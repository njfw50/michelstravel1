import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Plane, Calendar, CheckCircle2, Loader2, CreditCard, Mic, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type FlowStep = "auth" | "greeting" | "origin" | "destination" | "dates" | "searching" | "offer" | "checkout";

export default function SeniorTerminal() {
  const [step, setStep] = useState<FlowStep>("auth");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedDest, setSelectedDest] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  const handleLogin = () => {
    if (phoneNumber.length < 5) return;
    setStep("greeting");
    speak("Olá. Bem-vindo ao terminal de acesso rápido. Nós vamos ajudar você a comprar a sua passagem.");
  };

  const handleDest = (dest: string) => {
    setSelectedDest(dest);
    setStep("dates");
    speak(`Ótima escolha, ${dest}. Quando você deseja viajar?`);
  };

  const handleDate = (date: string) => {
    setSelectedDate(date);
    setStep("searching");
    speak("Perfeito. Nossa inteligência está procurando os melhores voos para você agora mesmo. Aguarde um momento.");
    
    // Simulate searching
    setTimeout(() => {
      setStep("offer");
      speak("Encontramos um excelente voo para você.");
    }, 4000);
  };

  const handleExit = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between font-sans selection:bg-blue-500/30">
      {/* Header Simplificado */}
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
            Sair
          </Button>
        )}
      </header>

      {/* Conteúdo Dinâmico */}
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
                Entrar <ArrowRight className="ml-4 h-8 w-8" />
              </Button>
            </div>
            <p className="text-slate-500 text-center text-xl mt-8">Não precisa de senha.</p>
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
                setStep("destination");
                speak("Para onde você quer viajar?");
              }}
              className="w-full h-32 text-4xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-[32px] mt-12 shadow-[0_0_60px_rgba(16,185,129,0.3)]"
            >
              Comprar Passagem
            </Button>
          </div>
        )}

        {step === "destination" && (
          <div className="w-full max-w-4xl text-center space-y-12 animate-in slide-in-from-right duration-500">
            <h2 className="text-5xl font-bold text-white mb-8 leading-tight">Para onde você quer viajar?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button onClick={() => handleDest("Portugal")} className="h-48 rounded-3xl bg-slate-800 hover:bg-blue-600 border-4 border-slate-700 hover:border-blue-400 flex flex-col gap-4 text-4xl font-bold text-white transition-all">
                <span className="text-6xl">🇵🇹</span> Portugal
              </Button>
              <Button onClick={() => handleDest("Brasil")} className="h-48 rounded-3xl bg-slate-800 hover:bg-emerald-600 border-4 border-slate-700 hover:border-emerald-400 flex flex-col gap-4 text-4xl font-bold text-white transition-all">
                <span className="text-6xl">🇧🇷</span> Brasil
              </Button>
              <Button onClick={() => handleDest("Flórida (EUA)")} className="h-48 rounded-3xl bg-slate-800 hover:bg-purple-600 border-4 border-slate-700 hover:border-purple-400 flex flex-col gap-4 text-4xl font-bold text-white transition-all">
                <span className="text-6xl">🎢</span> Flórida (EUA)
              </Button>
              <Button onClick={() => handleDest("Outro destino")} className="h-48 rounded-3xl bg-slate-800 hover:bg-orange-600 border-4 border-slate-700 hover:border-orange-400 flex flex-col gap-4 text-4xl font-bold text-white transition-all">
                <span className="text-5xl">🌍</span> Outro Lugar
              </Button>
            </div>
          </div>
        )}

        {step === "dates" && (
          <div className="w-full max-w-4xl text-center space-y-12 animate-in slide-in-from-right duration-500">
            <h2 className="text-5xl font-bold text-white mb-8 leading-tight">Quando você deseja ir para {selectedDest}?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button onClick={() => handleDate("Próxima Semana")} className="h-48 rounded-3xl bg-slate-800 hover:bg-indigo-600 border-4 border-slate-700 hover:border-indigo-400 flex flex-col gap-4 text-4xl font-bold text-white transition-all">
                <Calendar className="h-16 w-16 text-indigo-400" /> Próxima Semana
              </Button>
              <Button onClick={() => handleDate("Próximo Mês")} className="h-48 rounded-3xl bg-slate-800 hover:bg-indigo-600 border-4 border-slate-700 hover:border-indigo-400 flex flex-col gap-4 text-4xl font-bold text-white transition-all">
                <Calendar className="h-16 w-16 text-indigo-400" /> Próximo Mês
              </Button>
              <Button onClick={() => handleDate("Daqui a 3 meses")} className="h-48 rounded-3xl bg-slate-800 hover:bg-indigo-600 border-4 border-slate-700 hover:border-indigo-400 flex flex-col gap-4 text-4xl font-bold text-white transition-all">
                <Calendar className="h-16 w-16 text-indigo-400" /> Daqui a 3 meses
              </Button>
              <Button onClick={() => handleDate("Ainda não sei")} className="h-48 rounded-3xl bg-slate-800 hover:bg-indigo-600 border-4 border-slate-700 hover:border-indigo-400 flex flex-col gap-4 text-4xl font-bold text-white transition-all">
                <Calendar className="h-16 w-16 text-indigo-400" /> Data Flexível
              </Button>
            </div>
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
              Buscando passagem aérea ideal para {selectedDest}...
            </h2>
            <p className="text-2xl text-slate-400">
              Nossa equipe digital está comparando todas as companhias aéreas confiáveis para a data: {selectedDate}.
            </p>
          </div>
        )}

        {step === "offer" && (
          <div className="w-full max-w-4xl text-center space-y-12 animate-in slide-in-from-bottom duration-700">
            <h2 className="text-5xl font-bold text-white mb-8 leading-tight">Encontramos o voo ideal para você.</h2>
            <div className="bg-slate-800 rounded-[40px] p-12 border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)] text-left flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl text-slate-400 font-medium">Destino</p>
                  <p className="text-6xl font-extrabold text-white mt-2">{selectedDest}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl text-slate-400 font-medium">Melhor Preço</p>
                  <p className="text-6xl font-extrabold text-emerald-400 mt-2">US$ 450</p>
                </div>
              </div>
              <div className="h-1 bg-slate-700 w-full rounded-full"></div>
              <div className="flex gap-4 items-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <p className="text-3xl text-white">Voo direto, com bagagem inclusa e ótimo horário.</p>
              </div>
              <Button 
                onClick={() => {
                  setStep("checkout");
                  speak("Excelente. Para confirmar sua compra, insira os dados do cartão.");
                }}
                className="w-full h-32 text-4xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-full mt-4 shadow-xl"
              >
                Eu Quero Comprar <ArrowRight className="ml-4 h-10 w-10" />
              </Button>
            </div>
          </div>
        )}

        {step === "checkout" && (
          <div className="w-full max-w-3xl text-center space-y-12 animate-in slide-in-from-bottom duration-500">
            <h2 className="text-5xl font-bold text-white mb-8 leading-tight">Pagamento Seguro</h2>
            <div className="bg-slate-800 rounded-[40px] p-12 border-4 border-slate-700 text-left flex flex-col gap-8">
              <div className="space-y-4">
                <label className="text-3xl font-medium text-white block">Número do Cartão de Crédito</label>
                <div className="flex items-center bg-slate-900 border-4 border-slate-600 rounded-2xl px-4 focus-within:border-blue-500 transition-colors">
                  <CreditCard className="h-10 w-10 text-slate-400 ml-2" />
                  <Input 
                    type="tel"
                    placeholder="0000 0000 0000 0000"
                    className="h-24 text-4xl border-0 bg-transparent text-white px-6 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-3xl font-medium text-white block">Validade</label>
                  <Input 
                    type="tel"
                    placeholder="MM/AA"
                    className="h-24 text-4xl rounded-2xl border-4 border-slate-600 bg-slate-900 text-white px-8"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-3xl font-medium text-white block">Cód. Segurança</label>
                  <Input 
                    type="tel"
                    placeholder="123"
                    className="h-24 text-4xl rounded-2xl border-4 border-slate-600 bg-slate-900 text-white px-8"
                  />
                </div>
              </div>
              <Button 
                onClick={() => {
                  speak("Compra confirmada com sucesso! Uma cópia da sua passagem vai chegar no seu celular em instantes.");
                  toast({
                    title: "Compra Confirmada!",
                    description: "Reserva estilo 'Caixa Eletrônico' gerada com sucesso."
                  });
                  setTimeout(() => setLocation("/"), 4500);
                }}
                className="w-full h-32 text-4xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-full mt-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
              >
                Confirmar Compra
              </Button>
            </div>
          </div>
        )}

      </main>

      {/* Footer Fixo Simplificado */}
      <footer className="p-8 bg-slate-950 flex justify-center items-center">
        <Button variant="ghost" className="h-20 px-8 rounded-full text-xl font-bold bg-white/5 text-white hover:bg-white/10 gap-4">
          <Mic className="h-8 w-8 text-blue-400" />
          Falar com Atendente de Voz
        </Button>
      </footer>
    </div>
  );
}
