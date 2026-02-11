import { useLocation } from "wouter";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { FlightCard } from "@/components/FlightCard";
import { useFlightSearch } from "@/hooks/use-flights";
import { Loader2, Filter, AlertCircle, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";

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
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEO title="Resultados da Pesquisa" description="Compare voos e encontre as melhores ofertas de passagens aéreas. Preços atualizados em tempo real." path="/search" noindex={true} />
      <div className="bg-white border-b border-gray-200 shadow-sm pb-6 pt-8 px-4">
        <div className="container mx-auto max-w-6xl">
           <FlightSearchForm defaultValues={defaultValues} />
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-24">
              <div className="flex items-center gap-2 mb-6 font-bold text-gray-900">
                <Filter className="h-5 w-5 text-blue-500" /> {t("results.filters")}
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">{t("results.stops_filter")}</h4>
                  <div className="space-y-2.5">
                    {[t("flight.direct"), `1 ${t("flight.stop")}`, `2+ ${t("flight.stops")}`].map(stop => (
                      <label key={stop} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
                        <input type="checkbox" className="rounded border-gray-300 bg-white text-blue-500 focus:ring-blue-500/30 h-4 w-4" />
                        {stop}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="h-px bg-gray-100" />

                <div>
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">{t("results.airlines_filter")}</h4>
                  <div className="space-y-2.5">
                    {(uniqueAirlines.length > 0 ? uniqueAirlines : [t("results.airlines_filter")]).map(airline => (
                      <label key={airline} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
                        <input type="checkbox" className="rounded border-gray-300 bg-white text-blue-500 focus:ring-blue-500/30 h-4 w-4" />
                        {airline}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-4">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-gray-900" data-testid="text-results-count">
                {isLoading ? t("results.searching") : `${flights?.length || 0} ${t("results.flights_found")}`}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="lg:hidden border-gray-200 bg-white text-gray-700 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" /> {t("results.filters")}
                </Button>
                <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-700 cursor-pointer shadow-sm" data-testid="select-sort">
                  <option value="cheapest">{t("results.sort_cheapest")}</option>
                  <option value="fastest">{t("results.sort_fastest")}</option>
                  <option value="best">{t("results.sort_best")}</option>
                </select>
              </div>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">{t("results.searching_airlines")}</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl border border-red-200 text-red-600">
                <AlertCircle className="h-10 w-10 mb-4" />
                <p className="font-medium">{t("results.error")}</p>
              </div>
            )}

            {!isLoading && !error && flights?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Plane className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t("results.no_flights")}</h3>
                <p className="text-gray-500">{t("results.no_flights_desc")}</p>
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
