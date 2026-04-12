import { motion } from "framer-motion";
import { Plane, Calendar, CreditCard, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

interface DealCardProps {
  deal: {
    id: number;
    title: string;
    description: string;
    origin: string;
    destination: string;
    price: string;
    airline: string;
    departure_date: string;
    imageUrl?: string;
  };
}

export function DealCard({ deal }: DealCardProps) {
  const [, setLocation] = useLocation();
  const { language } = useI18n();

  const handleBook = () => {
    // Navigate to search with these params prefilled
    const searchParams = new URLSearchParams();
    searchParams.append("origin", deal.origin);
    searchParams.append("destination", deal.destination);
    searchParams.append("date", deal.departure_date);
    searchParams.append("dealId", String(deal.id));
    setLocation(`/search?${searchParams.toString()}`);
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="group overflow-hidden rounded-[32px] border-slate-100 bg-white shadow-xl shadow-slate-200/40">
        <div className="relative h-48 overflow-hidden">
          <img
            src={deal.imageUrl || "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=800"}
            alt={deal.destination}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="text-white">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{deal.airline}</p>
              <h3 className="text-lg font-black leading-tight tracking-tight">{deal.title}</h3>
            </div>
            <div className="bg-blue-600 px-3 py-1 rounded-full text-white text-xs font-black">
              {deal.price}
            </div>
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{deal.departure_date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Plane className="h-3.5 w-3.5" />
              <span>Direto / 1 parada</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6 leading-relaxed">
            {deal.description}
          </p>
          
          <Button 
            onClick={handleBook}
            className="w-full rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border-none shadow-none font-black text-xs uppercase tracking-widest transition-all h-12"
          >
            {language === "en" ? "Check availability" : language === "es" ? "Ver disponibilidad" : "Ver disponibilidade"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
