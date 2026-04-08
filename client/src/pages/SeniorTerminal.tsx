import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Plane, Calendar, CheckCircle2, Mic, ArrowRight, User, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import PaymentForm from "@/components/PaymentForm";
import FlightBaggageHighlights from "@/components/FlightBaggageHighlights";
import { useDebounce } from "@/hooks/use-debounce";
import SeniorCardImage from "@/components/SeniorCardImage";

type FlowStep = "auth" | "greeting" | "ask_class" | "ask_origin" | "destination" | "dates" | "ask_return_intention" | "return_date" | "ask_multi_intention" | "ask_name" | "ask_dob" | "searching" | "offer" | "checkout";

type Leg = { originQuery: string; originIata: string; destQuery: string; destIata: string; travelDate: string };

type Lang = "pt" | "en" | "es";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T: Record<Lang, Record<string, any>> = {
  pt: {
    langLabel: "Idioma",
    enterPhone: "Para começar, digite seu telefone no formato internacional:",
    phoneHint: "Exemplos: +1 (EUA), +55 (Brasil), +351 (Portugal)",
    phonePlaceholder: "+1 (555) 555-5555",
    enter: "Entrar & Iniciar Processo",
    routeReady: "Sua rota de atendimento exclusivo está pronta.",
    routeDesc: "Vamos ajudar você a comprar a sua passagem respondendo algumas perguntas simples passo-a-passo.",
    startBuy: "Iniciar Compra",
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
    yourName: "Para a sua passagem, preencha o seu nome:",
    firstName: "Primeiro Nome", lastName: "Sobrenome",
    yourDob: "Sua data de nascimento:",
    day: "Dia", month: "Mês", year: "Ano",
    search: "Pesquisar Passagens",
    searching: "Buscando rota ideal...",
    searchDesc: "Validando a disponibilidade real com seu nome e datas escolhidas. Não saia desta tela.",
    chooseOutbound: "Escolha o seu voo de IDA:",
    chooseReturn: "Ida Garantida! Agora escolha a VOLTA:",
    chooseFlight: "Escolha o voo de sua preferência:",
    selectGo: "Selecionar Ida", buyFlight: "Comprar Voo",
    moreFlights: (n: number) => `Ver mais opções (Mais ${n} voos disponíveis)`,
    backOptions: "Voltar para opções anteriores",
    cardData: "Inserir Dados do Cartão",
    speak: "Falar em Áudio com Agente",
    exit: "Sair & Finalizar",
    airline: "Companhia Aérea", price: "Preço Final (Taxas inclusas)", roundPriceNote: "*Preço total do pacote (Ida e Volta)",
    outboundDone: "Sua Seleção de Ida (Concluída)", outboundOpts: "Opções de Ida", returnOpts: "Opções de Volta",
    estTotal: "Preço Total Estimado do Pacote", flyingWith: "Voando com",
    direct: "Voo Direto", stop1: (c: string) => `1 Parada em ${c}`, stops: (n: number) => `${n} Paradas`,
    // voice
    v_welcome: "Olá. Bem-vindo ao terminal de acesso rápido. Vamos ajudar você a comprar a sua passagem.",
    v_askClass: "Em qual classe você prefere voar?",
    v_fromCity: "De qual cidade você vai sair?",
    v_toCity: "Muito bem. E para qual cidade você quer viajar?",
    v_toLegCity: (city: string) => `Trecho ${city}: Para qual cidade você quer ir?`,
    v_askDate: "Certo. Qual é a data da sua viagem?",
    v_askDateLeg: (city: string) => `E qual é a data deste trecho para ${city}?`,
    v_askReturn: "Você também deseja adicionar uma passagem de Volta para esta mesma viagem?",
    v_askMulti: "Você planeja visitar outra cidade além dessa antes de terminar a viagem?",
    v_yesReturn: "Excelente. Selecione qual será a data exata da sua volta ao calendário.",
    v_noReturn: "Entendi, será apenas ida. E você tem planos de ir para alguma outra cidade depois desta?",
    v_askName: "Tudo certo. Agora, para emitir a passagem, por favor digite o seu nome primeiro e depois o sobrenome.",
    v_askDob: "Maravilha. E me diga também a sua data de nascimento.",
    v_searching: "Tudo certo. Nossa inteligência está procurando os melhores voos para você agora mesmo. Aguarde um momento.",
    v_foundFlights: "Encontramos excelentes opções de voos para você. Escolha a sua preferida abaixo.",
    v_foundRT: "Encontramos excelentes opções. Primeiro, escolha o seu voo de ida.",
    v_noFlights: "Desculpe, não encontrei voos para esta rota exata. Vamos tentar novamente?",
    v_selectReturn: "Excelente. Agora escolha a data ou voo de volta que melhor se encaixa para você.",
    v_payment: "Iniciando conexão segura com seu banco. Por favor, aguarde.",
    v_cardReady: "Pronto. Agora digite os dados do cartão para concluir a aprovação.",
    v_success: "Compra confirmada com sucesso! O comprovante vai chegar em breve.",
    v_cardError: "Houve um problema com a validação do cartão. Corrija a informação de pagamento.",
    v_multiNext: (dest: string) => `Perfeito. Então, partindo de ${dest}, para onde você quer ir depois?`,
    v_routeReady: "Tudo certo. A sua rota está montada. Por favor, para emitir a passagem, digite seu nome.",
    v_nameNext: "Maravilha. Por favor, informe sua data de nascimento.",
  },
  en: {
    langLabel: "Language",
    enterPhone: "To start, enter your phone in international format:",
    phoneHint: "Examples: +1 (USA), +55 (Brazil), +351 (Portugal)",
    phonePlaceholder: "+1 (555) 555-5555",
    enter: "Enter & Start",
    routeReady: "Your exclusive service route is ready.",
    routeDesc: "We will help you buy your ticket by answering a few simple questions step-by-step.",
    startBuy: "Start Booking",
    chooseClass: "What comfort class would you like for this trip?",
    economy: "Economy", premiumEconomy: "Premium Economy", business: "Business", first: "First Class",
    fromCity: "Which city are you departing from?",
    fromCityN: (n: number) => `Which city are you departing from for leg ${n}?`,
    cityHint: "Type the city or airport name below:",
    originPH: "Ex: New York, London...",
    toCity: "Where do you want to travel to?",
    toCityN: (n: number) => `Leg ${n}: Which city are you flying to?`,
    destPH: "Ex: Lisbon, São Paulo...",
    dateIda: "What is your departure date?",
    dateN: (n: number) => `Date for Leg ${n}?`,
    continue: "Continue",
    wantReturn: "Would you like to add a RETURN ticket as well?",
    yesReturn: "Yes, add return",
    noReturn: "No, one-way only",
    returnDate: "What is your RETURN date?",
    multiQ: (dest: string) => `Will you visit another city AFTER ${dest}?`,
    yesMulti: "Yes, I'll visit another city",
    noMulti: "No, my trip ends here",
    yourName: "For your ticket, please fill in your name:",
    firstName: "First Name", lastName: "Last Name",
    yourDob: "Your date of birth:",
    day: "Day", month: "Month", year: "Year",
    search: "Search Flights",
    searching: "Searching for the best route...",
    searchDesc: "Validating real availability with your name and selected dates. Please stay on this screen.",
    chooseOutbound: "Choose your OUTBOUND flight:",
    chooseReturn: "Outbound confirmed! Now choose your RETURN:",
    chooseFlight: "Choose your preferred flight:",
    selectGo: "Select Outbound", buyFlight: "Buy Flight",
    moreFlights: (n: number) => `Show more options (${n} more flights available)`,
    backOptions: "Back to previous options",
    cardData: "Enter Card Details",
    speak: "Talk to Agent by Audio",
    exit: "Exit & Finish",
    airline: "Airline", price: "Final Price (taxes included)", roundPriceNote: "*Total package price (Round Trip)",
    outboundDone: "Your Outbound Selection (Done)", outboundOpts: "Outbound Options", returnOpts: "Return Options",
    estTotal: "Estimated Total Package Price", flyingWith: "Flying with",
    direct: "Direct Flight", stop1: (c: string) => `1 Stop in ${c}`, stops: (n: number) => `${n} Stops`,
    v_welcome: "Hello. Welcome to the express senior terminal. We will help you purchase your ticket.",
    v_askClass: "Which cabin class would you prefer?",
    v_fromCity: "Which city are you departing from?",
    v_toCity: "Great. And which city would you like to travel to?",
    v_toLegCity: (city: string) => `Leg ${city}: Which city do you want to go to?`,
    v_askDate: "Got it. What is your travel date?",
    v_askDateLeg: (city: string) => `And what is the date for this leg to ${city}?`,
    v_askReturn: "Would you also like to add a return ticket for this trip?",
    v_askMulti: "Do you plan to visit another city before ending your trip?",
    v_yesReturn: "Excellent. Please select the exact date of your return.",
    v_noReturn: "Understood, one-way only. Will you be visiting another city after this one?",
    v_askName: "Perfect. Now, to issue your ticket, please type your first and last name.",
    v_askDob: "Wonderful. Please also tell me your date of birth.",
    v_searching: "All set. Our system is searching for the best flights for you right now. Please wait a moment.",
    v_foundFlights: "We found excellent flight options for you. Please choose your preferred one below.",
    v_foundRT: "We found excellent options. First, choose your outbound flight.",
    v_noFlights: "Sorry, no flights found for this exact route. Shall we try again?",
    v_selectReturn: "Excellent. Now choose the return date or flight that works best for you.",
    v_payment: "Starting a secure connection with your bank. Please wait.",
    v_cardReady: "All done. Now enter your card details to complete the approval.",
    v_success: "Purchase confirmed successfully! Your receipt will arrive shortly.",
    v_cardError: "There was a problem validating your card. Please correct your payment information.",
    v_multiNext: (dest: string) => `Perfect. So, departing from ${dest}, where do you want to go next?`,
    v_routeReady: "All set. Your route is planned. Please type your name to issue the ticket.",
    v_nameNext: "Wonderful. Please provide your date of birth.",
  },
  es: {
    langLabel: "Idioma",
    enterPhone: "Para comenzar, ingrese su teléfono en formato internacional:",
    phoneHint: "Ejemplos: +1 (EE.UU.), +55 (Brasil), +34 (España)",
    phonePlaceholder: "+1 (555) 555-5555",
    enter: "Entrar e Iniciar",
    routeReady: "Su ruta de atención exclusiva está lista.",
    routeDesc: "Lo ayudaremos a comprar su pasaje respondiendo algunas preguntas simples paso a paso.",
    startBuy: "Iniciar Compra",
    chooseClass: "¿Qué clase de confort prefiere para este viaje?",
    economy: "Económica", premiumEconomy: "Premium Economy", business: "Ejecutiva", first: "Primera Clase",
    fromCity: "¿De qué ciudad parte usted?",
    fromCityN: (n: number) => `¿De qué ciudad parte en el tramo ${n}?`,
    cityHint: "Escriba el nombre de la ciudad o aeropuerto:",
    originPH: "Ej: Nueva York, Madrid...",
    toCity: "¿A dónde desea viajar?",
    toCityN: (n: number) => `Tramo ${n}: ¿A qué ciudad vuela?`,
    destPH: "Ej: Lisboa, São Paulo...",
    dateIda: "¿Cuál es la fecha de su viaje (Ida)?",
    dateN: (n: number) => `¿Fecha del Tramo ${n}?`,
    continue: "Continuar",
    wantReturn: "¿Desea incluir un pasaje de VUELTA (Regreso) también?",
    yesReturn: "Sí, agregar vuelta",
    noReturn: "No, solo ida",
    returnDate: "¿Cuál será la fecha de su VUELTA?",
    multiQ: (dest: string) => `¿Visitará otra ciudad DESPUÉS de ${dest}?`,
    yesMulti: "Sí, iré a otra ciudad",
    noMulti: "No, mi viaje termina aquí",
    yourName: "Para su pasaje, complete su nombre:",
    firstName: "Nombre", lastName: "Apellido",
    yourDob: "Su fecha de nacimiento:",
    day: "Día", month: "Mes", year: "Año",
    search: "Buscar Vuelos",
    searching: "Buscando la mejor ruta...",
    searchDesc: "Validando disponibilidad real con su nombre y fechas seleccionadas. No salga de esta pantalla.",
    chooseOutbound: "Elija su vuelo de IDA:",
    chooseReturn: "¡Ida confirmada! Ahora elija el REGRESO:",
    chooseFlight: "Elija el vuelo de su preferencia:",
    selectGo: "Seleccionar Ida", buyFlight: "Comprar Vuelo",
    moreFlights: (n: number) => `Ver más opciones (${n} vuelos disponibles)`,
    backOptions: "Volver a opciones anteriores",
    cardData: "Ingresar Datos de la Tarjeta",
    speak: "Hablar con Agente por Audio",
    exit: "Salir y Finalizar",
    airline: "Aerolínea", price: "Precio Final (impuestos incluidos)", roundPriceNote: "*Precio total del paquete (Ida y Vuelta)",
    outboundDone: "Su Selección de Ida (Completada)", outboundOpts: "Opciones de Ida", returnOpts: "Opciones de Vuelta",
    estTotal: "Precio Total Estimado del Paquete", flyingWith: "Volando con",
    direct: "Vuelo Directo", stop1: (c: string) => `1 Escala en ${c}`, stops: (n: number) => `${n} Escalas`,
    v_welcome: "Hola. Bienvenido al terminal de atención rápida senior. Lo ayudaremos a comprar su pasaje.",
    v_askClass: "¿En qué clase prefiere volar?",
    v_fromCity: "¿De qué ciudad parte usted?",
    v_toCity: "Muy bien. ¿Y a qué ciudad desea viajar?",
    v_toLegCity: (city: string) => `Tramo ${city}: ¿A qué ciudad quiere ir?`,
    v_askDate: "Perfecto. ¿Cuál es la fecha de su viaje?",
    v_askDateLeg: (city: string) => `¿Y cuál es la fecha de este tramo hacia ${city}?`,
    v_askReturn: "¿También desea agregar un pasaje de regreso para este viaje?",
    v_askMulti: "¿Planea visitar otra ciudad antes de terminar el viaje?",
    v_yesReturn: "Excelente. Por favor seleccione la fecha exacta de su regreso.",
    v_noReturn: "Entendido, solo ida. ¿Tiene planes de ir a otra ciudad después de esta?",
    v_askName: "Perfecto. Ahora, para emitir el pasaje, ingrese su nombre y apellido.",
    v_askDob: "Maravilloso. Dígame también su fecha de nacimiento.",
    v_searching: "Todo listo. Nuestro sistema está buscando los mejores vuelos ahora mismo. Espere un momento.",
    v_foundFlights: "Encontramos excelentes opciones de vuelos para usted. Elija su preferida a continuación.",
    v_foundRT: "Encontramos excelentes opciones. Primero, elija su vuelo de ida.",
    v_noFlights: "Lo sentimos, no encontramos vuelos para esta ruta. ¿Intentamos de nuevo?",
    v_selectReturn: "Excelente. Ahora elija la fecha o vuelo de regreso que mejor le convenga.",
    v_payment: "Iniciando conexión segura con su banco. Por favor espere.",
    v_cardReady: "Listo. Ahora ingrese los datos de su tarjeta para completar la aprobación.",
    v_success: "¡Compra confirmada con éxito! El comprobante llegará en breve.",
    v_cardError: "Hubo un problema al validar su tarjeta. Por favor corrija la información de pago.",
    v_multiNext: (dest: string) => `Perfecto. Entonces, saliendo de ${dest}, ¿a dónde quiere ir después?`,
    v_routeReady: "Todo listo. Su ruta está armada. Por favor ingrese su nombre para emitir el pasaje.",
    v_nameNext: "Maravilloso. Por favor ingrese su fecha de nacimiento.",
  },
};

