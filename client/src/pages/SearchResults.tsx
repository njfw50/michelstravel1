import { useLocation } from "wouter";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { FlightCard } from "@/components/FlightCard";
import { useFlightSearch } from "@/hooks/use-flights";
import { Loader2, Filter, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  
  const params = {
    origin: searchParams.get('origin') || "",
    destination: searchParams.get('destination') || "",
    date: searchParams.get('date') || "",
    passengers: searchParams.get('passengers') || "1",
  };

  const { data: flights, isLoading, error } = useFlightSearch(params);

  const defaultValues = {
    origin: params.origin,
    destination: params.destination,
    date: params.date ? new Date(params.date) : undefined,
    passengers: params.passengers,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Compact Search Header */}
      <div className="bg-slate-900 pb-24 pt-8 px-4">
        <div className="container mx-auto max-w-6xl">
           <FlightSearchForm defaultValues={defaultValues} className="shadow-none border-none bg-white/10 backdrop-blur-sm text-white" />
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Filters Sidebar (Mock for UI) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <div className="flex items-center gap-2 mb-6 font-bold text-slate-900">
                <Filter className="h-5 w-5" /> Filters
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Stops</h4>
                  <div className="space-y-2">
                    {['Direct', '1 Stop', '2+ Stops'].map(stop => (
                      <label key={stop} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary">
                        <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                        {stop}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="h-px bg-slate-100" />

                <div>
                  <h4 className="text-sm font-semibold mb-3">Airlines</h4>
                  <div className="space-y-2">
                    {['Delta', 'United', 'British Airways', 'Lufthansa'].map(airline => (
                      <label key={airline} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary">
                        <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                        {airline}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="lg:col-span-9 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-800">
                {isLoading ? "Searching flights..." : `${flights?.length || 0} flights found`}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="h-4 w-4 mr-2" /> Filters
                </Button>
                <select className="bg-white border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary">
                  <option>Cheapest first</option>
                  <option>Fastest first</option>
                  <option>Best value</option>
                </select>
              </div>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Searching hundreds of airlines...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl border border-red-100 text-red-600">
                <AlertCircle className="h-10 w-10 mb-4" />
                <p className="font-medium">Failed to load flights. Please try again.</p>
              </div>
            )}

            {!isLoading && !error && flights?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Filter className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No flights found</h3>
                <p className="text-slate-500">Try changing your dates or search filters.</p>
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
