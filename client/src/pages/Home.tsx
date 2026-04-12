import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useFeaturedDeals } from "@/hooks/use-flights";
import { useAirlines, useFeaturedAirports } from "@/hooks/use-flights";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { DealCard } from "@/components/DealCard";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plane, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Globe2, 
  MessageCircle,
  Clock,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Calendar,
  CloudSun,
  Banknote,
  Navigation,
  Info,
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
import { openChatbotAssistant } from "@/lib/chatbot";
import type { ContactLanguage } from "@/lib/contact";

const getDestinationImage = (iata?: string) => {
  if (!iata) return "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?q=80&w=800&auto=format&fit=crop";
  const code = iata.toUpperCase();
  const mapping: Record<string, string> = {
    "GIG": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800&auto=format&fit=crop",
    "SDU": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800&auto=format&fit=crop",
    "GRU": "https://images.unsplash.com/photo-1543059152-4293e3a84ed2?q=80&w=800&auto=format&fit=crop",
    "CGH": "https://images.unsplash.com/photo-1543059152-4293e3a84ed2?q=80&w=800&auto=format&fit=crop",
    "MCO": "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=800&auto=format&fit=crop",
    "LIS": "https://images.unsplash.com/photo-1525207934214-58e69a8f8a3e?q=80&w=800&auto=format&fit=crop",
    "CDG": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
    "EWR": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop",
    "NYC": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop",
    "MIA": "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?q=80&w=800&auto=format&fit=crop",
    "REC": "https://images.unsplash.com/photo-1596162391609-843e498bdbd1?q=80&w=800&auto=format&fit=crop",
  };
  return mapping[code] || "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?q=80&w=800&auto=format&fit=crop";
};

