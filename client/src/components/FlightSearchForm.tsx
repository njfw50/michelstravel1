import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Users, Search, ArrowRightLeft, Plus, Minus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { LocationSearch } from "./LocationSearch";

interface FlightSearchFormProps {
  className?: string;
  defaultValues?: {
    origin: string;
    destination: string;
    date: Date | undefined;
    passengers: string;
  };
}

export function FlightSearchForm({ className, defaultValues }: FlightSearchFormProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const [tripType, setTripType] = useState("round-trip");
  
  const [origin, setOrigin] = useState(defaultValues?.origin || "");
  const [destination, setDestination] = useState(defaultValues?.destination || "");
  const [date, setDate] = useState<Date | undefined>(defaultValues?.date);
  const [returnDate, setReturnDate] = useState<Date | undefined>();

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("economy");

  const totalPassengers = adults + children + infants;

  const classLabel = (id: string) => t(`class.${id}`);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!origin) {
        toast({ title: t("search.origin"), description: t("search.city_placeholder"), variant: "destructive" });
        return;
    }
    if (!destination) {
        toast({ title: t("search.destination"), description: t("search.city_placeholder"), variant: "destructive" });
        return;
    }
    if (!date) {
        toast({ title: t("search.departure"), description: t("search.date_placeholder"), variant: "destructive" });
        return;
    }

    const params = new URLSearchParams();
    params.set("origin", origin);
    params.set("destination", destination);
    params.set("date", format(date, "yyyy-MM-dd"));
    if (tripType === "round-trip" && returnDate) {
        params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
    }
    params.set("passengers", totalPassengers.toString());
    params.set("adults", adults.toString());
    params.set("children", children.toString());
    params.set("infants", infants.toString());
    params.set("cabinClass", cabinClass);

    setLocation(`/search?${params.toString()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "bg-white rounded-2xl shadow-2xl border border-gray-100 relative z-10 max-w-5xl mx-auto",
        className
      )}
    >
      <div className="px-6 md:px-8 pt-6 pb-3 flex items-center justify-between flex-wrap gap-3">
        <Tabs defaultValue="round-trip" value={tripType} onValueChange={setTripType}>
          <TabsList className="bg-gray-100 p-1 rounded-xl">
            {["round-trip", "one-way", "multi-city"].map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 rounded-lg px-4 py-2 transition-all text-sm font-semibold"
                data-testid={`tab-${type}`}
              >
                {t(`search.${type.replace("-", "_")}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <form onSubmit={handleSearch} className="px-6 md:px-8 pb-6 md:pb-8 pt-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <LocationSearch 
            label={t("search.origin")}
            placeholder={t("search.city_placeholder")}
            value={origin}
            onChange={setOrigin}
          />

          <div className="hidden md:flex justify-center items-end pb-1">
            <button 
              type="button"
              className="bg-white rounded-full p-2.5 border-2 border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-sm"
              onClick={() => {
                const temp = origin;
                setOrigin(destination);
                setDestination(temp);
              }}
              data-testid="button-swap"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          </div>

          <LocationSearch 
            label={t("search.destination")}
            placeholder={t("search.city_placeholder")}
            value={destination}
            onChange={setDestination}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block pl-1">{t("search.departure")}</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 h-14 flex items-center text-left hover:border-blue-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 group"
                  data-testid="button-departure-date"
                >
                  <CalendarIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span className={cn("text-base font-medium flex-1", !date ? "text-gray-400" : "text-gray-900")}>
                    {date ? format(date, "dd MMM yyyy") : t("search.date_placeholder")}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-gray-200" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className={cn("text-xs font-semibold text-gray-500 uppercase tracking-wider block pl-1", tripType === "one-way" && "opacity-40")}>{t("search.return")}</label>
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  type="button" 
                  className={cn(
                    "w-full bg-white border-2 border-gray-200 rounded-xl px-4 h-14 flex items-center text-left hover:border-blue-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 group",
                    tripType === "one-way" && "bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100 hover:border-gray-100"
                  )}
                  disabled={tripType === "one-way"}
                  data-testid="button-return-date"
                >
                  <CalendarIcon className={cn("h-5 w-5 mr-3 flex-shrink-0", tripType === "one-way" ? "text-gray-300" : "text-blue-500")} />
                  {tripType === "one-way" ? (
                    <span className="text-base font-medium text-gray-300 flex-1">{t("search.optional")}</span>
                  ) : (
                    <span className={cn("text-base font-medium flex-1", !returnDate ? "text-gray-400" : "text-gray-900")}>
                      {returnDate ? format(returnDate, "dd MMM yyyy") : t("search.date_placeholder")}
                    </span>
                  )}
                  <ChevronDown className={cn("h-4 w-4 transition-colors", tripType === "one-way" ? "text-gray-200" : "text-gray-300 group-hover:text-blue-400")} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-gray-200" align="start">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={setReturnDate}
                  initialFocus
                  disabled={(d) => d < (date || new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block pl-1">{t("search.passengers_class")}</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 h-14 flex items-center text-left hover:border-blue-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 group"
                  data-testid="button-passengers"
                >
                  <Users className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <span className="text-base font-semibold text-gray-900 leading-tight">
                      {totalPassengers} {totalPassengers !== 1 ? t("search.people") : t("search.person")}
                    </span>
                    <span className="text-xs text-blue-500 leading-tight font-medium">
                      {classLabel(cabinClass)}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-5 rounded-xl shadow-xl border-gray-200" align="end">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">{t("search.class")}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "economy" },
                        { id: "premium_economy" },
                        { id: "business" },
                        { id: "first" },
                      ].map((cls) => (
                        <div 
                          key={cls.id}
                          onClick={() => setCabinClass(cls.id)}
                          className={cn(
                            "cursor-pointer text-sm p-2.5 rounded-lg border text-center transition-all duration-200 font-medium",
                            cabinClass === cls.id 
                              ? "bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20" 
                              : "border-gray-200 hover:bg-gray-50 text-gray-600"
                          )}
                          data-testid={`class-option-${cls.id}`}
                        >
                          {classLabel(cls.id)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">{t("search.passengers")}</h4>
                    {[
                      { label: t("search.adults"), sub: t("search.adults_desc"), value: adults, set: setAdults, min: 1 },
                      { label: t("search.children"), sub: t("search.children_desc"), value: children, set: setChildren, min: 0 },
                      { label: t("search.infants"), sub: t("search.infants_desc"), value: infants, set: setInfants, min: 0 },
                    ].map((pax) => (
                      <div key={pax.label} className="flex justify-between items-center gap-4">
                        <div>
                          <div className="font-bold text-sm text-gray-900">{pax.label}</div>
                          <div className="text-xs text-gray-400">{pax.sub}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => pax.set(Math.max(pax.min, pax.value - 1))}
                            className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30"
                            disabled={pax.value <= pax.min}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-bold w-4 text-center text-gray-900">{pax.value}</span>
                          <button 
                            type="button"
                            onClick={() => pax.set(Math.min(9, pax.value + 1))}
                            className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <label className="text-xs font-semibold text-transparent uppercase tracking-wider block pl-1 hidden lg:block">&nbsp;</label>
            <Button 
              type="submit" 
              size="lg" 
              data-testid="button-search-flights"
              className="h-14 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/25 transition-all text-base gap-2"
            >
              <Search className="h-5 w-5" />
              {t("search.button")}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
