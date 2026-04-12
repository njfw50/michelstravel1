import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useFeaturedDeals } from "@/hooks/use-flights";
import { useAirlines } from "@/hooks/use-flights";
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
  ChevronRight,
  Headphones
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildWhatsAppHref, buildWhatsAppMessage, AGENCY_WHATSAPP_DISPLAY } from "@/lib/contact";
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
  const { data: airlines } = useAirlines(20);
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
    <div className="min-h-screen bg-[#0a1128] text-white font-sans selection:bg-orange-500/30">
      <SEO title={t("home.search.title")} description={t("home.search.desc")} path="/" />

      <section className="relative pt-12 pb-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e2a4a,transparent_70%)] opacity-40 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center gap-4">
              <Badge variant="outline" className="bg-orange-500/10 border-orange-500/20 text-orange-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                {t("home.bot.badge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter leading-[0.9] uppercase max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                {t("home.hero.title")}
              </h1>
              <p className="text-slate-400 font-medium text-base md:text-lg max-w-2xl leading-relaxed">
                {t("home.hero.desc")}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="mt-4">
              <div className="glass-dark rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-orange-600/20 text-orange-500 flex items-center justify-center">
                      <Plane className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-white/90 uppercase tracking-widest">{t("home.search.title")}</h2>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight">{t("home.search.tag")}</p>
                    </div>
                  </div>

                  <FlightSearchForm className="bg-transparent border-none p-0 shadow-none text-white" />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                {airlines?.slice(0, 6).map((airline) => (
                  airline.logoUrl && <img key={airline.id} src={airline.logoUrl} alt={airline.name} className="h-8 w-auto object-contain brightness-0 invert" />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
             <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer" onClick={() => setLocation("/senior")}>
               <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                 <Clock className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{t("home.senior.badge")}</h3>
               <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">{t("home.senior.desc")}</p>
               <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                 {t("home.senior.btn")} <ChevronRight className="h-4 w-4" />
               </div>
             </div>

             <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer" onClick={() => openChatbotAssistant({ message: t("home.bot.msg1"), autoSend: true })}>
               <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                 <Sparkles className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">MIA INTELLIGENCE</h3>
               <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">{t("home.bot.desc")}</p>
               <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                 {t("home.bot.btn")} <ChevronRight className="h-4 w-4" />
               </div>
             </div>

             <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer" onClick={() => setLocation("/messages")}>
               <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                 <Headphones className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{t("footer.contact_title")}</h3>
               <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">{t("footer.contact_desc")}</p>
               <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                 {t("footer.contact_cta")} <ChevronRight className="h-4 w-4" />
               </div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
            <div className="max-w-2xl">
              <Badge className="bg-orange-600 text-white rounded-full px-5 py-1 mb-6 text-[9px] uppercase font-black tracking-[0.2em] shadow-lg shadow-orange-600/20">
                <TrendingUp className="h-3. w-3.5 mr-2" />
                {t("home.deals.badge")}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter leading-[0.9] uppercase mb-6">
                {t("home.deals.title")} <br />
                <span className="text-orange-500">{t("results.filter_active")}</span>
              </h2>
              <p className="text-slate-400 font-medium text-lg leading-relaxed">{t("home.deals.desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
            {dealsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[420px] rounded-[32px] bg-white/5 border border-white/5 animate-pulse" />)
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
              <div className="col-span-full py-20 text-center bg-white/5 rounded-[32px] border border-dashed border-white/10">
                 <p className="text-slate-500 font-black uppercase tracking-widest text-xs">{t("results.no_matching_flights")}</p>
              </div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden bg-white/5 border-t border-white/5">
         <div className="container mx-auto px-4 max-w-6xl relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-white uppercase leading-[0.9] mb-8">
              {t("home.cta.title")}
            </h2>
            <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto mb-12">{t("home.cta.subtitle")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={contactWhatsAppHref} target="_blank" rel="noreferrer" className="flex h-16 items-center justify-center gap-4 rounded-full bg-orange-600 px-12 text-sm font-black text-white hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20">
                {t("footer.contact_cta")} <MessageCircle className="h-5 w-5" />
              </a>
              <Button variant="outline" className="h-16 rounded-full border-white/10 bg-white/5 px-12 text-sm font-bold text-white hover:bg-white/10" onClick={() => setLocation("/senior")}>
                {t("home.senior.btn")}
              </Button>
            </div>
         </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center">
         <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
           {t("footer.seal_ssl")} • {t("footer.seal_stripe")}
         </p>
      </footer>
    </div>
  );
}
