import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Plane, Calendar, CheckCircle2, Mic, ArrowRight, User, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import PaymentForm from "@/components/PaymentForm";
import FlightBaggageHighlights from "@/components/FlightBaggageHighlights";
import { useDebounce } from "@/hooks/use-debounce";
import SeniorCardImage from "@/components/SeniorCardImage";
import { useI18n } from "@/lib/i18n";

type FlowStep = "greeting" | "ask_class" | "ask_passengers" | "ask_origin" | "destination" | "dates" | "ask_return_intention" | "return_date" | "ask_multi_intention" | "searching" | "offer" | "collect_details" | "checkout";

type Leg = { originQuery: string; originIata: string; destQuery: string; destIata: string; travelDate: string };

type Lang = "pt" | "en" | "es";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T: Record<Lang, Record<string, any>> = {
  pt: {
    langLabel: "Idioma",
    enterPhone: "Telefone de Contato:",
    phoneHint: "Exemplos: +1 (EUA), +55 (Brasil), +351 (Portugal)",
    phonePlaceholder: "+1 (555) 555-5555",
    enter: "Entrar & Iniciar Processo",
    routeReady: "O seu terminal de alta performance está pronto.",
    routeDesc: "Vamos iniciar a sua busca agora mesmo. O seu conforto e agilidade são nossa prioridade.",
    startBuy: "Iniciar Busca",
    chooseClass: "Qual o tipo de conforto e classe para esta viagem?",
    economy: "Econômica", premiumEconomy: "Premium Economy", business: "Executiva", first: "Primeira Classe",
    fromCity: "De qual cidade você vai sair?",
    fromCityN: (n: number) => `E de qual cidade você vai sair agora, no trecho ${n}?`,
    cityHint: "Digite o nome da cidade ou aeroporto abaixo:",
    originPH: "Ex: Nova York, Londres...",
    toCity: "Para onde você deseja viajar?",
    toCityN: (n: number) => `E do trecho ${n}, para que cidade você vai voar?`,
    destPH: "Ex: Lisboa, São Paulo...",
    dateIda: "Qual a data da viagem (Ida)?",
    dateN: (n: number) => `Qual a data do Trecho ${n}?`,
    continue: "Continuar",
    wantReturn: "Você deseja incluir uma passagem de VOLTA (Retorno) também?",
    yesReturn: "Sim, adicionar volta",
    noReturn: "Não, viajo apenas ida",
    returnDate: "Qual será a data da sua VOLTA?",
    multiQ: (dest: string) => `Você vai aproveitar para visitar alguma outra cidade DEPOIS de ${dest}?`,
    yesMulti: "Sim, vou para outra cidade",
    noMulti: "Não, minha viagem encerra aqui",
    yourName: "Identificação do Passageiro:",
    firstName: "Primeiro Nome", lastName: "Sobrenome",
    yourDob: "Data de Nascimento:",
    day: "Dia", month: "Mês", year: "Ano",
    search: "Pesquisar Passagens",
    searching: "Buscando as melhores rotas em tempo real...",
    searchDesc: "Estamos analisando a disponibilidade global para você. Não saia desta tela.",
    chooseOutbound: "Escolha o seu voo de IDA:",
    chooseReturn: "Ida Garantida! Agora escolha a VOLTA:",
    chooseFlight: "Escolha o voo de sua preferência:",
    selectGo: "Selecionar Ida", buyFlight: "🛒 Comprar este Voo",
    moreFlights: (n: number) => `Ver mais opções (Mais ${n} voos disponíveis)`,
    backOptions: "Voltar para opções anteriores",
    howMany: "Com quantas pessoas você vai viajar?",
    adults: "Viajantes Adultos",
    adultsDesc: "(Acima de 12 anos)",
    children: "Crianças",
    childrenDesc: "(De 2 a 11 anos)",
    infants: "Bebês",
    infantsDesc: "(Até 2 anos no colo)",
    cardData: "Pagamento Seguro",
    speak: "Falar em Áudio com Agente",
    exit: "Sair",
    airline: "Companhia Aérea", price: "Preço Final (Taxas inclusas)", roundPriceNote: "*Preço total do pacote (Ida e Volta)",
    outboundDone: "Sua Seleção de Ida (Concluída)", outboundOpts: "Opções de Ida", returnOpts: "Opções de Volta",
    estTotal: "Preço Total Estimado do Pacote", flyingWith: "Voando com",
    direct: "Voo Direto", stop1: (c: string) => `1 Parada em ${c}`, stops: (n: number) => `${n} Paradas`,
    speakLabel: "Falar", speakAgent: "em Áudio",
    // voice
    v_welcome: "Bem-vindo. Vamos encontrar os melhores voos para você sem burocracia.",
    v_askClass: "Em qual classe você prefere voar?",
    v_askPassengers: "Com quantas pessoas você vai viajar?",
    v_fromCity: "De qual cidade você vai sair?",
    v_toCity: "E para qual cidade você quer viajar?",
    v_toLegCity: (city: string) => `Trecho ${city}: Para qual cidade você quer ir?`,
    v_askDate: "Qual é a data da sua viagem?",
    v_askDateLeg: (city: string) => `E qual é a data deste trecho para ${city}?`,
    v_askReturn: "Deseja adicionar uma passagem de Volta?",
    v_askMulti: "Planeja visitar outra cidade antes de terminar a viagem?",
    v_yesReturn: "Excelente. Selecione a data da sua volta no calendário.",
    v_noReturn: "Entendido, apenas ida.",
    v_askName: "Voo selecionado! Agora, informe seu nome e telefone para finalizarmos a reserva.",
    v_askDob: "Maravilha. E me diga também a sua data de nascimento.",
    v_searching: "Nossa inteligência está procurando os melhores voos para você. Aguarde um momento.",
    v_foundFlights: "Encontramos excelentes voos. Escolha o seu preferido.",
    v_foundRT: "Encontramos excelentes opções. Primeiro, escolha o voo de ida.",
    v_noFlights: "Desculpe, não encontrei voos para esta rota. Vamos tentar novamente?",
    v_selectReturn: "Excelente. Agora escolha o seu voo de volta.",
    v_payment: "Conectando ao sistema de pagamento seguro.",
    v_cardReady: "Pronto. Agora insira os dados do cartão para concluir.",
    v_success: "Compra confirmada! Boa viagem.",
    v_cardError: "Erro na validação do pagamento. Por favor, verifique os dados.",
    v_multiNext: (dest: string) => `Perfeito. Partindo de ${dest}, para onde você quer ir depois?`,
    v_routeReady: "Ruta pronto. Vamos buscar os voos.",
    v_nameNext: "Maravilha. Por favor, informe sua data de nascimento.",
    support: "Suporte", privacy: "Privacidade", terms: "Termos"
  },
  en: {
    langLabel: "Language",
    enterPhone: "Contact Phone:",
    phoneHint: "Examples: +1 (USA), +55 (Brazil), +351 (Portugal)",
    phonePlaceholder: "+1 (555) 555-5555",
    enter: "Enter & Start",
    routeReady: "Your high-performance terminal is ready.",
    routeDesc: "Let's start your search now. Your comfort and speed are our priority.",
    startBuy: "Start Search",
    chooseClass: "What comfort class would you like?",
    economy: "Economy", premiumEconomy: "Premium Economy", business: "Business", first: "First Class",
    fromCity: "Departure City:",
    fromCityN: (n: number) => `Which city for leg ${n}?`,
    cityHint: "Type city or airport name:",
    originPH: "Ex: New York, London...",
    toCity: "Where are you traveling to?",
    toCityN: (n: number) => `Leg ${n}: Which city for your flight?`,
    destPH: "Ex: Lisbon, São Paulo...",
    dateIda: "Departure Date:",
    dateN: (n: number) => `Date for Leg ${n}?`,
    continue: "Continue",
    wantReturn: "Add a RETURN ticket?",
    yesReturn: "Yes, add return",
    noReturn: "No, one-way only",
    returnDate: "Return Date:",
    multiQ: (dest: string) => `Traveling elsewhere AFTER ${dest}?`,
    yesMulti: "Yes, visit another city",
    noMulti: "No, ends here",
    yourName: "Passenger ID:",
    firstName: "First Name", lastName: "Last Name",
    yourDob: "Birth Date:",
    day: "Day", month: "Month", year: "Year",
    search: "Search Flights",
    searching: "Searching global routes...",
    searchDesc: "Validating global availability. Please stay on this screen.",
    chooseOutbound: "Choose OUTBOUND flight:",
    chooseReturn: "Outbound confirmed! Choose RETURN:",
    chooseFlight: "Choose preferred flight:",
    selectGo: "Select Outbound", buyFlight: "🛒 Purchase this Flight",
    moreFlights: (n: number) => `More options (${n} available)`,
    backOptions: "Back",
    cardData: "Secure Payment",
    howMany: "How many people are traveling?",
    adults: "Adult Travelers",
    adultsDesc: "(12+ years)",
    children: "Children",
    childrenDesc: "(2 to 11 years)",
    infants: "Infants",
    infantsDesc: "(Under 2 years, on lap)",
    speak: "Voice Agent",
    exit: "Exit",
    airline: "Airline", price: "Final Price", roundPriceNote: "*Total package price",
    outboundDone: "Outbound Selected", outboundOpts: "Outbound Options", returnOpts: "Return Options",
    estTotal: "Estimated Total", flyingWith: "Flying with",
    direct: "Direct", stop1: (c: string) => `1 Stop in ${c}`, stops: (n: number) => `${n} Stops`,
    speakLabel: "Speak", speakAgent: "Agent",
    v_welcome: "Welcome. Let's find your flights without bureaucracy.",
    v_askClass: "Which cabin class?",
    v_askPassengers: "How many people are traveling with you?",
    v_fromCity: "Departure city?",
    v_toCity: "Destination city?",
    v_toLegCity: (city: string) => `Leg to ${city}: Destination?`,
    v_askDate: "Travel date?",
    v_askDateLeg: (city: string) => `Date for leg to ${city}?`,
    v_askReturn: "Add a return ticket?",
    v_askMulti: "Visit another city?",
    v_yesReturn: "Select return date on calendar.",
    v_noReturn: "One-way only.",
    v_askName: "Flight selected! Please enter your name and phone to finish.",
    v_askDob: "Please provide your birth date.",
    v_searching: "Searching the best flights for you now. Please wait.",
    v_foundFlights: "Found great options. Choose your favorite.",
    v_foundRT: "Great options. Choose your outbound flight first.",
    v_noFlights: "No flights found. Try again?",
    v_selectReturn: "Excellent. Choose your return flight.",
    v_payment: "Connecting to secure payment.",
    v_cardReady: "Enter card details to finish.",
    v_success: "Purchase confirmed! Safe travels.",
    v_cardError: "Payment error. Check details.",
    v_multiNext: (dest: string) => `From ${dest}, where next?`,
    v_routeReady: "Ready. Searching flights.",
    v_nameNext: "Please enter your birth date.",
    support: "Support", privacy: "Privacy", terms: "Terms"
  },
  es: {
    langLabel: "Idioma",
    enterPhone: "Teléfono de Contacto:",
    phoneHint: "Ej: +1 (EE.UU.), +55 (Brasil)",
    phonePlaceholder: "+1 (555) 555-5555",
    enter: "Entrar",
    routeReady: "Su terminal de alta performance está listo.",
    routeDesc: "Buscaremos sus vuelos ahora mismo. Su confort es prioridad.",
    startBuy: "Iniciar Búsqueda",
    chooseClass: "¿Qué tipo de confort prefiere?",
    economy: "Económica", premiumEconomy: "Premium Economy", business: "Ejecutiva", first: "Primera Clase",
    fromCity: "¿De qué ciudad parte?",
    fromCityN: (n: number) => `¿De qué ciudad en tramo ${n}?`,
    cityHint: "Escriba la ciudad o aeropuerto:",
    originPH: "Ej: Madrid, Miami...",
    toCity: "¿A dónde desea viajar?",
    toCityN: (n: number) => `Tramo ${n}: ¿A qué ciudad vuela?`,
    destPH: "Ej: Lisboa, S. Paulo...",
    dateIda: "Fecha de Ida:",
    dateN: (n: number) => `Fecha Tramo ${n}?`,
    continue: "Continuar",
    wantReturn: "¿Añadir VUELTA?",
    yesReturn: "Sí, añadir vuelta",
    noReturn: "No, solo ida",
    returnDate: "Fecha de Regreso:",
    multiQ: (dest: string) => `¿Visita otra ciudad DESPUÉS de ${dest}?`,
    yesMulti: "Sí, otra ciudad",
    noMulti: "No, termina aquí",
    yourName: "Identificación:",
    firstName: "Nombre", lastName: "Apellido",
    yourDob: "Fecha de Nacimiento:",
    day: "Día", month: "Mes", year: "Año",
    search: "Buscar Vuelos",
    searching: "Buscando rutas globales...",
    searchDesc: "Validando disponibilidad. No salga de esta pantalla.",
    chooseOutbound: "Elija vuelo de IDA:",
    chooseReturn: "¡Ida confirmada! Elija REGRESO:",
    chooseFlight: "Elija su preferencia:",
    selectGo: "Seleccionar Ida", buyFlight: "🛒 Comprar este Vuelo",
    moreFlights: (n: number) => `Ver más (${n} disponibles)`,
    backOptions: "Volver",
    cardData: "Pago Seguro",
    howMany: "¿Con cuántas personas viajará?",
    adults: "Viajeros Adultos",
    adultsDesc: "(Más de 12 años)",
    children: "Niños",
    childrenDesc: "(De 2 a 11 años)",
    infants: "Bebés",
    infantsDesc: "(Hasta 2 años, en el regazo)",
    speak: "Voz",
    exit: "Salir",
    airline: "Aerolínea", price: "Precio Final", roundPriceNote: "*Precio total paquete",
    outboundDone: "Ida Seleccionada", outboundOpts: "Opciones Ida", returnOpts: "Opciones Vuelta",
    estTotal: "Total Estimado", flyingWith: "Volando con",
    direct: "Directo", stop1: (c: string) => `1 Escala en ${c}`, stops: (n: number) => `${n} Escalas`,
    speakLabel: "Hablar", speakAgent: "Agente",
    v_welcome: "Bienvenido. Encontraremos sus vuelos sin burocracia.",
    v_askClass: "¿En qué clase prefiere volar?",
    v_askPassengers: "¿Con cuántas personas viajará?",
    v_fromCity: "¿De qué ciudad parte?",
    v_toCity: "¿A qué ciudad viaja?",
    v_toLegCity: (city: string) => `Tramo ${city}: ¿A dónde quiere ir?`,
    v_askDate: "¿Fecha de viaje?",
    v_askDateLeg: (city: string) => `¿Fecha tramo ${city}?`,
    v_askReturn: "¿Añadir vuelta?",
    v_askMulti: "¿Visita otra ciudad?",
    v_yesReturn: "Elija la fecha de vuelta.",
    v_noReturn: "Solo ida.",
    v_askName: "¡Vuelo elegido! Ingrese su nombre y teléfono para finalizar.",
    v_askDob: "Ingrese su fecha de nacimiento.",
    v_searching: "Buscando los mejores vuelos. Espere.",
    v_foundFlights: "Encontramos vuelos excelentes.",
    v_foundRT: "Elija primero su vuelo de ida.",
    v_noFlights: "No hay vuelos. ¿Intentar de nuevo?",
    v_selectReturn: "Elija su vuelo de regreso.",
    v_payment: "Conectando al sistema seguro.",
    v_cardReady: "Ingrese datos de tarjeta.",
    v_success: "¡Confirmado! Buen viaje.",
    v_cardError: "Error de pago. Verifique datos.",
    v_multiNext: (dest: string) => `Desde ${dest}, ¿a dónde va después?`,
    v_routeReady: "Ruta lista. Buscando.",
    v_nameNext: "Ingrese su fecha de nacimiento.",
    support: "Soporte", privacy: "Privacidad", terms: "Términos"
  },
};

