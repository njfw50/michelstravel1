import { FlightSearchForm } from "@/components/FlightSearchForm";
import SeniorCardImage from "@/components/SeniorCardImage";
import AppLaunchPromo from "@/components/AppLaunchPromo";
import { FlightBoard } from "@/components/FlightBoard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAirlines, useFeaturedAirports, useFeaturedDeals, type PublicFeaturedDeal } from "@/hooks/use-flights";
import { ArrowRight, CheckCircle2, CreditCard, Globe, MessageCircle, Plane, Search, Sparkles, Ticket, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { SEO } from "@/components/SEO";
import { AGENCY_WHATSAPP_DISPLAY, buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
import { openChatbotAssistant } from "@/lib/chatbot";
import airplaneDestination from "@/assets/images/airplane-destination.jpg";
import airplaneLightHero from "@/assets/images/airplane-light-hero.png";
import imgNewYork from "@/assets/images/destinations/new-york.jpg";
import imgLondon from "@/assets/images/destinations/london.jpg";
import imgParis from "@/assets/images/destinations/paris.jpg";
import imgMiami from "@/assets/images/destinations/miami.jpg";
import imgSaoPaulo from "@/assets/images/destinations/sao-paulo.jpg";
import imgLisbon from "@/assets/images/destinations/lisbon.jpg";
import imgOrlando from "@/assets/images/destinations/orlando.jpg";

const DESTINATION_IMAGES: Record<string, string> = {
  JFK: imgNewYork,
  EWR: imgNewYork,
  LHR: imgLondon,
  CDG: imgParis,
  MIA: imgMiami,
  GRU: imgSaoPaulo,
  LIS: imgLisbon,
  MCO: imgOrlando,
};

export default function Home() {
  const { data: airlines } = useAirlines(14);
  const { data: airports } = useFeaturedAirports();
  const { data: featuredDeals, isLoading: dealsLoading } = useFeaturedDeals();
  const [, setLocation] = useLocation();

  const airlineCount = airlines?.length || 0;
  const airportCount = airports?.length || 0;
  const catalogDeals = featuredDeals?.slice(0, 3) || [];
  const topAirlines = (airlines || []).filter((airline) => airline.logoSymbolUrl && airline.iataCode).slice(0, 8);
  const airportSpots = (airports || []).slice(0, 4);
  const newarkWhatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: "pt",
      topic: "Ajuda de viagem em Newark",
      details: ["Quero ajuda com voos saindo de Newark."],
    }),
  );

  const formatDealPrice = (value: number | null, currency: string) => {
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
  };

  const openDealSearch = (deal: PublicFeaturedDeal) => {
    const searchParams = new URLSearchParams({
      origin: deal.origin,
      destination: deal.destination,
      date: deal.departure_date,
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

    setLocation(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="bg-[#f4f7ff] text-slate-900">
      <SEO
        title="Agência de viagens em Newark, NJ"
        description="Atendimento em português para passagens aéreas em Newark, NJ, com foco em voos para o Brasil, suporte humano e ajuda clara para clientes de Ironbound e região."
        path="/"
      />

      <section className="relative overflow-hidden px-0 pb-14 pt-6 md:pt-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-7rem] h-[28rem] w-[28rem] rounded-full bg-blue-300/20 blur-3xl" />
          <div className="absolute right-[-6%] top-[2rem] h-[22rem] w-[22rem] rounded-full bg-cyan-200/25 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-3xl">
              <Badge className="rounded-full border border-blue-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700 shadow-sm">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Plataforma comercial Michels Travel
              </Badge>
              <h1 className="mt-6 text-[2.8rem] font-extrabold leading-[0.94] tracking-tight text-slate-950 sm:text-5xl md:text-6xl lg:text-[4.65rem]">
                O site agora precisa vender com clareza, ritmo e presença comercial.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Esta nova home abre com uma estrutura mais forte: pesquisa real, apoio humano, rota senior, app e continuidade de compra no mesmo ambiente visual.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="rounded-full bg-[#2563eb] px-7 py-6 text-base font-bold text-white shadow-[0_18px_35px_-18px_rgba(37,99,235,0.75)] hover:bg-[#1d4ed8]"
                  onClick={() => window.scrollTo({ top: 620, behavior: "smooth" })}
                >
                  Buscar passagens
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-slate-300 bg-white px-7 py-6 text-base font-bold text-slate-800 shadow-sm hover:bg-slate-50"
                  onClick={() =>
                    openChatbotAssistant({
                      message: "Mia, me ajude a comecar esta viagem com as opcoes de voo certas.",
                      autoSend: true,
                    })
                  }
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Falar com a Mia
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  "Tarifas ao vivo",
                  "Atendimento em portugues, ingles e espanhol",
                  "Fluxo de compra com acompanhamento real",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-[0_34px_80px_-38px_rgba(15,23,42,0.35)]">
                <div className="relative h-[330px] overflow-hidden md:h-[380px]">
                  <img src={airplaneDestination} alt="Michels Travel" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07132d] via-[#07132d]/25 to-transparent" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/[0.15] bg-[#07132d]/[0.70] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                    Apoio prioritario
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <div className="rounded-[26px] border border-white/[0.15] bg-white/10 p-5 backdrop-blur-xl">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">Michels Travel</p>
                      <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white">
                        Uma unica porta de entrada para voos, senior, app e pos-venda.
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-white/80">
                        A estrutura agora precisa ser clara: captacao, reserva, suporte e retencao dentro da mesma interface.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Companhias", value: airlineCount > 0 ? `${airlineCount}+` : "500+", icon: Plane },
                  { label: "Aeroportos", value: airportCount > 0 ? `${airportCount}+` : "3000+", icon: Globe },
                  { label: "Busca ativa", value: "24/7", icon: TrendingUp },
                ].map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.3)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-5 text-3xl font-extrabold text-slate-950">{item.value}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-44px_rgba(15,23,42,0.35)] sm:p-6 md:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">Buscar voos ao vivo</p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">Michels Travel</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Pesquise ida, ida e volta ou multi destino e siga para o mesmo fluxo comercial da agencia.
                </p>
              </div>
              <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                Disponibilidade validada antes do pagamento
              </div>
            </div>
            <div className="mt-6">
              <FlightSearchForm />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12 md:pb-16">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-2 md:px-6">
          <Card className="overflow-hidden rounded-[28px] border border-amber-200 bg-[linear-gradient(135deg,#fffaf1_0%,#fff3db_100%)] shadow-[0_30px_90px_-46px_rgba(180,83,9,0.35)]">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Atendimento senior</p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950">
                  O atendimento senior continua aberto sem separar a marca.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Acoes maiores, guia mais calma e menos pressao para quem quer mais tempo sem perder o mesmo fluxo de reserva.
                </p>
                <Button onClick={() => setLocation("/senior")} className="mt-6 rounded-full bg-slate-950 px-6 text-sm font-bold text-white hover:bg-slate-800">
                  Abrir caminho senior
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <SeniorCardImage />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border border-blue-200 bg-[linear-gradient(135deg,#ffffff_0%,#edf5ff_100%)] shadow-[0_30px_90px_-46px_rgba(37,99,235,0.35)]">
            <CardContent className="p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">Newark / Ironbound</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950">
                Suporte local para Newark, Ironbound e rotas para o Brasil.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Use o mesmo fluxo digital com apoio direto no WhatsApp para voos, reservas e atendimento comercial mais proximo.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {airportSpots.map((airport) => (
                  <div key={airport.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="text-lg font-extrabold text-slate-950">{airport.iataCode || airport.icaoCode}</div>
                    <div className="text-sm font-semibold text-slate-600">{airport.cityName || airport.name}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-full bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700">
                  <a href={newarkWhatsAppHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Falar no WhatsApp
                  </a>
                </Button>
                <Link href="/agencia-de-viagens-ironbound-newark">
                  <Button variant="outline" className="rounded-full border-slate-300 bg-white px-6 text-sm font-bold text-slate-800">
                    Ironbound Newark
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-[#07132d] p-6 text-white shadow-[0_36px_100px_-52px_rgba(2,6,23,0.95)] md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8ccff]">Jornada de compra</p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">
                  Um caminho mais limpo da pesquisa ate a emissao do bilhete.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#c7d7f7] sm:text-base">
                  A pagina agora conduz melhor a venda: menos ruido, mais hierarquia e o suporte certo no momento certo.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                { number: "01", icon: Search, title: "Pesquise tarifas ao vivo", body: "Abra o inventario real da agencia informando rota, datas e perfil do passageiro." },
                { number: "02", icon: CreditCard, title: "Compare e confirme", body: "Revise conexoes, bagagem e preco com menos ruido antes de entrar na reserva." },
                { number: "03", icon: Ticket, title: "Emita e acompanhe", body: "Mantenha suporte, documentos e pos-venda no mesmo ambiente comercial." },
              ].map((step) => (
                <div key={step.number} className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/75">{step.number}</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#7cb0ff]">
                      <step.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-10 text-2xl font-extrabold text-white">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#c7d7f7] sm:text-base">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 md:py-18">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">Companhias e aeroportos ja conectados</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950 md:text-4xl">
                O site agora precisa parecer e agir como uma plataforma comercial de verdade.
              </h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
              {topAirlines.length > 0 ? `${topAirlines.length} logos ativos` : "Rede pronta para operar"}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_100%)] p-6 shadow-[0_28px_80px_-50px_rgba(37,99,235,0.34)] md:p-8">
              <div className="flex flex-wrap gap-3">
                {topAirlines.map((airline) => (
                  <div key={airline.id} className="inline-flex items-center gap-3 rounded-full border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <img src={airline.logoSymbolUrl || airline.logoUrl || ""} alt={airline.name} className="h-6 w-6 object-contain" loading="lazy" />
                    <span className="text-sm font-semibold text-slate-700">{airline.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  { title: "Suporte humano", body: "WhatsApp e Mia alinhados ao mesmo fluxo comercial." },
                  { title: "Inventario ao vivo", body: "As buscas usam o mesmo inventario operacional conectado a agencia." },
                  { title: "Retencao", body: "App, dashboard e centro de reservas continuam conectados depois da venda." },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-bold text-slate-950">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-slate-950 text-white shadow-[0_32px_90px_-54px_rgba(2,6,23,0.95)]">
              <div className="h-52 overflow-hidden">
                <img src={airplaneLightHero} alt="Airplane" className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/75">Rotas em evidencia</div>
                <div className="mt-4 space-y-3">
                  {catalogDeals.slice(0, 3).map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => openDealSearch(deal)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition-colors hover:bg-white/10"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{deal.origin} → {deal.destination}</div>
                        <div className="mt-1 text-sm text-[#bdd0f3]">{deal.headline}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#7cb0ff]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">Oportunidades em destaque</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-950 md:text-4xl">
                Tarifas e destinos destacados com intencao comercial.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                Abra uma rota, valide disponibilidade e siga para o mesmo motor de reserva que a agencia ja usa no dia a dia.
              </p>
            </div>
            <Link href="/blog">
              <Button variant="outline" className="rounded-full border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 shadow-sm">
                Ver guia de viagem
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {dealsLoading && Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="h-56 animate-pulse bg-slate-100" />
                <div className="space-y-4 p-6">
                  <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="h-8 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}

            {!dealsLoading && catalogDeals.map((deal) => {
              const coverImage = DESTINATION_IMAGES[deal.destination] || DESTINATION_IMAGES[deal.origin];
              const formattedPrice = formatDealPrice(deal.price_value, deal.currency);

              return (
                <Card key={deal.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_-52px_rgba(15,23,42,0.32)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="relative h-56 overflow-hidden">
                    {coverImage ? (
                      <img src={coverImage} alt={deal.destination_city} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-300 via-sky-100 to-white" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge className="border-0 bg-white/[0.92] text-slate-900">{deal.airline || "Michels Travel"}</Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#dce8ff]">{deal.origin} → {deal.destination}</div>
                      <div className="mt-2 text-3xl font-extrabold text-white">{deal.destination_city || deal.destination}</div>
                    </div>
                  </div>
                  <CardContent className="flex h-full flex-col p-6">
                    <p className="text-sm font-semibold text-blue-600">{deal.headline}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{deal.description}</p>
                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">A partir de</div>
                        <div className="mt-1 text-3xl font-extrabold text-slate-950">{formattedPrice || deal.price}</div>
                      </div>
                      <Button className="rounded-full bg-[#2563eb] px-5 text-sm font-bold text-white hover:bg-[#1d4ed8]" onClick={() => openDealSearch(deal)}>
                        Abrir tarifa
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <FlightBoard />

      <AppLaunchPromo className="section-white" />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#07132d_0%,#133266_100%)] shadow-[0_36px_100px_-52px_rgba(2,6,23,0.95)]">
            <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-10 lg:p-12">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">Mia dentro da venda</p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white md:text-5xl">
                  Use a assistente para conduzir a viagem, nao para substituir a venda.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c7d7f7] sm:text-base">
                  A Mia ajuda a qualificar o pedido, explicar opcoes e devolver o cliente para o fluxo de reserva com a rota, as datas e o nivel de apoio corretos.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    "Qualifique a viagem antes da cotacao",
                    "Devolva o viajante ao fluxo de reserva",
                    "Mantenha o WhatsApp disponivel para escalacao",
                    "Capture contexto para vendas futuras",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-4 py-4 text-sm font-semibold text-[#eef4ff]">
                      <CheckCircle2 className="mb-2 h-4 w-4 text-blue-300" />
                      {item}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => openChatbotAssistant({ message: "Mia, me ajude a comecar esta viagem com as opcoes de voo certas.", autoSend: true })}
                  className="mt-7 rounded-full bg-white px-7 py-6 text-base font-bold text-[#12356a] hover:bg-blue-50"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Falar com a Mia
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-white/[0.12] bg-white/[0.08] p-5 backdrop-blur-sm">
                  <div className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200/80">Mia</div>
                  <div className="mt-4 space-y-3">
                    <div className="max-w-[90%] rounded-[20px] rounded-tl-md bg-white/10 px-4 py-3 text-sm leading-6 text-[#f2f7ff]">
                      Quero um voo com menos conexoes e apoio em portugues.
                    </div>
                    <div className="ml-auto max-w-[85%] rounded-[20px] rounded-tr-md bg-[#3d86ff] px-4 py-3 text-sm leading-6 text-white">
                      Posso refinar a rota, comparar opcoes e manter um humano disponivel se voce precisar.
                    </div>
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/[0.12] bg-white/[0.08] p-5 backdrop-blur-sm">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">WhatsApp</div>
                  <div className="mt-2 text-xl font-extrabold text-white">{AGENCY_WHATSAPP_DISPLAY}</div>
                  <p className="mt-3 text-sm leading-7 text-[#bdd0f3]">
                    Quando o cliente quer uma pessoa, o fluxo digital mantem a passagem clara sem quebrar a jornada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
