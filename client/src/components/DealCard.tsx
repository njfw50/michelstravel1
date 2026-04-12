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
      whileHover={{ y: -12 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <Card className="group overflow-hidden rounded-[40px] border-none bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.15)] transition-all duration-500">
        
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={deal.imageUrl || "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=800"}
            alt={deal.destination_city}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          
          <div className="absolute top-4 right-4 animate-bounce-slow">
             <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
               {t("home.deals.badge")}
             </Badge>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                 <MapPin className="h-3 w-3 text-blue-400" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">{deal.destination_city || deal.destination}</p>
              </div>
              <h3 className="text-2xl font-display font-black leading-none tracking-tighter uppercase">{deal.title}</h3>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("home.board.col_price")}</span>
                <div className="flex items-baseline gap-1">
                   <span className="text-2xl font-black text-blue-600 tracking-tighter">{deal.price}</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t("home.board.per_person")}</span>
                </div>
             </div>
             <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                <Plane className="h-4 w-4 text-blue-600" />
             </div>
          </div>
          
          <div className="space-y-3 mb-8">
             <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span>{t("search.departure")}: {deal.departure_date}</span>
             </div>
             <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <Plane className="h-4 w-4 text-blue-400" />
                <span>{t("flight.direct")}</span>
             </div>
          </div>
          
          <Button 
            onClick={handleBook}
            className="w-full rounded-[24px] bg-slate-950 text-white hover:bg-blue-600 px-8 h-14 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-950/10 hover:shadow-blue-600/30 group/btn"
          >
            {t("home.board.book")}
            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-2 transition-transform" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