const langVoice: Record<Lang, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

export default function SeniorTerminal() {
  const { language: globalLang, setLanguage: setGlobalLang } = useI18n();
  const lang = (globalLang || "pt") as Lang;
  const t = T[lang];
  const [isListening, setIsListening] = useState(false);

  const [step, setStep] = useState<FlowStep>("greeting");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [tripType, setTripType] = useState<"one-way" | "round-trip" | "multi-city">("one-way");
  const [cabinClass, setCabinClass] = useState<string>("economy");
  const [returnDate, setReturnDate] = useState("");
  const [legs, setLegs] = useState<Leg[]>([]);
  const [currentLeg, setCurrentLeg] = useState(1);
  
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  
  const [originQuery, setOriginQuery] = useState("");
  const [originIata, setOriginIata] = useState("");
  const [originResults, setOriginResults] = useState<any[]>([]);
  const debouncedOrigin = useDebounce(originQuery, 500);

  const [destQuery, setDestQuery] = useState("");
  const [destIata, setDestIata] = useState("");
  const [destResults, setDestResults] = useState<any[]>([]);
  const debouncedDest = useDebounce(destQuery, 500);

  const [travelDate, setTravelDate] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [fetchedFlights, setFetchedFlights] = useState<any[]>([]);
  const [offerPage, setOfferPage] = useState(0);
  const [selectedOutboundSlice, setSelectedOutboundSlice] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [bookingData, setBookingData] = useState<{ clientSecret: string; bookingId: number; referenceCode: string; amount: number; currency: string } | null>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langVoice[lang];
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const [visitorId] = useState(() => {
    let vid = localStorage.getItem("senior_visitor_id");
    if (!vid) {
      vid = "sen_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("senior_visitor_id", vid);
    }
    return vid;
  });

  const [confusionCounter, setConfusionCounter] = useState(0);

  // Monitorar blocos para comandos de voz do admin
  useEffect(() => {
    if (step === "greeting") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/live-sessions/visitor/${visitorId}/blocks?sharedOnly=true`);
        if (res.ok) {
          const blocks = await res.json();
          const lastVoicePrompt = blocks
            .filter((b: any) => b.blockType === "voice_prompt")
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

          if (lastVoicePrompt && lastVoicePrompt.payload?.text) {
            const lastProcessed = localStorage.getItem("last_voice_prompt_id");
            if (lastProcessed !== String(lastVoicePrompt.id)) {
              speak(lastVoicePrompt.payload.text);
              localStorage.setItem("last_voice_prompt_id", String(lastVoicePrompt.id));
            }
          }
        }
      } catch (err) {
        console.error("Erro ao verificar blocos de voz:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [visitorId, step]);

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Erro",
        description: "Reconhecimento de voz não suportado.",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langVoice[lang];
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      window.speechSynthesis.cancel();
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Reconhecido:", transcript);
      
      let matched = false;

      if (step === "ask_class") {
        const text = transcript.toLowerCase();
        if (text.includes("econom") || text.includes("eco")) { setCabinClass("economy"); setStep("ask_origin"); speak(t.v_fromCity as string); matched = true; }
        else if (text.includes("premi")) { setCabinClass("premium_economy"); setStep("ask_origin"); speak(t.v_fromCity as string); matched = true; }
        else if (text.includes("busin") || text.includes("execut") || text.includes("ejecut")) { setCabinClass("business"); setStep("ask_origin"); speak(t.v_fromCity as string); matched = true; }
        else if (text.includes("first") || text.includes("primeir") || text.includes("primer")) { setCabinClass("first"); setStep("ask_origin"); speak(t.v_fromCity as string); matched = true; }
      } else if (step === "ask_return_intention") {
        const text = transcript.toLowerCase();
        if (text.includes("si") || text.includes("yes") || text.includes("sim")) {
          setTripType("round-trip");
          setStep("return_date");
          speak(t.v_yesReturn as string);
          matched = true;
        } else if (text.includes("no") || text.includes("não")) {
          setTripType("one-way");
          setStep("ask_multi_intention");
          speak(t.v_noReturn as string);
          matched = true;
        }
      } else if (step === "ask_multi_intention") {
        const text = transcript.toLowerCase();
        if (text.includes("si") || text.includes("yes") || text.includes("sim")) {
          setTripType("multi-city");
          const newLeg = { originQuery, originIata, destQuery, destIata, travelDate };
          setLegs(prev => [...prev, newLeg]);
          setCurrentLeg(c => c + 1);
          setStep("destination"); setOriginIata(destIata); setOriginQuery(destQuery); setDestIata(""); setDestQuery(""); setTravelDate("");
          speak((t.v_multiNext as any)(destIata));
          matched = true;
        } else if (text.includes("no") || text.includes("não")) {
          if (currentLeg > 1) {
            const newLeg = { originQuery, originIata, destQuery, destIata, travelDate };
            setLegs(prev => [...prev, newLeg]);
          }
          handleSearchFlights();
          matched = true;
        }
      }

      if (!matched) {
        try {
          const res = await fetch("/api/senior/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript, currentStep: step, language: lang, visitorId,
              state: { originQuery, destQuery, travelDate, tripType, cabinClass }
            })
          });
          const data = await res.json();
          if (data.understood) {
            setConfusionCounter(0);
            if (step === "ask_class" && data.value) {
              setCabinClass(data.value); setStep("ask_origin"); speak(data.response || t.v_fromCity as string);
            } else if (step === "ask_return_intention" && typeof data.value === "boolean") {
              if (data.value) { setTripType("round-trip"); setStep("return_date"); speak(data.response || t.v_yesReturn as string); }
              else { setTripType("one-way"); setStep("ask_multi_intention"); speak(data.response || t.v_noReturn as string); }
            } else if (step === "ask_multi_intention" && typeof data.value === "boolean") {
              if (data.value) { 
                setTripType("multi-city");
                const newLeg = { originQuery, originIata, destQuery, destIata, travelDate };
                setLegs(prev => [...prev, newLeg]);
                setCurrentLeg(c => c + 1);
                setStep("destination"); setOriginIata(destIata); setOriginQuery(destQuery); setDestIata(""); setDestQuery(""); setTravelDate("");
                speak(data.response || (t.v_multiNext as any)(destIata));
              } else {
                if (currentLeg > 1) { const newLeg = { originQuery, originIata, destQuery, destIata, travelDate }; setLegs(prev => [...prev, newLeg]); }
                handleSearchFlights();
              }
            } else {
              if (data.response) speak(data.response);
              if (step === "ask_origin") setOriginQuery(transcript);
              if (step === "destination") setDestQuery(transcript);
              if (step === "collect_details") setFirstName(transcript);
            }
          } else {
            setConfusionCounter(prev => prev + 1);
          }
        } catch (e) { console.error(e); }
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  useEffect(() => {
    const fetchPlaces = async (query: string, setter: any) => {
      if (query.length < 2) { setter([]); return; }
      try {
        const res = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setter(data || []);
      } catch (e) { setter([]); }
    };
    if (debouncedOrigin && !originIata) fetchPlaces(debouncedOrigin, setOriginResults);
  }, [debouncedOrigin, originIata]);

  useEffect(() => {
    const fetchPlaces = async (query: string, setter: any) => {
      if (query.length < 2) { setter([]); return; }
      try {
        const res = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setter(data || []);
      } catch (e) { setter([]); }
    };
    if (debouncedDest && !destIata) fetchPlaces(debouncedDest, setDestResults);
  }, [debouncedDest, destIata]);

  const handleOriginSelect = (place: any) => {
    setOriginIata(place.iataCode);
    setOriginQuery(`${place.cityName || place.name} (${place.iataCode})`);
    setOriginResults([]);
    setTimeout(() => {
      setStep("destination");
      speak(tripType === "multi-city" ? (t.v_toLegCity as any)(place.cityName || place.name) : t.v_toCity as string);
    }, 500);
  };

  const handleDestSelect = (place: any) => {
    setDestIata(place.iataCode);
    setDestQuery(`${place.cityName || place.name} (${place.iataCode})`);
    setDestResults([]);
    setTimeout(() => {
      setStep("dates");
      speak(currentLeg > 1 ? (t.v_askDateLeg as any)(place.cityName || place.name) : t.v_askDate as string);
    }, 500);
  };

  const handleDateNext = () => {
    if (!travelDate) return;
    if (currentLeg === 1) { setStep("ask_return_intention"); speak(t.v_askReturn as string); }
    else { setStep("ask_multi_intention"); speak(t.v_askMulti as string); }
  };

  const handleSearchFlights = async () => {
    setStep("searching");
    setIsSearching(true);
    speak(t.v_searching as string);
    try {
      let url = `/api/flights/search?passengers=${adults + children + infants}&adults=${adults}&children=${children}&infants=${infants}&cabinClass=${cabinClass}&tripType=${tripType}`;
      if (tripType === "multi-city") {
        const flightsArray = [...legs].map(leg => ({ origin: leg.originIata, destination: leg.destIata, date: leg.travelDate }));
        if (flightsArray.length < currentLeg) { flightsArray.push({ origin: originIata, destination: destIata, date: travelDate }); }
        url += `&flights=${encodeURIComponent(JSON.stringify(flightsArray))}`;
      } else {
        url += `&origin=${originIata}&destination=${destIata}&date=${travelDate}`;
        if (tripType === "round-trip" && returnDate) { url += `&returnDate=${returnDate}`; }
      }
      const res = await fetch(url);
      const flights = await res.json();
      if (flights && flights.length > 0) {
        setFetchedFlights(flights.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price)));
        setOfferPage(0);
        setSelectedOutboundSlice(null);
        setStep("offer");
        speak(tripType === "round-trip" ? t.v_foundRT as string : t.v_foundFlights as string);
      } else {
        toast({ title: "Ops!", description: t.v_noFlights as string, variant: "destructive" });
        setStep("greeting"); speak(t.v_noFlights as string);
      }
    } catch (e) { setStep("greeting"); } finally { setIsSearching(false); }
  };

  const createBooking = async (flight: any) => {
    setSelectedFlight(flight);
    speak(t.v_payment as string);
    try {
      const p = {
        type: "adult", givenName: firstName, familyName: lastName,
        bornOn: `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`, gender: "m"
      };
      const res = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightData: flight, passengers: [p], contactEmail: "senior-terminal@michelstravel.agency",
          contactPhone: phoneNumber, totalPrice: flight.price, currency: flight.currency
        })
      });
      const data = await res.json();
      if (res.ok && data.clientSecret) {
        setBookingData({
          clientSecret: data.clientSecret, bookingId: data.booking.id,
          referenceCode: data.booking.referenceCode, amount: parseFloat(flight.price), currency: flight.currency
        });
        setStep("checkout"); speak(t.v_cardReady as string);
      } else {
         toast({ title: t.v_cardError as string, variant: "destructive" }); speak(t.v_cardError as string);
      }
    } catch (e) { toast({ title: "Erro na reserva", variant: "destructive" }); }
  };

  const handleExit = () => setLocation("/");

  const displayedFlights = React.useMemo(() => {
    if ((tripType === "round-trip" || tripType === "multi-city") && !selectedOutboundSlice) {
      const uniqueOutbounds = new Map();
      fetchedFlights.forEach(flight => {
        if (!flight.slices || flight.slices.length === 0) return;
        const slice0 = flight.slices[0];
        const key = slice0.segments.map((s:any)=>s.flightNumber).join('-') + slice0.departureTime;
        if (!uniqueOutbounds.has(key)) uniqueOutbounds.set(key, flight);
      });
      return Array.from(uniqueOutbounds.values());
    } else if ((tripType === "round-trip" || tripType === "multi-city") && selectedOutboundSlice) {
      const keySelected = selectedOutboundSlice.slices[0].segments.map((s:any)=>s.flightNumber).join('-') + selectedOutboundSlice.slices[0].departureTime;
      return fetchedFlights.filter(f => {
        if (!f.slices || f.slices.length === 0) return false;
        const k = f.slices[0].segments.map((s:any)=>s.flightNumber).join('-') + f.slices[0].departureTime;
        return k === keySelected;
      });
    }
    return fetchedFlights;
  }, [fetchedFlights, selectedOutboundSlice, tripType]);

  const handleSelectFlightOption = (flight: any) => {
    if ((tripType === "round-trip" || tripType === "multi-city") && flight.slices && flight.slices.length > 1 && !selectedOutboundSlice) {
       setSelectedOutboundSlice(flight); setOfferPage(0); speak(t.v_selectReturn as string);
    } else {
       setSelectedFlight(flight); setStep("collect_details"); speak(t.v_askName as string);
    }
  };

  const displaySliceTimes = (slice: any, segment1: any, segmentLast: any, isCompact?: boolean) => {
    if (!slice || !segment1 || !segmentLast) return null;
    
    const safeDate = (isoString: string) => {
      if (!isoString) return new Date();
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const formatTime = (isoString: string) => 
      safeDate(isoString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});

    const formatDate = (isoString: string) => 
      safeDate(isoString).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const durationStr = slice.duration ? slice.duration.replace('PT', '').toLowerCase().replace('h', 'h ').replace('m', 'm') : "N/A";
    const getCityName = (segNode: any) => segNode?.cityName || segNode?.name || segNode?.iataCode || "";
    const origCity = getCityName(segment1.origin) || segment1.originCity || "Origem";
    const destCity = getCityName(segmentLast.destination) || segmentLast.destinationCity || "Destino";
    const stopsCount = slice.segments.length > 1 ? slice.segments.length - 1 : 0;
    
    let stopsLabel = 'Voo Direto';
    if (stopsCount === 1) stopsLabel = `1 Parada em ${getCityName(slice.segments[0].destination) || slice.segments[0].destinationCity}`;
    else if (stopsCount > 1) stopsLabel = `${stopsCount} Paradas`;

    return (
      <div className={`flex flex-col w-full ${isCompact ? 'mt-0' : 'mt-4'}`}>
        <p className="text-emerald-400 font-bold text-lg mb-4 text-center sm:text-left bg-slate-900/50 py-2 px-4 rounded-xl inline-block w-fit mx-auto sm:mx-0 shadow-inner border border-slate-700/50">
           📅 {formatDate(segment1.departingAt)}
        </p>
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="text-center sm:text-left">
             <p className="text-2xl sm:text-3xl font-black text-white">{formatTime(segment1.departingAt)}</p>
             <p className="text-sm sm:text-base text-slate-300 font-bold mt-1 truncate max-w-[100px]" title={origCity}>{origCity}</p>
          </div>
          <div className="flex-1 flex flex-col items-center px-4">
             <p className="text-[10px] sm:text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">{durationStr}</p>
             <div className="w-full h-[2px] bg-slate-600 relative rounded-full">
               <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 bg-slate-800 px-1 rounded-full border border-slate-700" />
             </div>
             <p className={`text-[10px] sm:text-xs font-bold mt-2 px-2 py-0.5 rounded-md border text-center ${stopsCount > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{stopsLabel}</p>
          </div>
          <div className="text-center sm:text-right">
             <p className="text-2xl sm:text-3xl font-black text-white">{formatTime(segmentLast.arrivingAt)}</p>
             <p className="text-sm sm:text-base text-slate-300 font-bold mt-1 truncate max-w-[100px]" title={destCity}>{destCity}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between font-sans selection:bg-blue-500/30">
      <header className="p-4 sm:p-8 flex justify-between items-center border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-50">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Michels Travel</h1>
          <p className="text-sm sm:text-xl text-blue-400 font-medium">Senior Express</p>
        </div>
        <div className="flex items-center gap-2">
          {(['pt','en','es'] as Lang[]).map(l => (
            <button key={l} onClick={() => setGlobalLang(l)} className={`px-3 py-2 rounded-xl text-sm font-bold uppercase border transition-all ${
              lang === l ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}>{l.toUpperCase()}</button>
          ))}
        </div>
        {(step !== "greeting") && (
          <Button onClick={handleExit} className="h-12 sm:h-16 px-4 sm:px-8 text-sm sm:text-xl bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 shadow-md">
            {t.exit as string}
          </Button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden relative pb-32">
        
         {step === "greeting" && (
           <div className="w-full max-w-2xl text-center space-y-8 animate-in slide-in-from-right duration-500">
             <div className="h-24 w-24 sm:h-40 sm:w-40 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-500/30 shadow-lg">
               <Plane className="h-12 w-12 sm:h-20 sm:w-20" />
             </div>
             <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight">{t.routeReady as string}</h2>
             <p className="text-lg sm:text-2xl text-slate-300">{t.routeDesc as string}</p>
             <Button onClick={() => { setStep("ask_class"); speak(t.v_askClass as string); }} className="w-full h-20 sm:h-32 text-2xl sm:text-4xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl mt-8 shadow-[0_0_60px_rgba(16,185,129,0.3)]">
               {t.startBuy as string} <ArrowRight className="ml-2 h-8 w-8 inline" />
             </Button>
           </div>
         )}
  
         {step === "ask_class" && (
           <div className="w-full max-w-5xl text-center space-y-6 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">{t.chooseClass as string}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Button onClick={() => { setCabinClass("economy"); setStep("ask_passengers"); speak(t.v_askPassengers as string); }} className="h-24 text-2xl font-bold rounded-2xl bg-slate-800 hover:bg-blue-600 text-white border border-slate-700 shadow-md">{t.economy as string}</Button>
               <Button onClick={() => { setCabinClass("premium_economy"); setStep("ask_passengers"); speak(t.v_askPassengers as string); }} className="h-24 text-2xl font-bold rounded-2xl bg-slate-800 hover:bg-emerald-600 text-white border border-slate-700 shadow-md">{t.premiumEconomy as string}</Button>
               <Button onClick={() => { setCabinClass("business"); setStep("ask_passengers"); speak(t.v_askPassengers as string); }} className="h-24 text-2xl font-bold rounded-2xl bg-slate-800 hover:bg-purple-600 text-white border border-slate-700 shadow-md">{t.business as string}</Button>
               <Button onClick={() => { setCabinClass("first"); setStep("ask_passengers"); speak(t.v_askPassengers as string); }} className="h-24 text-2xl font-bold rounded-2xl bg-slate-800 hover:bg-amber-600 text-white border border-slate-700 shadow-md">{t.first as string}</Button>
             </div>
           </div>
         )}

         {step === "ask_passengers" && (
           <div className="w-full max-w-5xl text-center space-y-8 animate-in slide-in-from-right duration-500">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">{t.howMany as string}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: t.adults, desc: t.adultsDesc, val: adults, setter: setAdults, min: 1, icon: <User className="h-8 w-8 text-blue-400" /> },
                   { label: t.children, desc: t.childrenDesc, val: children, setter: setChildren, min: 0, icon: <User className="h-6 w-6 text-emerald-400" /> },
                   { label: t.infants, desc: t.infantsDesc, val: infants, setter: setInfants, min: 0, icon: <User className="h-4 w-4 text-purple-400" /> }
                 ].map((p, i) => (
                   <div key={i} className="bg-slate-800 p-8 rounded-[40px] border border-slate-700 flex flex-col items-center gap-4">
                      <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                        {p.icon}
                      </div>
                      <p className="text-2xl font-bold text-white leading-none">{p.label as string}</p>
                      <p className="text-slate-400 text-sm font-medium">{p.desc as string}</p>
                      
                      <div className="flex items-center gap-6 mt-4">
                        <Button 
                          onClick={() => p.setter(Math.max(p.min, p.val - 1))}
                          variant="ghost" 
                          className="w-14 h-14 rounded-full border-2 border-slate-600 text-white hover:bg-slate-700 text-3xl font-bold"
                        >-</Button>
                        <span className="text-5xl font-black text-white w-12">{p.val}</span>
                        <Button 
                          onClick={() => p.setter(p.val + 1)}
                          variant="ghost" 
                          className="w-14 h-14 rounded-full border-2 border-slate-600 text-white hover:bg-slate-700 text-3xl font-bold"
                        >+</Button>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="flex justify-center mt-8">
                 <Button 
                   onClick={() => {
                     setStep("ask_origin");
                     speak(t.v_fromCity as string);
                   }}
                   className="h-16 sm:h-20 px-12 sm:px-16 text-xl sm:text-2xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xl"
                 >
                   {t.continue as string} <ArrowRight className="ml-2 h-6 w-6 inline" />
                 </Button>
              </div>
           </div>
         )}

         {step === "ask_origin" && (
           <div className="w-full max-w-4xl text-center space-y-6 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">{currentLeg > 1 ? (t.fromCityN as any)(currentLeg) : t.fromCity as string}</h2>
             <div className="relative">
                <Input value={originQuery} onChange={(e) => { setOriginQuery(e.target.value); setOriginIata(""); }} placeholder={t.originPH as string} className="h-20 sm:h-32 text-2xl sm:text-4xl text-center rounded-2xl border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400" />
                {originResults.length > 0 && !originIata && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-slate-800 border-4 border-slate-600 rounded-[32px] overflow-hidden z-[100] shadow-2xl max-h-[50vh] overflow-y-auto">
                    {originResults.map((place) => (
                      <button key={place.id} onClick={() => handleOriginSelect(place)} className="w-full p-4 text-left hover:bg-slate-700 flex items-center gap-4 border-b border-slate-700 last:border-0 transition-colors">
                        <MapPin className="h-8 w-8 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-2xl font-bold text-white">{place.cityName || place.name}</p>
                          <p className="text-lg text-slate-400">{place.countryName} ({place.iataCode})</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
             </div>
           </div>
         )}

         {step === "destination" && (
           <div className="w-full max-w-4xl text-center space-y-6 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">{currentLeg > 1 ? (t.toCityN as any)(currentLeg) : t.toCity as string}</h2>
             <div className="relative">
               <Input value={destQuery} onChange={(e) => { setDestQuery(e.target.value); setDestIata(""); }} placeholder={t.destPH as string} className="h-20 sm:h-32 text-2xl sm:text-4xl text-center rounded-2xl border-4 border-slate-600 bg-slate-800 text-white focus:border-emerald-400" />
               {destResults.length > 0 && !destIata && (
                 <div className="absolute top-full left-0 right-0 mt-4 bg-slate-800 border-4 border-slate-600 rounded-[32px] overflow-hidden z-[100] shadow-2xl max-h-[50vh] overflow-y-auto">
                   {destResults.map((place) => (
                     <button key={place.id} onClick={() => handleDestSelect(place)} className="w-full p-4 text-left hover:bg-slate-700 flex items-center gap-4 border-b border-slate-700 last:border-0 transition-colors">
                       <MapPin className="h-8 w-8 text-emerald-400 shrink-0" />
                       <div>
                         <p className="text-2xl font-bold text-white">{place.cityName || place.name}</p>
                         <p className="text-lg text-slate-400">{place.countryName} ({place.iataCode})</p>
                       </div>
                     </button>
                   ))}
                 </div>
               )}
             </div>
           </div>
         )}

         {step === "dates" && (
           <div className="w-full max-w-4xl text-center space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-8">{currentLeg > 1 ? (t.dateN as any)(currentLeg) : t.dateIda as string}</h2>
             <Input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="h-20 sm:h-32 w-full max-w-2xl text-2xl sm:text-5xl text-center rounded-2xl border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 mx-auto" />
             <Button onClick={handleDateNext} disabled={!travelDate} className="h-16 px-12 text-xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg">
               {t.continue as string} <ArrowRight className="ml-2 h-6 w-6 inline" />
             </Button>
           </div>
         )}

         {step === "ask_return_intention" && (
           <div className="w-full max-w-4xl text-center space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">{t.wantReturn as string}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Button onClick={() => { setTripType("round-trip"); setStep("return_date"); speak(t.v_yesReturn as string); }} className="h-24 text-2xl font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">{t.yesReturn as string}</Button>
               <Button onClick={() => { setTripType("one-way"); setStep("ask_multi_intention"); speak(t.v_noReturn as string); }} className="h-24 text-2xl font-bold rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md">{t.noReturn as string}</Button>
             </div>
           </div>
         )}

         {step === "return_date" && (
           <div className="w-full max-w-4xl text-center space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-8">{t.returnDate as string}</h2>
             <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="h-20 sm:h-32 w-full max-w-2xl text-2xl sm:text-5xl text-center rounded-2xl border-4 border-emerald-600 bg-slate-800 text-white mx-auto" />
             <Button onClick={() => { if (!returnDate) return; handleSearchFlights(); }} disabled={!returnDate} className="h-16 px-12 text-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg">
               {t.continue as string} <ArrowRight className="ml-2 h-6 w-6 inline" />
             </Button>
           </div>
         )}

         {step === "ask_multi_intention" && (
            <div className="w-full max-w-4xl text-center space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">{(t.multiQ as any)(destIata)}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Button onClick={() => { setTripType("multi-city"); setLegs(prev => [...prev, { originQuery, originIata, destQuery, destIata, travelDate }]); setCurrentLeg(c => c + 1); setStep("destination"); setOriginIata(destIata); setOriginQuery(destQuery); setDestIata(""); setDestQuery(""); setTravelDate(""); speak((t.v_multiNext as any)(destIata)); }} className="h-24 text-2xl font-bold rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-md">{t.yesMulti as string}</Button>
               <Button onClick={() => { if (currentLeg > 1) setLegs(prev => [...prev, { originQuery, originIata, destQuery, destIata, travelDate }]); handleSearchFlights(); }} className="h-24 text-2xl font-bold rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md">{t.noMulti as string}</Button>
             </div>
           </div>
         )}

         {step === "searching" && (
           <div className="w-full max-w-2xl text-center space-y-12 animate-in zoom-in duration-500">
             <div className="relative h-32 w-32 sm:h-48 sm:w-48 mx-auto flex items-center justify-center">
               <Plane className="h-12 w-12 sm:h-20 sm:w-20 text-blue-400 animate-pulse" />
             </div>
             <h2 className="text-3xl sm:text-4xl font-bold text-white">{t.searching as string}</h2>
             <p className="text-lg sm:text-2xl text-slate-400">{t.searchDesc as string}</p>
           </div>
         )}

         {step === "offer" && fetchedFlights.length > 0 && (
           <div className="w-full max-w-[1400px] text-center space-y-8 animate-in slide-in-from-bottom duration-700 pb-20">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-8">
               {(tripType === "round-trip" || tripType === "multi-city") && !selectedOutboundSlice ? t.chooseOutbound as string : (tripType === "round-trip" || tripType === "multi-city") && selectedOutboundSlice ? t.chooseReturn as string : t.chooseFlight as string}
             </h2>

             {selectedOutboundSlice && (
                <div className="bg-slate-800/90 border-4 border-blue-500 rounded-[32px] p-6 mb-12 text-left shadow-2xl relative animate-in fade-in duration-500">
                   <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-bl-2xl px-6 py-2 font-bold text-sm uppercase tracking-wider">{t.outboundDone as string}</div>
                   <div className="flex flex-col md:flex-row gap-10 items-center mt-2">
                      <div className="flex-1 w-full bg-slate-900/50 p-4 rounded-3xl border border-slate-700/50 shadow-inner">
                         {displaySliceTimes(selectedOutboundSlice.slices[0], selectedOutboundSlice.slices[0].segments[0], selectedOutboundSlice.slices[0].segments[selectedOutboundSlice.slices[0].segments.length - 1], true)}
                      </div>
                      <div className="text-center md:text-right md:border-l-2 border-slate-700 md:pl-8">
                         <p className="text-slate-400 font-medium">{t.estTotal as string}</p>
                         <p className="text-blue-400 font-black text-3xl sm:text-5xl capitalize">{selectedOutboundSlice.currency} {selectedOutboundSlice.price}</p>
                      </div>
                   </div>
                </div>
             )}
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
               {displayedFlights.slice(offerPage * 3, (offerPage + 1) * 3).map((flight: any, idx: number) => {
                 const sliceIndex = ((tripType === "round-trip" || tripType === "multi-city") && selectedOutboundSlice) ? 1 : 0;
                 const activeSlice = flight.slices?.[sliceIndex];
                 if (!activeSlice) return null;
                 return (
                   <div key={flight.id || idx} className="bg-slate-800 flex flex-col rounded-[40px] p-8 border-4 border-emerald-500 shadow-xl relative overflow-hidden transition-transform hover:-translate-y-2">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-base text-slate-400 font-medium">{t.airline as string}</p>
                         <p className="text-2xl font-extrabold text-white mt-1 capitalize truncate">{flight.airline}</p>
                       </div>
                       {flight.logoUrl && <img src={flight.logoUrl} className="h-10 w-10 sm:h-14 sm:w-14 bg-white rounded-xl p-1 shadow-sm" alt="Logo" />}
                     </div>
                     <div className="bg-slate-900/30 -mx-8 px-8 py-2 border-y border-slate-700/50 my-6">
                        {displaySliceTimes(activeSlice, activeSlice.segments[0], activeSlice.segments[activeSlice.segments.length-1])}
                     </div>
                     <div className="mb-6">
                       <p className="text-base text-slate-400 font-medium">{t.price as string}</p>
                       <p className="text-3xl font-extrabold text-emerald-400">{flight.currency} {flight.price}</p>
                     </div>
                     <div className="bg-slate-900 rounded-2xl p-4 flex-1 border border-slate-700 shadow-inner mb-6">
                        <FlightBaggageHighlights flight={flight} />
                     </div>
                     <Button onClick={() => handleSelectFlightOption(flight)} className="w-full h-16 sm:h-20 text-xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-xl">
                       {(!selectedOutboundSlice && (tripType === "round-trip" || tripType === "multi-city")) ? t.selectGo as string : t.buyFlight as string} <ArrowRight className="ml-2 h-6 w-6 inline" />
                     </Button>
                   </div>
                 );
               })}
             </div>
             
             {displayedFlights.length > (offerPage + 1) * 3 && (
               <Button onClick={() => { setOfferPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="h-16 px-12 text-xl font-bold rounded-full bg-slate-700 text-white hover:bg-slate-600 shadow-xl">
                 {t.moreFlights(displayedFlights.length - (offerPage + 1) * 3)} <ArrowRight className="ml-2 h-6 w-6 inline" />
               </Button>
             )}
           </div>
         )}

         {step === "collect_details" && (
           <div className="w-full max-w-3xl animate-in slide-in-from-right duration-500 pb-20">
             <div className="flex justify-center mb-6">
               <div className="h-20 w-20 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center border-4 border-blue-500/30 shadow-lg">
                 <User className="h-10 w-10" />
               </div>
             </div>
             <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center leading-tight">{t.yourName as string}</h2>
             <div className="flex flex-col gap-6 bg-slate-800/50 p-6 sm:p-10 rounded-[32px] border border-slate-700 shadow-xl">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <Input placeholder={t.firstName as string} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-16 text-xl rounded-2xl border-2 border-slate-600 bg-slate-900 text-white focus:border-blue-400 font-bold" />
                 <Input placeholder={t.lastName as string} value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-16 text-xl rounded-2xl border-2 border-slate-600 bg-slate-900 text-white focus:border-blue-400 font-bold" />
               </div>
               <div className="space-y-2">
                 <p className="text-slate-400 font-bold ml-1">{t.yourDob as string}</p>
                 <div className="flex gap-4">
                   <Input placeholder={t.day as string} value={dobDay} onChange={(e) => setDobDay(e.target.value)} className="h-16 text-xl text-center rounded-2xl border-2 border-slate-600 bg-slate-900 text-white w-1/4 font-bold" />
                   <Input placeholder={t.month as string} value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className="h-16 text-xl text-center rounded-2xl border-2 border-slate-600 bg-slate-900 text-white w-1/4 font-bold" />
                   <Input placeholder={t.year as string} value={dobYear} onChange={(e) => setDobYear(e.target.value)} className="h-16 text-xl text-center rounded-2xl border-2 border-slate-600 bg-slate-900 text-white flex-1 font-bold" />
                 </div>
               </div>
               <div className="space-y-2">
                 <p className="text-slate-400 font-bold ml-1">{t.enterPhone as string}</p>
                 <Input placeholder={t.phonePlaceholder as string} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="h-16 text-xl rounded-2xl border-2 border-slate-600 bg-slate-900 text-white focus:border-blue-400 font-bold" />
               </div>
               <Button onClick={() => createBooking(selectedFlight)} disabled={!firstName || !lastName || !dobDay || !dobMonth || !dobYear || dobYear.length < 4 || phoneNumber.length < 7} className="h-16 sm:h-20 text-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl mt-4 shadow-lg shadow-emerald-500/20">
                 {t.continue as string} <ArrowRight className="ml-2 h-6 w-6 inline" />
               </Button>
             </div>
           </div>
         )}

         {step === "checkout" && bookingData && (
           <div className="w-full max-w-3xl text-center space-y-12 animate-in slide-in-from-bottom duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-8">{t.cardData as string}</h2>
             <div className="bg-white rounded-[40px] p-8 border-4 border-emerald-500 text-left shadow-2xl">
               <PaymentForm 
                 clientSecret={bookingData.clientSecret} bookingId={bookingData.bookingId} referenceCode={bookingData.referenceCode} amount={bookingData.amount} currency={bookingData.currency}
                 onSuccess={() => {
                   speak(t.v_success as string);
                   toast({ title: "Compra Confirmada!", description: "Reserva aprovada." });
                   setTimeout(() => setLocation("/checkout/success?bookingId=" + bookingData.bookingId), 3000);
                 }}
                 onError={(msg) => {
                   toast({ title: "Erro no Cartão", description: msg, variant: "destructive" });
                   speak(t.v_cardError as string);
                 }}
               />
             </div>
           </div>
         )}
      </main>

      <footer className="w-full py-8 sm:py-12 bg-slate-950 border-t border-slate-800/50 relative z-10">
        <div className="max-w-[1400px] mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-center sm:text-left">
            <p className="text-xl font-black text-white">Michels Travel</p>
            <p className="text-slate-500 font-medium">© 2026 {t.routeReady as string}</p>
          </div>
          <div className="flex gap-8">
            <Link href="/help">
              <span className="text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-wider text-xs cursor-pointer">{t.support as string}</span>
            </Link>
            <Link href="/privacy">
              <span className="text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-wider text-xs cursor-pointer">{t.privacy as string}</span>
            </Link>
            <Link href="/terms">
              <span className="text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-wider text-xs cursor-pointer">{t.terms as string}</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating Mic Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
        <Button 
          onClick={startVoiceRecognition} 
          className={`w-full h-16 sm:h-20 rounded-full text-lg sm:text-xl font-bold gap-4 border shadow-2xl transition-all ${
            isListening 
              ? 'bg-blue-600 border-blue-400 text-white animate-pulse' 
              : 'bg-white text-slate-900 border-white hover:bg-slate-100'
          }`}
        >
          <Mic className={`h-8 w-8 ${isListening ? 'text-white' : 'text-blue-600'}`} />
          <span>{t.speakLabel as string} {t.speakAgent as string}</span>
        </Button>
      </div>
    </div>
  );
}