const langVoice: Record<Lang, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

export default function SeniorTerminal() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = T[lang];

  const [step, setStep] = useState<FlowStep>("auth");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [tripType, setTripType] = useState<"one-way" | "round-trip" | "multi-city">("one-way");
  const [cabinClass, setCabinClass] = useState<string>("economy");
  const [returnDate, setReturnDate] = useState("");
  const [legs, setLegs] = useState<Leg[]>([]);
  const [currentLeg, setCurrentLeg] = useState(1);
  
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

  useEffect(() => {
    const fetchPlaces = async (query: string, setter: any) => {
      if (query.length < 2) {
        setter([]);
        return;
      }
      try {
        const res = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setter(data || []);
      } catch (e) {
        setter([]);
      }
    };
    if (debouncedOrigin && !originIata) fetchPlaces(debouncedOrigin, setOriginResults);
  }, [debouncedOrigin, originIata]);

  useEffect(() => {
    const fetchPlaces = async (query: string, setter: any) => {
      if (query.length < 2) {
        setter([]);
        return;
      }
      try {
        const res = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setter(data || []);
      } catch (e) {
        setter([]);
      }
    };
    if (debouncedDest && !destIata) fetchPlaces(debouncedDest, setDestResults);
  }, [debouncedDest, destIata]);

  const handleLogin = () => {
    if (phoneNumber.length < 5) return;
    setStep("greeting");
    speak(t.v_welcome as string);
  };

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
    
    if (currentLeg === 1) {
      setStep("ask_return_intention");
      speak(t.v_askReturn as string);
    } else {
      setStep("ask_multi_intention");
      speak(t.v_askMulti as string);
    }
  };

  const handleNameNext = () => {
    if (!firstName || !lastName) return;
    setStep("ask_dob");
    speak(t.v_askDob as string);
  };

  const handleDobNext = async () => {
    if (!dobDay || !dobMonth || !dobYear) return;
    setStep("searching");
    setIsSearching(true);
    speak(t.v_searching as string);
    
    try {
      let url = `/api/flights/search?passengers=1&adults=1&children=0&infants=0&cabinClass=${cabinClass}&tripType=${tripType}`;
      
      if (tripType === "multi-city") {
        const flightsArray = [...legs].map(leg => ({ origin: leg.originIata, destination: leg.destIata, date: leg.travelDate }));
        if (flightsArray.length < currentLeg) {
           flightsArray.push({ origin: originIata, destination: destIata, date: travelDate });
        }
        url += `&flights=${encodeURIComponent(JSON.stringify(flightsArray))}`;
      } else {
        url += `&origin=${originIata}&destination=${destIata}&date=${travelDate}`;
        if (tripType === "round-trip" && returnDate) {
          url += `&returnDate=${returnDate}`;
        }
      }
      
      const res = await fetch(url);
      const flights = await res.json();
      
      if (flights && flights.length > 0) {
        const sorted = flights.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
        setFetchedFlights(sorted);
        setOfferPage(0);
        setSelectedOutboundSlice(null);
        setStep("offer");
        speak(tripType === "round-trip" ? t.v_foundRT as string : t.v_foundFlights as string);
      } else {
        toast({ title: "Ops!", description: t.v_noFlights as string, variant: "destructive" });
        setStep("greeting");
        speak(t.v_noFlights as string);
      }
    } catch (e) {
      toast({ title: "Erro", variant: "destructive" });
      setStep("greeting");
    } finally {
      setIsSearching(false);
    }
  };

  const createBooking = async (flight: any) => {
    setSelectedFlight(flight);
    speak(t.v_payment as string);
    try {
      const p = {
        type: "adult",
        givenName: firstName,
        familyName: lastName,
        bornOn: `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`,
        gender: "m" // Simplified for ATM flow
      };
      
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightData: flight,
          passengers: [p],
          contactEmail: "senior-terminal@michelstravel.agency",
          contactPhone: phoneNumber,
          totalPrice: flight.price,
          currency: flight.currency
        })
      });
      const data = await res.json();
      
      if (res.ok && data.clientSecret) {
        setBookingData({
          clientSecret: data.clientSecret,
          bookingId: data.booking.id,
          referenceCode: data.booking.referenceCode,
          amount: parseFloat(flight.price),
          currency: flight.currency
        });
        setStep("checkout");
        speak(t.v_cardReady as string);
      } else {
         toast({ title: "Aviso", description: data.error || "Tente novamente.", variant: "destructive" });
         speak("Houve um pequeno problema com a confirmação. Tente novamente.");
      }
    } catch (e) {
      toast({ title: "Erro na reserva", description: "Problema ao conectar com o banco de dados.", variant: "destructive" });
    }
  };

  const handleExit = () => {
    setLocation("/");
  };

  const displayedFlights = React.useMemo(() => {
    if ((tripType === "round-trip" || tripType === "multi-city") && !selectedOutboundSlice) {
      const uniqueOutbounds = new Map();
      fetchedFlights.forEach(flight => {
        if (!flight.slices || flight.slices.length === 0) return;
        const slice0 = flight.slices[0];
        const key = slice0.segments.map((s:any)=>s.flightNumber).join('-') + slice0.departureTime;
        if (!uniqueOutbounds.has(key)) {
          uniqueOutbounds.set(key, flight);
        }
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
       setSelectedOutboundSlice(flight);
       setOfferPage(0);
       speak(t.v_selectReturn as string);
    } else {
       createBooking(flight);
    }
  };

  const displaySliceTimes = (slice: any, segment1: any, segmentLast: any, isCompact?: boolean) => {
    if (!slice || !segment1 || !segmentLast) return null;
    const formatTime = (isoString: string) => {
       const date = new Date(isoString);
       return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    };
    const formatDate = (isoString: string) => {
       const date = new Date(isoString);
       return date.toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'});
    }
    
    let durationStr = "N/A";
    if (slice.duration) {
      durationStr = slice.duration.replace('PT', '').toLowerCase().replace('h', 'h ').replace('m', 'm');
    }
    
    const getCityName = (segNode: any) => segNode?.cityName || segNode?.name || segNode?.iataCode || "";
    const origCity = getCityName(segment1.origin) || segment1.originCity || "Origem";
    const destCity = getCityName(segmentLast.destination) || segmentLast.destinationCity || "Destino";
    const origCode = segment1.origin?.iataCode || segment1.originCode || "";
    const destCode = segmentLast.destination?.iataCode || segmentLast.destinationCode || "";

    const stopsCount = slice.segments.length > 1 ? slice.segments.length - 1 : 0;
    
    let stopsLabel = 'Voo Direto';
    if (stopsCount === 1) {
       const middleSeg = slice.segments[0]; 
       const connCity = getCityName(middleSeg.destination) || middleSeg.destinationCity || middleSeg.destinationCode;
       stopsLabel = `1 Parada em ${connCity}`;
    } else if (stopsCount > 1) {
       stopsLabel = `${stopsCount} Paradas`;
    }

    return (
      <div className={`flex flex-col w-full ${isCompact ? 'mt-0' : 'mt-4'}`}>
        <p className="text-emerald-400 font-bold text-lg mb-4 text-center sm:text-left bg-slate-900/50 py-2 px-4 rounded-xl inline-block w-fit mx-auto sm:mx-0 shadow-inner border border-slate-700/50">
           📅 {formatDate(segment1.departingAt)}
        </p>
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="text-center sm:text-left flex flex-col sm:block">
             <p className="text-3xl sm:text-4xl font-black text-white">{formatTime(segment1.departingAt)}</p>
             <p className="text-base sm:text-lg text-slate-300 font-bold mt-1 truncate max-w-[120px] sm:max-w-[150px]" title={origCity}>{origCity}</p>
             <p className="text-sm text-slate-500 font-medium px-2 py-1 bg-slate-800 rounded-md inline-block mt-1 border border-slate-700">{origCode}</p>
          </div>
          <div className="flex-1 flex flex-col items-center relative px-2 sm:px-4">
             <p className="text-sm sm:text-base text-slate-400 font-bold whitespace-nowrap mb-2">{durationStr}</p>
             <div className="w-full h-[3px] bg-slate-600 relative rounded-full">
               <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 text-slate-400 bg-slate-800 px-1 rounded-full border border-slate-700" />
             </div>
             <p className={`text-xs sm:text-sm font-bold mt-2 px-3 py-1 rounded-md border text-center leading-tight ${stopsCount > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
               {stopsLabel}
             </p>
          </div>
          <div className="text-center sm:text-right flex flex-col sm:block items-center sm:items-end">
             <p className="text-3xl sm:text-4xl font-black text-white">{formatTime(segmentLast.arrivingAt)}</p>
             <p className="text-base sm:text-lg text-slate-300 font-bold mt-1 truncate max-w-[120px] sm:max-w-[150px]" title={destCity}>{destCity}</p>
             <p className="text-sm text-slate-500 font-medium px-2 py-1 bg-slate-800 rounded-md inline-block mt-1 border border-slate-700">{destCode}</p>
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
            <button key={l} onClick={() => setLang(l)} className={`px-3 py-2 rounded-xl text-sm font-bold uppercase border transition-all ${
              lang === l ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}>{l.toUpperCase()}</button>
          ))}
        </div>
        {(step !== "auth" && step !== "greeting") && (
          <Button 
            onClick={handleExit} 
            className="h-12 sm:h-16 px-4 sm:px-8 text-sm sm:text-xl bg-slate-800 hover:bg-slate-700 text-white rounded-xl sm:rounded-2xl border border-slate-700 shadow-md"
          >
            {t.exit as string}
          </Button>
        )}
      </header>

      <div className="mx-auto mt-6 w-full max-w-sm px-4 md:hidden">
        <SeniorCardImage />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden relative">
        
        {step === "auth" && (
           <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6 text-center leading-tight text-balance">
               {t.enterPhone as string}
             </h2>
             <p className="text-base sm:text-xl text-blue-400 font-medium mb-6 sm:mb-10 text-center text-balance">
               {t.phoneHint as string}
             </p>
             <div className="flex flex-col gap-4 sm:gap-6">
               <Input 
                 type="tel"
                 placeholder="+1 (555) 555-5555"
                 value={phoneNumber}
                 onChange={(e) => setPhoneNumber(e.target.value)}
                 className="h-20 sm:h-32 text-2xl sm:text-6xl text-center rounded-2xl sm:rounded-[32px] border-4 border-blue-500 bg-slate-800 text-white placeholder:text-slate-500 transition-all focus:border-blue-400 px-4 shadow-inner"
                 autoFocus
               />
               <Button 
                 onClick={handleLogin}
                 disabled={phoneNumber.length < 7}
                 className="h-16 sm:h-24 text-xl sm:text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full mt-4 sm:mt-8 shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all"
               >
                 Entrar <span className="hidden sm:inline">& Iniciar Processo</span> <ArrowRight className="ml-2 sm:ml-4 h-6 w-6 sm:h-8 sm:w-8" />
               </Button>
             </div>
           </div>
         )}
 
         {step === "greeting" && (
           <div className="w-full max-w-2xl text-center space-y-8 sm:space-y-12 animate-in slide-in-from-right duration-500">
             <div className="h-24 w-24 sm:h-40 sm:w-40 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 border-4 border-blue-500/30 shadow-lg">
               <Phone className="h-12 w-12 sm:h-20 sm:w-20" />
             </div>
             <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight text-balance">
               {t.routeReady as string}
             </h2>
             <p className="text-lg sm:text-2xl text-slate-300 text-balance">
               {t.routeDesc as string}
             </p>
             <Button 
               onClick={() => {
                 setStep("ask_class");
                 speak("Em qual classe você prefere voar?");
               }}
               className="w-full h-20 sm:h-32 text-2xl sm:text-4xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl sm:rounded-[32px] mt-8 sm:mt-12 shadow-[0_0_60px_rgba(16,185,129,0.3)]"
             >
                Iniciar Compra <ArrowRight className="ml-2 sm:ml-4 h-8 w-8 sm:h-10 sm:w-10 inline" />
             </Button>
           </div>
         )}
 
         {step === "ask_class" && (
           <div className="w-full max-w-5xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight text-balance">{t.chooseClass as string}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
               <Button onClick={() => { setCabinClass("economy"); setStep("ask_origin"); speak(t.v_fromCity as string); }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-blue-600 text-white truncate text-balance whitespace-normal leading-tight border border-slate-700 shadow-md">{t.economy as string}</Button>
               <Button onClick={() => { setCabinClass("premium_economy"); setStep("ask_origin"); speak(t.v_fromCity as string); }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-emerald-600 text-white truncate text-balance whitespace-normal leading-tight border border-slate-700 shadow-md">{t.premiumEconomy as string}</Button>
               <Button onClick={() => { setCabinClass("business"); setStep("ask_origin"); speak(t.v_fromCity as string); }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-purple-600 text-white truncate text-balance whitespace-normal leading-tight border border-slate-700 shadow-md">{t.business as string}</Button>
               <Button onClick={() => { setCabinClass("first"); setStep("ask_origin"); speak(t.v_fromCity as string); }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-amber-600 text-white truncate text-balance whitespace-normal leading-tight border border-slate-700 shadow-md">{t.first as string}</Button>
             </div>
           </div>
         )}
 
         {step === "ask_origin" && (
           <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight text-balance">
               {currentLeg > 1 ? (t.fromCityN as any)(currentLeg) : t.fromCity as string}
             </h2>
             <p className="text-lg sm:text-2xl text-blue-400 mb-6 sm:mb-8 text-balance">{t.cityHint as string}</p>
             <div className="relative">
                <Input 
                  type="text"
                  value={originQuery}
                  onChange={(e) => {
                    setOriginQuery(e.target.value);
                    setOriginIata("");
                  }}
                  placeholder="Ex: Nova York, Londres..."
                  className="h-20 sm:h-32 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[32px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-4 shadow-inner"
                />
                {originResults.length > 0 && !originIata && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-slate-800 border-4 border-slate-600 rounded-[32px] overflow-hidden z-[100] shadow-2xl max-h-[50vh] overflow-y-auto">
                    {originResults.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => handleOriginSelect(place)}
                        className="w-full p-4 sm:p-8 text-left hover:bg-slate-700 flex items-center gap-4 sm:gap-6 border-b border-slate-700 last:border-0 transition-colors"
                      >
                        <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-2xl sm:text-4xl font-bold text-white truncate text-balance">{place.cityName || place.name}</p>
                          <p className="text-lg sm:text-2xl text-slate-400 mt-1 sm:mt-2 truncate">{place.countryName} ({place.iataCode})</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
             </div>
             {originQuery.length < 3 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12">
                  <Button onClick={() => handleOriginSelect({ iataCode: "EWR", cityName: "Newark", countryName: "United States" })} className="h-20 sm:h-32 text-xl sm:text-3xl font-bold rounded-2xl sm:rounded-[24px] bg-slate-800 hover:bg-blue-600 truncate text-balance whitespace-normal leading-tight border border-slate-700">Nova York / Newark (EWR)</Button>
                  <Button onClick={() => handleOriginSelect({ iataCode: "MIA", cityName: "Miami", countryName: "United States" })} className="h-20 sm:h-32 text-xl sm:text-3xl font-bold rounded-2xl sm:rounded-[24px] bg-slate-800 hover:bg-blue-600 truncate text-balance whitespace-normal leading-tight border border-slate-700">Miami, Flórida (MIA)</Button>
               </div>
             )}
           </div>
         )}
 
         {step === "destination" && (
           <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight text-balance">
               {currentLeg > 1 ? (t.toCityN as any)(currentLeg) : t.toCity as string}
             </h2>
             <p className="text-lg sm:text-2xl text-blue-400 mb-6 sm:mb-8 text-balance">{t.cityHint as string}</p>
             <div className="relative">
               <Input 
                 type="text"
                 value={destQuery}
                 onChange={(e) => {
                   setDestQuery(e.target.value);
                   setDestIata("");
                 }}
                 placeholder="Ex: Lisboa, São Paulo..."
                 className="h-20 sm:h-32 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[32px] border-4 border-slate-600 bg-slate-800 text-white focus:border-emerald-400 px-4 shadow-inner"
               />
               {destResults.length > 0 && !destIata && (
                 <div className="absolute top-full left-0 right-0 mt-4 bg-slate-800 border-4 border-slate-600 rounded-[32px] overflow-hidden z-[100] shadow-2xl max-h-[50vh] overflow-y-auto">
                   {destResults.map((place) => (
                     <button
                       key={place.id}
                       onClick={() => handleDestSelect(place)}
                       className="w-full p-4 sm:p-8 text-left hover:bg-slate-700 flex items-center gap-4 sm:gap-6 border-b border-slate-700 last:border-0 transition-colors"
                     >
                       <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-400 shrink-0" />
                       <div className="min-w-0">
                         <p className="text-2xl sm:text-4xl font-bold text-white truncate text-balance">{place.cityName || place.name}</p>
                         <p className="text-lg sm:text-2xl text-slate-400 mt-1 sm:mt-2 truncate">{place.countryName} ({place.iataCode})</p>
                       </div>
                     </button>
                   ))}
                 </div>
               )}
             </div>
             {destQuery.length < 3 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12">
                  <Button onClick={() => handleDestSelect({ iataCode: "LIS", cityName: "Lisboa", countryName: "Portugal" })} className="h-20 sm:h-32 text-xl sm:text-3xl font-bold rounded-2xl sm:rounded-[24px] bg-slate-800 hover:bg-emerald-600 truncate text-balance whitespace-normal leading-tight border border-slate-700">Lisboa, Portugal (LIS)</Button>
                  <Button onClick={() => handleDestSelect({ iataCode: "GRU", cityName: "São Paulo", countryName: "Brasil" })} className="h-20 sm:h-32 text-xl sm:text-3xl font-bold rounded-2xl sm:rounded-[24px] bg-slate-800 hover:bg-emerald-600 truncate text-balance whitespace-normal leading-tight border border-slate-700">S. Paulo, Brasil (GRU)</Button>
               </div>
             )}
           </div>
         )}
 
         {step === "dates" && (
           <div className="w-full max-w-4xl text-center space-y-8 sm:space-y-12 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-8 leading-tight text-balance">
               {currentLeg > 1 ? (t.dateN as any)(currentLeg) : t.dateIda as string}
             </h2>
             <div className="flex flex-col items-center gap-6 sm:gap-8">
               <Input 
                 type="date"
                 value={travelDate}
                 onChange={(e) => setTravelDate(e.target.value)}
                 className="h-20 sm:h-32 w-full max-w-2xl text-2xl sm:text-5xl text-center rounded-2xl sm:rounded-[32px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-4 shadow-inner"
               />
               <Button 
                 onClick={handleDateNext}
                 disabled={!travelDate}
                 className="h-16 sm:h-24 px-8 sm:px-12 text-xl sm:text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all w-full sm:w-auto"
               >
                 Continuar <ArrowRight className="ml-2 sm:ml-4 h-6 w-6 sm:h-8 sm:w-8 inline" />
               </Button>
             </div>
           </div>
         )}
 
         {step === "ask_return_intention" && (
           <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight text-balance">
               {t.wantReturn as string}
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8">
               <Button onClick={() => {
                 setTripType("round-trip");
                 setStep("return_date");
                 speak("Excelente. Selecione qual será a data exata da sua volta ao calendário.");
               }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-emerald-600 hover:bg-emerald-500 text-white truncate text-balance whitespace-normal leading-tight shadow-md">Sim, adicionar volta</Button>
               <Button onClick={() => {
                 setTripType("one-way");
                 setStep("ask_multi_intention");
                 speak("Entendi, será apenas ida. E você tem planos de ir para alguma outra cidade depois desta?");
               }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-slate-700 text-white truncate text-balance whitespace-normal leading-tight border border-slate-700 shadow-md">Não, viajo apenas ida</Button>
             </div>
           </div>
         )}
 
         {step === "return_date" && (
           <div className="w-full max-w-4xl text-center space-y-8 sm:space-y-12 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-8 leading-tight text-balance">{t.returnDate as string}</h2>
             <div className="flex flex-col items-center gap-6 sm:gap-8">
               <Input 
                 type="date"
                 value={returnDate}
                 onChange={(e) => setReturnDate(e.target.value)}
                 className="h-20 sm:h-32 w-full max-w-2xl text-2xl sm:text-5xl text-center rounded-2xl sm:rounded-[32px] border-4 border-emerald-600 bg-slate-800 text-white focus:border-emerald-400 px-4 shadow-inner"
               />
               <Button 
                 onClick={() => {
                   if (!returnDate) return;
                   setStep("ask_name");
                   speak("Tudo certo. Agora, para emitir a passagem, por favor digite o seu nome...");
                 }}
                 disabled={!returnDate}
                 className="h-16 sm:h-24 px-8 sm:px-12 text-xl sm:text-3xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all w-full sm:w-auto"
               >
                 Continuar <ArrowRight className="ml-2 sm:ml-4 h-6 w-6 sm:h-8 sm:w-8 inline" />
               </Button>
             </div>
           </div>
         )}
 
         {step === "ask_multi_intention" && (
            <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight text-balance">{(t.multiQ as any)(destIata)}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8">
               <Button onClick={() => {
                 setTripType("multi-city");
                 const newLeg = { originQuery, originIata, destQuery, destIata, travelDate };
                 setLegs(prev => [...prev, newLeg]);
                 setCurrentLeg(c => c + 1);
                 setStep("destination"); 
                 setOriginIata(destIata);
                 setOriginQuery(destQuery);
                 setDestIata("");
                 setDestQuery("");
                 setDestResults([]);
                 setTravelDate("");
                 speak(`Perfeito. Então, partindo de ${destIata}, para onde você quer ir depois?`);
               }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-purple-600 hover:bg-purple-500 text-white truncate text-balance whitespace-normal leading-tight shadow-md">Sim, vou para outra cidade</Button>
               <Button onClick={() => {
                 if (currentLeg > 1) {
                   const newLeg = { originQuery, originIata, destQuery, destIata, travelDate };
                   setLegs(prev => [...prev, newLeg]);
                 }
                 setStep("ask_name");
                 speak("Tudo certo. A sua rota está montada. Por favor, para emitir a passagem, digite seu nome de batismo.");
               }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-slate-700 text-white truncate text-balance whitespace-normal leading-tight border border-slate-700 shadow-md">Não, minha viagem encerra aqui</Button>
             </div>
           </div>
         )}
 
         {step === "ask_name" && (
           <div className="w-full max-w-2xl animate-in slide-in-from-right duration-500">
             <div className="flex justify-center mb-6">
               <div className="h-20 w-20 sm:h-24 sm:w-24 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center border-4 border-blue-500/30 shadow-lg">
                 <User className="h-10 w-10 sm:h-12 sm:w-12" />
               </div>
             </div>
             <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center leading-tight text-balance">
               {t.yourName as string}
             </h2>
             <div className="flex flex-col gap-4 sm:gap-6">
               <Input 
                 type="text"
                 placeholder="Primeiro Nome"
                 value={firstName}
                 onChange={(e) => setFirstName(e.target.value)}
                 className="h-16 sm:h-24 text-xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-400 px-4 shadow-inner"
               />
               <Input 
                 type="text"
                 placeholder="Sobrenome"
                 value={lastName}
                 onChange={(e) => setLastName(e.target.value)}
                 className="h-16 sm:h-24 text-xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-400 px-4 shadow-inner"
               />
               <Button 
                 onClick={handleNameNext}
                 disabled={!firstName || !lastName}
                 className="h-16 sm:h-24 text-xl sm:text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full mt-2 sm:mt-4 shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all"
               >
                 Continuar <ArrowRight className="ml-2 sm:ml-4 h-6 w-6 sm:h-8 sm:w-8 inline" />
               </Button>
             </div>
           </div>
         )}
 
         {step === "ask_dob" && (
           <div className="w-full max-w-3xl animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center leading-tight text-balance">
               {t.yourDob as string}
             </h2>
             <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex gap-4 w-full sm:w-1/2">
                 <Input 
                   type="number"
                   placeholder="Dia"
                   value={dobDay}
                   onChange={(e) => setDobDay(e.target.value)}
                   className="h-16 sm:h-24 w-1/2 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-2 shadow-inner"
                 />
                 <Input 
                   type="number"
                   placeholder="Mês"
                   value={dobMonth}
                   onChange={(e) => setDobMonth(e.target.value)}
                   className="h-16 sm:h-24 w-1/2 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-2 shadow-inner"
                 />
               </div>
               <Input 
                 type="number"
                 placeholder="Ano"
                 value={dobYear}
                 onChange={(e) => setDobYear(e.target.value)}
                 className="h-16 sm:h-24 w-full sm:w-1/2 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-4 shadow-inner"
               />
             </div>
             <Button 
               onClick={handleDobNext}
               disabled={!dobDay || !dobMonth || !dobYear || dobYear.length < 4}
               className="w-full h-16 sm:h-24 text-xl sm:text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full mt-6 sm:mt-8 shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all"
             >
               Pesquisar <span className="hidden sm:inline">Passagens</span> <ArrowRight className="ml-2 sm:ml-4 h-6 w-6 sm:h-8 sm:w-8 inline" />
             </Button>
           </div>
         )}
 
         {step === "searching" && (
           <div className="w-full max-w-2xl text-center space-y-8 sm:space-y-12 animate-in zoom-in duration-500">
             <div className="relative h-32 w-32 sm:h-48 sm:w-48 mx-auto flex items-center justify-center">
               <div className="absolute inset-0 border-4 sm:border-8 border-blue-500/20 rounded-full animate-ping"></div>
               <div className="absolute inset-2 sm:inset-4 border-4 sm:border-8 border-blue-500/40 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
               <div className="absolute inset-4 sm:inset-8 border-4 sm:border-8 border-blue-500/60 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
               <Plane className="h-12 w-12 sm:h-20 sm:w-20 text-blue-400 animate-pulse relative z-10" />
             </div>
             <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight text-balance">
               {t.searching as string}
             </h2>
             <p className="text-lg sm:text-2xl text-slate-400 text-balance">
               {t.searchDesc as string}
             </p>
           </div>
         )}
 
         {step === "offer" && fetchedFlights.length > 0 && (
           <div className="w-full max-w-[1400px] text-center space-y-6 sm:space-y-8 animate-in slide-in-from-bottom duration-700">
             <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight text-balance mb-8">
               {(tripType === "round-trip" || tripType === "multi-city") && !selectedOutboundSlice 
                 ? "Escolha o seu voo de IDA:" 
                 : (tripType === "round-trip" || tripType === "multi-city") && selectedOutboundSlice
                 ? "Ida Garantida! Agora escolha a VOLTA:"
                 : "Escolha o voo de sua preferência:"}
             </h2>

             {selectedOutboundSlice && (
                <div className="bg-slate-800/90 border-4 border-blue-500 rounded-[32px] p-6 lg:p-8 mb-12 text-left shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
                   <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-bl-2xl px-6 py-2 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md">
                      Sua Seleção de Ida (Concluída)
                   </div>
                   <div className="flex flex-col md:flex-row gap-6 sm:gap-10 items-center mt-2">
                      <div className="flex-1 w-full bg-slate-900/50 p-4 rounded-3xl border border-slate-700/50 shadow-inner">
                         {displaySliceTimes(selectedOutboundSlice.slices[0], selectedOutboundSlice.slices[0].segments[0], selectedOutboundSlice.slices[0].segments[selectedOutboundSlice.slices[0].segments.length - 1], true)}
                      </div>
                      <div className="text-center md:text-right md:border-l-2 border-slate-700 md:pl-8 w-full md:w-auto">
                         <p className="text-slate-400 font-medium text-sm sm:text-base">Preço Total Estimado do Pacote</p>
                         <p className="text-blue-400 font-black text-3xl sm:text-5xl capitalize truncate break-all">{selectedOutboundSlice.currency} {selectedOutboundSlice.price}</p>
                         <p className="text-slate-400 font-medium text-sm sm:text-base mt-2">Voando com {selectedOutboundSlice.airline}</p>
                      </div>
                   </div>
                </div>
             )}
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left relative z-10">
               {displayedFlights.slice(offerPage * 3, (offerPage + 1) * 3).map((flight: any, idx: number) => {
                 const sliceIndex = ((tripType === "round-trip" || tripType === "multi-city") && selectedOutboundSlice) ? 1 : 0;
                 const activeSlice = flight.slices ? flight.slices[sliceIndex] : null;
                 const segment1 = activeSlice?.segments?.[0];
                 const segmentLast = activeSlice?.segments?.[activeSlice.segments.length - 1];
 
                 return (
                   <div key={flight.id || idx} className="bg-slate-800 flex flex-col rounded-3xl sm:rounded-[40px] p-6 sm:p-8 border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)] gap-4 sm:gap-6 relative overflow-hidden transition-transform hover:-translate-y-2">
                     
                     {(!selectedOutboundSlice && (tripType === "round-trip" || tripType === "multi-city")) && (
                        <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-bl-3xl font-extrabold uppercase tracking-widest text-[10px] sm:text-xs shadow-md">
                           Opções de Ida
                        </div>
                     )}
                     {(selectedOutboundSlice) && (
                        <div className="absolute top-0 right-0 bg-emerald-600 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-bl-3xl font-extrabold uppercase tracking-widest text-[10px] sm:text-xs shadow-md">
                           Opções de Volta
                        </div>
                     )}

                     <div className="flex justify-between items-start mt-4 sm:mt-2">
                       <div>
                         <p className="text-base sm:text-lg text-slate-400 font-medium">Companhia Aérea</p>
                         <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 capitalize truncate" title={flight.airline}>{flight.airline}</p>
                       </div>
                       {flight.logoUrl && <img src={flight.logoUrl} className="h-10 w-10 sm:h-14 sm:w-14 bg-white rounded-xl p-1.5 shadow-sm" alt="Logo" />}
                     </div>
                     
                     <div className="bg-slate-900/30 -mx-6 sm:-mx-8 px-6 sm:px-8 py-2 border-y border-slate-700/50 my-2">
                        {activeSlice && displaySliceTimes(activeSlice, segment1, segmentLast)}
                     </div>

                     <div className="py-2">
                       <p className="text-base sm:text-lg text-slate-400 font-medium">Preço Final (Taxas inclusas)</p>
                       <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-1 uppercase truncate">{flight.currency} {flight.price}</p>
                       {(!selectedOutboundSlice && (tripType === "round-trip" || tripType === "multi-city")) && (
                         <p className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-wider">*Preço total do pacote (Ida e Volta)</p>
                       )}
                     </div>
 
                     <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden flex-1 border border-slate-700 shadow-inner">
                       <FlightBaggageHighlights flight={flight} />
                     </div>
 
                     <Button 
                       onClick={() => handleSelectFlightOption(flight)}
                       className="w-full h-16 sm:h-20 text-xl md:text-2xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-[20px] mt-2 shadow-xl transition-all"
                     >
                       {(!selectedOutboundSlice && (tripType === "round-trip" || tripType === "multi-city")) ? "Selecionar Ida" : "Comprar Voo"} <ArrowRight className="ml-2 h-6 w-6 inline" />
                     </Button>
                   </div>
                 );
               })}
             </div>
             
             <div className="flex flex-col items-center justify-center gap-4 mt-12 relative z-10">
                {displayedFlights.length > (offerPage + 1) * 3 && (
                 <Button
                   onClick={() => { setOfferPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                   className="h-16 sm:h-20 px-8 sm:px-12 text-lg sm:text-xl font-bold rounded-full bg-slate-700 text-white hover:bg-slate-600 shadow-xl border border-slate-600"
                 >
                   Ver mais opções (Mais {(displayedFlights.length - (offerPage + 1) * 3)} voos disponíveis) <ArrowRight className="ml-2 h-6 w-6 inline" />
                 </Button>
               )}
               
               {offerPage > 0 && (
                 <Button
                   onClick={() => { setOfferPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                   variant="ghost"
                   className="h-12 px-6 text-base sm:text-lg font-bold text-slate-400 hover:text-white"
                 >
                   Voltar para opções anteriores
                 </Button>
               )}
             </div>
           </div>
         )}
 
         {step === "checkout" && bookingData && (
           <div className="w-full max-w-3xl text-center space-y-8 sm:space-y-12 animate-in slide-in-from-bottom duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-8 leading-tight text-balance">{t.cardData as string}</h2>
             <div className="bg-white rounded-3xl sm:rounded-[40px] p-4 sm:p-8 border-4 border-emerald-500 text-left relative overflow-hidden shadow-2xl">
               <PaymentForm 
                 clientSecret={bookingData.clientSecret}
                 bookingId={bookingData.bookingId}
                 referenceCode={bookingData.referenceCode}
                 amount={bookingData.amount}
                 currency={bookingData.currency}
                 onSuccess={() => {
                   speak("Compra confirmada com sucesso! O comprovante vai chegar em breve.");
                   toast({
                     title: "Compra Confirmada!",
                     description: "Reserva aprovada. Seu voo está garantido."
                   });
                   setTimeout(() => setLocation("/checkout/success?bookingId=" + bookingData.bookingId), 3000);
                 }}
                 onError={(msg) => {
                   toast({ title: "Erro no Cartão", description: msg, variant: "destructive" });
                   speak("Houve um problema com a validação do cartão. Corrija a informação de pagamento.");
                 }}
               />
             </div>
           </div>
         )}
 
       </main>
 
       <footer className="p-4 sm:p-8 bg-slate-950 flex justify-center items-center sticky bottom-0 z-50 border-t border-slate-800">
         <Button variant="ghost" className="h-16 sm:h-20 px-4 sm:px-8 rounded-full text-base sm:text-xl font-bold bg-white/5 text-white hover:bg-white/10 gap-2 sm:gap-4 border border-white/10">
           <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
           Falar <span className="hidden sm:inline">em Áudio com Agente</span>
         </Button>
       </footer>
     </div>
   );
 }
