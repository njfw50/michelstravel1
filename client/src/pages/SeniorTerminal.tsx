import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Plane, Calendar, CheckCircle2, Mic, ArrowRight, User, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import PaymentForm from "@/components/PaymentForm";
import FlightBaggageHighlights from "@/components/FlightBaggageHighlights";
import { useDebounce } from "@/hooks/use-debounce";

type FlowStep = "auth" | "greeting" | "ask_origin" | "destination" | "dates" | "ask_name" | "ask_dob" | "searching" | "offer" | "checkout";

export default function SeniorTerminal() {
  const [step, setStep] = useState<FlowStep>("auth");
  const [phoneNumber, setPhoneNumber] = useState("");
  
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
      speak("Muito bem. E para qual cidade você quer viajar?");
    }, 500);
  };

  const handleDestSelect = (place: any) => {
    setDestIata(place.iataCode);
    setDestQuery(`${place.cityName || place.name} (${place.iataCode})`);
    setDestResults([]);
    setTimeout(() => {
      setStep("dates");
      speak("Certo. Qual é a data exata da sua viagem?");
    }, 500);
  };

  const handleDateNext = () => {
    if (!travelDate) return;
    setStep("ask_name");
    speak("Tudo certo. Agora, para emitir a passagem, por favor digite o seu nome de batismo da forma como está no documento");
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
      const res = await fetch(`/api/flights/search?origin=${originIata}&destination=${destIata}&date=${travelDate}&passengers=1&adults=1&children=0&infants=0&cabinClass=economy`);
      const flights = await res.json();
      
      if (flights && flights.length > 0) {
        const sorted = flights.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
        setSelectedFlight(sorted[0]);
        setStep("offer");
        speak("Encontramos um excelente voo para você.");
      } else {
        toast({ title: "Ops!", description: "Não encontramos voos. Escolha outra data.", variant: "destructive" });
        setStep("dates");
        speak("Desculpe, não encontrei voos nesta data. Escolha outra data.");
      }
    } catch (e) {
      toast({ title: "Erro", variant: "destructive" });
      setStep("dates");
    } finally {
      setIsSearching(false);
    }
  };

  const createBooking = async () => {
    if (!selectedFlight) return;
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
          flightData: selectedFlight,
          passengers: [p],
          contactEmail: "senior-terminal@michelstravel.agency",
          contactPhone: phoneNumber,
          totalPrice: selectedFlight.price,
          currency: selectedFlight.currency
        })
      });
      const data = await res.json();
      
      if (res.ok && data.clientSecret) {
        setBookingData({
          clientSecret: data.clientSecret,
          bookingId: data.booking.id,
          referenceCode: data.booking.referenceCode,
          amount: parseFloat(selectedFlight.price),
          currency: selectedFlight.currency
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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between font-sans selection:bg-blue-500/30">
      <header className="p-8 flex justify-between items-center border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Michels Travel</h1>
          <p className="text-xl text-blue-400 font-medium">Atendimento Rápido Sênior</p>
        </div>
        {(step !== "auth" && step !== "greeting") && (
          <Button 
            onClick={handleExit} 
            className="h-16 px-8 text-xl bg-slate-800 hover:bg-slate-700 text-white rounded-2xl"
          >
            Sair e Finalizar
          </Button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        
        {step === "auth" && (
          <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-center leading-tight">
              Para começar, digite seu telefone com o código do país:
            </h2>
            <p className="text-xl text-blue-400 font-medium mb-10 text-center">
              Exemplos: +1 (EUA), +55 (Brasil), +351 (Portugal)
            </p>
            <div className="flex flex-col gap-6">
              <Input 
                type="tel"
                placeholder="+1 (555) 555-5555"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-32 text-4xl sm:text-6xl text-center rounded-[32px] border-4 border-blue-500 bg-slate-800 text-white placeholder:text-slate-500 transition-all focus:border-blue-400"
                autoFocus
              />
              <Button 
                onClick={handleLogin}
                disabled={phoneNumber.length < 7}
                className="h-24 text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full mt-8 shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all"
              >
                Entrar e Iniciar Processo <ArrowRight className="ml-4 h-8 w-8" />
              </Button>
            </div>
            <p className="text-slate-500 text-center text-xl mt-8">Não é necessária nenhuma senha.</p>
          </div>
        )}

        {step === "greeting" && (
          <div className="w-full max-w-2xl text-center space-y-12 animate-in slide-in-from-right duration-500">
            <div className="h-40 w-40 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-blue-500/30">
              <Phone className="h-20 w-20" />
            </div>
            <h2 className="text-5xl font-bold text-white leading-tight">
              Sua rota de atendimento exclusivo está pronta.
            </h2>
            <p className="text-2xl text-slate-300">
              Vamos ajudar você a comprar a sua passagem em poucos passos largos.
            </p>
            <Button 
              onClick={() => {
                setStep("ask_origin");
                speak("De qual cidade você vai sair?");
              }}
              className="w-full h-32 text-4xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-[32px] mt-12 shadow-[0_0_60px_rgba(16,185,129,0.3)]"
            >
              Iniciar Compra de Passagem
            </Button>
          </div>
        )}

        {step === "ask_origin" && (
          <div className="w-full max-w-4xl text-center space-y-8 animate-in slide-in-from-right duration-500">
            <h2 className="text-5xl font-bold text-white mb-4 leading-tight">De qual cidade você vai sair?</h2>
            <p className="text-2xl text-blue-400 mb-8">Digite o nome da cidade ou aeroporto abaixo:</p>
            <div className="relative">
              <Input 
                type="text"
                value={originQuery}
                onChange={(e) => {
                  setOriginQuery(e.target.value);
                  setOriginIata("");
                }}
                placeholder="Ex: Nova York, Rio de Janeiro..."
                className="h-32 text-4xl text-center rounded-[32px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400"
              />
              {originResults.length > 0 && !originIata && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-slate-800 border-4 border-slate-600 rounded-[32px] overflow-hidden z-50">
                  {originResults.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleOriginSelect(place)}
                      className="w-full p-8 text-left hover:bg-slate-700 flex items-center gap-6 border-b border-slate-700 last:border-0"
                    >
                      <MapPin className="h-12 w-12 text-blue-400" />
                      <div>
                        <p className="text-4xl font-bold text-white">{place.cityName || place.name}</p>
                        <p className="text-2xl text-slate-400 mt-2">{place.countryName} ({place.iataCode})</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {originQuery.length < 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                 <Button onClick={() => handleOriginSelect({ iataCode: "EWR", cityName: "Newark", countryName: "United States" })} className="h-32 text-3xl font-bold rounded-[24px] bg-slate-800 hover:bg-blue-600">Nova York / Newark (EWR)</Button>
                 <Button onClick={() => handleOriginSelect({ iataCode: "MIA", cityName: "Miami", countryName: "United States" })} className="h-32 text-3xl font-bold rounded-[24px] bg-slate-800 hover:bg-blue-600">Miami, Flórida (MIA)</Button>
              </div>
            )}
          </div>
        )}

        {step === "destination" && (
          <div className="w-full max-w-4xl text-center space-y-8 animate-in slide-in-from-right duration-500">
            <h2 className="text-5xl font-bold text-white mb-4 leading-tight">Para onde você quer viajar?</h2>
            <p className="text-2xl text-blue-400 mb-8">Digite o nome da cidade ou aeroporto abaixo:</p>
            <div className="relative">
              <Input 
                type="text"
                value={destQuery}
                onChange={(e) => {
                  setDestQuery(e.target.value);
                  setDestIata("");
                }}
                placeholder="Ex: Lisboa, São Paulo..."
                className="h-32 text-4xl text-center rounded-[32px] border-4 border-slate-600 bg-slate-800 text-white focus:border-emerald-400"
              />
              {destResults.length > 0 && !destIata && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-slate-800 border-4 border-slate-600 rounded-[32px] overflow-hidden z-50">
                  {destResults.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleDestSelect(place)}
                      className="w-full p-8 text-left hover:bg-slate-700 flex items-center gap-6 border-b border-slate-700 last:border-0"
                    >
                      <MapPin className="h-12 w-12 text-emerald-400" />
                      <div>
                        <p className="text-4xl font-bold text-white">{place.cityName || place.name}</p>
                        <p className="text-2xl text-slate-400 mt-2">{place.countryName} ({place.iataCode})</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {destQuery.length < 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                 <Button onClick={() => handleDestSelect({ iataCode: "LIS", cityName: "Lisboa", countryName: "Portugal" })} className="h-32 text-3xl font-bold rounded-[24px] bg-slate-800 hover:bg-emerald-600">Lisboa, Portugal (LIS)</Button>
                 <Button onClick={() => handleDestSelect({ iataCode: "GRU", cityName: "São Paulo", countryName: "Brasil" })} className="h-32 text-3xl font-bold rounded-[24px] bg-slate-800 hover:bg-emerald-600">S. Paulo, Brasil (GRU)</Button>
              </div>
            )}
          </div>
        )}

        {step === "dates" && (
          <div className="w-full max-w-4xl text-center space-y-12 animate-in slide-in-from-right duration-500">
            <h2 className="text-5xl font-bold text-white mb-8 leading-tight">Qual a data da viagem?</h2>
            <div className="flex flex-col items-center gap-8">
              <Input 
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="h-32 w-full max-w-2xl text-5xl text-center rounded-[32px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400"
              />
              <Button 
                onClick={handleDateNext}
                disabled={!travelDate}
                className="h-24 px-12 text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all"
              >
                Continuar <ArrowRight className="ml-4 h-8 w-8" />
              </Button>
            </div>
          </div>
        )}

        {step === "ask_name" && (
          <div className="w-full max-w-2xl animate-in slide-in-from-right duration-500">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center border-4 border-blue-500/30">
                <User className="h-12 w-12" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6 text-center leading-tight">
              Para a sua passagem, preencha o seu nome:
            </h2>
            <div className="flex flex-col gap-6">
              <Input 
                type="text"
                placeholder="Primeiro Nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-24 text-3xl sm:text-4xl text-center rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-400"
              />
              <Input 
                type="text"
                placeholder="Sobrenome"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-24 text-3xl sm:text-4xl text-center rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-400"
              />
              <Button 
                onClick={handleNameNext}
                disabled={!firstName || !lastName}
                className="h-24 text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full mt-4 shadow-[0_0_40px_rgba(37,99,235,0.3)]"
              >
                Continuar <ArrowRight className="ml-4 h-8 w-8" />
              </Button>
            </div>
          </div>
        )}

        {step === "ask_dob" && (
          <div className="w-full max-w-3xl animate-in slide-in-from-right duration-500">
            <h2 className="text-4xl font-bold text-white mb-6 text-center leading-tight">
              Sua data de nascimento:
            </h2>
            <div className="flex gap-4">
              <Input 
                type="number"
                placeholder="Dia"
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                className="h-24 w-1/4 text-4xl text-center rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400"
              />
              <Input 
                type="number"
                placeholder="Mês"
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                className="h-24 w-1/4 text-4xl text-center rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400"
              />
              <Input 
                type="number"
                placeholder="Ano"
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                className="h-24 w-1/2 text-4xl text-center rounded-[24px] border-4 border-slate-600 bg-slate-800 text-white focus:border-blue-400"
              />
            </div>
            <Button 
              onClick={handleDobNext}
              disabled={!dobDay || !dobMonth || !dobYear || dobYear.length < 4}
              className="w-full h-24 text-3xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full mt-8 shadow-[0_0_40px_rgba(37,99,235,0.3)]"
            >
              Pesquisar Passagens <ArrowRight className="ml-4 h-8 w-8" />
            </Button>
          </div>
        )}

        {step === "searching" && (
          <div className="w-full max-w-2xl text-center space-y-12 animate-in zoom-in duration-500">
            <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-8 border-blue-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-4 border-8 border-blue-500/40 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute inset-8 border-8 border-blue-500/60 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
              <Plane className="h-20 w-20 text-blue-400 animate-pulse relative z-10" />
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Buscando passagem aérea ideal para {destIata}...
            </h2>
            <p className="text-2xl text-slate-400">
              Estamos validando a disponibilidade real com seu nome e datas escolhidas. Não saia desta tela.
            </p>
          </div>
        )}

        {step === "offer" && selectedFlight && (
          <div className="w-full max-w-4xl text-center space-y-8 animate-in slide-in-from-bottom duration-700">
            <h2 className="text-5xl font-bold text-white leading-tight">Encontramos o voo ideal para você.</h2>
            <div className="bg-slate-800 rounded-[40px] p-10 border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)] text-left flex flex-col gap-8">
              
              <div className="flex justify-between items-center gap-4 flex-wrap pb-4 border-b border-slate-700">
                <div>
                  <p className="text-2xl text-slate-400 font-medium">Companhia Aérea</p>
                  <p className="text-5xl font-extrabold text-white mt-1 capitalize">{selectedFlight.airline}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl text-slate-400 font-medium">Preço (Taxas inclusas)</p>
                  <p className="text-6xl font-extrabold text-emerald-400 mt-2 uppercase">{selectedFlight.currency} {selectedFlight.price}</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6">
                <p className="text-2xl font-bold text-white mb-4">Informações de Bagagem</p>
                <div className="scale-125 origin-top-left max-w-[80%]">
                  <FlightBaggageHighlights flight={selectedFlight} />
                </div>
              </div>

              <Button 
                onClick={createBooking}
                className="w-full h-32 text-4xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-full mt-4 shadow-xl"
              >
                Eu Quero Comprar <ArrowRight className="ml-4 h-10 w-10" />
              </Button>
            </div>
          </div>
        )}

        {step === "checkout" && bookingData && (
          <div className="w-full max-w-3xl text-center space-y-12 animate-in slide-in-from-bottom duration-500">
            <h2 className="text-5xl font-bold text-white mb-8 leading-tight">Inserir Dados do Cartão</h2>
            <div className="bg-white rounded-[40px] p-8 border-4 border-emerald-500 text-left relative overflow-hidden">
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

      <footer className="p-8 bg-slate-950 flex justify-center items-center">
        <Button variant="ghost" className="h-20 px-8 rounded-full text-xl font-bold bg-white/5 text-white hover:bg-white/10 gap-4">
          <Mic className="h-8 w-8 text-blue-400" />
          Falar em Áudio com Agente
        </Button>
      </footer>
    </div>
  );
}
