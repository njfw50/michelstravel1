import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2, ChevronDown, MessageCircle, Search, ShieldCheck, UserRound, ArrowRight, HeartHandshake, BriefcaseBusiness, Package, Luggage } from "lucide-react";
import { SEO } from "@/components/SEO";
import AppLaunchPromo from "@/components/AppLaunchPromo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LocationSearch } from "@/components/LocationSearch";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  AGENCY_WHATSAPP_DISPLAY,
  buildWhatsAppHref,
  buildWhatsAppMessage,
} from "@/lib/contact";
import { openChatbotAssistant } from "@/lib/chatbot";

type EasyLanguage = "pt" | "en" | "es";
type TripType = "round-trip" | "one-way";
type SeniorPriority = "comfort" | "fastest" | "balanced" | "cheapest";
type SeniorConnections = "none" | "one" | "any";
type SeniorBags = "checked" | "carry" | "flexible";
type SeniorTime = "day" | "any";

const COPY: Record<EasyLanguage, Record<string, string>> = {
  pt: {
    seo_title: "Atendimento Senior",
    seo_desc: "Fluxo simplificado da Michels Travel para idosos e clientes que preferem comprar com mais calma, letras maiores e ajuda humana visivel.",
    badge: "Atendimento senior",
    title: "Comprar sua passagem com calma, ajuda e letras maiores",
    subtitle: `Este caminho foi preparado para idosos e clientes que preferem menos pressa. A Mia pode acompanhar sua escolha com calma, e o WhatsApp ${AGENCY_WHATSAPP_DISPLAY} continua disponivel quando voce quiser falar com um humano.`,
    call: "Abrir WhatsApp",
    chat: "Falar com a Mia",
    trust: `Nada e cobrado agora. Primeiro voce escolhe o voo e revisa tudo com calma. Se quiser, a Mia explica cada passo e a equipe humana continua com voce pelo WhatsApp ${AGENCY_WHATSAPP_DISPLAY}.`,
    section_title: "Escolha o jeito que fica melhor para voce",
    section_subtitle: "Se quiser, voce pode seguir no site com o fluxo facil, abrir a Mia para comparar com ajuda, ou chamar nossa equipe no WhatsApp.",
    path_site: "1. Continuar pelo fluxo facil",
    path_site_desc: "Preencha origem, destino, data e veja os voos com calma.",
    path_call: "2. Falar com a Michels Travel no WhatsApp",
    path_call_desc: `Fale com a equipe no WhatsApp ${AGENCY_WHATSAPP_DISPLAY} para tirar duvidas ou continuar sua viagem.`,
    continue_label: "Continuar no site",
    phone_label: "WhatsApp direto",
    direct_call: `WhatsApp ${AGENCY_WHATSAPP_DISPLAY}`,
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
    helper_desc: `A Mia pode ajudar voce a comparar voos, conexoes e bagagem antes de finalizar a compra. Se preferir falar com um humano, o contato direto desta trilha e ${AGENCY_WHATSAPP_DISPLAY}.`,
    helper_item_1: "Letras maiores e visual mais limpo",
    helper_item_2: "Menos opções por tela",
    helper_item_3: "Mia visivel o tempo todo, com apoio humano quando precisar",
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
    baggage_support: `Se qualquer regra de bagagem parecer confusa, pare e fale com a equipe no WhatsApp ${AGENCY_WHATSAPP_DISPLAY} antes de pagar.`,
    missing_title: "Faltam informações",
    missing_desc: "Escolha origem, destino e data para continuar.",
    choose_date: "Escolher data",
  },
  en: {
    seo_title: "Senior Support",
    seo_desc: "Simplified Michels Travel flow for older travelers and anyone who wants larger text, fewer choices, and visible human support.",
    badge: "Senior support",
    title: "Buy your flight with more calm, help, and larger text",
    subtitle: `This path is designed for older travelers and anyone who prefers less pressure. Mia can guide the choice calmly, and WhatsApp at ${AGENCY_WHATSAPP_DISPLAY} stays available whenever you want a human.`,
    call: "Open WhatsApp",
    chat: "Talk to Mia",
    trust: `Nothing is charged now. First you choose a flight and review everything calmly. If you want, Mia explains each step and our team can continue with you on WhatsApp at ${AGENCY_WHATSAPP_DISPLAY}.`,
    section_title: "Choose the path that feels best for you",
    section_subtitle: "You can keep going on the site with the easy flow, open Mia for guided help, or talk to our team on WhatsApp.",
    path_site: "1. Continue with the easy flow",
    path_site_desc: "Choose origin, destination, date, and review flights calmly.",
    path_call: "2. Talk to Michels Travel on WhatsApp",
    path_call_desc: `Talk to our team on WhatsApp at ${AGENCY_WHATSAPP_DISPLAY} to ask questions or continue your trip.`,
    continue_label: "Continue online",
    phone_label: "Direct WhatsApp",
    direct_call: `WhatsApp ${AGENCY_WHATSAPP_DISPLAY}`,
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
    helper_desc: `Mia can help you compare flights, connections, and baggage before finishing the purchase. If you prefer a human, the direct contact for this path is ${AGENCY_WHATSAPP_DISPLAY}.`,
    helper_item_1: "Larger text and cleaner visuals",
    helper_item_2: "Fewer choices per screen",
    helper_item_3: "Mia visible all the time, with human backup when needed",
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
    baggage_support: `If any baggage rule feels confusing, stop and talk to our team on WhatsApp at ${AGENCY_WHATSAPP_DISPLAY} before paying.`,
    missing_title: "Information is missing",
    missing_desc: "Choose origin, destination, and date to continue.",
    choose_date: "Choose date",
  },
  es: {
    seo_title: "Atencion Senior",
    seo_desc: "Flujo simplificado de Michels Travel para personas mayores y viajeros que prefieren texto mas grande, menos opciones y apoyo humano visible.",
    badge: "Atencion senior",
    title: "Compre su vuelo con mas calma, ayuda y texto mas grande",
    subtitle: `Esta ruta fue creada para personas mayores y clientes que prefieren menos presion. Mia puede acompanar su eleccion con calma, y WhatsApp al ${AGENCY_WHATSAPP_DISPLAY} sigue disponible cuando quiera un humano.`,
    call: "Abrir WhatsApp",
    chat: "Hablar con Mia",
    trust: `No se cobra nada ahora. Primero elige el vuelo y revisa todo con calma. Si quiere, Mia explica cada paso y nuestro equipo puede continuar con usted por WhatsApp en ${AGENCY_WHATSAPP_DISPLAY}.`,
    section_title: "Elija el camino que le quede mejor",
    section_subtitle: "Puede seguir en el sitio con el flujo facil, abrir a Mia para recibir ayuda guiada, o hablar con nuestro equipo por WhatsApp.",
    path_site: "1. Continuar con el flujo facil",
    path_site_desc: "Elija origen, destino, fecha y revise los vuelos con calma.",
    path_call: "2. Hablar con Michels Travel por WhatsApp",
    path_call_desc: `Hable con nuestro equipo por WhatsApp al ${AGENCY_WHATSAPP_DISPLAY} para resolver dudas o continuar su viaje.`,
    continue_label: "Continuar en el sitio",
    phone_label: "WhatsApp directo",
    direct_call: `WhatsApp ${AGENCY_WHATSAPP_DISPLAY}`,
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
    helper_desc: `Mia puede ayudarle a comparar vuelos, conexiones y equipaje antes de terminar la compra. Si prefiere un humano, el contacto directo de esta ruta es ${AGENCY_WHATSAPP_DISPLAY}.`,
    helper_item_1: "Texto más grande y visual más limpio",
    helper_item_2: "Menos opciones por pantalla",
    helper_item_3: "Mia visible todo el tiempo, con apoyo humano cuando haga falta",
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
    baggage_support: `Si alguna regla de equipaje parece confusa, pare y hable con el equipo por WhatsApp al ${AGENCY_WHATSAPP_DISPLAY} antes de pagar.`,
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
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [priority, setPriority] = useState<SeniorPriority>("comfort");
  const [connections, setConnections] = useState<SeniorConnections>("one");
  const [bags, setBags] = useState<SeniorBags>("flexible");
  const [timePreference, setTimePreference] = useState<SeniorTime>("day");

  const wizardCopy = currentLanguage === "en"
    ? {
        progress: "Calm planning",
        next: "Continue",
        back: "Go back",
        searchNow: "See calmer flights",
        routeTitle: "First, where are you leaving from and where do you want to go?",
        routeDesc: "Only answer this part now. We keep the rest for the next step.",
        dateTitle: "Now choose the date and how many people are traveling.",
        dateDesc: "One calm decision at a time.",
        priorityTitle: "What matters most for this trip?",
        priorityDesc: "This answer changes which flights appear first.",
        connectionTitle: "How many connections feel acceptable?",
        connectionDesc: "For older travelers, less connection usually means less fatigue.",
        bagTitle: "Let us finish with baggage and schedule.",
        bagDesc: "We use this to avoid showing options that may create surprise later.",
        summaryTitle: "Your answers so far",
        summaryEmpty: "As you answer each question, the trip summary appears here.",
        priorityComfort: "More comfort",
        priorityFastest: "Less travel time",
        priorityBalanced: "Balance price and comfort",
        priorityCheapest: "Lower price",
        connectionsNone: "Avoid connections",
        connectionsOne: "At most 1 connection",
        connectionsAny: "Any connection if needed",
        bagsChecked: "Need checked bag",
        bagsCarry: "Need carry-on",
        bagsFlexible: "Baggage can vary",
        timeDay: "Avoid very late hours",
        timeAny: "Any schedule",
        bagNote: "We will put calmer flights first and leave the rest hidden unless you ask to see more.",
      }
    : currentLanguage === "es"
      ? {
          progress: "Planificacion tranquila",
          next: "Continuar",
          back: "Volver",
          searchNow: "Ver vuelos mas tranquilos",
          routeTitle: "Primero, digame desde donde sale y a donde quiere ir.",
          routeDesc: "Solo responda esta parte ahora. Dejamos el resto para el siguiente paso.",
          dateTitle: "Ahora elija la fecha y cuantas personas van a viajar.",
          dateDesc: "Una decision tranquila por vez.",
          priorityTitle: "Que es lo mas importante para este viaje?",
          priorityDesc: "Esta respuesta cambia cuales vuelos aparecen primero.",
          connectionTitle: "Cuantas conexiones se sienten aceptables?",
          connectionDesc: "Para personas mayores, menos conexiones normalmente significa menos cansancio.",
          bagTitle: "Terminemos con equipaje y horario.",
          bagDesc: "Usamos esto para no mostrar opciones que puedan traer sorpresa despues.",
          summaryTitle: "Sus respuestas hasta ahora",
          summaryEmpty: "A medida que responda cada pregunta, el resumen del viaje aparece aqui.",
          priorityComfort: "Mas comodidad",
          priorityFastest: "Menos tiempo total",
          priorityBalanced: "Equilibrio entre precio y comodidad",
          priorityCheapest: "Menor precio",
          connectionsNone: "Evitar conexiones",
          connectionsOne: "Maximo 1 conexion",
          connectionsAny: "Cualquier conexion si hace falta",
          bagsChecked: "Necesita maleta facturada",
          bagsCarry: "Necesita equipaje de mano",
          bagsFlexible: "El equipaje puede variar",
          timeDay: "Evitar horas muy tarde",
          timeAny: "Cualquier horario",
          bagNote: "Pondremos primero los vuelos mas tranquilos y dejaremos el resto escondido hasta que usted quiera verlo.",
        }
      : {
          progress: "Planejamento tranquilo",
          next: "Continuar",
          back: "Voltar",
          searchNow: "Ver voos mais tranquilos",
          routeTitle: "Primeiro, me diga de onde voce sai e para onde quer ir.",
          routeDesc: "Responda so esta parte agora. O resto fica para a proxima etapa.",
          dateTitle: "Agora escolha a data e quantas pessoas vao viajar.",
          dateDesc: "Uma decisao tranquila por vez.",
          priorityTitle: "O que e mais importante para esta viagem?",
          priorityDesc: "Essa resposta muda quais voos aparecem primeiro.",
          connectionTitle: "Quantas conexoes parecem aceitaveis?",
          connectionDesc: "Para idosos, menos conexao normalmente significa menos cansaco.",
          bagTitle: "Vamos terminar com bagagem e horario.",
          bagDesc: "Usamos isso para nao mostrar opcoes que podem trazer surpresa depois.",
          summaryTitle: "Suas respostas ate aqui",
          summaryEmpty: "Conforme voce responde cada pergunta, o resumo da viagem aparece aqui.",
          priorityComfort: "Mais conforto",
          priorityFastest: "Menor tempo total",
          priorityBalanced: "Equilibrio entre preco e conforto",
          priorityCheapest: "Menor preco",
          connectionsNone: "Evitar conexoes",
          connectionsOne: "No maximo 1 conexao",
          connectionsAny: "Qualquer conexao se precisar",
          bagsChecked: "Precisa de mala despachada",
          bagsCarry: "Precisa de bagagem de mao",
          bagsFlexible: "A bagagem pode variar",
          timeDay: "Evitar horario muito tarde",
          timeAny: "Qualquer horario",
          bagNote: "Vamos colocar primeiro os voos mais tranquilos e deixar o restante escondido ate voce pedir para ver mais.",
        };

  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: currentLanguage,
      topic: currentLanguage === "en" ? "Senior support" : currentLanguage === "es" ? "Atencion senior" : "Atendimento senior",
      details: [
        origin ? `${currentLanguage === "en" ? "Origin" : currentLanguage === "es" ? "Origen" : "Origem"}: ${origin}` : null,
        destination ? `${currentLanguage === "en" ? "Destination" : currentLanguage === "es" ? "Destino" : "Destino"}: ${destination}` : null,
        departureDate ? `${currentLanguage === "en" ? "Departure" : currentLanguage === "es" ? "Salida" : "Ida"}: ${format(departureDate, "yyyy-MM-dd")}` : null,
        tripType === "round-trip" && returnDate ? `${currentLanguage === "en" ? "Return" : currentLanguage === "es" ? "Vuelta" : "Volta"}: ${format(returnDate, "yyyy-MM-dd")}` : null,
        `${currentLanguage === "en" ? "Travelers" : currentLanguage === "es" ? "Pasajeros" : "Passageiros"}: ${adults + children + infants}`,
      ],
    }),
  );

  const travelerSummary = (
    currentLanguage === "en"
      ? [
          adults ? `${adults} adult${adults === 1 ? "" : "s"}` : null,
          children ? `${children} child${children === 1 ? "" : "ren"}` : null,
          infants ? `${infants} infant${infants === 1 ? "" : "s"}` : null,
        ]
      : currentLanguage === "es"
        ? [
            adults ? `${adults} adulto${adults === 1 ? "" : "s"}` : null,
            children ? `${children} niño${children === 1 ? "" : "s"}` : null,
            infants ? `${infants} bebe${infants === 1 ? "" : "s"}` : null,
          ]
        : [
            adults ? `${adults} adulto${adults === 1 ? "" : "s"}` : null,
            children ? `${children} crianca${children === 1 ? "" : "s"}` : null,
            infants ? `${infants} bebe${infants === 1 ? "" : "s"}` : null,
          ]
  )
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    setInfants((value) => Math.min(value, adults));
  }, [adults]);

  const goToPlanner = () => {
    document.getElementById("senior-planner")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openAssistant = () => {
    const tripSummary = [
      origin ? `${currentLanguage === "en" ? "from" : currentLanguage === "es" ? "desde" : "saindo de"} ${origin}` : null,
      destination ? `${currentLanguage === "en" ? "to" : currentLanguage === "es" ? "hacia" : "para"} ${destination}` : null,
      departureDate ? format(departureDate, "yyyy-MM-dd") : null,
    ]
      .filter(Boolean)
      .join(" ");

    const starter =
      currentLanguage === "en"
        ? `Mia, help me plan a calm senior trip ${tripSummary || "with step-by-step guidance"}.`
        : currentLanguage === "es"
          ? `Mia, ayúdeme a planear un viaje senior con calma ${tripSummary || "con orientacion paso a paso"}.`
          : `Mia, me ajude a planejar uma viagem senior com calma ${tripSummary || "com orientacao passo a passo"}.`;

    openChatbotAssistant({ message: starter, autoSend: true });
  };

  const summaryItems = [
    { label: copy.origin, value: origin || "" },
    { label: copy.destination, value: destination || "" },
    { label: copy.departure, value: departureDate ? format(departureDate, "dd MMM yyyy") : "" },
    { label: copy.return, value: tripType === "round-trip" && returnDate ? format(returnDate, "dd MMM yyyy") : tripType === "one-way" ? copy.one_way : "" },
    { label: wizardCopy.priorityTitle, value: priority === "fastest" ? wizardCopy.priorityFastest : priority === "balanced" ? wizardCopy.priorityBalanced : priority === "cheapest" ? wizardCopy.priorityCheapest : wizardCopy.priorityComfort },
    { label: wizardCopy.connectionTitle, value: connections === "none" ? wizardCopy.connectionsNone : connections === "any" ? wizardCopy.connectionsAny : wizardCopy.connectionsOne },
    { label: wizardCopy.bagTitle, value: bags === "checked" ? wizardCopy.bagsChecked : bags === "carry" ? wizardCopy.bagsCarry : wizardCopy.bagsFlexible },
    { label: copy.travelers, value: travelerSummary },
  ].filter((item) => item.value);

  const validateStep = (step: number) => {
    if (step === 0 && (!origin || !destination)) {
      toast({
        title: copy.missing_title,
        description: currentLanguage === "en"
          ? "Choose origin and destination to continue."
          : currentLanguage === "es"
            ? "Elija origen y destino para continuar."
            : "Escolha origem e destino para continuar.",
        variant: "destructive",
      });
      return false;
    }

    if (step === 1 && (!departureDate || (tripType === "round-trip" && !returnDate))) {
      toast({
        title: copy.missing_title,
        description: currentLanguage === "en"
          ? "Choose the date to continue."
          : currentLanguage === "es"
            ? "Elija la fecha para continuar."
            : "Escolha a data para continuar.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((value) => Math.min(value + 1, 4));
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
      tripType,
      passengers: String(adults + children + infants),
      adults: String(adults),
      children: String(children),
      infants: String(infants),
      cabinClass: "economy",
      ui: "easy",
      seniorPriority: priority,
      seniorConnections: connections,
      seniorBags: bags,
      seniorTime: timePreference,
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

        <div className="container mx-auto px-4 md:px-6 py-8 md:py-16 relative">
          <div className="max-w-5xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-3.5 py-2 text-xs sm:px-4 sm:text-sm font-semibold text-blue-700 shadow-sm">
              <HeartHandshake className="h-4 w-4" />
              {copy.badge}
            </span>
            <h1 className="mt-5 text-[2.5rem] sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-slate-950 leading-[0.95]">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base sm:text-lg md:text-2xl leading-relaxed text-slate-600">
              {copy.subtitle}
            </p>

            <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Button size="lg" onClick={openAssistant} className="min-h-14 w-full sm:w-auto rounded-2xl px-5 sm:px-6 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white">
                <MessageCircle className="h-5 w-5" />
                {copy.chat}
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-14 w-full sm:w-auto rounded-2xl px-5 sm:px-6 text-base font-bold border-slate-300 bg-white/90 text-slate-800">
                <a href={whatsAppHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  {copy.direct_call}
                </a>
              </Button>
              <Button size="lg" variant="ghost" onClick={goToPlanner} className="min-h-14 w-full sm:w-auto rounded-2xl px-4 text-base font-bold text-blue-700 hover:bg-blue-50">
                {currentLanguage === "en" ? "Answer the questions below" : currentLanguage === "es" ? "Responder las preguntas abajo" : "Responder as perguntas abaixo"}
              </Button>
            </div>

            <div className="mt-6 inline-flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm md:text-base text-emerald-900 shadow-sm">
              <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600" />
              <span>{copy.trust}</span>
            </div>
          </div>
        </div>
      </section>

      <AppLaunchPromo mode="senior" source="senior-page" />

      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_380px] gap-6 md:gap-8 items-start">
            <Card id="senior-planner" className="rounded-[24px] md:rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_80px_-30px_rgba(15,23,42,0.28)]">
              <CardContent className="p-4 sm:p-5 md:p-8 space-y-6 md:space-y-8">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                    <HeartHandshake className="h-4 w-4" />
                    {wizardCopy.progress}
                  </span>
                  <h2 className="mt-4 text-[1.75rem] sm:text-2xl md:text-3xl font-display font-extrabold text-slate-950">
                    {currentStep === 0
                      ? wizardCopy.routeTitle
                      : currentStep === 1
                        ? wizardCopy.dateTitle
                        : currentStep === 2
                          ? wizardCopy.priorityTitle
                          : currentStep === 3
                            ? wizardCopy.connectionTitle
                            : wizardCopy.bagTitle}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed">
                    {currentStep === 0
                      ? wizardCopy.routeDesc
                      : currentStep === 1
                        ? wizardCopy.dateDesc
                        : currentStep === 2
                          ? wizardCopy.priorityDesc
                          : currentStep === 3
                            ? wizardCopy.connectionDesc
                            : wizardCopy.bagDesc}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  {[0, 1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        "flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border text-sm font-extrabold",
                        currentStep === step
                          ? "border-blue-600 bg-blue-600 text-white"
                          : currentStep > step
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-400",
                      )}
                    >
                      {step + 1}
                    </div>
                  ))}
                </div>

                {currentStep === 4 && (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 sm:px-5 sm:py-5 shadow-[0_20px_60px_-42px_rgba(16,185,129,0.35)]">
                    <p className="text-sm font-semibold leading-relaxed text-emerald-950">{wizardCopy.bagNote}</p>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-900">{copy.baggage_support}</p>
                  </div>
                )}

                {currentStep === 1 && (
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setTripType("round-trip")}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm sm:px-5 sm:text-base font-bold transition-colors",
                      tripType === "round-trip" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                  >
                    {copy.round_trip}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType("one-way")}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm sm:px-5 sm:text-base font-bold transition-colors",
                      tripType === "one-way" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                  >
                    {copy.one_way}
                  </button>
                </div>
                )}

                {currentStep === 0 && (
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
                )}

                {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
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
                )}

                {currentStep === 1 && (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5 md:p-6">
                  <div>
                    <p className="text-sm font-semibold tracking-[0.08em] text-slate-600">{copy.travelers}</p>
                    <p className="mt-1 text-base sm:text-lg md:text-xl font-bold text-slate-950">
                      {travelerSummary}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 max-w-xl">{copy.travelers_hint}</p>
                  </div>
                  <div className="mt-5 space-y-4">
                    {[
                      {
                        label: currentLanguage === "en" ? "Adults" : currentLanguage === "es" ? "Adultos" : "Adultos",
                        hint: currentLanguage === "en" ? "Age 12 or older" : currentLanguage === "es" ? "12 anos o mas" : "12 anos ou mais",
                        value: adults,
                        min: 1,
                        max: 9,
                        onChange: setAdults,
                      },
                      {
                        label: currentLanguage === "en" ? "Children" : currentLanguage === "es" ? "Niños" : "Criancas",
                        hint: currentLanguage === "en" ? "Age 2 to 11" : currentLanguage === "es" ? "De 2 a 11 anos" : "De 2 a 11 anos",
                        value: children,
                        min: 0,
                        max: 8,
                        onChange: setChildren,
                      },
                      {
                        label: currentLanguage === "en" ? "Infants" : currentLanguage === "es" ? "Bebes" : "Bebes",
                        hint: currentLanguage === "en" ? "Under 2 years old" : currentLanguage === "es" ? "Menos de 2 anos" : "Menos de 2 anos",
                        value: infants,
                        min: 0,
                        max: adults,
                        onChange: setInfants,
                      },
                    ].map((group) => (
                      <div key={group.label} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-bold text-slate-950">{group.label}</p>
                          <p className="text-sm text-slate-500">{group.hint}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => group.onChange((value) => Math.max(group.min, value - 1))}
                            className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 text-2xl font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600"
                          >
                            -
                          </button>
                          <div className="flex h-14 min-w-[4.5rem] items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-2xl font-extrabold text-slate-950">
                            {group.value}
                          </div>
                          <button
                            type="button"
                            onClick={() => group.onChange((value) => Math.min(group.max, value + 1))}
                            className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 text-2xl font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={group.value >= group.max}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {currentStep === 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold tracking-[0.08em] text-slate-600">{copy.quick_routes}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUICK_ROUTES.map((route) => (
                      <button
                        key={`${route.origin}-${route.destination}`}
                        type="button"
                        onClick={() => {
                          setOrigin(route.origin);
                          setDestination(route.destination);
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-sm sm:text-base font-semibold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50"
                      >
                        {copy[route.key]}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {currentStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: "comfort", label: wizardCopy.priorityComfort },
                      { value: "fastest", label: wizardCopy.priorityFastest },
                      { value: "balanced", label: wizardCopy.priorityBalanced },
                      { value: "cheapest", label: wizardCopy.priorityCheapest },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPriority(option.value as SeniorPriority)}
                        className={cn(
                          "rounded-[24px] border px-4 py-4 text-left text-sm sm:px-5 sm:py-5 sm:text-base font-bold transition-all",
                          priority === option.value ? "border-blue-500 bg-blue-50 text-blue-900 shadow-[0_20px_60px_-42px_rgba(37,99,235,0.42)]" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/70",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: "none", label: wizardCopy.connectionsNone },
                      { value: "one", label: wizardCopy.connectionsOne },
                      { value: "any", label: wizardCopy.connectionsAny },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setConnections(option.value as SeniorConnections)}
                        className={cn(
                          "rounded-[24px] border px-4 py-4 text-left text-sm sm:px-5 sm:py-5 sm:text-base font-bold transition-all",
                          connections === option.value ? "border-blue-500 bg-blue-50 text-blue-900 shadow-[0_20px_60px_-42px_rgba(37,99,235,0.42)]" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/70",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: "checked", label: wizardCopy.bagsChecked },
                        { value: "carry", label: wizardCopy.bagsCarry },
                        { value: "flexible", label: wizardCopy.bagsFlexible },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setBags(option.value as SeniorBags)}
                          className={cn(
                            "rounded-[24px] border px-4 py-4 text-left text-sm sm:px-5 sm:py-5 sm:text-base font-bold transition-all",
                            bags === option.value ? "border-blue-500 bg-blue-50 text-blue-900 shadow-[0_20px_60px_-42px_rgba(37,99,235,0.42)]" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/70",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { value: "day", label: wizardCopy.timeDay },
                        { value: "any", label: wizardCopy.timeAny },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTimePreference(option.value as SeniorTime)}
                          className={cn(
                            "rounded-[24px] border px-4 py-4 text-left text-sm sm:px-5 sm:py-5 sm:text-base font-bold transition-all",
                            timePreference === option.value ? "border-blue-500 bg-blue-50 text-blue-900 shadow-[0_20px_60px_-42px_rgba(37,99,235,0.42)]" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/70",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep((value) => Math.max(0, value - 1))}
                    disabled={currentStep === 0}
                    className="min-h-16 rounded-2xl border-slate-300 bg-white text-slate-800 text-lg font-bold"
                  >
                    {wizardCopy.back}
                  </Button>
                  {currentStep < 4 ? (
                    <Button onClick={goNext} className="min-h-16 flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-extrabold">
                      {wizardCopy.next}
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button onClick={handleSearch} className="min-h-16 flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-extrabold">
                      <Search className="h-5 w-5" />
                      {wizardCopy.searchNow}
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  )}
                  <Button asChild variant="outline" className="min-h-16 rounded-2xl border-slate-300 bg-white text-slate-800 text-lg font-bold">
                    <a href={whatsAppHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-5 w-5" />
                      {copy.direct_call}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-[24px] md:rounded-[28px] border border-slate-200 bg-[#0f172a] text-white shadow-[0_20px_80px_-30px_rgba(15,23,42,0.6)]">
                <CardContent className="p-5 md:p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <UserRound className="h-6 w-6 text-blue-200" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.16em] text-blue-200">Michels Travel</p>
                      <h3 className="text-[1.4rem] sm:text-2xl font-display font-extrabold">{copy.helper_title}</h3>
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

              <Card className="rounded-[24px] md:rounded-[28px] border border-slate-200 bg-white">
                <CardContent className="p-5 md:p-7">
                  <h3 className="text-xl font-display font-extrabold text-slate-950">{wizardCopy.summaryTitle}</h3>
                  <div className="mt-4 space-y-3">
                    {summaryItems.length > 0 ? summaryItems.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">{item.value}</p>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-500">
                        {wizardCopy.summaryEmpty}
                      </div>
                    )}
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
