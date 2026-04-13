import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Users, Search, ArrowRightLeft, Plus, Minus, ChevronDown, Trash2 } from "lucide-react";
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
  isCompact?: boolean;
  defaultValues?: {
    origin: string;
    destination: string;
    date: Date | undefined;
    returnDate?: Date | undefined;
    passengers: string;
    adults?: string;
    children?: string;
    infants?: string;
    cabinClass?: string;
    tripType?: string;
  };
  extraSearchParams?: Record<string, string | undefined>;
}

interface MultiCityLeg {
  origin: string;
  destination: string;
  date: Date | undefined;
}

export function FlightSearchForm({ className, isCompact = false, defaultValues, extraSearchParams }: FlightSearchFormProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const [tripType, setTripType] = useState(
    defaultValues
      ? defaultValues.tripType || (defaultValues.returnDate ? "round-trip" : "one-way")
      : "round-trip",
  );
  
  const [origin, setOrigin] = useState(defaultValues?.origin || "");
  const [destination, setDestination] = useState(defaultValues?.destination || "");
  const [date, setDate] = useState<Date | undefined>(defaultValues?.date);
  const [returnDate, setReturnDate] = useState<Date | undefined>(defaultValues?.returnDate);

  const [multiCityLegs, setMultiCityLegs] = useState<MultiCityLeg[]>([
    { origin: "", destination: "", date: undefined },
    { origin: "", destination: "", date: undefined },
  ]);

  const [adults, setAdults] = useState(Number(defaultValues?.adults || "1"));
  const [children, setChildren] = useState(Number(defaultValues?.children || "0"));
  const [infants, setInfants] = useState(Number(defaultValues?.infants || "0"));
  const [cabinClass, setCabinClass] = useState(defaultValues?.cabinClass || "economy");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPassengers = adults + children + infants;

  useEffect(() => {
    if (!defaultValues) return;
    setTripType(defaultValues.tripType || (defaultValues.returnDate ? "round-trip" : "one-way"));
    setOrigin(defaultValues.origin || "");
    setDestination(defaultValues.destination || "");
    setDate(defaultValues.date);
    setReturnDate(defaultValues.returnDate);
    setAdults(Number(defaultValues.adults || "1"));
    setChildren(Number(defaultValues.children || "0"));
    setInfants(Number(defaultValues.infants || "0"));
    setCabinClass(defaultValues.cabinClass || "economy");
  }, [
    defaultValues?.adults,
    defaultValues?.cabinClass,
    defaultValues?.children,
    defaultValues?.date,
    defaultValues?.destination,
    defaultValues?.infants,
    defaultValues?.origin,
    defaultValues?.returnDate,
    defaultValues?.tripType,
  ]);

  const classLabel = (id: string) => t(`class.${id}`);
  const appendExtraSearchParams = (params: URLSearchParams) => {
    if (!extraSearchParams) return;
    for (const [key, value] of Object.entries(extraSearchParams)) {
      if (value) params.set(key, value);
    }
  };

  const updateLeg = (index: number, field: keyof MultiCityLeg, value: any) => {
    const updated = [...multiCityLegs];
    updated[index] = { ...updated[index], [field]: value };
    setMultiCityLegs(updated);
  };

  const addLeg = () => {
    if (multiCityLegs.length >= 5) return;
    const lastLeg = multiCityLegs[multiCityLegs.length - 1];
    setMultiCityLegs([...multiCityLegs, { origin: lastLeg.destination, destination: "", date: undefined }]);
  };

  const removeLeg = (index: number) => {
    if (multiCityLegs.length <= 2) return;
    setMultiCityLegs(multiCityLegs.filter((_, i) => i !== index));
  };

  const resolveToIata = async (text: string) => {
    const query = text.trim();
    if (!query) return null;
    try {
      const res = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) return null;
      const data = await res.json();
      const firstAirport = (data || []).find((p: any) => p.iataCode);
      return firstAirport?.iataCode || null;
    } catch {
      return null;
    }
  };

  const handleSearch = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (tripType === "multi-city") {
      for (let i = 0; i < multiCityLegs.length; i++) {
        const leg = multiCityLegs[i];
        if (!leg.origin || !leg.destination || !leg.date) {
          toast({ title: t("search.validation_error"), description: t("search.fill_all_fields"), variant: "destructive" });
          return;
        }
      }
      const params = new URLSearchParams();
      params.set("tripType", "multi-city");
      params.set("legs", JSON.stringify(multiCityLegs.map(l => ({
        origin: l.origin,
        destination: l.destination,
        date: l.date ? format(l.date, "yyyy-MM-dd") : "",
      }))));
      params.set("adults", adults.toString());
      params.set("cabinClass", cabinClass);
      setLocation(`/search?${params.toString()}`);
      return;
    }
    
    let originCode = origin?.trim();
    let destinationCode = destination?.trim();

    if (!originCode || !destinationCode || !date) {
        toast({ title: t("search.validation_error"), description: t("search.fill_all_fields"), variant: "destructive" });
        return;
    }

    const params = new URLSearchParams();
    params.set("origin", originCode.toUpperCase());
    params.set("destination", destinationCode.toUpperCase());
    params.set("date", format(date, "yyyy-MM-dd"));
    params.set("tripType", tripType);
    if (tripType === "round-trip" && returnDate) {
        params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
    }
    params.set("adults", adults.toString());
    params.set("children", children.toString());
    params.set("infants", infants.toString());
    params.set("cabinClass", cabinClass);
    appendExtraSearchParams(params);

    setLocation(`/search?${params.toString()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: isCompact ? -20 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative z-10 mx-auto w-full transition-all duration-300",
        isCompact 
          ? "rounded-[24px] border border-blue-100 bg-white/70 backdrop-blur-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]"
          : "max-w-6xl rounded-[40px] border border-slate-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)]",
        className
      )}
      id="flight-search-form"
    >
      <div className={cn(isCompact ? "p-3 md:p-4" : "p-4 md:p-8")}>
        {!isCompact && (
          <div className="mb-6 flex justify-center md:justify-start">
            <Tabs value={tripType} onValueChange={setTripType} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-slate-50 p-1 md:w-auto">
                {["round-trip", "one-way", "multi-city"].map((type) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  >
                    {t(`search.${type.replace("-", "_")}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <form onSubmit={handleSearch} className={cn(isCompact ? "space-y-3" : "space-y-8")}>
          <div className={cn(
            "grid gap-3",
            isCompact ? "grid-cols-1 md:grid-cols-12 items-center" : "grid-cols-1"
          )}>
            
            {/* Locations */}
            <div className={cn(
              "grid gap-2 items-center",
              isCompact ? "md:col-span-5 grid-cols-[1fr_40px_1fr]" : "md:grid-cols-11"
            )}>
              <div className={cn(!isCompact && "md:col-span-5")}>
                <LocationSearch
                  label={isCompact ? "" : t("search.from")}
                  value={origin}
                  onChange={setOrigin}
                  placeholder={t("search.from") || "Origem"}
                  isLarge={!isCompact}
                  className="w-full"
                />
              </div>
              
              <div className={cn(
                "flex items-center justify-center",
                !isCompact && "md:col-span-1 -my-4 md:my-0 md:pt-6"
              )}>
                <button
                  type="button"
                  onClick={() => { const tmp = origin; setOrigin(destination); setDestination(tmp); }}
                  className={cn(
                    "rounded-full border border-slate-100 bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all active:scale-90",
                    isCompact ? "h-8 w-8" : "h-11 w-11"
                  )}
                >
                  <ArrowRightLeft className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </button>
              </div>

              <div className={cn(!isCompact && "md:col-span-5")}>
                <LocationSearch
                  label={isCompact ? "" : t("search.to")}
                  value={destination}
                  onChange={setDestination}
                  placeholder={t("search.to") || "Destino"}
                  isLarge={!isCompact}
                  className="w-full"
                />
              </div>
            </div>

            {/* Dates & Extras */}
            <div className={cn(
              "grid gap-2",
              isCompact ? "md:col-span-5 md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"
            )}>
              {/* Departure */}
              <div className="relative">
                {!isCompact && <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pl-1 mb-2">{t("search.departure")}</label>}
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className={cn(
                      "w-full bg-slate-50 border border-slate-50 rounded-2xl px-4 flex items-center justify-between text-left hover:bg-white hover:border-blue-200 transition-all group",
                      isCompact ? "h-12" : "h-16"
                    )}>
                      <div className="flex items-center gap-2 truncate">
                        <CalendarIcon className={cn("text-blue-500", isCompact ? "h-3.5 w-3.5" : "h-5 w-5")} />
                        <span className={cn("font-bold truncate", !date ? "text-slate-300" : "text-slate-900", isCompact ? "text-xs" : "text-base")}>
                          {date ? format(date, "dd/MM") : t("search.departure")}
                        </span>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Return */}
              <div className="relative">
                {!isCompact && <label className={cn("text-[10px] font-black uppercase tracking-widest text-slate-400 block pl-1 mb-2", tripType === "one-way" && "opacity-20")}>{t("search.return")}</label>}
                <Popover>
                  <PopoverTrigger asChild disabled={tripType === "one-way"}>
                    <button type="button" className={cn(
                      "w-full bg-slate-50 border border-slate-50 rounded-2xl px-4 flex items-center justify-between text-left transition-all group",
                      isCompact ? "h-12" : "h-16",
                      tripType === "one-way" ? "opacity-30 cursor-not-allowed" : "hover:bg-white hover:border-blue-200"
                    )}>
                      <div className="flex items-center gap-2 truncate">
                        <CalendarIcon className={cn(tripType === "one-way" ? "text-slate-300" : "text-blue-500", isCompact ? "h-3.5 w-3.5" : "h-5 w-5")} />
                        <span className={cn("font-bold truncate", !returnDate ? "text-slate-300" : "text-slate-900", isCompact ? "text-xs" : "text-base")}>
                          {tripType === "one-way" ? "—" : returnDate ? format(returnDate, "dd/MM") : t("search.return")}
                        </span>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                    <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} disabled={(d) => (date ? d < date : d < new Date())} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Passengers */}
              <div className="relative">
                {!isCompact && <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pl-1 mb-2">{t("search.passengers")}</label>}
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className={cn(
                      "w-full bg-slate-50 border border-slate-50 rounded-2xl px-4 flex items-center justify-between text-left hover:bg-white hover:border-blue-200 transition-all group",
                      isCompact ? "h-12" : "h-16"
                    )}>
                      <div className="flex items-center gap-2 truncate">
                        <Users className={cn("text-blue-500", isCompact ? "h-3.5 w-3.5" : "h-5 w-5")} />
                        <span className={cn("font-bold truncate text-slate-900", isCompact ? "text-xs" : "text-base")}>{totalPassengers}</span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-slate-300" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-6 rounded-3xl border-none shadow-2xl" align="end">
                     <div className="space-y-6">
                       <div className="space-y-3">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classe</p>
                         <div className="grid grid-cols-2 gap-2">
                           {["economy", "business"].map(cls => (
                             <button key={cls} type="button" onClick={() => setCabinClass(cls)} className={cn("py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all", cabinClass === cls ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "border-slate-100 text-slate-400 hover:border-blue-200")}>
                               {classLabel(cls)}
                             </button>
                           ))}
                         </div>
                       </div>
                       <div className="space-y-4">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Viajantes</p>
                         {[
                           { label: t("search.adults"), val: adults, set: setAdults, min: 1 },
                           { label: t("search.children"), val: children, set: setChildren, min: 0 }
                         ].map(p => (
                           <div key={p.label} className="flex justify-between items-center">
                             <span className="text-sm font-bold text-slate-900">{p.label}</span>
                             <div className="flex items-center gap-4">
                               <button type="button" onClick={() => p.set(Math.max(p.min, p.val - 1))} className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"><Minus className="h-4 w-4" /></button>
                               <span className="text-sm font-black w-4 text-center">{p.val}</span>
                               <button type="button" onClick={() => p.set(Math.min(9, p.val + 1))} className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"><Plus className="h-4 w-4" /></button>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Submit */}
            <div className={cn(isCompact ? "md:col-span-2" : "mt-8")}>
              <Button type="submit" className={cn(
                "w-full rounded-2xl bg-blue-600 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 active:scale-95",
                isCompact ? "h-12" : "h-16"
              )}>
                {isCompact ? <Search className="h-4 w-4" /> : t("search.button")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
