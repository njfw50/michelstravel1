import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageCircle,
  PhoneCall,
  Plane,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { AGENCY_PHONE_DISPLAY, AGENCY_PHONE_TEL } from "@/lib/contact";
import { useFeaturedDeals, type PublicFeaturedDeal } from "@/hooks/use-flights";

const BRAZIL_AIRPORTS = new Set([
  "GRU",
  "GIG",
  "BSB",
  "CNF",
  "SSA",
  "REC",
  "FOR",
  "POA",
  "CWB",
  "FLN",
  "BEL",
  "MAO",
  "NAT",
  "VCP",
  "SDU",
]);

const NEWARK_REGION_AIRPORTS = new Set(["EWR", "JFK", "LGA"]);

const fallbackRoutes = [
  { origin: "EWR", destination: "GRU", label: "Newark para Sao Paulo", city: "Sao Paulo", dateOffset: 21 },
  { origin: "EWR", destination: "GIG", label: "Newark para Rio de Janeiro", city: "Rio de Janeiro", dateOffset: 24 },
  { origin: "EWR", destination: "BSB", label: "Newark para Brasilia", city: "Brasilia", dateOffset: 28 },
  { origin: "EWR", destination: "SSA", label: "Newark para Salvador", city: "Salvador", dateOffset: 30 },
];

const faqItems = [
  {
    question: "Vocês ajudam brasileiros a comparar voos saindo de Newark para o Brasil?",
    answer:
      "Sim. A página foi feita exatamente para esse público, com foco em rotas entre Newark e destinos brasileiros, atendimento em português e suporte humano antes da emissão.",
  },
  {
    question: "As ofertas mostradas aqui são dinâmicas?",
    answer:
      "Sim. Quando há ofertas publicadas no sistema para rotas da região de Newark ou Nova York para o Brasil, a página mostra esses cards automaticamente. Quando não há, ela mantém rotas de busca rápida para não perder intenção comercial.",
  },
  {
    question: "Posso comprar online e depois falar com alguém?",
    answer:
      "Pode. Você pode pesquisar e reservar online, mas também pode ligar ou abrir as mensagens para tirar dúvidas sobre bagagem, escalas, horários e regras de alteração.",
  },
  {
    question: "Por que esta página ajuda quem quer viajar para o Brasil?",
    answer:
      "Porque ela reúne rotas úteis, ofertas quando disponíveis e atendimento em português para quem quer comparar voo, bagagem, escalas e regras antes de reservar.",
  },
];

function formatFutureDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