export default function Home() {
  const { data: airlines } = useAirlines(30);
  const { data: airports } = useFeaturedAirports();
  const { t, language } = useI18n();
  const { data: catalogDeals = [], isLoading: dealsLoading } = useFeaturedDeals(language);
  const [, setLocation] = useLocation();

  const contactWhatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: (language || "pt") as ContactLanguage,
      topic: t("home.hero.whatsapp_topic"),
      details: [t("home.hero.whatsapp_details")]
    })
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600/10">
      <SEO title={t("home.search.title")} description={t("home.search.desc")} path="/" />

      {/* Hero Search Section - Professional Utility */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 right-0 w-[50%] h-[600px] bg-gradient-to-bl from-blue-600/5 via-transparent to-transparent pointer-events-none rounded-bl-[160px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-6 mb-12">
               <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <Badge variant="outline" className="bg-blue-600/5 border-blue-100 text-blue-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                    <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                    {t("home.bot.badge")}
                  </Badge>
               </motion.div>
               <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-slate-950 leading-[0.9] uppercase max-w-4xl">
                 {t("home.hero.title")}
               </h1>
               <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                 {t("home.hero.desc")}
               </p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
               <div className="rounded-[40px] bg-white shadow-[0_40px_100px_-20px_rgba(15,23,42,0.1)] p-8 md:p-12 border border-slate-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                      <Plane className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t("home.search.title")}</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{t("home.search.tag")}</p>
                    </div>
                  </div>
                  <FlightSearchForm />
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Market Insights & Tools - ENRICHED CONTENT */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Intel Card: Market Trends */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-8 rounded-[32px] bg-blue-50/50 border border-blue-100/50 hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    <Badge className="bg-blue-600 text-white text-[9px] uppercase font-black">LIVE INSIGHTS</Badge>
                  </div>
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-4">{t("home.bot.badge")} Inteligência</h3>
                  <div className="space-y-4">
                     {[
                       { icon: CheckCircle2, label: "Rotas para o Brasil com 15% de queda na última semana", color: "text-emerald-500" },
                       { icon: Info, label: "EWR → GRU: Melhor época de reserva é 45 dias antes", color: "text-blue-500" },
                       { icon: Navigation, label: "Trending: Voos para Lisboa via Newark em alta", color: "text-amber-500" }
                     ].map((item, i) => (
                       <div key={i} className="flex items-start gap-3">
                          <item.icon className={`h-4 w-4 mt-0.5 ${item.color}`} />
                          <p className="text-sm font-semibold text-slate-600 leading-tight">{item.label}</p>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="p-8 rounded-[32px] bg-amber-50/50 border border-amber-100/50 hover:border-amber-200 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Clock className="h-6 w-6 text-amber-600" />
                    <Badge className="bg-amber-600 text-white text-[9px] uppercase font-black">SENIOR CARE</Badge>
                  </div>
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-4">Dicas de Segurança</h3>
                  <div className="space-y-4">
                     {[
                       { icon: ShieldAlert, label: "Assistência especial em escalas: Peça com 48h de antecedência", color: "text-amber-600" },
                       { icon: Plane, label: "Prefira voos diretos para reduzir o cansaço na chegada", color: "text-amber-600" },
                       { icon: Headphones, label: "Suporte 24h via WhatsApp exclusivo para passageiros", color: "text-emerald-600" }
                     ].map((item, i) => (
                       <div key={i} className="flex items-start gap-3">
                          <item.icon className={`h-4 w-4 mt-0.5 ${item.color}`} />
                          <p className="text-sm font-semibold text-slate-600 leading-tight">{item.label}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Toolbox Card: Quick Info */}
            <div className="p-8 rounded-[32px] bg-slate-950 text-white shadow-xl flex flex-col justify-between">
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Traveler's Toolbox</h3>
                  <p className="text-slate-400 text-sm mb-8 font-medium">Informações dinâmicas para sua viagem.</p>
                  
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <CloudSun className="h-5 w-5 text-blue-400" />
                           <span className="text-sm font-bold opacity-80 uppercase tracking-widest">Weather (GRU)</span>
                        </div>
                        <span className="text-lg font-black tracking-tighter">24°C</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Banknote className="h-5 w-5 text-emerald-400" />
                           <span className="text-sm font-bold opacity-80 uppercase tracking-widest">Exchange Rate</span>
                        </div>
                        <span className="text-lg font-black tracking-tighter">1 USD = 5.04 BRL</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Navigation className="h-5 w-5 text-orange-400" />
                           <span className="text-sm font-bold opacity-80 uppercase tracking-widest">Next Gate Info</span>
                        </div>
                        <span className="text-xs font-black text-orange-400 uppercase">Available 2h pre-flight</span>
                     </div>
                  </div>
               </div>
               
               <Button className="w-full mt-10 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 h-14 font-black text-xs uppercase tracking-widest">
                  Ver Ferramentas <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Deals Section */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
            <div className="max-w-2xl">
              <Badge className="bg-blue-600 text-white rounded-full px-5 py-1.5 mb-6 text-[10px] uppercase font-black tracking-[0.2em]">
                <Globe2 className="h-3.5 w-3.5 mr-2" />
                {t("home.deals.badge")}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-display font-black text-slate-950 tracking-tighter leading-[0.9] uppercase mb-6">
                {t("home.deals.title")} <br />
                <span className="text-blue-600">{t("results.filter_active")}</span>
              </h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">{t("home.deals.desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {dealsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[430px] rounded-[32px] bg-white border border-slate-100 animate-pulse" />)
            ) : catalogDeals.length > 0 ? (
              catalogDeals.map((deal) => (
                <DealCard 
                  key={deal.id} 
                  deal={{
                    ...deal,
                    title: `${deal.origin} → ${deal.destination}`,
                    description: deal.headline || deal.description,
                    imageUrl: getDestinationImage(deal.destination)
                  }} 
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                 <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t("results.no_matching_flights")}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Airline Partner Network - PRO RICH CONTENT */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-4">Nossa Rede de Alianças</h2>
             <p className="text-slate-500 font-medium max-w-xl mx-auto">Parcerias estratégicas com as melhores companhias aéreas do mundo para garantir seu conforto e suporte.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
             {airlines?.slice(0, 12).map((airline) => (
               <div key={airline.id} className="flex flex-col items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all p-6 rounded-3xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50">
                  {airline.logoUrl ? (
                    <img src={airline.logoUrl} alt={airline.name} className="h-8 md:h-12 w-auto object-contain" />
                  ) : (
                    <Plane className="h-8 w-8 text-slate-300" />
                  )}
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{airline.name}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
         <div className="container mx-auto px-4 max-w-6xl relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter uppercase leading-[0.9] mb-8">
              {t("home.cta.title")}
            </h2>
            <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto mb-12">{t("home.cta.subtitle")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={contactWhatsAppHref} target="_blank" rel="noreferrer" className="flex h-16 items-center justify-center gap-4 rounded-full bg-blue-600 px-12 text-sm font-black text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">
                {t("footer.contact_cta")} <MessageCircle className="h-5 w-5" />
              </a>
              <Button variant="outline" className="h-16 rounded-full border-white/10 bg-white/5 px-12 text-sm font-bold text-white hover:bg-white/10" onClick={() => setLocation("/senior")}>
                {t("home.senior.btn")}
              </Button>
            </div>
         </div>
      </section>
    </div>
  );
}
