import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2, ChevronDown, MessageCircle, PhoneCall, Search, ShieldCheck, UserRound, ArrowRight, HeartHandshake, BriefcaseBusiness, Package, Luggage } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LocationSearch } from "@/components/LocationSearch";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { AGENCY_PHONE_DISPLAY, AGENCY_PHONE_TEL } from "@/lib/contact";

type EasyLanguage = "pt" | "en" | "es";
type TripType = "round-trip" | "one-way";

const COPY: Record<EasyLanguage, Record<string, string>> = {
  pt: {
    seo_title: "Atendimento Senior",
    seo_desc: "Fluxo simplificado da Michels Travel para idosos e clientes que preferem comprar com mais calma, letras maiores e ajuda humana visivel.",
    badge: "Atendimento senior",
    title: "Comprar sua passagem com calma, ajuda e letras maiores",
    subtitle: `Este caminho foi preparado para idosos e clientes que preferem menos pressa. Voce pode fechar a compra no site ou ligar para ${AGENCY_PHONE_DISPLAY}.`,
    call: "Ligar agora",
    chat: "Falar com a Mia",
    trust: `Nada e cobrado agora. Primeiro voce escolhe o voo e revisa tudo com calma. Se preferir, nossa equipe continua com voce pelo telefone ${AGENCY_PHONE_DISPLAY}.`,
    section_title: "Escolha o jeito que fica melhor para voce",
    section_subtitle: "Se quiser, voce pode seguir no site com o fluxo facil. Se preferir, pode ligar para nossa equipe e concluir por telefone.",
    path_site: "1. Continuar pelo fluxo facil",
    path_site_desc: "Preencha origem, destino, data e veja os voos com calma.",
    path_call: "2. Ligar para a Michels Travel",
    path_call_desc: `Fale com a equipe no numero ${AGENCY_PHONE_DISPLAY} para tirar duvidas ou fechar sua viagem.`,
    continue_label: "Continuar no site",
    phone_label: "Telefone direto",
    direct_call: `Ligar para ${AGENCY_PHONE_DISPLAY}`,
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
    helper_desc: `Voce pode ligar, abrir o chat ou pedir ajuda antes de finalizar a compra. O telefone direto desta trilha e ${AGENCY_PHONE_DISPLAY}.`,
    helper_item_1: "Letras maiores e visual mais limpo",
    helper_item_2: "Menos opções por tela",
    helper_item_3: "Suporte humano visível o tempo todo",
    helper_item_4: "Busca com foco em clareza, não em pressa",
    baggage_title: "Bagagem explicada de forma facil",
    baggage_desc: "Antes de ver os voos, entenda assim: uma bolsa pequena quase sempre vai com voce, a bagagem de mao depende da tarifa e a mala despachada pode ou nao estar incluida.",
    baggage_personal_title: "Bolsa pequena ou mochila",
    baggage_personal_desc: "Normalmente e o item que fica embaixo do assento. E a parte mais simples da viagem.",
    baggage_carry_title: "Bagagem de mao",
    baggage_carry_desc: "Nem toda tarifa inclui. Na proxima tela mostramos claramente se seu voo permite levar mala de mao na cabine.",
    baggage_checked_title: "Mala despachada",
    baggage_checked_desc: "E a mala que vai no bagageiro do aviao. Algumas tarifas incluem, outras cobram separado.",
    baggage_note: "Quando houver bagagem extra, mostramos o preco por mala, para qual passageiro vale e se serve para ida, volta ou trecho especifico.",
    baggage_support: `Se qualquer regra de bagagem parecer confusa, pare e fale com a equipe no ${AGENCY_PHONE_DISPLAY} antes de pagar.`,
    missing_title: "Faltam informações",
    missing_desc: "Escolha origem, destino e data para continuar.",
    choose_date: "Escolher data",
  },
  en: {
    seo_title: "Senior Support",
    seo_desc: "Simplified Michels Travel flow for older travelers and anyone who wants larger text, fewer choices, and visible human support.",
    badge: "Senior support",
    title: "Buy your flight with more calm, help, and larger text",
    subtitle: `This path is designed for older travelers and anyone who prefers less pressure. You can finish online or call ${AGENCY_PHONE_DISPLAY}.`,
    call: "Call now",
    chat: "Talk to Mia",
    trust: `Nothing is charged now. First you choose a flight and review everything calmly. If you prefer, our team can continue with you by phone at ${AGENCY_PHONE_DISPLAY}.`,
    section_title: "Choose the path that feels best for you",
    section_subtitle: "You can keep going on the site with the easy flow, or call our team and finish the trip by phone.",
    path_site: "1. Continue with the easy flow",
    path_site_desc: "Choose origin, destination, date, and review flights calmly.",
    path_call: "2. Call Michels Travel",
    path_call_desc: `Talk to our team at ${AGENCY_PHONE_DISPLAY} to ask questions or finish your trip.`,
    continue_label: "Continue online",
    phone_label: "Direct phone",
    direct_call: `Call ${AGENCY_PHONE_DISPLAY}`,
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
    helper_desc: `You can call, open the chat, or ask for help before finishing the purchase. The direct phone for this path is ${AGENCY_PHONE_DISPLAY}.`,
    helper_item_1: "Larger text and cleaner visuals",
    helper_item_2: "Fewer choices per screen",
    helper_item_3: "Human support visible all the time",
    helper_item_4: "Search focused on clarity, not pressure",
    baggage_title: "Baggage explained the easy way",
    baggage_desc: "Before looking at flights, think about baggage like this: a small personal item usually goes with you, carry-on depends on the fare, and checked baggage may or may not be included.",
    baggage_personal_title: "Small bag or backpack",
    baggage_personal_desc: "This is usually the item that stays under the seat. It is the simplest part of the trip.",
    baggage_carry_title: "Carry-on bag",
    baggage_carry_desc: "Not every fare includes it. On the next screen we show clearly whether your flight allows cabin baggage.",
    baggage_checked_title: "Checked bag",
    baggage_checked_desc: "This is the bag that goes in the aircraft hold. Some fares include it and others charge separately.",
    baggage_note: "When extra baggage is available, we show the price per bag, which passenger it applies to, and whether it is for outbound, return, or a specific segment.",
    baggage_support: `If any baggage rule feels confusing, stop and talk to our team at ${AGENCY_PHONE_DISPLAY} before paying.`,
    missing_title: "Information is missing",
    missing_desc: "Choose origin, destination, and date to continue.",
    choose_date: "Choose date",
  },
  es: {
    seo_title: "Atencion Senior",
    seo_desc: "Flujo simplificado de Michels Travel para personas mayores y viajeros que prefieren texto mas grande, menos opciones y apoyo humano visible.",
    badge: "Atencion senior",
    title: "Compre su vuelo con mas calma, ayuda y texto mas grande",
    subtitle: `Esta ruta fue creada para personas mayores y clientes que prefieren menos presion. Puede cerrar en el sitio o llamar al ${AGENCY_PHONE_DISPLAY}.`,
    call: "Llamar ahora",
    chat: "Hablar con Mia",
    trust: `No se cobra nada ahora. Primero elige el vuelo y revisa todo con calma. Si prefiere, nuestro equipo puede continuar con usted por telefono en ${AGENCY_PHONE_DISPLAY}.`,
    section_title: "Elija el camino que le quede mejor",
    section_subtitle: "Puede seguir en el sitio con el flujo facil o llamar a nuestro equipo y terminar el viaje por telefono.",
    path_site: "1. Continuar con el flujo facil",
    path_site_desc: "Elija origen, destino, fecha y revise los vuelos con calma.",
    path_call: "2. Llamar a Michels Travel",
    path_call_desc: `Hable con nuestro equipo al ${AGENCY_PHONE_DISPLAY} para resolver dudas o cerrar su viaje.`,
    continue_label: "Continuar en el sitio",
    phone_label: "Telefono directo",
    direct_call: `Llamar al ${AGENCY_PHONE_DISPLAY}`,
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
    helper_desc: `Puede llamar, abrir el chat o pedir ayuda antes de terminar la compra. El telefono directo de esta ruta es ${AGENCY_PHONE_DISPLAY}.`,
    helper_item_1: "Texto más grande y visual más limpio",
    helper_item_2: "Menos opciones por pantalla",
    helper_item_3: "Apoyo humano visible todo el tiempo",
    helper_item_4: "Búsqueda enfocada en claridad, no en presión",
    baggage_title: "Equipaje explicado de forma facil",
    baggage_desc: "Antes de ver los vuelos, piense en el equipaje asi: un articulo pequeno normalmente va con usted, el equipaje de mano depende de la tarifa y la maleta facturada puede estar incluida o no.",
    baggage_personal_title: "Bolso pequeno o mochila",
    baggage_personal_desc: "Normalmente es el articulo que queda debajo del asiento. Es la parte mas simple del viaje.",
    baggage_carry_title: "Equipaje de mano",
    baggage_carry_desc: "No todas las tarifas lo incluyen. En la siguiente pantalla mostramos claramente si su vuelo permite llevar maleta en cabina.",
    baggage_checked_title: "Maleta facturada",
    baggage_checked_desc: "Es la maleta que va en la bodega del avion. Algunas tarifas la incluyen y otras la cobran aparte.",
    baggage_note: "Cuando exista equipaje extra, mostramos el precio por maleta, para que pasajero aplica y si sirve para ida, vuelta o un tramo especifico.",
    baggage_support: `Si alguna regla de equipaje parece confusa, pare y hable con el equipo al ${AGENCY_PHONE_DISPLAY} antes de pagar.`,
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
      <SEO title={copy.seo_title} description={copy.seo_desc} path="/senior" />

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
                <a href={`tel:${AGENCY_PHONE_TEL}`}>
                  <PhoneCall className="h-5 w-5" />
                  {copy.direct_call}
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
                  <div className="rounded-[24px] border border-blue-200 bg-blue-50/80 p-5">
                    <p className="text-sm font-semibold tracking-[0.08em] text-blue-700">{copy.path_site}</p>
                    <p className="mt-2 text-base leading-relaxed text-slate-700">{copy.path_site_desc}</p>
                  </div>
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-semibold tracking-[0.08em] text-emerald-700">{copy.path_call}</p>
                    <p className="mt-2 text-base leading-relaxed text-slate-700">{copy.path_call_desc}</p>
                    <p className="mt-3 text-lg font-extrabold text-emerald-900">{AGENCY_PHONE_DISPLAY}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[copy.step_1, copy.step_2, copy.step_3, copy.step_4].map((step) => (
                    <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-semibold text-slate-700">
                      {step}
                    </div>
                  ))}
                </div>

                <div className="rounded-[28px] border border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,1),rgba(255,255,255,0.98))] p-5 md:p-6 shadow-[0_20px_60px_-40px_rgba(217,119,6,0.5)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                      <Luggage className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-extrabold text-slate-950">{copy.baggage_title}</h3>
                      <p className="mt-2 text-base leading-relaxed text-slate-600">{copy.baggage_desc}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-amber-100 bg-white px-4 py-4">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-5 w-5 text-amber-700" />
                        <p className="text-base font-bold text-slate-950">{copy.baggage_personal_title}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.baggage_personal_desc}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-700" />
                        <p className="text-base font-bold text-slate-950">{copy.baggage_carry_title}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.baggage_carry_desc}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Luggage className="h-5 w-5 text-emerald-700" />
                        <p className="text-base font-bold text-slate-950">{copy.baggage_checked_title}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.baggage_checked_desc}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <p className="text-sm font-semibold leading-relaxed text-amber-950">{copy.baggage_note}</p>
                    <p className="mt-2 text-sm leading-relaxed text-amber-900">{copy.baggage_support}</p>
                  </div>
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
                    {copy.continue_label}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button asChild variant="outline" className="min-h-16 rounded-2xl border-slate-300 bg-white text-slate-800 text-lg font-bold">
                    <a href={`tel:${AGENCY_PHONE_TEL}`}>
                      <PhoneCall className="h-5 w-5" />
                      {copy.direct_call}
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
