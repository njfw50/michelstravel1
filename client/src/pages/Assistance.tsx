import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Accessibility, 
  Stethoscope, 
  Utensils, 
  ShieldCheck, 
  Heart,
  ChevronRight,
  HandHelping,
  Ambulance,
  PhoneCall,
  ShieldAlert,
  Globe
} from "lucide-react";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
import { useState, useEffect } from "react";

function TravelAdvisory() {
  const [advisory, setAdvisory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://www.travel-advisory.info/api?countrycode=BR")
      .then(res => res.json())
      .then(data => {
        setAdvisory(data.data.BR);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !advisory) return null;

  return (
    <Card className="p-8 rounded-[40px] bg-amber-50 border-amber-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-black text-amber-900 uppercase tracking-tight">Status de Segurança: Brasil</h4>
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Fonte: Travel Advisory (Real-Time)</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
         <div className="text-4xl font-black text-amber-600">{advisory.advisory.score.toFixed(1)}</div>
         <p className="text-sm text-amber-800 font-medium leading-tight">
           {advisory.advisory.message}
         </p>
      </div>
    </Card>
  );
}

export default function Assistance() {
  const { t, language } = useI18n();

  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: (language || "pt") as any,
      topic: "Assistência Especial e Médica",
      details: ["Necessito de suporte especial (cadeira de rodas/oxigênio/dieta) para minha viagem."]
    })
  );

  const services = [
    {
      icon: Accessibility,
      title: "Mobilidade Reduzida",
      desc: "Solicitação de cadeiras de rodas, auxílio no embarque/desembarque e transporte de equipamentos próprios de mobilidade.",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: Stethoscope,
      title: "Oxigênio & Suporte Médico",
      desc: "Coordenação de transporte de cilindros de oxigênio portáteis (POC) e autorizações médicas (MEDIF) junto às companhias.",
      color: "text-red-600 bg-red-50"
    },
    {
      icon: Utensils,
      title: "Dietas Especiais",
      desc: "Reserva de refeições especiais a bordo: dietas para diabéticos, baixa em sódio, sem glúten ou restrições religiosas.",
      color: "text-emerald-600 bg-emerald-50"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Assistência Especial & Médica | Michels Travel" 
        description="Suporte completo para passageiros com necessidades especiais, mobilidade reduzida ou requisitos médicos."
        path="/assistance"
      />

      <section className="pt-20 pb-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                 <Badge className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Suporte Humanizado</Badge>
                 <h1 className="text-4xl md:text-6xl font-display font-black text-slate-950 tracking-tighter uppercase leading-[0.9] mb-8">
                   Cuidado que <br />
                   <span className="text-emerald-600">Não Tem Fronteiras</span>
                 </h1>
                 <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mb-10">
                   Garantimos que cada detalhe da sua saúde e conforto seja respeitado pelas companhias aéreas. Nossa equipe técnica cuida de toda a burocracia médica para você.
                 </p>
                 <div className="flex gap-4">
                    <a href={whatsAppHref} target="_blank" rel="noreferrer">
                       <Button className="rounded-full bg-emerald-600 text-white px-10 py-7 text-sm font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20">
                          Solicitar Assistência <HandHelping className="ml-2 h-5 w-5" />
                       </Button>
                    </a>
                 </div>
              </motion.div>
              <div className="relative hidden lg:block">
                 <div className="aspect-square bg-emerald-100 rounded-[80px] rotate-3 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center -rotate-3">
                       <Heart className="h-40 w-40 text-emerald-500/20 animate-pulse" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-4">Recursos de Acessibilidade</h2>
              <p className="text-slate-500 font-medium">Serviços técnicos operados diretamente com as bases aeroportuárias.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {services.map((service, i) => (
                <Card key={i} className="p-8 rounded-[40px] border-slate-100 hover:border-emerald-200 transition-all group cursor-pointer">
                   <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${service.color}`}>
                      <service.icon className="h-7 w-7" />
                   </div>
                   <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-4">{service.title}</h3>
                   <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6">{service.desc}</p>
                   <ChevronRight className="h-5 w-5 text-emerald-500 group-hover:translate-x-2 transition-transform" />
                </Card>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <Card className="p-10 rounded-[40px] bg-slate-100 border-none">
                 <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight mb-6 flex items-center gap-3">
                    <ShieldCheck className="h-7 w-7 text-blue-600" />
                    Protocolo MEDIF
                 </h3>
                 <p className="text-slate-600 font-medium leading-relaxed mb-8">
                    O Formulário de Informação Médica (MEDIF) é obrigatório para passageiros que necessitem de oxigênio, maca ou que possuam condições médicas instáveis. Nós guiamos seus médicos no preenchimento correto para evitar recusas de embarque.
                 </p>
                 <Badge className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-4 py-1">Suporte Técnico Especializado</Badge>
              </Card>

              <Card className="p-10 rounded-[40px] bg-slate-950 text-white border-none shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <PhoneCall className="h-8 w-8 text-emerald-400" />
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1 text-white">Linha de Cuidado</h3>
                       <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Atendimento de Emergência</p>
                    </div>
                  </div>
                 <p className="text-slate-400 font-medium leading-relaxed mb-10">
                    Seu bem-estar é nossa prioridade. Em caso de necessidade de última hora no aeroporto, nossa linha exclusiva de concierge médico está a um clique de distância.
                 </p>
                 <a href={whatsAppHref} target="_blank" rel="noreferrer">
                    <Button className="w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 h-16 font-black text-xs uppercase tracking-widest">
                       Falar com Concierge Médico
                    </Button>
                 </a>
              </Card>
           </div>
           
           <div className="max-w-3xl mx-auto">
              <TravelAdvisory />
           </div>
        </div>
      </section>
    </div>
  );
}
