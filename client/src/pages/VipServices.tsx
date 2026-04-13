import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  Coffee, 
  Wifi, 
  Armchair, 
  UserCheck, 
  Star,
  CheckCircle2,
  PhoneCall
} from "lucide-react";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";

export default function VipServices() {
  const { t, language } = useI18n();

  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: (language || "pt") as any,
      topic: "Serviços VIP e Salas VIP",
      details: ["Gostaria de saber mais sobre acesso a salas VIP e serviços de concierge."]
    })
  );

  const lounges = [
    {
      name: "Espaço Banco Safra",
      location: "Guarulhos (GRU) - Terminal 3",
      amenities: ["Open Bar", "Buffet Quente", "Duchas", "Business Center"],
      access: "Priority Pass, LoungeKey, Primeira Classe"
    },
    {
      name: "The Centurion Lounge",
      location: "New York (JFK) - Terminal 4",
      amenities: ["Spa", "Fine Dining", "Área Kids", "Wi-Fi Premium"],
      access: "Amex Platinum, Centurion"
    },
    {
      name: "TAP Premium Lounge",
      location: "Lisboa (LIS) - Terminal 1",
      amenities: ["Culinária Portuguesa", "Área de Descanso", "Vinhos Selecionados"],
      access: "Star Alliance Gold, Executiva TAP"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Serviços VIP & Salas VIP | Michels Travel" 
        description="Eleve sua experiência de viagem com acesso a lounges exclusivos e serviços de concierge personalizados."
        path="/vip-services"
      />

      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <Badge className="bg-amber-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Executivo & Luxo</Badge>
            <h1 className="text-4xl md:text-7xl font-display font-black tracking-tighter uppercase leading-[0.9] mb-8 text-white">
              Sua Viagem em <br />
              <span className="text-amber-500">Primeira Classe</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mb-12">
              Transformamos o tempo de espera no aeroporto em um momento de puro relaxamento e produtividade. Conheça nossa curadoria de salas VIP e serviços exclusivos.
            </p>
            <div className="flex flex-wrap gap-4">
               <a href={whatsAppHref} target="_blank" rel="noreferrer">
                  <Button className="rounded-full bg-amber-500 text-black px-12 py-8 text-sm font-black uppercase tracking-widest hover:bg-amber-600 shadow-xl shadow-amber-500/20">
                    Solicitar Acesso VIP <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
               </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20">
             <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-4">Salas VIP em Destaque</h2>
             <p className="text-slate-500 font-medium">Os lounges mais prestigiados nos hubs que você frequenta.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {lounges.map((lounge, i) => (
               <Card key={i} className="p-8 rounded-[40px] border-slate-100 hover:shadow-2xl transition-all duration-500 group">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="h-10 w-10 rounded-xl bg-slate-950 text-white flex items-center justify-center">
                        <Armchair className="h-5 w-5" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">{lounge.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lounge.location}</p>
                     </div>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                     {lounge.amenities.map((item, idx) => (
                       <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          {item}
                       </div>
                     ))}
                  </div>

                  <div className="pt-6 border-t border-slate-50">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Quem Acessa:</p>
                     <p className="text-xs font-bold text-slate-700">{lounge.access}</p>
                  </div>
               </Card>
             ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
         <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
               <div className="space-y-8">
                  <h2 className="text-3xl md:text-5xl font-display font-black tracking-tighter uppercase leading-tight text-slate-950">
                    Concierge <br />
                    <span className="text-blue-600">Meet & Greet</span>
                  </h2>
                  <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    Não se preocupe com filas ou burocracia. Nosso serviço de Meet & Greet oferece um assistente pessoal que o aguarda na porta do avião e o conduz por todos os processos de imigração e bagagem com prioridade total.
                  </p>
                  <ul className="space-y-4">
                     {[
                       "Acompanhamento personalizado em cada etapa.",
                       "Fast-track em raio-x e imigração.",
                       "Assistência com bagagem pesada.",
                       "Coordenação de transporte privado na saída."
                     ].map((item, i) => (
                       <li key={i} className="flex items-center gap-3 font-bold text-slate-700 text-sm italic">
                          <Star className="h-4 w-4 text-amber-500" /> {item}
                       </li>
                     ))}
                  </ul>
               </div>
               <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 text-center">
                  <PhoneCall className="h-12 w-12 text-blue-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight mb-4">Atendimento Premium</h3>
                  <p className="text-slate-500 mb-10 font-medium">Nossa equipe VIP está disponível 24h para garantir que cada detalhe da sua chegada seja impecável.</p>
                  <a href={whatsAppHref} target="_blank" rel="noreferrer" className="w-full">
                     <Button className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800 h-20 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10">
                        Acionar Concierge VIP
                     </Button>
                  </a>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
