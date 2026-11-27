/* ────────────────────────────────────────────────────────────────────
   BlogList — redesign 2027 (visual revista, mesmo conteúdo).
   Correção FACT_LOCK: o "Pulso" exibia "242/512/385/624 viajantes
   ativos" e tendências "+12%/+8%..." FIXOS no código, sem fonte.
   Removidos. O que fica no Pulso é só dado REAL: clima via
   /api/external/weather e tarifa via /api/flight-board, com a fonte
   escrita na página (nova chave blog.pulse_note). Sem dado real, o
   campo mostra "—" — nunca número parado como se fosse ao vivo.
   Também: título do hero e "Filtros Avançados" estavam fixos em PT
   no JSX — agora passam pelos locales (blog.hero_title,
   blog.advanced_filters). Descrição genérica inventada de lugar
   ("Ponto histórico com arquitetura única...") removida: sem endereço
   real, não há parágrafo.
   ──────────────────────────────────────────────────────────────────── */
import { useBlogPosts } from "@/hooks/use-blog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Loader2,
  ArrowRight,
  BookOpen,
  Clock,
  Globe2,
  MapPin,
  Navigation2,
  ArrowUpRight,
  Filter,
  Search,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { useDestinationHighlights } from "@/hooks/use-destinations";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function estimateReadTime(content: string | null | undefined): number {
  if (!content) return 3;
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

const HIGHLIGHT_DESTINATIONS = [
  { city: "Orlando", country: "us", label: "Orlando", accent: "from-blue-500 to-cyan-400" },
  { city: "Miami", country: "us", label: "Miami", accent: "from-pink-500 to-rose-400" },
  { city: "New York", country: "us", label: "Nova York", accent: "from-slate-500 to-slate-400" },
  { city: "Lisboa", country: "pt", label: "Lisboa", accent: "from-orange-500 to-yellow-400" },
  { city: "Rio de Janeiro", country: "br", label: "Rio de Janeiro", accent: "from-green-500 to-emerald-400" },
  { city: "São Paulo", country: "br", label: "São Paulo", accent: "from-slate-700 to-slate-500" },
];

/* Cidades do Pulso — SÓ identificadores. Qualquer número que aparecer
   na tela vem da API (clima / quadro de voos), nunca daqui. */
const PULSE_CITIES = [
  { id: "lisbon", name: "Lisbon", display: "Lisboa" },
  { id: "new-york", name: "New York", display: "Nova York" },
  { id: "paris", name: "Paris", display: "Paris" },
  { id: "sao-paulo", name: "Sao Paulo", display: "São Paulo" },
];

/* O clima vem em inglês da API (wttr.in) — traduz as condições mais
   comuns para o idioma da página; frase desconhecida segue em inglês
   (nunca inventar tradução). */
const WEATHER_CONDITIONS: Record<string, { pt: string; es: string }> = {
  Sunny: { pt: "Ensolarado", es: "Soleado" },
  Clear: { pt: "Céu limpo", es: "Despejado" },
  "Partly cloudy": { pt: "Parcialmente nublado", es: "Parcialmente nublado" },
  Cloudy: { pt: "Nublado", es: "Nublado" },
  Overcast: { pt: "Encoberto", es: "Cubierto" },
  Mist: { pt: "Névoa", es: "Niebla" },
  Fog: { pt: "Nevoeiro", es: "Niebla" },
  "Patchy rain nearby": { pt: "Chuva fraca próxima", es: "Lluvia débil cercana" },
  "Patchy rain possible": { pt: "Possível chuva fraca", es: "Posible lluvia débil" },
  "Light rain": { pt: "Chuva fraca", es: "Lluvia débil" },
  "Light rain shower": { pt: "Pancada fraca", es: "Chubasco débil" },
  "Moderate rain": { pt: "Chuva moderada", es: "Lluvia moderada" },
  "Heavy rain": { pt: "Chuva forte", es: "Lluvia fuerte" },
  "Thundery outbreaks possible": { pt: "Possíveis trovoadas", es: "Posibles tormentas" },
  "Patchy light snow": { pt: "Neve fraca esparsa", es: "Nieve débil dispersa" },
  "Light snow": { pt: "Neve fraca", es: "Nieve débil" },
  "Moderate snow": { pt: "Neve moderada", es: "Nieve moderada" },
  "Heavy snow": { pt: "Neve forte", es: "Nieve fuerte" },
  "Patchy light drizzle": { pt: "Garoa fraca esparsa", es: "Llovizna débil dispersa" },
  "Light drizzle": { pt: "Garoa fraca", es: "Llovizna débil" },
  "Freezing fog": { pt: "Nevoeiro congelante", es: "Niebla helada" },
  Blizzard: { pt: "Nevasca", es: "Ventisca" },
  Thunderstorm: { pt: "Tempestade", es: "Tormenta" },
};

export default function BlogList() {
  const { data: posts, isLoading } = useBlogPosts();
  const { t, language } = useI18n();
  const [selectedDest, setSelectedDest] = useState(HIGHLIGHT_DESTINATIONS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("lisbon");
  const [pulseData, setPulseData] = useState<Record<string, any>>({});
  // Fail-closed (QA 26/nov, rodada 2): enquanto o Pulso carrega,
  // mostra esqueleto; sem dado real após carregar, a seção some.
  const [pulseLoading, setPulseLoading] = useState(true);

  useEffect(() => {
    const fetchPulse = async () => {
      const newData: Record<string, any> = {};

      await Promise.all(
        PULSE_CITIES.map(async (dest) => {
          try {
            const res = await fetch(`/api/external/weather/${dest.id}`);
            if (res.ok) {
              const weather = await res.json();
              newData[dest.id] = { ...dest, weather: `${weather.temp}°C`, condition: weather.condition };
            }
          } catch (e) {
            console.error("Failed to fetch weather for", dest.id);
          }
        }),
      );

      try {
        const flightRes = await fetch("/api/flight-board");
        if (flightRes.ok) {
          const flights = await flightRes.json();
          PULSE_CITIES.forEach((dest) => {
            const flight = flights.find(
              (f: any) =>
                f.destinationCity?.toLowerCase().includes(dest.id.replace("-", " ")) ||
                f.destinationCity?.toLowerCase().includes(dest.display.toLowerCase()),
            );
            if (flight && newData[dest.id]) {
              newData[dest.id].price = flight.price;
              newData[dest.id].currency = flight.currency;
            }
          });
        }
      } catch (e) {
        console.error("Failed to fetch flight board", e);
      }

      setPulseData(newData);
    };

    fetchPulse().finally(() => setPulseLoading(false));
  }, []);

  // Rodada 4 (26/nov, re-QA item 2): o Pulso só existe quando há
  // TARIFA real — o clima sozinho deixava o cartão gigante com ~70%
  // de espaço branco no desktop (o quadro de voos é 500 no preview
  // sem banco). Sem tarifa em nenhuma cidade, a seção some inteira
  // (fail-closed): nunca um cartão vazio/inacabado. O clima continua
  // dentro do cartão completo, junto com a tarifa.
  const citiesWithFare = PULSE_CITIES.filter((c) => pulseData[c.id]?.price);
  const hasFareData = citiesWithFare.length > 0;
  // Rodada 3: a cidade ativa NUNCA cai para a entrada estática.
  // Carregando, activeCity é undefined e o esqueleto cobre o lugar;
  // depois, só cidades COM tarifa ganham aba — a aba destacada é
  // sempre uma delas (highlightedTab corrige a aba inicial sem tarifa).
  const activeCity = pulseLoading
    ? undefined
    : citiesWithFare.find((c) => c.id === activeTab) || citiesWithFare[0];
  const highlightedTab = activeCity?.id ?? activeTab;
  const activeDest =
    (activeCity && pulseData[activeCity.id]) ||
    PULSE_CITIES.find((c) => c.id === activeTab) ||
    PULSE_CITIES[0];

  // Rodada 3 (26/nov): sem condição NÃO há texto — a string de
  // carregamento ("CARREGANDO CRÔNICA...") era um fallback com nome
  // errado: ela aparecia DEPOIS do carregamento, quando o clima
  // falhava, e o QA lia como widget travado. Carregando, o esqueleto
  // já cobre o lugar; depois, sem dado, não há linha de condição.
  const conditionText = (condition?: string) => {
    if (!condition) return "";
    if ((language || "pt") === "en") return condition;
    const hit = WEATHER_CONDITIONS[condition];
    if (!hit) return condition;
    return (language || "pt") === "es" ? hit.es : hit.pt;
  };

  const { data: highlights, isLoading: loadingHighlights } = useDestinationHighlights({
    city: selectedDest.city,
    country: selectedDest.country,
    lang: language || "pt",
    limit: 6,
  });
  // Rodada 4: calculado ANTES do portão da seção estreitar o tipo de
  // `highlights` (usar `highlights?.items` direto depois do portão
  // vira erro TS2339 — o tipo estreita para `never`).
  const hasHighlightItems = (highlights?.items?.length ?? 0) > 0;

  const featuredPost = posts?.[0];
  const remainingPosts =
    posts?.filter(
      (p) =>
        p.id !== featuredPost?.id &&
        (p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())),
    ) || [];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBF7EF] text-[#101E42] selection:bg-[#FA5F52]/20">
      <SEO
        title={t("blog.seo_title") || "Guia de Viagens de Elite"}
        description={t("blog.seo_desc") || "Explore o mundo com curadoria de especialistas. Dicas exclusivas, destinos secretos e roteiros premium."}
        path="/blog"
      />

      {/* Hero Section */}
      <section className="relative flex h-[60vh] items-center justify-center overflow-hidden bg-[#0B1B3A] md:h-[70vh]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0B1B3A]/40 via-[#0B1B3A]/85 to-[#0B1B3A]" />
          <img
            src="/images/hero-jet-sunset.jpg"
            className="animate-slow-zoom h-full w-full object-cover"
            alt="Hero Background"
          />
        </div>

        <div className="container relative z-20 px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
            <Badge className="mb-6 rounded-full border border-[#E8B65D]/30 bg-[#E8B65D]/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.3em] text-[#E8B65D] backdrop-blur-md">
              {t("blog.elite_experience")}
            </Badge>
            <h1 className="font-display mb-4 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-3xl font-extrabold leading-tight tracking-tight text-transparent md:text-8xl md:leading-none">
              {t("blog.hero_title")}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg font-medium leading-relaxed text-white mt-hero-subtitle md:text-xl">
              {t("blog.curated_destinations")}
            </p>

            <div className="group relative mx-auto max-w-xl px-2 md:px-0">
              <div className="absolute inset-0 -z-10 bg-[#E8B65D]/10 blur-xl transition-all duration-500 group-hover:bg-[#E8B65D]/20" />
              <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-2xl md:rounded-[32px] md:p-2">
                <div className="pl-4 text-slate-400 md:pl-6">
                  <Search className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <Input
                  id="blog-search"
                  placeholder={t("blog.search_placeholder")}
                  className="h-10 border-0 bg-transparent text-sm font-medium text-white placeholder:text-slate-400 focus-visible:ring-0 md:h-14 md:text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button className="hidden h-12 rounded-[24px] bg-[#FA5F52] px-8 font-extrabold uppercase tracking-widest text-white hover:bg-[#E2483D] md:flex">
                  {t("blog.explore")}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destination Pulse — só com TARIFA real (clima + quadro de
          voos). Sem tarifa após o carregamento, o bloco some inteiro
          (fail-closed, rodada 4): o clima sozinho deixava o cartão
          com ~70% de branco no desktop. O bloco de destaques abaixo
          tem regra própria. */}
      <section className="container mx-auto px-4 py-20">
        {!pulseLoading && !hasFareData ? null : (
        <>
        <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <div className="mb-3 flex w-fit items-center gap-3 rounded-full bg-[#3D4EAB]/10 px-3 py-1 text-[#3D4EAB]">
              <MapIcon className="h-4 w-4" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">{t("blog.curation_city")}</span>
            </div>
            <h2 className="font-display text-4xl font-extrabold tracking-tight">{t("blog.pulse_title")}</h2>
            <p className="mt-2 font-medium text-[#3D4A6B]">{t("blog.pulse_desc")}</p>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-[28px] border border-[#101E42]/10 bg-white p-1.5 shadow-sm">
            {/* Rodada 4: depois de carregar, só as cidades COM tarifa
                ganham aba — a aba ativa é sempre uma delas
                (highlightedTab). */}
            {(pulseLoading ? PULSE_CITIES : citiesWithFare).map((city) => (
              <button
                key={city.id}
                onClick={() => setActiveTab(city.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-6 py-3 text-xs font-extrabold uppercase tracking-widest transition-all",
                  highlightedTab === city.id ? "bg-[#0B1B3A] text-white shadow-lg" : "text-[#6B7594] hover:bg-[#FBF7EF] hover:text-[#101E42]",
                )}
              >
                {city.display}
              </button>
            ))}
          </div>
        </div>

        <Card className="group relative mb-12 overflow-hidden rounded-[32px] border border-[#101E42]/10 bg-white p-8 shadow-[0_22px_48px_rgba(15,23,42,0.08)] md:p-14">
          <div className="flex flex-1 flex-col items-center gap-6 md:flex-row md:items-center md:gap-12">
            <div className="flex flex-col items-center gap-1 md:items-start">
              <p className="font-display text-5xl font-extrabold tracking-tight text-[#101E42] md:text-8xl">
                {pulseLoading ? (
                  <span className="inline-block h-12 w-36 animate-pulse rounded-2xl bg-[#101E42]/10 align-middle md:h-20" />
                ) : (
                  activeDest.weather || ""
                )}
              </p>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#E58B48]">
                {pulseLoading ? (
                  <span className="inline-block h-3 w-28 animate-pulse rounded-full bg-[#101E42]/10" />
                ) : (
                  conditionText(activeDest.condition)
                )}
              </p>
            </div>

            <div className="h-px w-20 bg-[#101E42]/10 md:h-20 md:w-px" />

            <div className="text-center md:text-left">
              <h3 className="font-display mb-2 text-3xl font-extrabold tracking-tight md:text-5xl">{activeDest.display}</h3>
              <p className="text-[12px] font-semibold leading-relaxed text-[#6B7594]">{t("blog.pulse_note")}</p>
            </div>
          </div>

          {/* Rodada 3: sem tarifa real não há bloco de tarifa — o "---"
              era exibido sempre no preview, onde o quadro de voos é 500
              (sem banco). Carregando, o esqueleto cobre o lugar. */}
          {(pulseLoading || activeDest.price) && (
          <div className="mt-8 flex items-center justify-center gap-8 border-t border-[#101E42]/10 pt-6 md:justify-end md:border-t-0 md:pt-0">
            <div className="flex flex-col items-center gap-1 md:items-end">
              <p className="text-xl font-extrabold text-[#101E42] md:text-2xl">
                {pulseLoading ? (
                  <span className="inline-block h-6 w-20 animate-pulse rounded-lg bg-[#101E42]/10" />
                ) : (
                  `${activeDest.price} ${activeDest.currency}`
                )}
              </p>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#E58B48]">
                {t("blog.best_fare") || "Melhor Tarifa"}
              </p>
            </div>
          </div>
          )}
        </Card>
        </>)}

        {/* Highlights from Destinations tab — fail-closed (QA 26/nov):
            sem itens da API (preview sem banco), o bloco some em vez
            de mostrar abas vazias e contadores "0". */}
        {!loadingHighlights && (!highlights?.items || highlights.items.length === 0) ? null : (
        <div className="mb-12">
          <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto rounded-[28px] border border-[#101E42]/10 bg-white p-1.5 shadow-sm">
            {HIGHLIGHT_DESTINATIONS.map((d) => (
              <button
                key={d.city}
                onClick={() => setSelectedDest(d)}
                className={cn(
                  "whitespace-nowrap rounded-[20px] px-6 py-3 text-xs font-extrabold uppercase tracking-widest transition-all duration-300",
                  selectedDest.city === d.city
                    ? `bg-gradient-to-br ${d.accent} text-white shadow-lg`
                    : "text-[#6B7594] hover:bg-[#FBF7EF] hover:text-[#101E42]",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="wait">
              {/* Rodada 4: o esqueleto só aparece na primeira carga
                  (sem dado); ao trocar o idioma, os cartões do idioma
                  anterior ficam visíveis (placeholderData no hook) —
                  sem flash cinza. */}
              {loadingHighlights && !hasHighlightItems ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[200px] animate-pulse rounded-[32px] border border-[#101E42]/10 bg-white" />
                ))
              ) : (
                highlights?.items?.map((place, idx) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="group relative h-full overflow-hidden rounded-[32px] border border-[#101E42]/10 bg-white p-6 transition-all duration-500 hover:border-[#E8B65D]/60 hover:shadow-xl">
                      <div className="relative z-10 flex h-full flex-col">
                        <div className="mb-4 flex items-start justify-between">
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                              selectedDest.accent,
                            )}
                          >
                            <MapPin className="h-6 w-6" />
                          </div>
                          {place.distance_m && (
                            <span className="rounded-lg bg-[#FBF7EF] px-2 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#6B7594]">
                              {Math.round(place.distance_m)}m de raio
                            </span>
                          )}
                        </div>

                        <h3 className="mb-2 line-clamp-1 text-xl font-extrabold text-[#101E42] transition-colors group-hover:text-[#3D4EAB]">
                          {place.name}
                        </h3>
                        {place.address && (
                          <p className="mb-6 line-clamp-2 text-sm font-medium text-[#3D4A6B]">{place.address}</p>
                        )}

                        <div className="mt-auto flex items-center justify-between border-t border-[#101E42]/10 pt-4">
                          <div className="flex gap-2">
                            {place.website && (
                              <a
                                href={place.website}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBF7EF] text-[#3D4A6B] transition-all hover:bg-[#0B1B3A] hover:text-white"
                              >
                                <Globe2 className="h-4 w-4" />
                              </a>
                            )}
                            <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-[#FBF7EF] text-[#3D4A6B] transition-all hover:bg-[#0B1B3A] hover:text-white">
                              <Navigation2 className="h-4 w-4" />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            className="gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#3D4EAB] hover:text-[#0B1B3A]"
                          >
                            {t("blog.details")} <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        )}
      </section>

      {/* The Magazine - Blog Section */}
      <section className="border-y border-[#101E42]/10 bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 flex items-center justify-between">
            <div>
              <h2 className="font-display text-4xl font-extrabold tracking-tight">{t("blog.chronicles_title")}</h2>
              <p className="mt-2 font-medium text-[#3D4A6B]">{t("blog.chronicles_subtitle")}</p>
            </div>
            {/* O botão rola até a busca do blog e foca o campo — antes
                levava para /search (busca de voos), rótulo errado. */}
            <Button
              onClick={() => {
                const el = document.getElementById("blog-search");
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                (el as HTMLInputElement | null)?.focus({ preventScroll: true });
              }}
              className="hidden h-12 gap-2 rounded-2xl border border-[#101E42]/10 bg-[#FBF7EF] px-6 font-extrabold uppercase tracking-widest text-[#101E42] hover:bg-[#F5EDDD] md:flex"
            >
              <Filter className="h-4 w-4" /> {t("blog.advanced_filters")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Featured Column */}
            <div className="lg:col-span-8">
              {!isLoading && (!posts || posts.length === 0) ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-dashed border-[#101E42]/15 bg-white/60 px-6 py-16 text-center">
                  <BookOpen className="mb-6 h-10 w-10 text-[#6B7594]" />
                  <h3 className="font-display text-2xl font-extrabold tracking-tight">{t("blog.no_posts")}</h3>
                  <p className="mt-3 max-w-md text-[15px] font-medium leading-relaxed text-[#3D4A6B]">
                    {t("blog.no_posts_desc")}
                  </p>
                </div>
              ) : (
                featuredPost && (
                <Link href={`/blog/${featuredPost.slug}`}>
                  <motion.div
                    whileHover={{ y: -10 }}
                    className="group relative aspect-[16/9] cursor-pointer overflow-hidden rounded-[32px] border border-[#101E42]/10 md:aspect-[21/9]"
                  >
                    <div className="absolute inset-0 z-0">
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#060D24] via-[#060D24]/40 to-transparent" />
                      {featuredPost.coverImage ? (
                        <img
                          src={featuredPost.coverImage}
                          alt={featuredPost.title}
                          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#0B1B3A]">
                          <BookOpen className="h-20 w-20 text-white/20" />
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-14">
                      <div className="mb-6 flex items-center gap-4">
                        <Badge className="rounded-full border-0 bg-[#FA5F52] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-xl">
                          {t("blog.exclusive_article")}
                        </Badge>
                        <span className="flex items-center gap-2 text-xs font-medium text-white/60">
                          <Clock className="h-3 w-3" /> {t("blog.immersion_time", { count: estimateReadTime(featuredPost.content) })}
                        </span>
                      </div>
                      <h3 className="font-display mb-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white transition-colors group-hover:text-[#E8B65D] md:text-5xl">
                        {featuredPost.title}
                      </h3>
                      <p className="mb-8 line-clamp-2 max-w-2xl text-lg font-medium text-slate-300 md:text-xl">
                        {featuredPost.excerpt}
                      </p>
                    </div>
                  </motion.div>
                </Link>
                )
              )}
            </div>

            {/* Side Column */}
            <div className="space-y-6 lg:col-span-4">
              <Card className="group relative overflow-hidden rounded-[32px] border-0 bg-gradient-to-br from-[#0B1B3A] to-[#12244D] p-8">
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[#E8B65D]/20 blur-[50px] transition-transform duration-700 group-hover:scale-150" />
                <Sparkles className="mb-6 h-10 w-10 text-[#E8B65D]" />
                <h4 className="mb-4 text-left text-xl font-extrabold leading-tight text-white">{t("blog.mia_guide_prompt")}</h4>
                <p className="mb-8 text-left text-sm font-medium leading-relaxed text-slate-300">{t("blog.mia_guide_desc")}</p>
                <Button
                  className="h-12 w-full rounded-[20px] bg-white font-extrabold uppercase tracking-widest text-[#0B1B3A] hover:bg-[#F5EDDD]"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("open-chatbot", { detail: { message: "Olá Mia, quero um guia de viagem personalizado!" } }),
                    )
                  }
                >
                  {t("blog.talk_to_mia")}
                </Button>
              </Card>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {remainingPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <motion.div whileHover={{ y: -8 }} className="group flex h-full cursor-pointer flex-col">
                  <div className="relative mb-6 h-64 overflow-hidden rounded-[32px] border border-[#101E42]/10">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#F5EDDD]">
                        <BookOpen className="h-10 w-10 text-[#6B7594]" />
                      </div>
                    )}
                  </div>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-[11px] font-extrabold uppercase text-[#E58B48]">
                      {format(new Date(post.createdAt || new Date()), "dd MMM yyyy")}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-[#6B7594]" />
                    <span className="text-[11px] font-bold uppercase text-[#6B7594]">{estimateReadTime(post.content)} min</span>
                  </div>
                  <h4 className="mb-2 line-clamp-2 text-xl font-extrabold text-[#101E42] transition-colors group-hover:text-[#3D4EAB]">
                    {post.title}
                  </h4>
                  <p className="line-clamp-2 text-sm font-medium text-[#3D4A6B]">{post.excerpt}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container relative mx-auto overflow-hidden px-4 py-24 text-center md:py-32">
        <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8B65D]/20 blur-[120px]" />

        <div className="mx-auto max-w-3xl">
          <h2 className="font-display mb-8 text-4xl font-extrabold tracking-tight md:text-6xl">{t("blog.high_conversion_headline")}</h2>
          <p className="mb-12 text-lg font-medium text-[#3D4A6B] md:text-xl">{t("blog.next_adventure_desc")}</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/search">
              <Button className="mt-cta-coral h-16 w-full rounded-[24px] px-10 text-lg font-extrabold uppercase tracking-widest transition-all sm:w-auto">
                <Navigation2 className="mr-3 h-6 w-6" /> {t("blog.start_adventure")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-in-out infinite alternate;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  );
}
