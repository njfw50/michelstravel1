import { Plane, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FlightOffer } from "@shared/schema";
import { Link } from "wouter";

interface FlightCardProps {
  flight: FlightOffer;
  passengers?: string;
  returnDate?: string;
}

export function FlightCard({ flight, passengers }: FlightCardProps) {
  return (
    <Card className="hover-card-effect border-none shadow-sm bg-white overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Airline Info */}
          <div className="flex items-center gap-4 min-w-[150px]">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Plane className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-lg">{flight.airline}</h4>
              <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
            </div>
          </div>

          {/* Flight Route & Duration */}
          <div className="flex-1 flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-xl font-bold">{flight.departureTime}</p>
              <p className="text-sm text-muted-foreground">DEP</p>
            </div>
            
            <div className="flex flex-col items-center gap-1 min-w-[100px]">
              <p className="text-xs text-muted-foreground">{flight.duration}</p>
              <div className="w-full h-[2px] bg-slate-200 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                  <Plane className="h-4 w-4 text-slate-300 transform rotate-90" />
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] h-5">
                {flight.stops === 0 ? "Non-stop" : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
              </Badge>
            </div>

            <div>
              <p className="text-xl font-bold">{flight.arrivalTime}</p>
              <p className="text-sm text-muted-foreground">ARR</p>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex flex-col items-end gap-3 min-w-[120px]">
            <div className="text-right">
              <span className="text-sm text-muted-foreground block">per person</span>
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price)}
              </span>
            </div>
            <Link href={`/book/${flight.id}${passengers ? `?passengers=${passengers}` : ''}`}>
              <Button className="w-full bg-primary hover:bg-blue-600 text-white rounded-lg group-hover:shadow-lg transition-all">
                Select <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
