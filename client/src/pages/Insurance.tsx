import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ShieldCheck, 
  HeartPulse, 
  Briefcase, 
  Plane, 
  Clock, 
  CheckCircle2,
  MessageCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";

export default function Insurance() {
  const { t, language } = useI18n();

  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: (language || "pt") as any,
      topic: "Cotação de Seguro Viagem",
      details: ["Gostaria de receber uma cotação de seguro viagem para meu próximo destino."]
    })
  );

  const benefits = [
    {
      icon: HeartPulse,
      title: "Assistência Médica 24h",
      desc: "Cobertura completa para emergências médicas, hospitalares e odontológicas durante toda a viagem.",
      color: "bg-red-50 text-red-600"
    },
    {
      icon: Briefcase,
      title: "Extravio de Bagagem",
      desc: "Indenização e suporte imediato em caso de perda, roubo ou danos à sua bagagem.",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: ShieldCheck,
      title: "Cancelamento de Viagem",
      desc: "Proteção financeira caso precise cancelar ou interromper sua viagem por motivos de força maior.",
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      icon: Plane,
      title: "Atraso de Voo",
      desc: "Auxílio alimentação e hotel em casos de atrasos prolongados causados pela companhia aérea.",
      color: "bg-amber-50 text-amber-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Seguro Viagem Boutique | Michels Travel" 
        description="Proteção completa para sua viagem. Especialistas em assistência para o público sênior e viagens internacionais."
        path="/insurance"
      />

      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 rounded-bl-[200px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Michels Protection</Badge>
              <h1 className="text-4xl md:text-6xl font-display font-black text-slate-950 tracking-tighter uppercase leading-[0.9] mb-8">
                Viaje com a mente <br />
                <span className="text-blue-600">Totalmente Tranquila</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mb-10">
                Mais do que um seguro, oferecemos uma rede de proteção ativa. Especialmente desenhado para quem prioriza segurança, conforto e suporte 24h em português.
              </p>
              <div className="flex flex-wrap gap-4">
                 <a href={whatsAppHref} target="_blank" rel="noreferrer">
                    <Button className="rounded-full bg-blue-600 px-10 py-7 text-sm font-black uppercase tracking-widest text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20">
                      Solicitar Cotação <MessageCircle className="ml-2 h-5 w-5" />
                    </Button>
                 </a>
                 <Button variant="outline" className="rounded-full px-10 py-7 text-sm font-black uppercase tracking-widest border-slate-200">
                    Ver Planos <FileText className="ml-2 h-5 w-5" />
                 </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-4">Coberturas Essenciais</h2>
             <p className="text-slate-500 font-medium">Proteção desenhada para atender as necessidades reais do viajante moderno.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full p-8 rounded-[32px] border-slate-100 hover:border-blue-200 transition-all group">
                   <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${benefit.color}`}>
                      <benefit.icon className="h-7 w-7" />
                   </div>
                   <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-4">{benefit.title}</h3>
                   <p className="text-sm text-slate-500 leading-relaxed font-medium">{benefit.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-950 text-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div>
                <Badge className="bg-amber-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Diferencial Boutique</Badge>
                <h2 className="text-3xl md:text-5xl font-display font-black tracking-tighter uppercase leading-tight mb-8">
                  Por que escolher o seguro Michels Travel?
                </h2>
                <div className="space-y-6">
                   {[
                     "Atendimento emergencial 100% em português em qualquer lugar.",
                     "Planos específicos para passageiros acima de 70 anos.",
                     "Telemedicina inclusa para atendimentos rápidos por vídeo.",
                     "Rede hospitalar credenciada nas principais cidades do mundo.",
                     "Suporte da nossa equipe para acionar o seguro se necessário."
                   ].map((item, i) => (
                     <div key={i} className="flex items-start gap-4">
                        <CheckCircle2 className="h-6 w-6 text-amber-500 mt-1" />
                        <p className="text-lg font-medium text-slate-300">{item}</p>
                     </div>
                   ))}
                </div>
             </div>
             <div className="relative">
                <div className="rounded-[40px] bg-white/5 border border-white/10 p-10 backdrop-blur-xl">
                   <div className="flex items-center gap-4 mb-8">
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                      <h3 className="text-xl font-black uppercase tracking-tight">Precisa de Ajuda Agora?</h3>
                   </div>
                   <p className="text-slate-400 mb-10 leading-relaxed font-medium">
                     Nossos consultores estão prontos para analisar seu roteiro e sugerir o plano com o melhor custo-benefício e cobertura adequada para sua idade e destino.
                   </p>
                   <a href={whatsAppHref} target="_blank" rel="noreferrer" className="block">
                      <Button className="w-full rounded-2xl bg-amber-500 text-black hover:bg-amber-600 h-16 font-black text-xs uppercase tracking-widest transition-all">
                        Falar com Consultor via WhatsApp
                      </Button>
                   </a>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
