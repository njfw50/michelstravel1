import { type FlightOffer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, Clock, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";

// Helper to format ISO Duration (PT4H30M)
const formatDuration = (duration: string) => {
  // Simple regex parser for PT#H#M format which is standard ISO 8601
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? hoursMatch[1] : "0";
  const minutes = minutesMatch ? minutesMatch[1] : "0";
  return `${hours}h ${minutes}m`;
};

// Helper to format currency
const formatPrice = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function FlightCard({ flight }: { flight: FlightOffer }) {
  const formattedDuration = flight.duration.startsWith("P") ? formatDuration(flight.duration) : flight.duration;
  
  return (
    <Card className="p-0 overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl">
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Airline Info */}
        <div className="md:col-span-3 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-2 overflow-hidden">
            {flight.logoUrl ? (
              <img src={flight.logoUrl} alt={flight.airline} className="w-full h-full object-contain" />
            ) : (
              <Plane className="text-slate-400 h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{flight.airline}</h3>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
              {flight.flightNumber}
            </span>
          </div>
        </div>

        {/* Flight Details Graph */}
        <div className="md:col-span-6 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2 px-2">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900">{format(parseISO(flight.departureTime), "HH:mm")}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Departs</div>
            </div>
            <div className="flex-1 flex flex-col items-center px-4">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formattedDuration}
              </div>
              <div className="w-full h-[2px] bg-slate-200 relative">
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between items-center">
                  <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                  <Plane className="h-4 w-4 text-primary rotate-90" />
                  <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                </div>
              </div>
              <div className="text-xs text-green-600 font-medium mt-1">
                {flight.stops === 0 ? "Direct" : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900">{format(parseISO(flight.arrivalTime), "HH:mm")}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Arrives</div>
            </div>
          </div>
        </div>

        {/* Price & Action */}
        <div className="md:col-span-3 flex flex-col items-end justify-center border-l border-slate-100 pl-6 gap-2">
          <div className="text-right">
            <span className="text-xs text-slate-500">Total Price</span>
            <div className="text-3xl font-display font-bold text-primary">
              {formatPrice(flight.price, flight.currency)}
            </div>
          </div>
          <Link href={`/book/${flight.id}`} className="w-full">
            <Button className="w-full rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              Select Flight <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
