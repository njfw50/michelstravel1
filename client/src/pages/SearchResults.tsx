import { useLocation } from "wouter";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { FlightCard } from "@/components/FlightCard";
import { useFlightSearch } from "@/hooks/use-flights";
import { Loader2, Filter, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export default function SearchResults() {
  const [location] = useLocation();
  const { t } = useI18n();
  const searchParams = new URLSearchParams(window.location.search);
  
  const params = {
    origin: searchParams.get('origin') || "",
    destination: searchParams.get('destination') || "",
    date: searchParams.get('date') || "",
    passengers: searchParams.get('passengers') || "1",
    adults: searchParams.get('adults') || "1",
    children: searchParams.get('children') || "0",
    infants: searchParams.get('infants') || "0",
    cabinClass: searchParams.get('cabinClass') || "economy",
    returnDate: searchParams.get('returnDate') || undefined,
  };

  const { data: flights, isLoading, error } = useFlightSearch(params);

  const defaultValues = {
    origin: params.origin,
    destination: params.destination,
    date: params.date ? new Date(params.date) : undefined,
    passengers: params.passengers,
  };

  const uniqueAirlines = flights ? Array.from(new Set(flights.map(f => f.airline))) : [];

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 pb-24 pt-8 px-4">
        <div className="container mx-auto max-w-6xl">
           <FlightSearchForm defaultValues={defaultValues} className="shadow-none border-none bg-transparent backdrop-blur-none" />
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10 sticky top-24">
              <div className="flex items-center gap-2 mb-6 font-bold text-white">
                <Filter className="h-5 w-5 text-amber-400" /> {t("results.filters")}
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-white/80">{t("results.stops_filter")}</h4>
                  <div className="space-y-2">
                    {[t("flight.direct"), `1 ${t("flight.stop")}`, `2+ ${t("flight.stops")}`].map(stop => (
                      <label key={stop} className="flex items-center gap-2 text-sm text-white/60 cursor-pointer hover:text-amber-300 transition-colors">
                        <input type="checkbox" className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/50" />
                        {stop}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="h-px bg-white/10" />

                <div>
                  <h4 className="text-sm font-semibold mb-3 text-white/80">{t("results.airlines_filter")}</h4>
                  <div className="space-y-2">
                    {(uniqueAirlines.length > 0 ? uniqueAirlines : [t("results.airlines_filter")]).map(airline => (
                      <label key={airline} className="flex items-center gap-2 text-sm text-white/60 cursor-pointer hover:text-amber-300 transition-colors">
                        <input type="checkbox" className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/50" />
                        {airline}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-white" data-testid="text-results-count">
                {isLoading ? t("results.searching") : `${flights?.length || 0} ${t("results.flights_found")}`}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="lg:hidden border-white/10 bg-white/5 text-white hover:bg-white/10">
                  <Filter className="h-4 w-4 mr-2" /> {t("results.filters")}
                </Button>
                <select className="bg-white/5 border border-white/10 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-amber-500/50 text-white cursor-pointer" data-testid="select-sort">
                  <option className="bg-[hsl(220,18%,10%)] text-white" value="cheapest">{t("results.sort_cheapest")}</option>
                  <option className="bg-[hsl(220,18%,10%)] text-white" value="fastest">{t("results.sort_fastest")}</option>
                  <option className="bg-[hsl(220,18%,10%)] text-white" value="best">{t("results.sort_best")}</option>
                </select>
              </div>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-white/10">
                <Loader2 className="h-10 w-10 text-amber-400 animate-spin mb-4" />
                <p className="text-white/60 font-medium">{t("results.searching_airlines")}</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-20 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400">
                <AlertCircle className="h-10 w-10 mb-4" />
                <p className="font-medium">{t("results.error")}</p>
              </div>
            )}

            {!isLoading && !error && flights?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-white/10">
                <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                  <Filter className="h-8 w-8 text-white/30" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t("results.no_flights")}</h3>
                <p className="text-white/50">{t("results.no_flights_desc")}</p>
              </div>
            )}

            <div className="space-y-4">
              {flights?.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