function formatDealPrice(value: number | null, currency: string) {
  if (value === null || Number.isNaN(value)) return null;

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || "USD"} ${value.toFixed(2)}`;
  }
}

function formatDealDate(date: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(parsed);
}

function toSearchParams(deal: PublicFeaturedDeal) {
  const searchParams = new URLSearchParams({
    origin: deal.origin,
    destination: deal.destination,
    date: deal.departure_date || formatFutureDate(21),
    passengers: "1",
    adults: "1",
    children: "0",
    infants: "0",
    cabinClass: deal.cabin_class || "economy",
    tripType: deal.return_date ? "round-trip" : "one-way",
  });

  if (deal.return_date) {
    searchParams.set("returnDate", deal.return_date);
  }

  return searchParams.toString();
}

export default function BrazilFlightsNewark() {
  const { data: featuredDeals, isLoading } = useFeaturedDeals();
  const [, setLocation] = useLocation();

  const allDeals = featuredDeals ?? [];
  const newarkBrazilDeals = allDeals.filter(
    (deal) => deal.origin === "EWR" && BRAZIL_AIRPORTS.has(deal.destination),
  );
  const regionalBrazilDeals =
    newarkBrazilDeals.length > 0
      ? newarkBrazilDeals
      : allDeals.filter(
          (deal) => NEWARK_REGION_AIRPORTS.has(deal.origin) && BRAZIL_AIRPORTS.has(deal.destination),
        );
  const liveDeals = regionalBrazilDeals.slice(0, 6);

  const structuredData: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Passagens para o Brasil saindo de Newark | Michels Travel",
      url: "https://www.michelstravel.agency/passagens-para-o-brasil-saindo-de-newark",
      description:
        "Página dedicada a brasileiros em Newark que buscam passagens para o Brasil, atendimento em português e ofertas dinâmicas de voos saindo de Newark.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Passagens para o Brasil saindo de Newark",
      serviceType: "Pesquisa e reserva de voos Newark Brasil com atendimento em português",
      areaServed: [
        { "@type": "Place", name: "Ironbound, Newark, NJ" },
        { "@type": "City", name: "Newark" },
        { "@type": "Country", name: "Brazil" },
      ],
      provider: {
        "@type": "TravelAgency",
        name: "Michels Travel",
        url: "https://www.michelstravel.agency",
        telephone: AGENCY_PHONE_TEL,
        email: "contact@michelstravel.agency",
        availableLanguage: ["Portuguese", "English", "Spanish"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.michelstravel.agency/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Passagens para o Brasil saindo de Newark",
          item: "https://www.michelstravel.agency/passagens-para-o-brasil-saindo-de-newark",
        },
      ],
    },
  ];

  if (liveDeals.length > 0) {
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Ofertas de passagens para o Brasil saindo de Newark e regiao",
      itemListElement: liveDeals.map((deal, index) => ({
        "@type": "Offer",
        position: index + 1,
        name: `${deal.origin_city || deal.origin} para ${deal.destination_city || deal.destination}`,
        priceCurrency: deal.currency,
        price: deal.price_value ?? deal.price,
        url: `https://www.michelstravel.agency/search?${toSearchParams(deal)}`,
      })),
    });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_22%,#fbfcfe_100%)]">
      <SEO
        title="Passagens para o Brasil saindo de Newark"
        description="Página em português para brasileiros em Newark que buscam passagens para o Brasil, atendimento humano e ofertas dinâmicas de voos saindo de Newark."
        path="/passagens-para-o-brasil-saindo-de-newark"
        structuredData={structuredData}
      />

      <section className="relative overflow-hidden px-4 pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="absolute inset-0">
          <div className="absolute left-[-6%] top-12 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="absolute right-[-8%] top-16 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl" />
        </div>

        <div className="relative container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Pagina dedicada ao publico brasileiro
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 md:text-6xl">
              Passagens para o Brasil saindo de Newark, com atendimento em portugues
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-xl">
              Se voce mora em Newark, Ironbound ou na regiao e quer comparar voos para o Brasil com mais
              clareza, esta pagina foi feita para reunir rotas uteis, oferta real e suporte humano.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                className="rounded-full bg-blue-600 px-7 py-6 text-base font-bold text-white hover:bg-blue-700"
                onClick={() => setLocation("/search?origin=EWR&destination=GRU&date=" + formatFutureDate(21) + "&passengers=1&adults=1&children=0&infants=0&cabinClass=economy")}
              >
                Buscar voos agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a href={`tel:${AGENCY_PHONE_TEL}`}>
                <Button variant="outline" className="rounded-full px-7 py-6 text-base font-bold">
                  <PhoneCall className="mr-2 h-4 w-4" />
                  {AGENCY_PHONE_DISPLAY}
                </Button>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
              {[
                "Rotas Newark Brasil mais procuradas",
                "Cards dinâmicos com ofertas quando houver publicacao",
                "Atendimento humano antes e depois da emissao",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/80 bg-white/90 px-4 py-4 text-sm font-medium text-slate-700 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]"
                >
                  <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Feita para Newark e Ironbound",
                description:
                  "Nao e uma pagina generica de agencia. Ela foi escrita para pessoas da comunidade brasileira que pesquisam voos saindo de Newark ou da regiao imediata.",
              },
              {
                icon: Plane,
                title: "Mais perto da decisao",
                description:
                  "Quem busca passagens para o Brasil saindo de Newark normalmente ja quer comparar opcoes e decidir com menos etapas.",
              },
              {
                icon: ShieldCheck,
                title: "Compra com mais seguranca",
                description:
                  "Voce pode comparar tarifa, bagagem, conexoes e regras com apoio humano, em portugues, antes de fechar a emissao.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.35)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-2xl font-extrabold text-slate-950">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-6xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_35px_100px_-60px_rgba(15,23,42,0.4)] md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Ofertas dinamicas</span>
                <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">
                  Voos para o Brasil que fazem sentido para esse publico
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Quando existem ofertas publicadas para Newark ou para o corredor Newark/Nova York com destino ao
                  Brasil, esta secao se atualiza automaticamente.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {isLoading ? "Carregando ofertas..." : `${liveDeals.length} oferta(s) exibida(s) agora`}
              </div>
            </div>

            {liveDeals.length > 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {liveDeals.map((deal) => {
                  const price = formatDealPrice(deal.price_value, deal.currency);
                  const routeLabel = `${deal.origin_city || deal.origin} para ${deal.destination_city || deal.destination}`;
                  const searchUrl = `/search?${toSearchParams(deal)}`;

                  return (
                    <button
                      key={`${deal.id}-${deal.origin}-${deal.destination}`}
                      type="button"
                      onClick={() => setLocation(searchUrl)}
                      className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition-all duration-200 hover:border-blue-200 hover:bg-blue-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
                            {deal.origin} {"->"} {deal.destination}
                          </span>
                          <div className="mt-3 text-lg font-bold text-slate-950">{routeLabel}</div>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-600" />
                      </div>

                      <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                        <span>
                          {formatDealDate(deal.departure_date)}
                          {deal.return_date ? ` ate ${formatDealDate(deal.return_date)}` : ""}
                        </span>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Desde
                          </div>
                          <div className="text-2xl font-extrabold text-slate-950">
                            {price || deal.price}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-blue-700">{deal.airline}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {fallbackRoutes.map((route) => (
                  <button
                    key={route.label}
                    type="button"
                    onClick={() =>
                      setLocation(
                        `/search?origin=${route.origin}&destination=${route.destination}&date=${formatFutureDate(route.dateOffset)}&passengers=1&adults=1&children=0&infants=0&cabinClass=economy`,
                      )
                    }
                    className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition-all duration-200 hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Busca rapida</span>
                    <div className="mt-3 text-lg font-bold text-slate-950">{route.label}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Ir direto para busca de voos entre Newark e {route.city}.
                    </p>
                    <div className="mt-5 flex items-center text-sm font-semibold text-blue-700">
                      Pesquisar rota <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-8 md:p-10">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Por que esta pagina facilita</span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">
                Uma pagina dedicada ao publico brasileiro deixa sua escolha mais simples
              </h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
                <p>
                  Ela junta localidade, idioma e necessidade real na mesma URL: Newark, Brasil e atendimento em
                  portugues.
                </p>
                <p>
                  Para o cliente, isso reduz friccao e melhora a chance de contato imediato.
                </p>
                <p>
                  Voce consegue ver ofertas quando existem, ir para buscas rapidas e falar com alguem sem perder tempo.
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white md:p-10">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Proximo clique</span>
              <h2 className="mt-3 text-3xl font-extrabold">Transforme busca local em conversa ou reserva</h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
                <p className="flex gap-3">
                  <PhoneCall className="mt-1 h-4 w-4 flex-shrink-0 text-blue-300" />
                  Ligue se quiser atendimento direto em portugues.
                </p>
                <p className="flex gap-3">
                  <MessageCircle className="mt-1 h-4 w-4 flex-shrink-0 text-blue-300" />
                  Abra as mensagens se preferir tirar duvidas antes de comprar.
                </p>
                <p className="flex gap-3">
                  <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  Visite tambem a pagina local de Ironbound e Newark para reforcar a presenca regional.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <a href={`tel:${AGENCY_PHONE_TEL}`}>
                  <Button className="w-full rounded-full bg-white text-slate-950 hover:bg-slate-100">
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Ligar agora
                  </Button>
                </a>
                <Link href="/messages">
                  <Button variant="outline" className="w-full rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Abrir mensagens
                  </Button>
                </Link>
                <Link href="/agencia-de-viagens-ironbound-newark">
                  <Button variant="outline" className="w-full rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">
                    <MapPin className="mr-2 h-4 w-4" />
                    Ver pagina local de Newark
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">FAQ</span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">
              Perguntas comuns de brasileiros na regiao
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
                  <h3 className="text-lg font-bold text-slate-950">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
