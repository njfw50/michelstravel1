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
  ShieldAlert,
  Headphones,
  Compass,
  Star,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
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
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <SEO title={t("home.search.title")} description={t("home.search.desc")} path="/" />

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.8)_100%)]" />
      </div>

      {/* Hero Search Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            <motion.div 
               initial={{ opacity: 0, y: -20 }} 
               animate={{ opacity: 1, y: 0 }}
               className="mb-8"
            >
              <Badge className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/10 backdrop-blur-md">
                <Sparkles className="h-4 w-4 mr-3 animate-pulse" />
                {t("home.bot.badge")} Premium Experience
              </Badge>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-[0.9] uppercase max-w-5xl mb-10"
            >
              {t("home.hero.title")}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 font-medium text-lg md:text-xl max-w-2xl leading-relaxed mb-16"
            >
              {t("home.hero.desc")}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 40 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              className="w-full"
            >
               <FlightSearchForm className="hover:shadow-blue-500/5 transition-shadow duration-700" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats / Value Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { label: "Active Routes", value: "2,400+", icon: Compass },
                { label: "Premium Partners", value: "45+", icon: Star },
                { label: "Happy Travelers", value: "120k", icon: Globe2 },
                { label: "Search Speed", value: "< 2s", icon: Zap }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-3 p-6 rounded-[32px] bg-white/5 border border-white/5 backdrop-blur-sm">
                   <stat.icon className="h-6 w-6 text-blue-500 mb-2" />
                   <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">{stat.value}</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Market Insights & Tools */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="group p-10 rounded-[48px] bg-slate-900/40 border border-white/5 backdrop-blur-3xl hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <TrendingUp className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
                    <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[9px] uppercase font-black px-4 py-1.5 rounded-full">LIVE INSIGHTS</Badge>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Midnight Inteligência</h3>
                  <div className="space-y-6">
                     {[
                       { icon: CheckCircle2, label: "Rotas para o Brasil com 15% de queda na última semana", color: "text-emerald-400" },
                       { icon: Info, label: "EWR → GRU: Melhor época de reserva é 45 dias antes", color: "text-blue-400" },
                       { icon: Navigation, label: "Trending: Voos para Lisboa via Newark em alta", color: "text-coral-500" }
                     ].map((item, i) => (
                       <div key={i} className="flex items-start gap-4">
                          <item.icon className={cn("h-5 w-5 mt-0.5 shrink-0", item.color)} />
                          <p className="text-sm font-bold text-slate-400 leading-relaxed">{item.label}</p>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="group p-10 rounded-[48px] bg-slate-900/40 border border-white/5 backdrop-blur-3xl hover:border-coral-500/30 transition-all duration-500 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <Clock className="h-8 w-8 text-coral-500 group-hover:scale-110 transition-transform" />
                    <Badge className="bg-coral-500/20 text-coral-400 border border-coral-500/20 text-[9px] uppercase font-black px-4 py-1.5 rounded-full">SENIOR CARE</Badge>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Segurança & Conforto</h3>
                  <div className="space-y-6">
                     {[
                       { icon: ShieldAlert, label: "Assistência especial em escalas: Peça com 48h de antecedência", color: "text-coral-500" },
                       { icon: Plane, label: "Prefira voos diretos para reduzir o cansaço na chegada", color: "text-coral-500" },
                       { icon: Headphones, label: "Suporte 24h via WhatsApp exclusivo para passageiros", color: "text-emerald-400" }
                     ].map((item, i) => (
                       <div key={i} className="flex items-start gap-4">
                          <item.icon className={cn("h-5 w-5 mt-0.5 shrink-0", item.color)} />
                          <p className="text-sm font-bold text-slate-400 leading-relaxed">{item.label}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-10 rounded-[48px] bg-white text-slate-950 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
               {/* Background Gloss */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />
               
               <div className="relative z-10">
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-3">Traveler's Toolbox</h3>
                  <p className="text-slate-500 text-sm mb-12 font-bold uppercase tracking-widest">Informações Dinâmicas</p>
                  
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <CloudSun className="h-6 w-6 text-blue-600" />
                           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Weather (GRU)</span>
                        </div>
                        <span className="text-2xl font-black tracking-tighter">24°C</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <Banknote className="h-6 w-6 text-emerald-600" />
                           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Exchange Rate</span>
                        </div>
                        <span className="text-2xl font-black tracking-tighter">1 USD = 5.04 BRL</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <Navigation className="h-6 w-6 text-orange-600" />
                           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Flight Status</span>
                        </div>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-md">Live Monitoring</span>
                     </div>
                  </div>
               </div>
               
               <Button 
                  onClick={() => setLocation("/toolbox")}
                  className="w-full mt-12 rounded-[24px] bg-slate-950 text-white hover:bg-blue-600 h-16 font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                   Acessar Painel <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Deals Section */}
      <section className="py-32 relative z-10 overflow-hidden">
        {/* Decorative mask */}
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-3xl -z-10" />
        
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
            <div className="max-w-2xl">
              <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full px-6 py-2 mb-8 text-[10px] uppercase font-black tracking-[0.4em]">
                <Globe2 className="h-4 w-4 mr-3" />
                {t("home.deals.badge")}
              </Badge>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] uppercase mb-8">
                {t("home.deals.title")} <br />
                <span className="text-blue-500">{t("results.filter_active")}</span>
              </h2>
              <p className="text-slate-400 font-medium text-lg leading-relaxed">{t("home.deals.desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {dealsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[430px] rounded-[48px] bg-white/5 border border-white/5 animate-pulse" />)
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
              <div className="col-span-full py-24 text-center bg-white/5 rounded-[48px] border border-dashed border-white/10">
                 <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">{t("results.no_matching_flights")}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Airline Partner Network */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20">
             <Badge variant="outline" className="mb-6 border-white/10 text-slate-500 text-[9px] uppercase font-black tracking-[0.3em] px-5 py-1.5 rounded-full">Global Network</Badge>
             <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">Nossa Rede de Alianças</h2>
             <p className="text-slate-400 font-medium max-w-xl mx-auto text-lg leading-relaxed">Conexão direta com as maiores alianças aéreas para garantir sua segurança e conforto global.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
             {airlines?.slice(0, 12).map((airline) => (
               <div key={airline.id} className="flex flex-col items-center gap-4 transition-all p-8 rounded-[32px] border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 hover:border-blue-500/30 group">
                  <div className="h-12 w-full flex items-center justify-center grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                    {airline.logoUrl ? (
                      <img src={airline.logoUrl} alt={airline.name} className="h-full w-auto object-contain" />
                    ) : (
                      <Plane className="h-10 w-10 text-slate-700" />
                    )}
                  </div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">{airline.name}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 relative z-10 overflow-hidden bg-white text-slate-950">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
         <div className="container mx-auto px-4 max-w-6xl relative z-10 text-center">
            <Badge className="bg-slate-950 text-white rounded-full px-6 py-2 mb-8 text-[10px] uppercase font-black tracking-[0.5em] shadow-xl">Ready for Takeoff</Badge>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-12">
              {t("home.cta.title")}
            </h2>
            <p className="text-slate-500 text-xl md:text-2xl font-bold max-w-2xl mx-auto mb-16 uppercase tracking-tight">{t("home.cta.subtitle")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href={contactWhatsAppHref} target="_blank" rel="noreferrer" className="flex h-20 items-center justify-center gap-5 rounded-[24px] bg-blue-600 px-16 text-sm font-black text-white hover:bg-slate-950 transition-all shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95">
                {t("footer.contact_cta")} <MessageCircle className="h-6 w-6" />
              </a>
              <Button 
                variant="outline" 
                className="h-20 rounded-[24px] border-slate-200 bg-white px-16 text-sm font-black uppercase tracking-widest text-slate-950 hover:bg-slate-50 shadow-xl transition-all hover:scale-105 active:scale-95" 
                onClick={() => setLocation("/senior")}
              >
                {t("home.senior.btn")}
              </Button>
            </div>
         </div>
      </section>
    </div>
  );
}
