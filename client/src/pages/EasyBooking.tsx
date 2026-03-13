import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2, ChevronDown, MessageCircle, PhoneCall, Search, ShieldCheck, UserRound, ArrowRight, HeartHandshake } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LocationSearch } from "@/components/LocationSearch";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

type EasyLanguage = "pt" | "en" | "es";
type TripType = "round-trip" | "one-way";

const COPY: Record<EasyLanguage, Record<string, string>> = {
  pt: {
    seo_title: "Modo Fácil",
    seo_desc: "Tela simplificada da Michels Travel para quem prefere comprar passagens com mais calma, letras maiores e apoio humano visível.",
    badge: "Tela simplificada",
    title: "Comprar sua passagem com calma e segurança",
    subtitle: "Criamos esta tela para quem prefere um caminho mais simples, com letras maiores, menos opções por vez e ajuda humana sempre visível.",
    call: "Ligar agora",
    chat: "Falar com a Mia",
    trust: "Nada é cobrado agora. Primeiro você escolhe o voo e revisa tudo com calma.",
    section_title: "Preencha só o essencial",
    section_subtitle: "Você escolhe origem, destino, data e quantidade de pessoas. O restante vem depois, passo a passo.",
    step_1: "1. Escolha de onde sai",
    step_2: "2. Escolha para onde vai",
    step_3: "3. Escolha a data",
    step_4: "4. Veja os voos com calma",
    origin: "De onde você sai?",
    destination: "Para onde você vai?",
    city_placeholder: "Cidade ou aeroporto",
    departure: "Data da ida",
    return: "Data da volta",
    travelers: "Quantas pessoas vão viajar?",
    traveler_one: "viajante",
    traveler_many: "viajantes",
    one_way: "Só ida",
    round_trip: "Ida e volta",
    travelers_hint: "Se precisar de ajuda com crianças, bagagem ou documentos, fale com nossa equipe.",
    search: "Ver voos",
    quick_routes: "Rotas rápidas",
    route_1: "Newark para São Paulo",
    route_2: "Orlando para Brasil",
    route_3: "Newark para Orlando",
    route_4: "Miami para Lisboa",
    helper_title: "Se preferir, nós ajudamos ao vivo",
    helper_desc: "Você pode ligar, abrir o chat ou pedir ajuda antes de finalizar a compra.",
    helper_item_1: "Letras maiores e visual mais limpo",
    helper_item_2: "Menos opções por tela",
    helper_item_3: "Suporte humano visível o tempo todo",
    helper_item_4: "Busca com foco em clareza, não em pressa",
    missing_title: "Faltam informações",
    missing_desc: "Escolha origem, destino e data para continuar.",
    choose_date: "Escolher data",
  },
  en: {
    seo_title: "Easy Mode",
    seo_desc: "Simplified Michels Travel screen for people who want larger text, fewer choices at a time, and visible human support.",
    badge: "Simplified screen",
    title: "Buy your flight with more calm and confidence",
    subtitle: "This screen is designed for travelers who prefer a clearer path, larger text, fewer choices at a time, and human help always within reach.",
    call: "Call now",
    chat: "Talk to Mia",
    trust: "Nothing is charged now. First you choose a flight and review everything calmly.",
    section_title: "Fill in only the essentials",
    section_subtitle: "Choose your origin, destination, date, and number of travelers. Everything else comes later, step by step.",
    step_1: "1. Choose where you leave from",
    step_2: "2. Choose where you are going",
    step_3: "3. Choose your date",
    step_4: "4. Review the flights calmly",
    origin: "Where are you leaving from?",
    destination: "Where do you want to go?",
    city_placeholder: "City or airport",
    departure: "Departure date",
    return: "Return date",
    travelers: "How many people are traveling?",
    traveler_one: "traveler",
    traveler_many: "travelers",
    one_way: "One way",
    round_trip: "Round trip",
    travelers_hint: "If you need help with children, baggage, or documents, talk to our team.",
    search: "See flights",
    quick_routes: "Quick routes",
    route_1: "Newark to São Paulo",
    route_2: "Orlando to Brazil",
    route_3: "Newark to Orlando",
    route_4: "Miami to Lisbon",
    helper_title: "If you prefer, we can help live",
    helper_desc: "You can call, open the chat, or ask for help before finishing the purchase.",
    helper_item_1: "Larger text and cleaner visuals",
    helper_item_2: "Fewer choices per screen",
    helper_item_3: "Human support visible all the time",
    helper_item_4: "Search focused on clarity, not pressure",
    missing_title: "Information is missing",
    missing_desc: "Choose origin, destination, and date to continue.",
    choose_date: "Choose date",
  },
  es: {
    seo_title: "Modo Fácil",
    seo_desc: "Pantalla simplificada de Michels Travel para quienes prefieren texto más grande, menos opciones por vez y apoyo humano visible.",
    badge: "Pantalla simplificada",
    title: "Compre su vuelo con más calma y seguridad",
    subtitle: "Esta pantalla fue creada para quien prefiere un camino más claro, texto más grande, menos opciones por vez y ayuda humana siempre visible.",
    call: "Llamar ahora",
    chat: "Hablar con Mia",
    trust: "No se cobra nada ahora. Primero elige el vuelo y revisa todo con calma.",
    section_title: "Complete solo lo esencial",
    section_subtitle: "Elija origen, destino, fecha y número de personas. Todo lo demás viene después, paso a paso.",
    step_1: "1. Elija desde dónde sale",
    step_2: "2. Elija a dónde va",
    step_3: "3. Elija la fecha",
    step_4: "4. Revise los vuelos con calma",
    origin: "¿Desde dónde sale?",
    destination: "¿A dónde quiere ir?",
    city_placeholder: "Ciudad o aeropuerto",
    departure: "Fecha de ida",
    return: "Fecha de vuelta",
    travelers: "¿Cuántas personas van a viajar?",
    traveler_one: "viajero",
    traveler_many: "viajeros",
    one_way: "Solo ida",
    round_trip: "Ida y vuelta",
    travelers_hint: "Si necesita ayuda con niños, equipaje o documentos, hable con nuestro equipo.",
    search: "Ver vuelos",
    quick_routes: "Rutas rápidas",
    route_1: "Newark a São Paulo",
    route_2: "Orlando a Brasil",
    route_3: "Newark a Orlando",
    route_4: "Miami a Lisboa",
    helper_title: "Si prefiere, le ayudamos en vivo",
    helper_desc: "Puede llamar, abrir el chat o pedir ayuda antes de terminar la compra.",
    helper_item_1: "Texto más grande y visual más limpio",
    helper_item_2: "Menos opciones por pantalla",
    helper_item_3: "Apoyo humano visible todo el tiempo",
    helper_item_4: "Búsqueda enfocada en claridad, no en presión",
    missing_title: "Faltan datos",
    missing_desc: "Elija origen, destino y fecha para continuar.",
    choose_date: "Elegir fecha",
  },
};

