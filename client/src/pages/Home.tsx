import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useFeaturedDeals } from "@/hooks/use-flights";
import { useAirlines, useFeaturedAirports } from "@/hooks/use-flights";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { DealCard } from "@/components/DealCard";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Missing import added
import { 
  Plane, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Globe2, 
  Phone, 
  CheckCircle2,
  MessageCircle,
  Clock,
  TrendingUp,
  MapPin
} from "lucide-react";
import { motion } from "framer-motion";
import { buildWhatsAppHref, buildWhatsAppMessage, AGENCY_WHATSAPP_DISPLAY } from "@/lib/contact";
import { openChatbotAssistant } from "@/lib/chatbot";
import type { ContactLanguage } from "@/lib/contact";

const getDestinationImage = (iata?: string) => {
  if (!iata) return "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=800";
  const code = iata.toUpperCase();
  
  // Mapeamento preciso por IATA para garantir a "regra primária" das fotos
  const mapping: Record<string, string> = {
    "GIG": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=800", // Rio
    "SDU": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=800", // Rio
    "GRU": "https://images.unsplash.com/photo-1512453979798-5ea4e7ed58e3?auto=format&fit=crop&q=80&w=800", // SP
    "CGH": "https://images.unsplash.com/photo-1512453979798-5ea4e7ed58e3?auto=format&fit=crop&get=80&w=800", // SP
    "MCO": "https://images.unsplash.com/photo-1567627402534-190977800762?auto=format&fit=crop&q=80&w=800", // Orlando
    "LIS": "https://images.unsplash.com/photo-1589330273594-fade1ee91647?auto=format&fit=crop&q=80&w=800", // Lisboa
    "CDG": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800", // Paris
    "EWR": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800", // NY/NJ
    "JFK": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800", // NY/NJ
    "MIA": "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?auto=format&fit=crop&q=80&w=800", // Miami
    "REC": "https://images.unsplash.com/photo-1596162391609-843e498bdbd1?auto=format&fit=crop&q=80&w=800", // Recife
  };

  return mapping[code] || "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&q=80&w=800";
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
    <div className="bg-[#fcfdff] text-slate-900 font-sans">
      <SEO
        title={t("home.search.title")}
        description={t("home.search.desc")}
        path="/"
      />

      <section className="relative pt-8 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[55%] h-[650px] bg-gradient-to-bl from-blue-50/50 via-blue-50/20 to-transparent pointer-events-none rounded-bl-[240px] z-0" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col gap-10">
            
            <div className="flex flex-wrap items-end justify-between gap-6">
               <div className="flex flex-col gap-3 max-w-2xl">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Badge variant="outline" className="w-fit bg-blue-600/5 border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                      <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                      {t("home.bot.badge")}
                    </Badge>
                  </motion.div>
                  <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-slate-950 leading-[0.95] uppercase">
                    {t("home.hero.title").split(":")[0]} <br />
                    <span className="text-blue-600">{t("home.office.badge")}</span>
                  </h1>
                  <p className="text-slate-500 font-medium text-base md:text-lg max-w-lg leading-relaxed">
                    {t("home.hero.desc")}
                  </p>
               </div>
               
               <div className="hidden lg:flex items-center gap-8 pb-2">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("home.bot.whatsapp_badge")} 24h</span>
                    </div>
                    <a href={contactWhatsAppHref} target="_blank" rel="noreferrer" className="text-xl font-black text-slate-950 hover:text-blue-600 transition-colors">
                      {AGENCY_WHATSAPP_DISPLAY}
                    </a>
                  </div>
               </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative">
              <div className="rounded-[40px] md:rounded-[56px] border border-white bg-white/80 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.12)] backdrop-blur-2xl p-6 md:p-12">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                      <Plane className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t("home.search.title")}</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{t("home.search.tag")}</p>
                    </div>
                  </div>

                  <FlightSearchForm />
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-between gap-8 border-t border-slate-100 pt-8">
                  <div className="flex flex-wrap items-center gap-10">
                     <div className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest opacity-70">{t("footer.seal_stripe")}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Globe2 className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest opacity-70">{t("footer.seal_ssl")}</span>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-5">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t("home.airlines.tag")}:</p>
                     <div className="flex -space-x-3 opacity-40 grayscale">
                        {airlines?.slice(0, 5).map((airline) => (
                          <div key={airline.id} className="h-10 w-10 rounded-full border-4 border-white bg-slate-50 flex items-center justify-center p-1.5 overflow-hidden shadow-sm">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <motion.div whileHover={{ y: -8 }} className="group p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all cursor-pointer" onClick={() => setLocation("/senior")}>
                 <div className="h-14 w-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all">
                   <Clock className="h-7 w-7" />
                 </div>
                 <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-3">{t("home.senior.badge")}</h3>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">{t("home.senior.desc")}</p>
                 <div className="mt-6 flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest">
                   {t("home.senior.btn")} <ArrowRight className="h-4 w-4" />
                 </div>
               </motion.div>

               <motion.div whileHover={{ y: -8 }} className="group p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all cursor-pointer" onClick={() => openChatbotAssistant({ message: t("home.bot.msg1"), autoSend: true })}>
                 <div className="h-14 w-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                   <Sparkles className="h-7 w-7" />
                 </div>
                 <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-3">MIA INTELLIGENCE</h3>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">{t("home.bot.desc")}</p>
                 <div className="mt-6 flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest">
                   {t("home.bot.btn")} <ArrowRight className="h-4 w-4" />
                 </div>
               </motion.div>

               <motion.div whileHover={{ y: -8 }} className="group p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all cursor-pointer" onClick={() => setLocation("/messages")}>
                 <div className="h-14 w-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                   <MessageCircle className="h-7 w-7" />
                 </div>
                 <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-3">{t("footer.contact_title")}</h3>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">{t("footer.contact_desc")}</p>
                 <div className="mt-6 flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest">
                   {t("footer.contact_cta")} <ArrowRight className="h-4 w-4" />
                 </div>
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50/50 py-28 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
            <div className="max-w-2xl">
              <Badge className="bg-blue-600 text-white rounded-full px-5 py-1.5 mb-6 text-[10px] uppercase font-black tracking-[0.2em] shadow-lg shadow-blue-600/20">
                <TrendingUp className="h-3.5 w-3.5 mr-2" />
                {t("home.deals.badge")}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-display font-black text-slate-950 tracking-tighter leading-[0.9] uppercase mb-6">
                {t("home.deals.title")} <br />
                <span className="text-blue-600">{t("results.filter_active")}</span>
              </h2>
              <p className="text-slate-500 font-medium text-lg max-w-lg leading-relaxed">{t("home.deals.desc")}</p>
            </div>
            <Link href="/search" className="group flex items-center gap-3 text-blue-600 font-black text-sm uppercase tracking-widest hover:gap-4 transition-all">
               {t("home.board.show_more")} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {dealsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[450px] rounded-[40px] bg-white border border-slate-100 animate-pulse" />)
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
              <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                 <p className="text-slate-400 font-black uppercase tracking-widest text-sm">{t("results.no_matching_flights")}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-24 relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <Globe2 className="h-[800px] w-[800px] absolute -bottom-40 -right-40 text-blue-500" />
         </div>
         <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-16">
               <div className="max-w-3xl">
                  <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-white uppercase leading-[0.9] mb-8">
                    {t("home.cta.title")}
                  </h2>
                  <p className="text-slate-400 text-xl font-medium max-w-xl">{t("home.cta.subtitle")}</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-6">
                  <a href={contactWhatsAppHref} target="_blank" rel="noreferrer" className="flex h-20 items-center justify-center gap-4 rounded-full bg-blue-600 px-12 text-lg font-black text-white hover:bg-blue-700 transition-all">
                    {t("footer.contact_cta")} <MessageCircle className="h-6 w-6" />
                  </a>
                  <Button variant="outline" className="h-20 rounded-full border-white/20 bg-white/5 px-12 text-lg font-bold text-white hover:bg-white/10" onClick={() => setLocation("/senior")}>
                    {t("home.senior.btn")}
                  </Button>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
