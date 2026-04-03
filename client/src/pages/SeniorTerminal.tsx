import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Plane, Calendar, CheckCircle2, Mic, ArrowRight, User, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import PaymentForm from "@/components/PaymentForm";
import FlightBaggageHighlights from "@/components/FlightBaggageHighlights";
import { useDebounce } from "@/hooks/use-debounce";

type FlowStep = "auth" | "greeting" | "ask_class" | "ask_origin" | "destination" | "dates" | "ask_return_intention" | "return_date" | "ask_multi_intention" | "ask_name" | "ask_dob" | "searching" | "offer" | "checkout";

type Leg = { originQuery: string; originIata: string; destQuery: string; destIata: string; travelDate: string };

export default function SeniorTerminal() {
  const [step, setStep] = useState<FlowStep>("auth");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Trip details State
  const [tripType, setTripType] = useState<"one-way" | "round-trip" | "multi-city">("one-way");
  const [cabinClass, setCabinClass] = useState<string>("economy");
  const [returnDate, setReturnDate] = useState("");
  const [legs, setLegs] = useState<Leg[]>([]);
  const [currentLeg, setCurrentLeg] = useState(1);
  
  // Origin State
  const [originQuery, setOriginQuery] = useState("");
  const [originIata, setOriginIata] = useState("");
  const [originResults, setOriginResults] = useState<any[]>([]);
  const debouncedOrigin = useDebounce(originQuery, 500);

  // Dest State
  const [destQuery, setDestQuery] = useState("");
  const [destIata, setDestIata] = useState("");
  const [destResults, setDestResults] = useState<any[]>([]);
  const debouncedDest = useDebounce(destQuery, 500);

  // Date State
  const [travelDate, setTravelDate] = useState("");

  // Passenger State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  
  // Flight & Booking State
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
    utterance.lang = 'pt-BR';
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
    speak("Olá. Bem-vindo ao terminal de acesso rápido. Nós vamos ajudar você a comprar a sua passagem.");
  };

  const handleOriginSelect = (place: any) => {
    setOriginIata(place.iataCode);
    setOriginQuery(`${place.cityName || place.name} (${place.iataCode})`);
    setOriginResults([]);
    setTimeout(() => {
      setStep("destination");
      speak(tripType === "multi-city" ? `Trecho ${currentLeg}: Para qual cidade você quer ir depois de sair de ${place.cityName || place.name}?` : "Muito bem. E para qual cidade você quer viajar?");
    }, 500);
  };

  const handleDestSelect = (place: any) => {
    setDestIata(place.iataCode);
    setDestQuery(`${place.cityName || place.name} (${place.iataCode})`);
    setDestResults([]);
    setTimeout(() => {
      setStep("dates");
      speak(currentLeg > 1 ? `E qual é a data deste trecho para ${place.cityName || place.name}?` : "Certo. Qual é a data da sua viagem?");
    }, 500);
  };

  const handleDateNext = () => {
    if (!travelDate) return;
    
    if (currentLeg === 1) {
      setStep("ask_return_intention");
      speak("Você também deseja adicionar uma passagem de Volta para esta mesma viagem?");
    } else {
      setStep("ask_multi_intention");
      speak("Você planeja visitar outra cidade além dessa antes de terminar a viagem?");
    }
  };

  const handleNameNext = () => {
    if (!firstName || !lastName) return;
    setStep("ask_dob");
    speak("Maravilha. E me diga também a sua data de nascimento.");
  };

  const handleDobNext = async () => {
    if (!dobDay || !dobMonth || !dobYear) return;
    setStep("searching");
    setIsSearching(true);
    speak("Tudo certo. Nossa inteligência está procurando os melhores voos para você agora mesmo. Aguarde um momento.");
    
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
        speak(tripType === "round-trip" ? "Encontramos excelentes opções. Primeiro, escolha o seu voo de ida." : "Encontramos excelentes opções de voos para você. Escolha a sua preferida abaixo.");
      } else {
        toast({ title: "Ops!", description: "Não encontramos voos. Escolha outra configuração.", variant: "destructive" });
        setStep("greeting");
        speak("Desculpe, não encontrei voos para esta rota exata. Vamos tentar novamente?");
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
    speak("Iniciando conexão segura com seu banco. Por favor, aguarde.");
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
        speak("Pronto. Agora digite os dados do cartão para concluir a aprovação.");
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
       speak("Excelente. Agora escolha a data ou voo de volta que melhor se encaixa para você.");
    } else {
       createBooking(flight);
    }
  };

  const displaySliceTimes = (slice: any, segment1: any, segmentLast: any) => {
    if (!slice || !segment1 || !segmentLast) return null;
    const formatTime = (isoString: string) => {
       const date = new Date(isoString);
       return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    };
    let durationStr = "N/A";
    if (slice.duration) {
      durationStr = slice.duration.replace('PT', '').toLowerCase();
    }
    
    return (
      <div className="flex items-center justify-between gap-2 w-full mt-4">
        <div className="text-center">
           <p className="text-2xl sm:text-4xl font-bold text-white">{formatTime(segment1.departingAt)}</p>
           <p className="text-sm sm:text-lg text-slate-400 font-medium mt-1">{segment1.origin?.iataCode}</p>
        </div>
        <div className="flex-1 flex flex-col items-center relative px-4">
           <p className="text-sm sm:text-lg text-slate-400 font-medium whitespace-nowrap mb-2">{durationStr}</p>
           <div className="w-full h-[3px] bg-slate-600 relative">
             <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 text-slate-400 bg-slate-800 px-1" />
           </div>
           <p className="text-xs sm:text-sm text-slate-500 mt-2">{slice.segments.length > 1 ? `${slice.segments.length - 1} parada(s)` : 'Direto'}</p>
        </div>
        <div className="text-center">
           <p className="text-2xl sm:text-4xl font-bold text-white">{formatTime(segmentLast.arrivingAt)}</p>
           <p className="text-sm sm:text-lg text-slate-400 font-medium mt-1">{segmentLast.destination?.iataCode}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between font-sans selection:bg-blue-500/30">
      <header className="p-4 sm:p-8 flex justify-between items-center border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Michels Travel</h1>
          <p className="text-sm sm:text-xl text-blue-400 font-medium">Atendimento Rápido Sênior</p>
        </div>
        {(step !== "auth" && step !== "greeting") && (
          <Button 
            onClick={handleExit} 
            className="h-12 sm:h-16 px-4 sm:px-8 text-sm sm:text-xl bg-slate-800 hover:bg-slate-700 text-white rounded-xl sm:rounded-2xl"
          >
            Sair <span className="hidden sm:inline">& Finalizar</span>
          </Button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
        
        {step === "auth" && (
           <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6 text-center leading-tight text-balance">
               Para começar, digite seu telefone no formato internacional:
             </h2>
             <p className="text-base sm:text-xl text-blue-400 font-medium mb-6 sm:mb-10 text-center text-balance">
               Exemplos: +1 (EUA), +55 (Brasil), +351 (Portugal)
             </p>
             <div className="flex flex-col gap-4 sm:gap-6">
               <Input 
                 type="tel"
                 placeholder="+1 (555) 555-5555"
                 value={phoneNumber}
                 onChange={(e) => setPhoneNumber(e.target.value)}
                 className="h-20 sm:h-32 text-2xl sm:text-6xl text-center rounded-2xl sm:rounded-[32px] border-4 border-blue-500 bg-slate-800 text-white placeholder:text-slate-500 transition-all focus:border-blue-400 px-4"
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
             <div className="h-24 w-24 sm:h-40 sm:w-40 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 border-4 border-blue-500/30">
               <Phone className="h-12 w-12 sm:h-20 sm:w-20" />
             </div>
             <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight text-balance">
               Sua rota de atendimento exclusivo está pronta.
             </h2>
             <p className="text-lg sm:text-2xl text-slate-300 text-balance">
               Vamos ajudar você a comprar a sua passagem respondendo algumas perguntas simples passo-a-passo.
             </p>
             <Button 
               onClick={() => {
                 setStep("ask_class");
                 speak("Em qual classe você prefere voar?");
               }}
               className="w-full h-20 sm:h-32 text-2xl sm:text-4xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl sm:rounded-[32px] mt-8 sm:mt-12 shadow-[0_0_60px_rgba(16,185,129,0.3)]"
             >
                Iniciar Compra
             </Button>
           </div>
         )}
 
         {step === "ask_class" && (
           <div className="w-full max-w-5xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight text-balance">Qual o tipo de conforto e classe para esta viagem?</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
               <Button onClick={() => { setCabinClass("economy"); setStep("ask_origin"); speak("De qual cidade você vai sair?"); }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-blue-600 text-white truncate text-balance whitespace-normal leading-tight">Econômica</Button>
               <Button onClick={() => { setCabinClass("premium_economy"); setStep("ask_origin"); speak("De qual cidade você vai sair?"); }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-emerald-600 text-white truncate text-balance whitespace-normal leading-tight">Premium Economy</Button>
               <Button onClick={() => { setCabinClass("business"); setStep("ask_origin"); speak("De qual cidade você vai sair?"); }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-purple-600 text-white truncate text-balance whitespace-normal leading-tight">Executiva</Button>
               <Button onClick={() => { setCabinClass("first"); setStep("ask_origin"); speak("De qual cidade você vai sair?"); }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-amber-600 text-white truncate text-balance whitespace-normal leading-tight">Primeira Classe</Button>
             </div>
           </div>
         )}
 
         {step === "ask_origin" && (
           <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight text-balance">
               {currentLeg > 1 ? `E de qual cidade você vai sair agora, no trecho ${currentLeg}?` : "De qual cidade você vai sair?"}
             </h2>
             <p className="text-lg sm:text-2xl text-blue-400 mb-6 sm:mb-8 text-balance">Digite o nome da cidade ou aeroporto abaixo:</p>
             <div className="relative">
                <Input 
                  type="text"
                  value={originQuery}
                  onChange={(e) => {
                    setOriginQuery(e.target.value);
                    setOriginIata("");
                  }}
                  placeholder="Ex: Nova York, Londres..."
                  className="h-20 sm:h-32 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[32px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-4"
                />
                {originResults.length > 0 && !originIata && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-slate-800 border-4 border-slate-600 rounded-[32px] overflow-hidden z-50">
                    {originResults.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => handleOriginSelect(place)}
                        className="w-full p-4 sm:p-8 text-left hover:bg-slate-700 flex items-center gap-4 sm:gap-6 border-b border-slate-700 last:border-0"
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
                  <Button onClick={() => handleOriginSelect({ iataCode: "EWR", cityName: "Newark", countryName: "United States" })} className="h-20 sm:h-32 text-xl sm:text-3xl font-bold rounded-2xl sm:rounded-[24px] bg-slate-800 hover:bg-blue-600 truncate text-balance whitespace-normal leading-tight">Nova York / Newark (EWR)</Button>
                  <Button onClick={() => handleOriginSelect({ iataCode: "MIA", cityName: "Miami", countryName: "United States" })} className="h-20 sm:h-32 text-xl sm:text-3xl font-bold rounded-2xl sm:rounded-[24px] bg-slate-800 hover:bg-blue-600 truncate text-balance whitespace-normal leading-tight">Miami, Flórida (MIA)</Button>
               </div>
             )}
           </div>
         )}
 
         {step === "destination" && (
           <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight text-balance">
               {currentLeg > 1 ? `E do trecho ${currentLeg}, para que cidade você vai voar?` : "Para onde você deseja viajar?"}
             </h2>
             <p className="text-lg sm:text-2xl text-blue-400 mb-6 sm:mb-8 text-balance">Digite o nome da cidade ou aeroporto abaixo:</p>
             <div className="relative">
               <Input 
                 type="text"
                 value={destQuery}
                 onChange={(e) => {
                   setDestQuery(e.target.value);
                   setDestIata("");
                 }}
                 placeholder="Ex: Lisboa, São Paulo..."
                 className="h-20 sm:h-32 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[32px] border-4 border-slate-600 bg-slate-800 text-white focus:border-emerald-400 px-4"
               />
               {destResults.length > 0 && !destIata && (
                 <div className="absolute top-full left-0 right-0 mt-4 bg-slate-800 border-4 border-slate-600 rounded-[32px] overflow-hidden z-50">
                   {destResults.map((place) => (
                     <button
                       key={place.id}
                       onClick={() => handleDestSelect(place)}
                       className="w-full p-4 sm:p-8 text-left hover:bg-slate-700 flex items-center gap-4 sm:gap-6 border-b border-slate-700 last:border-0"
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
                  <Button onClick={() => handleDestSelect({ iataCode: "LIS", cityName: "Lisboa", countryName: "Portugal" })} className="h-20 sm:h-32 text-xl sm:text-3xl font-bold rounded-2xl sm:rounded-[24px] bg-slate-800 hover:bg-emerald-600 truncate text-balance whitespace-normal leading-tight">Lisboa, Portugal (LIS)</Button>
                  <Button onClick={() => handleDestSelect({ iataCode: "GRU", cityName: "São Paulo", countryName: "Brasil" })} className="h-20 sm:h-32 text-xl sm:text-3xl font-bold rounded-2xl sm:rounded-[24px] bg-slate-800 hover:bg-emerald-600 truncate text-balance whitespace-normal leading-tight">S. Paulo, Brasil (GRU)</Button>
               </div>
             )}
           </div>
         )}
 
         {step === "dates" && (
           <div className="w-full max-w-4xl text-center space-y-8 sm:space-y-12 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-8 leading-tight text-balance">
               {currentLeg > 1 ? `Qual a data do Trecho ${currentLeg}?` : "Qual a data da viagem (Ida)?"}
             </h2>
             <div className="flex flex-col items-center gap-6 sm:gap-8">
               <Input 
                 type="date"
                 value={travelDate}
                 onChange={(e) => setTravelDate(e.target.value)}
                 className="h-20 sm:h-32 w-full max-w-2xl text-2xl sm:text-5xl text-center rounded-2xl sm:rounded-[32px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-4"
               />
               <Button 
                 onClick={handleDateNext}
                 disabled={!travelDate}
                 className="h-16 sm:h-24 px-8 sm:px-12 text-xl sm:text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all w-full sm:w-auto"
               >
                 Continuar <ArrowRight className="ml-2 sm:ml-4 h-6 w-6 sm:h-8 sm:w-8" />
               </Button>
             </div>
           </div>
         )}
 
         {step === "ask_return_intention" && (
           <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight text-balance">
               Você deseja incluir uma passagem de VOLTA (Retorno) também?
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8">
               <Button onClick={() => {
                 setTripType("round-trip");
                 setStep("return_date");
                 speak("Excelente. Selecione qual será a data exata da sua volta ao calendário.");
               }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-emerald-600 hover:bg-emerald-500 text-white truncate text-balance whitespace-normal leading-tight">Sim, adicionar volta</Button>
               <Button onClick={() => {
                 setTripType("one-way");
                 setStep("ask_multi_intention");
                 speak("Entendi, será apenas ida. E você tem planos de ir para alguma outra cidade depois desta?");
               }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-slate-700 text-white truncate text-balance whitespace-normal leading-tight">Não, viajo apenas ida</Button>
             </div>
           </div>
         )}
 
         {step === "return_date" && (
           <div className="w-full max-w-4xl text-center space-y-8 sm:space-y-12 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-8 leading-tight text-balance">Qual será a data da sua VOLTA?</h2>
             <div className="flex flex-col items-center gap-6 sm:gap-8">
               <Input 
                 type="date"
                 value={returnDate}
                 onChange={(e) => setReturnDate(e.target.value)}
                 className="h-20 sm:h-32 w-full max-w-2xl text-2xl sm:text-5xl text-center rounded-2xl sm:rounded-[32px] border-4 border-emerald-600 bg-slate-800 text-white focus:border-emerald-400 px-4"
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
                 Continuar <ArrowRight className="ml-2 sm:ml-4 h-6 w-6 sm:h-8 sm:w-8" />
               </Button>
             </div>
           </div>
         )}
 
         {step === "ask_multi_intention" && (
            <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight text-balance">Você vai aproveitar para visitar alguma outra cidade DEPOIS de {destIata}?</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8">
               <Button onClick={() => {
                 setTripType("multi-city");
                 const newLeg = { originQuery, originIata, destQuery, destIata, travelDate };
                 setLegs(prev => [...prev, newLeg]);
                 setCurrentLeg(c => c + 1);
                 setStep("destination"); 
                 
                 // Pré-preenche a origem para onde ele estava indo
                 setOriginIata(destIata);
                 setOriginQuery(destQuery);
                 // Limpa destino do proximo trecho
                 setDestIata("");
                 setDestQuery("");
                 setDestResults([]);
                 setTravelDate("");
 
                 speak(`Perfeito. Então, partindo de ${destIata}, para onde você quer ir depois?`);
               }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-purple-600 hover:bg-purple-500 text-white truncate text-balance whitespace-normal leading-tight">Sim, vou para outra cidade</Button>
               <Button onClick={() => {
                 if (currentLeg > 1) {
                   const newLeg = { originQuery, originIata, destQuery, destIata, travelDate };
                   setLegs(prev => [...prev, newLeg]);
                 }
                 setStep("ask_name");
                 speak("Tudo certo. A sua rota está montada. Por favor, para emitir a passagem, digite seu nome de batismo.");
               }} className="h-24 sm:h-32 text-2xl sm:text-4xl font-bold rounded-2xl sm:rounded-[32px] bg-slate-800 hover:bg-slate-700 text-white truncate text-balance whitespace-normal leading-tight">Não, minha viagem encerra aqui</Button>
             </div>
           </div>
         )}
 
         {step === "ask_name" && (
           <div className="w-full max-w-2xl animate-in slide-in-from-right duration-500">
             <div className="flex justify-center mb-6">
               <div className="h-20 w-20 sm:h-24 sm:w-24 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center border-4 border-blue-500/30">
                 <User className="h-10 w-10 sm:h-12 sm:w-12" />
               </div>
             </div>
             <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center leading-tight text-balance">
               Para a sua passagem, preencha o seu nome:
             </h2>
             <div className="flex flex-col gap-4 sm:gap-6">
               <Input 
                 type="text"
                 placeholder="Primeiro Nome"
                 value={firstName}
                 onChange={(e) => setFirstName(e.target.value)}
                 className="h-16 sm:h-24 text-xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-400 px-4"
               />
               <Input 
                 type="text"
                 placeholder="Sobrenome"
                 value={lastName}
                 onChange={(e) => setLastName(e.target.value)}
                 className="h-16 sm:h-24 text-xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-400 px-4"
               />
               <Button 
                 onClick={handleNameNext}
                 disabled={!firstName || !lastName}
                 className="h-16 sm:h-24 text-xl sm:text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full mt-2 sm:mt-4 shadow-[0_0_40px_rgba(37,99,235,0.3)]"
               >
                 Continuar <ArrowRight className="ml-2 sm:ml-4 h-6 w-6 sm:h-8 sm:w-8" />
               </Button>
             </div>
           </div>
         )}
 
         {step === "ask_dob" && (
           <div className="w-full max-w-3xl animate-in slide-in-from-right duration-500">
             <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center leading-tight text-balance">
               Sua data de nascimento:
             </h2>
             <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex gap-4 w-full sm:w-1/2">
                 <Input 
                   type="number"
                   placeholder="Dia"
                   value={dobDay}
                   onChange={(e) => setDobDay(e.target.value)}
                   className="h-16 sm:h-24 w-1/2 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-2"
                 />
                 <Input 
                   type="number"
                   placeholder="Mês"
                   value={dobMonth}
                   onChange={(e) => setDobMonth(e.target.value)}
                   className="h-16 sm:h-24 w-1/2 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-2"
                 />
               </div>
               <Input 
                 type="number"
                 placeholder="Ano"
                 value={dobYear}
                 onChange={(e) => setDobYear(e.target.value)}
                 className="h-16 sm:h-24 w-full sm:w-1/2 text-2xl sm:text-4xl text-center rounded-2xl sm:rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400 px-4"
               />
             </div>
             <Button 
               onClick={handleDobNext}
               disabled={!dobDay || !dobMonth || !dobYear || dobYear.length < 4}
               className="w-full h-16 sm:h-24 text-xl sm:text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full mt-6 sm:mt-8 shadow-[0_0_40px_rgba(37,99,235,0.3)]"
             >
               Pesquisar <span className="hidden sm:inline">Passagens</span> <ArrowRight className="ml-2 sm:ml-4 h-6 w-6 sm:h-8 sm:w-8" />
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
               Buscando rota ideal...
             </h2>
             <p className="text-lg sm:text-2xl text-slate-400 text-balance">
               Validando a disponibilidade real com seu nome e datas escolhidas. Não saia desta tela.
             </p>
           </div>
         )}
 
         {step === "offer" && fetchedFlights.length > 0 && (
           <div className="w-full max-w-[1400px] text-center space-y-6 sm:space-y-8 animate-in slide-in-from-bottom duration-700">
             <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight text-balance">
               {(tripType === "round-trip" || tripType === "multi-city") && !selectedOutboundSlice 
                 ? "Escolha o seu voo de IDA:" 
                 : (tripType === "round-trip" || tripType === "multi-city") && selectedOutboundSlice
                 ? "Ida selecionada! Agora escolha a VOLTA:"
                 : "Escolha o voo de sua preferência:"}
             </h2>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
               {displayedFlights.slice(offerPage * 3, (offerPage + 1) * 3).map((flight: any, idx: number) => {
                 // If we are choosing outbound, sliceIndex is 0. If return, sliceIndex is 1.
                 const sliceIndex = ((tripType === "round-trip" || tripType === "multi-city") && selectedOutboundSlice) ? 1 : 0;
                 const activeSlice = flight.slices ? flight.slices[sliceIndex] : null;
                 const segment1 = activeSlice?.segments?.[0];
                 const segmentLast = activeSlice?.segments?.[activeSlice.segments.length - 1];
 
                 return (
                   <div key={flight.id || idx} className="bg-slate-800 flex flex-col rounded-3xl sm:rounded-[40px] p-6 sm:p-8 border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)] gap-6">
                     
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-base sm:text-lg text-slate-400 font-medium">Companhia Aérea</p>
                         <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 capitalize truncate">{flight.airline}</p>
                       </div>
                       {flight.logoUrl && <img src={flight.logoUrl} className="h-10 w-10 sm:h-12 sm:w-12 bg-white rounded-lg p-1" alt="Logo" />}
                     </div>
 
                     {activeSlice && displaySliceTimes(activeSlice, segment1, segmentLast)}
                     
                     <div className="py-4 border-y border-slate-700">
                       <p className="text-base sm:text-lg text-slate-400 font-medium">Preço (Taxas inclusas)</p>
                       <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-1 uppercase truncate">{flight.currency} {flight.price}</p>
                       {(!selectedOutboundSlice && (tripType === "round-trip" || tripType === "multi-city")) && (
                         <p className="text-xs text-emerald-600 mt-1">*Preço final do pacote da viagem todo</p>
                       )}
                     </div>
 
                     <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden flex-1">
                       <FlightBaggageHighlights flight={flight} />
                     </div>
 
                     <Button 
                       onClick={() => handleSelectFlightOption(flight)}
                       className="w-full h-16 sm:h-20 text-xl md:text-2xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-[20px] mt-2 shadow-xl"
                     >
                       {(!selectedOutboundSlice && (tripType === "round-trip" || tripType === "multi-city")) ? "Selecionar Ida" : "Comprar Voo"} <ArrowRight className="ml-2 h-6 w-6" />
                     </Button>
                   </div>
                 );
               })}
             </div>
             
             <div className="flex flex-col items-center justify-center gap-4 mt-8">
                {displayedFlights.length > (offerPage + 1) * 3 && (
                 <Button
                   onClick={() => { setOfferPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                   className="h-16 sm:h-20 px-8 sm:px-12 text-lg sm:text-xl font-bold rounded-full bg-slate-700 text-white hover:bg-slate-600 shadow-xl"
                 >
                   Ver mais opções (Mais {(displayedFlights.length - (offerPage + 1) * 3)} voos) <ArrowRight className="ml-2 h-6 w-6" />
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
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-8 leading-tight text-balance">Inserir Dados do Cartão</h2>
             <div className="bg-white rounded-3xl sm:rounded-[40px] p-4 sm:p-8 border-4 border-emerald-500 text-left relative overflow-hidden">
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
 
       <footer className="p-4 sm:p-8 bg-slate-950 flex justify-center items-center">
         <Button variant="ghost" className="h-16 sm:h-20 px-4 sm:px-8 rounded-full text-base sm:text-xl font-bold bg-white/5 text-white hover:bg-white/10 gap-2 sm:gap-4">
           <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
           Falar <span className="hidden sm:inline">em Áudio com Agente</span>
         </Button>
       </footer>
     </div>
   );
 }
