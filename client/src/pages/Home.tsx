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
import { useI18n } from "@/lib/i18n";
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
  const { t, language } = useI18n();

  const airlineCount = airlines?.length || 0;
  const airportCount = airports?.length || 0;
  const catalogDeals = featuredDeals?.slice(0, 3) || [];
  const topAirlines = (airlines || []).filter((airline) => airline.logoSymbolUrl && airline.iataCode).slice(0, 8);
  const airportSpots = (airports || []).slice(0, 4);
  
  const newarkWhatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language,
      topic: "Ajuda de viagem em Newark",
      details: ["Quero ajuda com voos saindo de Newark."],
    }),
  );

  const formatDealPrice = (value: number | null, currency: string) => {
    if (value === null || Number.isNaN(value)) return null;
    try {
      return new Intl.NumberFormat(language === "pt" ? "pt-BR" : "en-US", {
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
    <div className="bg-[#f8fbff] text-slate-900">
      <SEO
        title="Agência de viagens em Newark, NJ"
        description="Atendimento em português para passagens aéreas em Newark, NJ, com foco em voos para o Brasil, suporte humano e ajuda clara para clientes de Ironbound e região."
        path="/"
      />

      <section className="relative overflow-hidden px-0 pb-16 pt-8 md:pt-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-7rem] h-[28rem] w-[28rem] rounded-full bg-blue-300/20 blur-3xl" />
          <div className="absolute right-[-6%] top-[2rem] h-[22rem] w-[22rem] rounded-full bg-cyan-200/25 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-3xl">
              <Badge className="rounded-full border border-blue-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700 shadow-sm">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                {t("home.hero.badge") || "Curadoria de Viagens & Concierge Exclusivo"}
              </Badge>
              <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-[4.65rem] font-extrabold leading-[1] sm:leading-[0.94] tracking-tight text-slate-950 text-balance break-words">
                {t("home.hero.title") || "A Arte de Viajar Bem: Excelência, Conforto e Suporte Exclusivo."}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                {t("home.hero.desc") || "Descubra o novo padrão em viagens. Mais do que reservas, oferecemos uma curadoria inteligente e um serviço de concierge focado em quem exige o melhor. Cuidamos de cada detalhe para que sua única preocupação seja aproveitar o destino."}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="rounded-full bg-[#2563eb] px-7 py-6 text-base font-bold text-white shadow-[0_18px_35px_-18px_rgba(37,99,235,0.75)] hover:bg-[#1d4ed8]"
                  onClick={() => window.scrollTo({ top: 620, behavior: "smooth" })}
                >
                  {t("home.hero.btn_explore") || "Explorar Destinos"}
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
                  {t("home.hero.btn_consulting") || "Consultoria Privada"}
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  t("home.hero.perks.1") || "Tarifas ao vivo",
                  t("home.hero.perks.2") || "Atendimento em portugues, ingles e espanhol",
                  t("home.hero.perks.3") || "Fluxo de compra com acompanhamento real",
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
                    {t("home.hero.box.badge") || "Concierge 24h"}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <div className="rounded-[26px] border border-white/[0.15] bg-white/10 p-5 backdrop-blur-xl">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">{t("home.hero.box.sub") || "Experiência Sob Medida"}</p>
                      <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white">
                        {t("home.hero.box.title") || "Assessoramos cada passo da sua jornada com uma presença invisível e contínua."}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-white/80">
                        {t("home.hero.box.desc") || "Tranquilidade em todo o processo: desde a curadoria impecável da rota até nosso suporte proativo, antecipando imprevistos e ajustando planos antes que eles o afetem."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Companhias", value: airlineCount > 0 ? `${airlineCount}+` : "500+", icon: Plane },
                  { label: "Aeroportos", value: airportCount > 0 ? `${airportCount}+` : "3000+", icon: Globe },
                  { label: "Buscador", value: "24/7", icon: TrendingUp },
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
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">{t("home.search.badge") || "Buscar voos ao vivo"}</p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">{t("home.search.title") || "Para onde deseja viajar?"}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {t("home.search.desc") || "Encontre e reserve seu voo agora mesmo. Comparação inteligente em tempo real para os melhores preços do mercado."}
                </p>
              </div>
              <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                {t("home.search.tag") || "Disponibilidade validada antes do pagamento"}
              </div>
            </div>
            <div className="mt-6">
              <FlightSearchForm />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 md:py-20">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-2 md:px-6">
          <Card className="overflow-hidden rounded-[28px] border border-amber-200 bg-[linear-gradient(135deg,#fffaf1_0%,#fff3db_100%)] shadow-sm">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">{t("home.senior.badge") || "Design de Jornada"}</p>
                <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold leading-tight text-slate-950">
                  {t("home.senior.title") || "Tranquilidade absoluta: ritmamos sua viagem ao seu tempo."}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  {t("home.senior.desc") || "Desenvolvemos uma curadoria especial para nossos viajantes mais exigentes. Nossa tecnologia se funde ao cuidado humano para guiar de perto cada aspecto da reserva, sem sobressaltos e com absoluta clareza passo a passo."}
                </p>
                <Button onClick={() => setLocation("/senior")} className="mt-6 rounded-full bg-slate-950 px-6 text-sm font-bold text-white shadow-md hover:bg-slate-800">
                  {t("home.senior.btn") || "Explorar Experiência"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <SeniorCardImage />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border border-blue-200 bg-[linear-gradient(135deg,#ffffff_0%,#edf5ff_100%)] shadow-sm">
            <CardContent className="p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">{t("home.office.badge") || "Newark / Ironbound"}</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold leading-tight text-slate-950">
                {t("home.office.title") || "Liderança no mercado de viagens para o Brasil."}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                {t("home.office.desc") || "Estamos no coração de Ironbound (Newark, NJ) garantindo tarifas exclusivas para sua família voar para o Brasil, Europa, e por todos os Estados Unidos. Nosso atendimento humanizado pelo WhatsApp garante o conforto que você precisa antes de voar."}
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
                <Button asChild className="rounded-full bg-blue-600 px-6 text-sm font-bold text-white shadow-md hover:bg-blue-700">
                  <a href={newarkWhatsAppHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t("home.office.btn_whatsapp") || "Falar no WhatsApp"}
                  </a>
                </Button>
                <Link href="/agencia-de-viagens-ironbound-newark">
                  <Button variant="outline" className="rounded-full border-slate-300 bg-white px-6 text-sm font-bold text-slate-800">
                    {t("home.office.btn_location") || "Ironbound Newark"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-[#f8fbff] py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-[#07132d] p-6 text-white shadow-xl md:p-10 lg:p-12">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8ccff]">{t("home.exp.badge") || "A Experiência Michels"}</p>
                <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold leading-tight md:text-5xl">
                  {t("home.exp.title") || "Onde a sofisticação de um serviço impecável cruza com rotas inteligentes."}
                </h2>
                <p className="mt-5 text-sm leading-8 text-[#c7d7f7] sm:text-lg">
                  {t("home.exp.desc") || "Elevamos a sua jornada a outro patamar de qualidade. Operamos com máxima fluidez para trazer clareza, proteção absoluta da transação e isenção total de preocupações ou surpresas."}
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[
                { number: "01", icon: Search, title: t("home.exp.step1.title") || "Conexões Inteligentes", body: t("home.exp.step1.desc") || "Nosso sistema cruza a malha aérea mundial instantaneamente para encontrar as rotas mais imperdíveis com o menor preço online." },
                { number: "02", icon: CreditCard, title: t("home.exp.step2.title") || "Reserva Descomplicada", body: t("home.exp.step2.desc") || "Confirmamos as regras de bagagem, os assentos e emitimos seus recibos em uma plataforma blindada de alto padrão e sem burocracia." },
                { number: "03", icon: Ticket, title: t("home.exp.step3.title") || "Emissão Imediata", body: t("home.exp.step3.desc") || "Sua passagem gerada aprovada em segundos entregue de imediato no seu e-mail particular e app, acompanhada de total suporte comercial pré-embarque." },
              ].map((step) => (
                <div key={step.number} className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:p-8">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/75">{step.number}</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#7cb0ff]">
                      <step.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-8 text-2xl font-extrabold text-white">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#c7d7f7] sm:text-base">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">{t("home.airlines.badge") || "Companhias e aeroportos ja conectados"}</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold leading-tight text-slate-950 md:text-5xl text-balance">
                {t("home.airlines.title") || "Nossos grandes parceiros, unidos pelo seu custo-benefício."}
              </h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
              {topAirlines.length > 0 ? `${topAirlines.length} ${t("home.airlines.tag") || "logos ativos"}` : (t("home.airlines.tag_alt") || "Rede pronta para operar")}
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_100%)] p-6 shadow-sm md:p-10">
              <div className="flex flex-wrap gap-3">
                {topAirlines.map((airline) => (
                  <div key={airline.id} className="inline-flex items-center gap-3 rounded-full border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <img src={airline.logoSymbolUrl || airline.logoUrl || ""} alt={airline.name} className="h-6 w-6 object-contain" loading="lazy" />
                    <span className="text-sm font-semibold text-slate-700">{airline.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { title: t("home.airlines.f1.title") || "Acordos Comerciais Fortes", body: t("home.airlines.f1.desc") || "Negociamos taxas de bagagem e horários preferenciais direto na fonte das companhias para bater o preço do mercado livre." },
                  { title: t("home.airlines.f2.title") || "Inventário Global Ao Vivo", body: t("home.airlines.f2.desc") || "Tenha acesso às prateleiras e passagens de última hora de todas as companhias disponíveis mundialmente." },
                  { title: t("home.airlines.f3.title") || "Sua Viagem Com Apoio Premium", body: t("home.airlines.f3.desc") || "Tenha a Michels Travel do seu lado. Apoio no WhatsApp com consultores verdadeiros, aptos a ajudá-lo na resolução rápida de problemas ou remarcação se necessário." },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-base font-bold text-slate-950">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-[#07132d] text-white shadow-xl">
              <div className="h-52 overflow-hidden">
                <img src={airplaneLightHero} alt="Airplane" className="h-full w-full object-cover opacity-80" />
              </div>
              <div className="p-6 md:p-8">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7cb0ff]">{t("home.airlines.routes") || "Rotas em evidencia"}</div>
                <div className="mt-5 space-y-3">
                  {catalogDeals.slice(0, 3).map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => openDealSearch(deal)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition-colors hover:bg-white/10"
                    >
                      <div>
                        <div className="text-base font-bold text-white">{deal.origin} → {deal.destination}</div>
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

      <section className="bg-[#f8fbff] py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">{t("home.deals.badge") || "Oportunidades em destaque"}</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold leading-tight text-slate-950 md:text-5xl text-balance">
                {t("home.deals.title") || "Destinos Imperdíveis em Oferta Relâmpago."}
              </h2>
              <p className="mt-4 text-sm leading-8 text-slate-600 sm:text-lg">
                {t("home.deals.desc") || "Explore os destinos mais incríveis por preços que cabem no bolso da sua família. Selecionamos passagens aéreas e rotas estratégicas focando na perfeita aliança entre excelência, baixo preço de cotação e exclusividade antes de subirem de preço."}
              </p>
            </div>
            <Link href="/blog">
              <Button variant="outline" className="rounded-full border-slate-300 bg-white px-6 py-5 text-sm font-bold text-slate-800 shadow-sm md:py-6">
                {t("home.deals.btn_guide") || "Ver guia de viagem"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {dealsLoading && Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="h-64 animate-pulse bg-slate-100" />
                <div className="space-y-4 p-6 md:p-8">
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
                <Card key={deal.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-64 overflow-hidden">
                    {coverImage ? (
                      <img src={coverImage} alt={deal.destination_city} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-300 via-sky-100 to-white" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge className="border-0 bg-white/[0.92] text-slate-900">{deal.airline || "Michels Travel"}</Badge>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#dce8ff]">{deal.origin} → {deal.destination}</div>
                      <div className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">{deal.destination_city || deal.destination}</div>
                    </div>
                  </div>
                  <CardContent className="flex h-full flex-col p-6 sm:p-8">
                    <p className="text-base font-bold text-blue-600">{deal.headline}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{deal.description}</p>
                    <div className="mt-8 flex items-end justify-between gap-4 border-t border-slate-100 pt-6">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("home.deals.from") || "A partir de"}</div>
                        <div className="mt-1 text-3xl font-extrabold text-slate-950">{formattedPrice || deal.price}</div>
                      </div>
                      <Button className="rounded-full bg-[#2563eb] px-5 py-6 text-sm font-bold text-white hover:bg-[#1d4ed8]" onClick={() => openDealSearch(deal)}>
                        {t("home.deals.btn_open") || "Abrir tarifa"}
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

      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#07132d_0%,#133266_100%)] shadow-2xl">
            <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-12 lg:p-16">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">{t("home.bot.badge") || "Mia dentro da venda"}</p>
                <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold leading-tight text-white md:text-5xl text-balance">
                  {t("home.bot.title") || "Sua Consultora de Viagens Digital Inteligente."}
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-[#c7d7f7] sm:text-base">
                  {t("home.bot.desc") || "Pode fazer pesquisas ilimitadas! A Mia é a nossa robô amigável criada com base nas políticas da empresa, preparada para identificar seus desejos e indicar a tarifa final que mais te favorece, e te transferir aos nossos agentes ao vivo quando solicitado."}
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    t("home.bot.f1") || "Cotação avançadíssima em qualquer idioma",
                    t("home.bot.f2") || "Apresentação assertiva da rota mais segura e econômica via Chat",
                    t("home.bot.f3") || "Redirecionamento automático e transparente ao fluxo final seguro",
                    t("home.bot.f4") || "Conexão com um atendente humano instantaneamente caso queira suporte pessoal",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-5 py-4 text-sm font-semibold text-[#eef4ff] shadow-inner">
                      <CheckCircle2 className="mb-2 h-5 w-5 text-[#88b5ff]" />
                      {item}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => openChatbotAssistant({ message: "Mia, me ajude a comecar esta viagem com as opcoes de voo certas.", autoSend: true })}
                  className="mt-8 rounded-full bg-white px-8 py-7 text-lg font-bold text-[#12356a] hover:bg-blue-50"
                >
                  <MessageCircle className="mr-2 h-6 w-6" />
                  {t("home.bot.btn") || "Falar com a Mia"}
                </Button>
              </div>

              <div className="grid gap-6">
                <div className="rounded-[28px] border border-white/[0.12] bg-white/[0.08] p-6 backdrop-blur-sm shadow-xl">
                  <div className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200/80">Mia</div>
                  <div className="mt-5 space-y-4">
                    <div className="max-w-[90%] rounded-[20px] rounded-tl-md bg-white/10 px-5 py-4 text-sm leading-6 text-[#f2f7ff]">
                      {t("home.bot.msg1") || "Quero um voo com menos conexoes e apoio em portugues."}
                    </div>
                    <div className="ml-auto max-w-[85%] rounded-[20px] rounded-tr-md bg-[#3d86ff] px-5 py-4 text-sm leading-6 text-white shadow-md">
                      {t("home.bot.msg2") || "Posso refinar a rota, comparar opcoes e manter um humano disponivel se voce precisar."}
                    </div>
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/[0.12] bg-white/[0.08] p-6 backdrop-blur-sm">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">{t("home.bot.whatsapp_badge") || "WhatsApp"}</div>
                  <div className="mt-3 text-2xl font-extrabold text-white">{AGENCY_WHATSAPP_DISPLAY}</div>
                  <p className="mt-3 text-sm leading-7 text-[#bdd0f3]">
                    {t("home.bot.whatsapp_desc") || "Com apenas um toque você conversa em tempo real com diretores da Michels Travel, unificando a segurança das agências do passado à praticidade premium do futuro."}
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
