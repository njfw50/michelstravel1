import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Globe2, 
  ShieldCheck, 
  MapPin, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight
} from "lucide-react";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";

interface AdvisoryData {
  score: number;
  message: string;
  updated: string;
  source: string;
}

export default function VisaSupport() {
  const { t, language } = useI18n();

  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: (language || "pt") as any,
      topic: "Assessoria de Visto",
      details: ["Gostaria de informações sobre o processo de visto para meu próximo destino."]
    })
  );

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Vistos & Segurança Global | Michels Travel" 
        description="Consulte requisitos de visto e alertas de segurança globais em tempo real para sua viagem."
        path="/visa-support"
      />

      <section className="pt-20 pb-16 bg-slate-50/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <Badge className="bg-orange-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Security & Documentation</Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-950 tracking-tighter uppercase leading-tight mb-4">
            Vistos & <span className="text-orange-600">Segurança Global</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">
            Acesse dados reais de segurança e guias documentais verificados para cruzar fronteiras com total confiança.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
             
             {/* Safety Alerts - REAL DATA */}
             <div className="space-y-8">
                <div className="flex items-center gap-4 mb-2">
                   <ShieldCheck className="h-7 w-7 text-emerald-600" />
                   <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Status de Segurança (Live)</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <SafetyCard countryCode="BR" countryName="Brasil" />
                   <SafetyCard countryCode="US" countryName="Estados Unidos" />
                   <SafetyCard countryCode="PT" countryName="Portugal" />
                   <SafetyCard countryCode="ES" countryName="Espanha" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                   Fonte: Travel-Advisory.info (Dados atualizados diariamente)
                </p>
             </div>

             {/* Visa Guidance */}
             <div>
                <Card className="p-8 md:p-10 rounded-[40px] bg-slate-950 text-white h-full relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 opacity-10">
                      <FileText className="h-40 w-40" />
                   </div>
                   <div className="relative z-10">
                      <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Guia de Vistos 2024</h3>
                      <div className="space-y-8">
                         <div className="group cursor-pointer">
                            <h4 className="text-orange-500 font-black uppercase text-sm tracking-widest mb-2 flex items-center justify-between">
                               ESTADOS UNIDOS (B1/B2) <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                            </h4>
                            <p className="text-slate-400 text-sm leading-relaxed">Brasileiros precisam de visto consular. Validade de até 10 anos. Nossa agência presta assessoria completa no preenchimento do DS-160.</p>
                         </div>
                         <div className="group cursor-pointer">
                            <h4 className="text-blue-400 font-black uppercase text-sm tracking-widest mb-2 flex items-center justify-between">
                               EUROPA (ETIAS 2025) <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                            </h4>
                            <p className="text-slate-400 text-sm leading-relaxed">Em breve será necessária a autorização eletrônica ETIAS para brasileiros visitarem o Espaço Schengen. Fique atento às datas.</p>
                         </div>
                         <div className="group cursor-pointer">
                            <h4 className="text-emerald-400 font-black uppercase text-sm tracking-widest mb-2 flex items-center justify-between">
                               BRASIL (VIVIS) <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                            </h4>
                            <p className="text-slate-400 text-sm leading-relaxed">Americanos agora precisam de e-Visa para entrar no Brasil. Processo 100% online através do portal oficial do consulado.</p>
                         </div>
                      </div>
                   </div>
                </Card>
             </div>
          </div>

          {/* Contact Section */}
          <div className="bg-orange-50 rounded-[48px] p-12 md:p-20 text-center border border-orange-100">
             <Globe2 className="h-12 w-12 text-orange-600 mx-auto mb-8" />
             <h2 className="text-3xl md:text-5xl font-display font-black text-slate-950 tracking-tighter uppercase mb-6 leading-tight">
                Dúvida na Documentação? <br />
                <span className="text-orange-600">Nossa Equipe Resolve.</span>
              </h2>
              <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto mb-10">
                 Não arrisque sua viagem por um detalhe burocrático. Oferecemos assessoria técnica para que seu check-in seja tranquilo.
              </p>
              <a href={whatsAppHref} target="_blank" rel="noreferrer">
                 <Button className="rounded-full bg-slate-950 text-white px-12 py-8 text-sm font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-950/20">
                    Falar com Especialista de Vistos
                 </Button>
              </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function SafetyCard({ countryCode, countryName }: { countryCode: string; countryName: string }) {
  const { data, isLoading } = useQuery<AdvisoryData>({
    queryKey: [`/api/external/advisory/${countryCode}`],
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
  });

  const getStatusColor = (score: number) => {
    if (score <= 2) return "bg-emerald-500";
    if (score <= 3.5) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusText = (score: number) => {
    if (score <= 2) return "Baixo Risco";
    if (score <= 3.5) return "Risco Moderado";
    return "Consulte Restrições";
  };

  return (
    <Card className="p-6 rounded-3xl border-slate-100 bg-white shadow-sm hover:border-orange-200 transition-all group">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs">
                {countryCode}
             </div>
             <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{countryName}</span>
          </div>
          <div className={`h-2.5 w-2.5 rounded-full ${isLoading ? "bg-slate-200" : getStatusColor(data?.score || 0)}`} />
       </div>
       
       <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Score</p>
          <div className="flex items-center gap-2">
             <span className="text-2xl font-black text-slate-950 leading-none">
                {isLoading ? "--" : data?.score?.toFixed(1)}
             </span>
             <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${isLoading ? "bg-slate-100 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                {isLoading ? "Loading" : getStatusText(data?.score || 0)}
             </span>
          </div>
       </div>
    </Card>
  );
}
