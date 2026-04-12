import { motion } from "framer-motion";
import { Plane, Calendar, ArrowRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

interface DealCardProps {
  deal: {
    id: number;
    title: string;
    description: string;
    origin: string;
    destination: string;
    origin_city: string;
    destination_city: string;
    price: string;
    airline: string;
    departure_date: string;
    imageUrl?: string;
  };
}

export function DealCard({ deal }: DealCardProps) {
  const [, setLocation] = useLocation();
  const { language, t } = useI18n();

  const handleBook = () => {
    // Navigate to search with these params prefilled
    const searchParams = new URLSearchParams();
    searchParams.append("origin", deal.origin);
    searchParams.append("destination", deal.destination);
    
    // Convert date if possible, otherwise just use today for the search to be valid
    searchParams.append("date", deal.departure_date || new Date().toISOString().split('T')[0]);
    searchParams.append("dealId", String(deal.id));
    setLocation(`/search?${searchParams.toString()}`);
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <Card className="group h-full flex flex-col overflow-hidden rounded-[32px] border-none bg-white shadow-[0_15px_45px_-10px_rgba(0,0,0,0.06)] hover:shadow-[0_45px_100px_-25px_rgba(37,99,235,0.18)] transition-all duration-500">
        
        {/* Image Section - Fixed Aspect Ratio */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={deal.imageUrl || "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=800"}
            alt={deal.destination_city}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
          
          <div className="absolute top-4 left-4">
             <Badge className="bg-white/10 backdrop-blur-xl text-white border-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
               {t("home.deals.badge")}
             </Badge>
          </div>

          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex items-center gap-1.5 mb-1.5 opacity-90">
               <MapPin className="h-3 w-3 text-blue-400" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{deal.destination_city || deal.destination}</p>
            </div>
            <h3 className="text-2xl font-display font-black leading-tight tracking-tighter uppercase text-white">{deal.title}</h3>
          </div>
        </div>
        
        {/* Content Section - Flexible but balanced */}
        <div className="p-8 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("home.board.col_price")}</span>
                  <div className="flex items-baseline gap-1.5">
                     <span className="text-3xl font-black text-blue-600 tracking-tighter">{deal.price}</span>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("home.board.per_person")}</span>
                  </div>
               </div>
            </div>
            
            <div className="space-y-3 pt-2 border-t border-slate-50">
               <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                  <Calendar className="h-4 w-4 text-blue-500/50" />
                  <span>{t("search.departure")}: {deal.departure_date}</span>
               </div>
               <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                  <Plane className="h-4 w-4 text-blue-500/50" />
                  <span>{t("flight.direct")}</span>
               </div>
            </div>
          </div>
          
          <Button 
            onClick={handleBook}
            className="w-full mt-8 rounded-2xl bg-slate-950 text-white hover:bg-blue-600 h-14 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-950/10 hover:shadow-blue-600/30 group/btn"
          >
            {t("home.board.book")}
            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-2 transition-transform" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
