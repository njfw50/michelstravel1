import { MessageSquare, Headset, Zap, ShieldCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { openChatbotAssistant } from "@/lib/chatbot";
import { useI18n } from "@/lib/i18n";

export function ConciergePromo() {
  const { t } = useI18n();

  return (
    <section className="py-20 bg-[#07132d] overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <Badge className="bg-white/10 text-blue-300 border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                Midnight Concierge
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1]">
                Acompanhamento <span className="text-blue-500">Humano</span> em cada escala.
              </h2>
              <p className="text-lg text-blue-100/70 leading-relaxed max-w-xl">
                Não somos apenas uma plataforma de busca. Somos uma agência de elite disponível 24h no seu WhatsApp para garantir que nenhum imprevisto interrompa seu descanso.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, title: "Proteção Ativa", desc: "Monitoramos seu voo em tempo real." },
                { icon: Zap, title: "Resposta Instantânea", desc: "Conselheiros reais em menos de 2 min." },
                { icon: Headset, title: "Suporte Multilíngue", desc: "PT, EN e ES sempre à disposição." },
                { icon: Clock, title: "Disponibilidade 24/7", desc: "Diretores da agência sempre online." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="p-2.5 bg-blue-600 rounded-2xl text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-blue-100/50 mt-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button 
                onClick={() => openChatbotAssistant()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-7 text-base font-black shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1"
              >
                Atendimento VIP Now
              </Button>
              <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-white/10 bg-white/5">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-[#07132d] bg-emerald-500 flex items-center justify-center text-[10px] font-bold">M</div>
                  <div className="h-8 w-8 rounded-full border-2 border-[#07132d] bg-blue-500 flex items-center justify-center text-[10px] font-bold">L</div>
                </div>
                <div className="text-xs font-bold text-white">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Diretores Online
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
              <div className="relative rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Concierge Digital</h3>
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Ativo em Newark, New Jersey</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Live</Badge>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-blue-900 border border-blue-500/30 shrink-0" />
                    <div className="p-4 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 text-sm text-blue-100/90 leading-relaxed">
                      Olá! Sou a Mia. Encontrei uma conexão direta para Lisboa com 15% de desconto via TAP. Deseja que um diretor revise a tarifa para você?
                    </div>
                  </div>
                  <div className="flex gap-4 justify-end">
                    <div className="p-4 rounded-2xl rounded-tr-none bg-blue-600 text-sm text-white font-bold">
                      Sim, por favor! E verifique a bagagem inclusa.
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border border-white/20 shrink-0" />
                    <div className="p-4 rounded-2xl rounded-tl-none bg-white/10 border border-white/20 text-sm text-white font-medium">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase bg-blue-600 px-1.5 py-0.5 rounded">Agente Michel</span>
                      </div>
                      Tarifa revisada. Consegui isenção da segunda mala para esta reserva. Podemos emitir?
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3 pt-6 border-t border-white/5">
                  <div className="h-10 grow rounded-2xl bg-white/5 border border-white/10 px-4 flex items-center text-blue-100/30 text-xs">
                    Sua mensagem...
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