const QUICK_ROUTES = [
  { origin: "EWR", destination: "GRU", key: "route_1" },
  { origin: "MCO", destination: "GRU", key: "route_2" },
  { origin: "EWR", destination: "MCO", key: "route_3" },
  { origin: "MIA", destination: "LIS", key: "route_4" },
];

export default function EasyBooking() {
  const { language } = useI18n();
  const currentLanguage = (language || "pt") as EasyLanguage;
  const copy = COPY[currentLanguage];
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tripType, setTripType] = useState<TripType>("round-trip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [adults, setAdults] = useState(1);

  const openAssistant = () => {
    const chatButton = document.querySelector('[data-testid="button-chatbot-toggle"]') as HTMLButtonElement | null;
    chatButton?.click();
  };

  const handleSearch = () => {
    if (!origin || !destination || !departureDate) {
      toast({
        title: copy.missing_title,
        description: copy.missing_desc,
        variant: "destructive",
      });
      return;
    }

    const params = new URLSearchParams({
      origin,
      destination,
      date: format(departureDate, "yyyy-MM-dd"),
      passengers: String(adults),
      adults: String(adults),
      children: "0",
      infants: "0",
      cabinClass: "economy",
      ui: "easy",
    });

    if (tripType === "round-trip" && returnDate) {
      params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
    }

    setLocation(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(241,245,249,0.96)_40%,_rgba(226,232,240,0.95)_100%)]">
      <SEO title={copy.seo_title} description={copy.seo_desc} path="/easy" />

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute -top-24 left-12 h-56 w-56 rounded-full bg-blue-200/60 blur-3xl" />
          <div className="absolute top-32 right-10 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 relative">
          <div className="max-w-5xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <HeartHandshake className="h-4 w-4" />
              {copy.badge}
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-display font-extrabold tracking-tight text-slate-950 leading-[0.95]">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg md:text-2xl leading-relaxed text-slate-600">
              {copy.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="min-h-14 rounded-2xl px-6 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white">
                <a href="tel:+18623501161">
                  <PhoneCall className="h-5 w-5" />
                  {copy.call}
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={openAssistant} className="min-h-14 rounded-2xl px-6 text-base font-bold border-slate-300 bg-white/90 text-slate-800">
                <MessageCircle className="h-5 w-5" />
                {copy.chat}
              </Button>
            </div>

            <div className="mt-8 inline-flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm md:text-base text-emerald-900 shadow-sm">
              <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600" />
              <span>{copy.trust}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_380px] gap-8 items-start">
            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_80px_-30px_rgba(15,23,42,0.28)]">
              <CardContent className="p-6 md:p-8 space-y-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-display font-extrabold text-slate-950">{copy.section_title}</h2>
                  <p className="mt-3 text-base md:text-lg text-slate-600 leading-relaxed">{copy.section_subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[copy.step_1, copy.step_2, copy.step_3, copy.step_4].map((step) => (
                    <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-semibold text-slate-700">
                      {step}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setTripType("round-trip")}
                    className={cn(
                      "rounded-2xl px-5 py-3 text-base font-bold transition-colors",
                      tripType === "round-trip" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                  >
                    {copy.round_trip}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType("one-way")}
                    className={cn(
                      "rounded-2xl px-5 py-3 text-base font-bold transition-colors",
                      tripType === "one-way" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                  >
                    {copy.one_way}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <LocationSearch
                    label={copy.origin}
                    placeholder={copy.city_placeholder}
                    value={origin}
                    onChange={setOrigin}
                    size="large"
                  />
                  <LocationSearch
                    label={copy.destination}
                    placeholder={copy.city_placeholder}
                    value={destination}
                    onChange={setDestination}
                    size="large"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block pl-1 text-sm font-semibold tracking-[0.08em] text-slate-600">{copy.departure}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex h-16 md:h-[72px] w-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-left transition-all hover:border-blue-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/10"
                        >
                          <CalendarDays className="mr-4 h-6 w-6 shrink-0 text-blue-600" />
                          <span className={cn("flex-1 text-lg md:text-xl font-semibold", departureDate ? "text-slate-900" : "text-slate-400")}>
                            {departureDate ? format(departureDate, "dd MMM yyyy") : copy.choose_date}
                          </span>
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200" align="start">
                        <Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} initialFocus disabled={(date) => date < new Date()} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className={cn("block pl-1 text-sm font-semibold tracking-[0.08em] text-slate-600", tripType === "one-way" && "opacity-40")}>{copy.return}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={tripType === "one-way"}
                          className={cn(
                            "flex h-16 md:h-[72px] w-full items-center rounded-2xl border px-5 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/10",
                            tripType === "one-way"
                              ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300"
                              : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-white",
                          )}
                        >
                          <CalendarDays className={cn("mr-4 h-6 w-6 shrink-0", tripType === "one-way" ? "text-slate-300" : "text-blue-600")} />
                          <span className={cn("flex-1 text-lg md:text-xl font-semibold", returnDate ? "text-slate-900" : "text-slate-400")}>
                            {tripType === "one-way" ? copy.one_way : returnDate ? format(returnDate, "dd MMM yyyy") : copy.choose_date}
                          </span>
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200" align="start">
                        <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus disabled={(date) => date < (departureDate || new Date())} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold tracking-[0.08em] text-slate-600">{copy.travelers}</p>
                      <p className="mt-1 text-lg md:text-xl font-bold text-slate-950">
                        {adults} {adults === 1 ? copy.traveler_one : copy.traveler_many}
                      </p>
                      <p className="mt-2 text-sm text-slate-500 max-w-xl">{copy.travelers_hint}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAdults((value) => Math.max(1, value - 1))}
                        className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-2xl font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600"
                      >
                        -
                      </button>
                      <div className="flex h-14 min-w-20 items-center justify-center rounded-2xl bg-white border border-slate-200 text-2xl font-extrabold text-slate-950">
                        {adults}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdults((value) => Math.min(9, value + 1))}
                        className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-2xl font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold tracking-[0.08em] text-slate-600">{copy.quick_routes}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {QUICK_ROUTES.map((route) => (
                      <button
                        key={`${route.origin}-${route.destination}`}
                        type="button"
                        onClick={() => {
                          setOrigin(route.origin);
                          setDestination(route.destination);
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-base font-semibold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50"
                      >
                        {copy[route.key]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleSearch} className="min-h-16 flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-extrabold">
                    <Search className="h-5 w-5" />
                    {copy.search}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button asChild variant="outline" className="min-h-16 rounded-2xl border-slate-300 bg-white text-slate-800 text-lg font-bold">
                    <a href="tel:+18623501161">
                      <PhoneCall className="h-5 w-5" />
                      {copy.call}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-[28px] border border-slate-200 bg-[#0f172a] text-white shadow-[0_20px_80px_-30px_rgba(15,23,42,0.6)]">
                <CardContent className="p-6 md:p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <UserRound className="h-6 w-6 text-blue-200" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.16em] text-blue-200">Michels Travel</p>
                      <h3 className="text-2xl font-display font-extrabold">{copy.helper_title}</h3>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-slate-300">{copy.helper_desc}</p>
                  <div className="mt-6 space-y-3">
                    {[copy.helper_item_1, copy.helper_item_2, copy.helper_item_3, copy.helper_item_4].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300 mt-0.5" />
                        <span className="text-sm text-slate-100">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-emerald-200 bg-emerald-50">
                <CardContent className="p-6 md:p-7">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <h3 className="text-xl font-display font-extrabold text-emerald-950">Michels Travel</h3>
                      <p className="mt-2 text-sm leading-relaxed text-emerald-900">
                        {copy.trust}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
