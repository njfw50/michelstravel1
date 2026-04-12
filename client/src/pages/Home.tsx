import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useFeaturedDeals } from "@/hooks/use-flights";
import { useAirlines, useFeaturedAirports } from "@/hooks/use-flights";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { DealCard } from "@/components/DealCard";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  ArrowRight, 
  ShieldCheck, 
  Navigation, 
  Sparkles, 
  Globe2, 
  Phone, 
  Clock, 
  CheckCircle2,
  Calendar,
  MessageCircle,
  HelpCircle,
  TrendingUp,
  MapPin
} from "lucide-react";
import { motion } from "framer-motion";
import { buildWhatsAppHref, buildWhatsAppMessage, AGENCY_WHATSAPP_DISPLAY } from "@/lib/contact";
import { openChatbotAssistant } from "@/lib/chatbot";

export default function Home() {
  const { data: airlines } = useAirlines(20);
  const { data: airports } = useFeaturedAirports();
  const { t, language } = useI18n();
  const { data: catalogDeals = [], isLoading: dealsLoading } = useFeaturedDeals(language);
  const [, setLocation] = useLocation();

  const airlineCount = airlines?.length || 0;
  
  const contactWhatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language,
      topic: language === "en" ? "Flight Inquiry" : language === "es" ? "Consulta de Vuelo" : "Consulta de Vôo",
      details: ["Página: Home / Hero"]
    })
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Michels Travel",
    "image": "https://michelstravel.agency/favicon.png",
    "description": t("hero.subtitle"),
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Newark",
      "addressRegion": "NJ",
      "addressCountry": "US"
    },
    "telephone": AGENCY_WHATSAPP_DISPLAY,
    "url": "https://michelstravel.agency"
  };

  return (
    <div className="bg-[#fcfdff] text-slate-900 font-sans">
      <SEO
        title="Agência de Viagens Newark & Ironbound | Michels Travel"
        description="A maior agência de passagens aéreas para brasileiros em Newark e Ironbound. Suporte humano 24h e integridade linguística garantida."
        path="/"
        structuredData={structuredData}
      />

      {/* --- REFORMED HERO: SEARCH FIRST DESIGN --- */}
      <section className="relative pt-6 pb-20 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[50%] h-[600px] bg-gradient-to-bl from-blue-50/40 to-transparent pointer-events-none rounded-bl-[200px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          
          <div className="flex flex-col gap-8">
            
            {/* 1. TOP HEADER INFO (Compact) */}
            <div className="flex flex-wrap items-center justify-between gap-4">
               <div className="flex flex-col gap-1">
                  <Badge variant="outline" className="w-fit bg-blue-50/50 border-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <ShieldCheck className="h-3 w-3 mr-1.5" />
                    Integridade Linguística Ativa ({language?.toUpperCase()})
                  </Badge>
                  <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-slate-950">
                    Sua Agência em <span className="text-blue-600">Newark & Ironbound</span>
                  </h1>
               </div>
               
               <div className="hidden md:flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Suporte 24h</p>
                      <p className="text-sm font-bold text-slate-950">{AGENCY_WHATSAPP_DISPLAY}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Globe2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Sessão Segura</p>
                      <p className="text-sm font-bold text-blue-600">Encriptado SSL</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* 2. MAIN SEARCHER (The Centerpiece) */}
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="relative"
            >
              {/* Floating Badge for Search */}
              <div className="absolute -top-4 left-8 z-20">
                <div className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg shadow-blue-600/30">
                  <Plane className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Encontre seu próximo voo</span>
                </div>
              </div>

              {/* Search Form Container */}
              <div className="rounded-[32px] md:rounded-[40px] border border-slate-100 bg-white shadow-[0_50px_100px_-20px_rgba(15,23,42,0.1)] p-6 md:p-10 pt-12 relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/30 to-transparent pointer-events-none" />
                
                <FlightSearchForm 
                  onSearch={(params) => {
                    const searchParams = new URLSearchParams();
                    Object.entries(params).forEach(([key, value]) => {
                      if (value) searchParams.append(key, String(value));
                    });
                    setLocation(`/search?${searchParams.toString()}`);
                  }}
                />

                <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-slate-50 pt-8">
                  <div className="flex items-center gap-8">
                     <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm font-bold text-slate-600 italic">Preço Garantido</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm font-bold text-slate-600 italic">Suporte Humano</span>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <p className="text-xs font-bold text-slate-400 mr-2">MAIS DE {airlineCount}+ CIAS AÉREAS:</p>
                     <div className="flex -space-x-3 opacity-60 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                        {airlines?.slice(0, 5).map((airline) => (
                          <div key={airline.id} className="h-10 w-10 rounded-full border-4 border-white bg-slate-50 flex items-center justify-center p-1 overflow-hidden" title={airline.name}>
                            {airline.logoUrl ? (
                              <img src={airline.logoUrl} alt={airline.name} className="h-full w-full object-contain" />
                            ) : (
                              <Plane className="h-4 w-4 text-slate-300" />
                            )}
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. QUICK LINKS / FEATURES (Bottom of block) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <motion.div 
                 whileHover={{ y: -5 }}
                 className="group p-6 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer"
                 onClick={() => setLocation("/senior")}
               >
                 <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <HelpCircle className="h-6 w-6" />
                 </div>
                 <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-2">Modo Sênior</h3>
                 <p className="text-sm text-slate-500 font-medium">Atendimento especializado e interface simplificada para viajantes experientes.</p>
               </motion.div>

               <motion.div 
                 whileHover={{ y: -5 }}
                 className="group p-6 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer"
                 onClick={() => openChatbotAssistant({ message: "Quero ajuda para planejar minha viagem.", autoSend: true })}
               >
                 <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <Sparkles className="h-6 w-6" />
                 </div>
                 <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-2">Consultoria IA</h3>
                 <p className="text-sm text-slate-500 font-medium">Nossa IA Mia ajuda você a encontrar as melhores rotas e conexões em segundos.</p>
               </motion.div>

               <motion.div 
                 whileHover={{ y: -5 }}
                 className="group p-6 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer"
                 onClick={() => setLocation("/messages")}
               >
                 <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <MessageCircle className="h-6 w-6" />
                 </div>
                 <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-2">Chat ao Vivo</h3>
                 <p className="text-sm text-slate-500 font-medium">Dúvidas sobre sua reserva? Fale com nossos especialistas no Ironbound.</p>
               </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FEATURED DEALS SECTION (Language Integrant) --- */}
      <section className="bg-slate-50 py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <Badge className="bg-blue-600/10 text-blue-700 hover:bg-blue-600/10 rounded-full px-4 py-1 mb-4 text-[10px] uppercase font-black tracking-widest">
                <TrendingUp className="h-3 w-3 mr-2" />
                Destaques da Semana
              </Badge>
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-950 tracking-tighter leading-none mb-4 uppercase">
                Ofertas Exclusivas <br />
                <span className="text-blue-600">para sua Língua</span>
              </h2>
              <p className="text-slate-500 font-medium">Curadoria manual de passagens saindo dos EUA para destinos selecionados com o melhor custo-benefício.</p>
            </div>
            <Link href="/search" className="group hidden md:flex items-center gap-2 text-blue-600 font-bold hover:underline">
               Ver todas as ofertas <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dealsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-3xl bg-slate-200 animate-pulse" />
              ))
            ) : catalogDeals.length > 0 ? (
              catalogDeals.map((deal) => (
                <DealCard 
                  key={deal.id} 
                  deal={{
                    ...deal,
                    title: `${deal.origin_city} para ${deal.destination_city}`,
                    description: deal.headline || deal.description,
                    imageUrl: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800` // Placeholder for localized feel
                  }} 
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                 <MapPin className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                 <p className="text-slate-400 font-medium">Nenhuma oferta disponível para o idioma selecionado no momento.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-blue-600 py-16 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <Globe2 className="h-[600px] w-[600px] absolute -bottom-48 -right-48" />
         </div>
         <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-white">
               <div className="max-w-2xl text-center md:text-left">
                  <h2 className="text-4xl font-display font-black tracking-tighter uppercase mb-4 leading-tight">
                    Pronto para <br />
                    sua próxima aventura?
                  </h2>
                  <p className="text-blue-100 text-lg font-medium opacity-90">Junte-se a milhares de brasileiros que viajam com segurança e suporte total da Michels Travel.</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <a 
                    href={contactWhatsAppHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-16 items-center justify-center gap-3 rounded-full bg-white px-10 text-lg font-black text-blue-600 shadow-2xl hover:bg-blue-50 transition-all outline-none"
                  >
                    Falar com Agente <MessageCircle className="h-6 w-6" />
                  </a>
                  <Button 
                    variant="outline"
                    className="h-16 rounded-full border-white/30 bg-white/10 px-10 text-lg font-bold text-white hover:bg-white/20 outline-none backdrop-blur-md"
                    onClick={() => setLocation("/senior")}
                  >
                    Conhecer Plano Sênior
                  </Button>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
