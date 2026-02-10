import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { FlightCard } from "@/components/FlightCard";
import { useFlightSearch } from "@/hooks/use-flights";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { parse, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter } from "lucide-react";

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const dateStr = searchParams.get("date");
  const passengers = searchParams.get("passengers") || "1";
  
  const date = dateStr ? parse(dateStr, "yyyy-MM-dd", new Date()) : undefined;

  const { data: flights, isLoading } = useFlightSearch({
    origin,
    destination,
    date: dateStr || format(new Date(), "yyyy-MM-dd"),
    passengers,
  });

  return (
    <Layout>
      <div className="bg-primary/5 pb-12">
        <div className="container mx-auto px-4 pt-8">
          {/* Compact Search Form */}
          <div className="mb-8">
             <FlightSearchForm 
               className="py-4 shadow-md" 
               defaultValues={{ origin, destination, date, passengers }}
             />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="hidden lg:block space-y-8 bg-white p-6 rounded-2xl shadow-sm h-fit sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Filters</h3>
              </div>

              {/* Stops */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Stops</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="non-stop" />
                    <Label htmlFor="non-stop">Non-stop</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="one-stop" />
                    <Label htmlFor="one-stop">1 Stop</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="two-stop" />
                    <Label htmlFor="two-stop">2+ Stops</Label>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Price */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Price Range</h4>
                <Slider defaultValue={[1000]} max={2000} step={50} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>$2,000+</span>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Airlines */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Airlines</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="delta" />
                    <Label htmlFor="delta">Delta Airlines</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="american" />
                    <Label htmlFor="american">American Airlines</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="united" />
                    <Label htmlFor="united">United Airlines</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Results List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {isLoading ? "Searching flights..." : `${flights?.length || 0} flights found`}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {origin} to {destination} • {passengers} Adult{passengers !== "1" && "s"}
                </span>
              </div>

              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-10 w-24 ml-auto" />
                  </div>
                ))
              ) : flights && flights.length > 0 ? (
                flights.map((flight) => (
                  <FlightCard key={flight.id} flight={flight} passengers={passengers} />
                ))
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                  <h3 className="text-lg font-semibold mb-2">No flights found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search for different dates.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
