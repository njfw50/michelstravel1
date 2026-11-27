/* ────────────────────────────────────────────────────────────────────
   HOME — redesign 2027 ("Revista de bordo").
   ATA MT-DESIGN-2027-001 · Diretriz de Execução Visual 2027 · Código
   Canônico: Cân. I (auditoria) · V (Livro da Vida) · XIV (segurança)
   · XVI (texto plano e preciso) · XVIII (soberania cognitiva — sem
   urgência falsa, sem dark pattern) · XIX (integridade das refs.) ·
   XXII (procedência — preço e fato com fonte e data visíveis) ·
   XXIII (fail-closed — sem número inventado no ar).

   O QUE MUDOU (vs. cloudflare-containers @377db97) — Parte 3:
   (D) parceiros: só companhias COM logo (filter antes do slice);
   (E) Toolbox: removidos "24°C" e "1 USD = 5.04 BRL" fixos — o cartão
       virou link honesto p/ /toolbox, sem número parado;
   (F) estatísticas sem fonte ("2,400+ rotas", "45+ parceiros",
       "120k viajantes", "<2s") REMOVIDAS — no lugar, uma faixa de
       confiança com 4 fatos verificáveis, sem número inventado;
   (intel) "Midnight Inteligência" com "15% de queda" e "melhor época
       45 dias antes" REMOVIDO — afirmações sem fonte viraram "Como
       funciona" (3 passos, chaves home.how.* já existentes);
   (DealCard) "Voo direto" fixo removido — agora mostra paradas reais.
   A ordem das seções continua vindo de site_settings (painel admin,
   Parte 1 bloqueada): os ids são os mesmos (hero, stats, insights,
   deals, partners, cta). A seção de segurança é renderizada SEMPRE
   após o loop (não depende do painel).
   ──────────────────────────────────────────────────────────────────── */
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useFeaturedDeals } from "@/hooks/use-flights";
import { useAirlines } from "@/hooks/use-flights";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { DealCard } from "@/components/DealCard";
import { SEO } from "@/components/SEO";
import { usePublicSettings } from "@/hooks/use-public-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Globe2,
  Languages,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
  Search,
  CreditCard,
  Ticket,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
import type { ContactLanguage } from "@/lib/contact";
import {
  formatPackagePrice,
  formatPackageStartDate,
  getPackageImage,
  getPackages,
  isPriceFresh,
} from "@/lib/packages";

/* Fotos de destino já verificadas no repo (Unsplash/Pexels). Destino
   sem foto real verificada usa a foto genérica LOCAL (jato ao pôr do
   sol) — nunca a foto de outro destino como se fosse aquele lugar.
   Correção QA 26/nov: a URL do Unsplash usada antes
   (photo-1436491865332-7a61a109c0f3) retorna 404; Recife (REC,
   photo-1596162391609) também — os dois caem no genérico local. */
const getDestinationImage = (iata?: string) => {
  if (!iata) return "/images/hero-jet-sunset.jpg";
  const code = iata.toUpperCase();
  const mapping: Record<string, string> = {
    GIG: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800&auto=format&fit=crop",
    SDU: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800&auto=format&fit=crop",
    GRU: "https://images.pexels.com/photos/18179143/pexels-photo-18179143.jpeg?auto=compress&cs=tinysrgb&w=1000&h=625&fit=crop",
    CGH: "https://images.pexels.com/photos/18179143/pexels-photo-18179143.jpeg?auto=compress&cs=tinysrgb&w=1000&h=625&fit=crop",
    MCO: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=800&auto=format&fit=crop",
    LIS: "https://images.unsplash.com/photo-1525207934214-58e69a8f8a3e?q=80&w=800&auto=format&fit=crop",
    CDG: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
    EWR: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop",
    NYC: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop",
    MIA: "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?q=80&w=800&auto=format&fit=crop",
  };
  return mapping[code] || "/images/hero-jet-sunset.jpg";
};

export default function Home() {
  const { data: airlines } = useAirlines(30);
  const { t, language } = useI18n();
  const { data: catalogDeals = [], isLoading: dealsLoading } = useFeaturedDeals(language);
  const { data: settings } = usePublicSettings();
  const [, setLocation] = useLocation();

  /* Ordem das seções: vem do painel admin (site_settings). Os ids são
     os mesmos de antes — o redesign NÃO quebra o painel. */
  const activeLayout = settings?.mobileLayout || [
    { id: "hero", enabled: true },
    { id: "stats", enabled: true },
    { id: "insights", enabled: true },
    { id: "deals", enabled: true },
    { id: "partners", enabled: true },
    { id: "cta", enabled: true },
  ];

  /* Companhias COM logo, antes de cortar (Parte 3-D). Sem logo, sem
     cartão — nunca ícone genérico de avião no lugar da marca. */
  const airlinesWithLogo = (airlines || []).filter((a) => a.logoUrl).slice(0, 12);

  /* Fallback fail-closed (QA 26/nov): quando a API de ofertas não
     responde (preview sem banco → 500), a vitrine mostra os 4 pacotes
     REAIS do packages.json — nunca seção vazia. A API vence quando há
     dados. Preço de pacote é TOTAL p/ 2 (nunca "por pessoa") e pacote
     velho vira "a reconfirmar" sem valor. O botão leva a /pacotes. */
  const dealLang = (language || "pt") as ContactLanguage;
  const packageDeals = getPackages().map((pkg, i) => {
    const fresh = isPriceFresh(pkg);
    return {
      id: 9000 + i,
      origin: "",
      origin_city: "",
      destination: pkg.destinationCode,
      destination_city: pkg.destination,
      departure_date: formatPackageStartDate(pkg, dealLang),
      return_date: pkg.dates.end,
      price: fresh ? formatPackagePrice(pkg, dealLang) : t("packages.reconfirm"),
      priceSuffix: fresh ? t("packages.total_for_2") : null,
      price_value: fresh ? pkg.price.amount : null,
      currency: pkg.price.currency,
      airline: "",
      cabin_class: "",
      stops: undefined as number | undefined,
      duration: "",
      title:
        dealLang === "en"
          ? `Package ${pkg.destination}`
          : dealLang === "es"
            ? `Paquete ${pkg.destination}`
            : `Pacote ${pkg.destination}`,
      description: pkg.hotel.name,
      imageUrl: getPackageImage(pkg),
      booking_url: "",
      created_at: pkg.verifiedAt,
      bookHref: "/pacotes",
    };
  });
  const dealsToShow =
    catalogDeals.length > 0
      ? catalogDeals.map((deal) => ({
          ...deal,
          title: deal.headline || `${deal.origin} → ${deal.destination}`,
          description: deal.description || "",
          imageUrl: deal.imageUrl || getDestinationImage(deal.destination),
          createdAt: deal.created_at,
        }))
      : packageDeals;

  const contactWhatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: (language || "pt") as ContactLanguage,
      topic: t("home.hero.whatsapp_topic"),
      details: [t("home.hero.whatsapp_details")],
    }),
  );

  /* Faixa de confiança (id "stats"): 4 FATOS verificáveis, nenhum
     número inventado. Substitui "2,400+ / 45+ / 120k / <2s". */
  const trustFacts = [
    { icon: ShieldCheck, text: t("home.trust.f1") },
    { icon: Languages, text: t("home.trust.f2") },
    { icon: BadgeCheck, text: t("home.trust.f3") },
    { icon: MessageCircle, text: t("home.trust.f4") },
  ];

  const howSteps = [
    { icon: Search, title: t("home.how.step1_title"), desc: t("home.how.step1_desc") },
    { icon: CreditCard, title: t("home.how.step2_title"), desc: t("home.how.step2_desc") },
    { icon: Ticket, title: t("home.how.step3_title"), desc: t("home.how.step3_desc") },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBF7EF] font-sans text-[#101E42] selection:bg-[#FA5F52]/20">
      <SEO title={t("home.search.title")} description={t("home.search.desc")} path="/" />

      {activeLayout.map((section: any) => {
        if (!section.enabled) return null;

        switch (section.id) {
          case "hero":
            // Rodada 6 (26/nov): o bleed (-mt-20) da rodada 5 está
            // SUPERADO — a barra do topo voltou a ser escura e opaca
            // (full-width), então o herói começa ABAIXO dela como
            // antes (padding 24/24 no celular, como na rodada 3).
            return (
              <section key="hero" className="relative overflow-hidden bg-[#0B1B3A] pb-6 pt-6 md:pb-24 md:pt-16">
                {/* Foto quente em tela cheia (asa ao pôr do sol) + scrim
                    navy: a marca fria sobre a foto quente — a logo fica
                    no header, canto superior direito, intacta. */}
                <div className="absolute inset-0">
                  {/* Foto quente local (jato ao pôr do sol) + scrim navy:
                      a marca fria sobre a foto quente — a logo fica no
                      header, canto superior direito, intacta. Arquivo
                      local: a URL do Unsplash usada antes retornava 404. */}
                  <img
                    src="/images/hero-jet-sunset.jpg"
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="mt-hero-scrim absolute inset-0" />
                </div>

                <div className="container relative z-10 mx-auto px-4">
                  <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="mb-6 md:mb-8"
                    >
                      {/* Rodada 3 (26/nov): no celular o selo longo
                          quebrava em 2 linhas dentro da pílula — versão
                          curta só no mobile (badge_short), 10px/0.1em. */}
                      <Badge className="rounded-full border border-[#E8B65D]/40 bg-[#E8B65D]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#E8B65D] backdrop-blur-md md:px-6 md:py-2 md:text-[11px] md:tracking-[0.3em]">
                        <Sparkles className="mr-2 h-3.5 w-3.5 md:mr-3 md:h-4 md:w-4" />
                        <span className="md:hidden">{t("home.hero.badge_short")}</span>
                        <span className="hidden md:inline">{t("home.hero.badge")}</span>
                      </Badge>
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="font-display max-w-5xl text-[2rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl md:text-7xl md:leading-[0.95]"
                    >
                      {/* Título decidido pelo dono (26/nov, opção C) — o
                          locale manda: o site_settings do banco ainda
                          guarda o título legado em inglês ("Find Your
                          Next Adventure") e ele NÃO pode vencer.
                          Rodada 3 (26/nov): 48px no celular = 3 linhas
                          e o herói dominando a tela (print do dono no
                          Galaxy S26 FE) — 32px (2rem, ~44% dos 72px do
                          desktop; proporção 40–50% recomendada pelo
                          Gemini) e leading 1.1; desktop intacto. */}
                      {t("home.hero.title")}
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05, duration: 0.3, ease: "easeOut" }}
                      className="mt-4 max-w-2xl text-sm font-medium leading-snug text-white mt-hero-subtitle md:mt-6 md:text-xl md:leading-relaxed"
                    >
                      {/* Idem: o subtítulo legado do banco ("Best prices
                          on flights worldwide.") não pode vencer. */}
                      {t("home.hero.desc")}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05, duration: 0.3, ease: "easeOut" }}
                      className="mt-8 w-full md:mt-10"
                    >
                      <FlightSearchForm className="hover:shadow-blue-500/5 transition-shadow duration-700" />
                    </motion.div>

                    <p className="mt-provenance mt-6 !text-slate-300">
                      <BadgeCheck className="h-4 w-4 text-[#E8B65D]" />
                      {t("home.search.tag")}
                    </p>

                    {settings?.promotionalBanner && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
                        className="mt-12 w-full max-w-4xl"
                      >
                        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#E8B65D] to-[#E58B48] p-8 shadow-2xl md:p-10">
                          <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
                            <div className="text-center md:text-left">
                              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#0B1B3A]/70">
                                {t("home.bot.badge")}
                              </p>
                              <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-[#0B1B3A] md:text-3xl">
                                {settings.promotionalBanner}
                              </h3>
                            </div>
                            <Button
                              onClick={() => setLocation("/pacotes")}
                              className="h-14 shrink-0 rounded-2xl bg-[#0B1B3A] px-8 text-[12px] font-extrabold uppercase tracking-widest text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
                            >
                              {t("nav.packages")} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </section>
            );

          case "stats":
            return (
              <section key="stats" className="relative z-10 py-10 md:py-14">
                <div className="container mx-auto max-w-6xl px-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {trustFacts.map((fact, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 rounded-[24px] border border-[#101E42]/10 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B1B3A] text-[#E8B65D]">
                          <fact.icon className="h-6 w-6" />
                        </div>
                        <p className="text-[14px] font-bold leading-snug text-[#101E42]">{fact.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "insights":
            return (
              <section key="insights" className="relative z-10 py-10 md:py-14">
                <div className="container mx-auto max-w-6xl px-4">
                  <div className="mb-12 max-w-2xl">
                    <span className="mt-eyebrow mt-eyebrow--navy">
                      <Compass className="h-4 w-4" />
                      {t("home.how.title")}
                    </span>
                    <h2 className="font-display mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
                      {t("home.how.subtitle")}
                    </h2>
                    <div className="mt-gold-rule mt-6" />
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {howSteps.map((step, i) => (
                      <div key={i} className="mt-card rounded-[32px] p-8">
                        <div className="mb-6 flex items-center justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF7EF] text-[#3D4EAB]">
                            <step.icon className="h-7 w-7" />
                          </div>
                          <span className="font-display text-5xl font-extrabold text-[#101E42]/10">
                            0{i + 1}
                          </span>
                        </div>
                        <h3 className="font-display text-xl font-extrabold tracking-tight">{step.title}</h3>
                        <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#3D4A6B]">{step.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Assistente Mia — chaves home.assistant.* já existentes */}
                    <div className="rounded-[32px] bg-[#0B1B3A] p-8 text-white md:p-10">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#E8B65D]">
                        {t("home.assistant.label")}
                      </span>
                      <h3 className="font-display mt-4 text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
                        {t("home.assistant.title")}
                      </h3>
                      <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-300">
                        {t("home.assistant.desc")}
                      </p>
                      <Button
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("open-chatbot", { detail: { message: "" } }),
                          )
                        }
                        className="mt-cta-coral mt-8 h-14 rounded-2xl px-8 text-[12px] font-extrabold uppercase tracking-widest"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        {t("home.assistant.cta")}
                      </Button>
                    </div>

                    {/* Ferramentas — link honesto p/ /toolbox. SEM valores
                        fixos de clima/câmbio (Parte 3-E): nada aqui finge
                        ser dado ao vivo. */}
                    <div className="mt-card rounded-[32px] p-8 md:p-10">
                      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF7EF] text-[#E58B48]">
                        <Wrench className="h-7 w-7" />
                      </div>
                      <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
                        {t("home.toolbox.title")}
                      </h3>
                      <p className="mt-4 text-[15px] font-medium leading-relaxed text-[#3D4A6B]">
                        {t("home.toolbox.desc")}
                      </p>
                      <Button
                        onClick={() => setLocation("/toolbox")}
                        className="mt-8 h-14 rounded-2xl bg-[#0B1B3A] px-8 text-[12px] font-extrabold uppercase tracking-widest text-white transition-transform hover:scale-105 active:scale-95"
                      >
                        {t("home.toolbox.access")} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            );

          case "deals":
            return (
              <section key="deals" className="relative z-10 overflow-hidden bg-[#0B1B3A] py-20 md:py-28">
                <div className="container mx-auto max-w-6xl px-4">
                  <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                      <Badge className="mb-6 rounded-full border border-[#E8B65D]/30 bg-[#E8B65D]/10 px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#E8B65D]">
                        <Globe2 className="mr-2 h-4 w-4" />
                        {t("home.deals.badge")}
                      </Badge>
                      <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-white md:text-6xl">
                        {t("home.deals.title")}
                      </h2>
                      <p className="mt-5 text-base font-medium leading-relaxed text-slate-300 md:text-lg">
                        {t("home.deals.desc")}
                      </p>
                    </div>
                    <Button
                      onClick={() => setLocation("/pacotes")}
                      variant="outline"
                      className="h-14 shrink-0 rounded-2xl border-white/20 bg-transparent px-8 text-[12px] font-extrabold uppercase tracking-widest text-white hover:bg-white/10 hover:text-white"
                    >
                      {t("nav.packages")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {dealsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-[430px] animate-pulse rounded-[32px] bg-white/5" />
                      ))
                    ) : dealsToShow.length > 0 ? (
                      dealsToShow.map((deal) => <DealCard key={deal.id} deal={deal} />)
                    ) : (
                      <div className="col-span-full rounded-[32px] border border-dashed border-white/15 py-24 text-center">
                        <p className="text-[12px] font-extrabold uppercase tracking-widest text-slate-400">
                          {t("results.no_matching_flights")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Procedência das ofertas: a fonte e a data ficam
                      visíveis na página (Cân. XXII). */}
                  <p className="mt-provenance mt-10 !text-slate-400">
                    <BadgeCheck className="h-4 w-4 text-[#E8B65D]" />
                    {t("home.deals.provenance")}
                  </p>
                </div>
              </section>
            );

          case "partners":
            /* Fail-closed (QA 26/nov): sem logo de companhia, sem seção
               — a API de companhias volta vazia no preview (sem banco).
               Nunca prometer uma rede vazia. */
            if (airlinesWithLogo.length === 0) return null;
            return (
              <section key="partners" className="relative z-10 py-20 md:py-24">
                <div className="container mx-auto max-w-6xl px-4">
                  <div className="mb-12 text-center md:mb-16">
                    <Badge
                      variant="outline"
                      className="mb-6 rounded-full border-[#101E42]/10 px-5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#6B7594]"
                    >
                      {t("home.stats.network")}
                    </Badge>
                    <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
                      {t("home.stats.alliance_title")}
                    </h2>
                    <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-[#3D4A6B] md:text-lg">
                      {t("home.stats.alliance_desc")}
                    </p>
                  </div>
                  {airlinesWithLogo.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                      {airlinesWithLogo.map((airline) => (
                        <div
                          key={airline.id}
                          className="flex flex-col items-center gap-4 rounded-[24px] border border-[#101E42]/10 bg-white p-6 transition-all hover:border-[#E8B65D]/60 hover:shadow-lg"
                        >
                          <div className="flex h-12 w-full items-center justify-center">
                            <img
                              src={airline.logoUrl!}
                              alt={airline.name}
                              className="h-full w-auto object-contain"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#6B7594]">
                            {airline.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[12px] font-extrabold uppercase tracking-widest text-[#6B7594]">
                      {t("home.airlines.tag_alt")}
                    </p>
                  )}
                </div>
              </section>
            );

          case "cta":
            return (
              <section key="cta" className="relative z-10 overflow-hidden py-20 md:py-24">
                <div className="container mx-auto max-w-6xl px-4">
                  <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#E8B65D] via-[#E9D7B7] to-[#E58B48] p-8 text-center shadow-2xl md:p-16">
                    <Badge className="mb-8 rounded-full bg-[#0B1B3A] px-6 py-2 text-[11px] font-extrabold uppercase tracking-[0.3em] text-white">
                      {t("home.stats.ready")}
                    </Badge>
                    <h2 className="font-display mx-auto max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tight text-[#0B1B3A] md:text-7xl">
                      {section.props?.title || t("home.cta.title")}
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-base font-bold leading-relaxed text-[#0B1B3A]/70 md:text-xl">
                      {section.props?.subtitle || t("home.cta.subtitle")}
                    </p>
                    <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                      <a
                        href={contactWhatsAppHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-cta-whatsapp flex h-16 items-center justify-center gap-3 rounded-[20px] px-10 text-[13px] font-extrabold uppercase tracking-widest transition-transform hover:scale-105 active:scale-95"
                      >
                        {section.props?.buttonText || t("footer.contact_cta")}
                        <MessageCircle className="h-5 w-5" />
                      </a>
                      <Button
                        variant="outline"
                        className="h-16 rounded-[20px] border-[#0B1B3A]/20 bg-white/70 px-10 text-[13px] font-extrabold uppercase tracking-widest text-[#0B1B3A] backdrop-blur transition-all hover:scale-105 hover:bg-white active:scale-95"
                        onClick={() => setLocation("/senior")}
                      >
                        {t("home.senior.btn")}
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            );

          default:
            return (
              <section
                key={section.id}
                className={cn("relative z-10 overflow-hidden", section.style?.paddingY || "py-20")}
              >
                {section.props?.imageUrl && (
                  <div className="absolute inset-0 z-0">
                    <img src={section.props.imageUrl} className="h-full w-full object-cover opacity-20" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3A] via-[#0B1B3A]/60 to-transparent" />
                  </div>
                )}
                <div className="container relative z-10 mx-auto max-w-4xl px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={cn(
                      "flex flex-col rounded-[48px] border border-[#101E42]/10 bg-white p-12 shadow-2xl md:p-24",
                      section.style?.textAlign === "center" ? "items-center text-center" : "items-start text-left",
                    )}
                  >
                    <h2 className="font-display mb-8 text-4xl font-extrabold leading-none tracking-tight md:text-6xl">
                      {section.props?.title || section.label}
                    </h2>
                    <p className="mb-12 max-w-2xl text-lg font-medium leading-relaxed text-[#3D4A6B] md:text-2xl">
                      {section.props?.subtitle}
                    </p>
                    {section.props?.buttonText && (
                      <Button className="h-16 rounded-[24px] bg-[#0B1B3A] px-12 text-[13px] font-extrabold uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-105 active:scale-95">
                        {section.props.buttonText}
                      </Button>
                    )}
                  </motion.div>
                </div>
              </section>
            );
        }
      })}

      {/* Seção de segurança — página separada /seguranca (decisão do
          dono, 26/nov/2026), não seção na home. */}
    </div>
  );
}
