import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Users, 
  Search, 
  ArrowRightLeft, 
  Plus, 
  Minus, 
  ChevronDown, 
  Trash2,
  MapPin,
  Plane,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
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
    legs?: MultiCityLeg[];
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

  const [multiCityLegs, setMultiCityLegs] = useState<MultiCityLeg[]>(
    defaultValues?.legs || [
      { origin: "", destination: "", date: undefined },
      { origin: "", destination: "", date: undefined },
    ]
  );

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
    if (defaultValues.legs) {
       setMultiCityLegs(defaultValues.legs);
    }
  }, [defaultValues]);

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

  const handleSearch = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (tripType === "multi-city") {
      for (let i = 0; i < multiCityLegs.length; i++) {
        const leg = multiCityLegs[i];
        if (!leg.origin || !leg.destination || !leg.date) {
          toast({ title: t("search.validation_error"), description: `${t("search.fill_all_fields")} (Leg ${i+1})`, variant: "destructive" });
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
      params.set("children", children.toString());
      params.set("infants", infants.toString());
      params.set("cabinClass", cabinClass);
      appendExtraSearchParams(params);
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
          ? "rounded-[32px] border border-white/10 bg-slate-900/40 backdrop-blur-3xl shadow-2xl"
          : "max-w-6xl rounded-[48px] border border-white/10 bg-slate-900/60 backdrop-blur-3xl shadow-2xl",
        className
      )}
      id="flight-search-form"
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none rounded-[inherit]" />

      <div className={cn(isCompact ? "p-4" : "p-6 md:p-10")}>
        {!isCompact && (
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <Tabs value={tripType} onValueChange={setTripType} className="w-full md:w-auto">
              <TabsList className="flex h-14 w-full md:w-auto overflow-x-auto items-center rounded-2xl bg-white/5 p-1.5 border border-white/5 scrollbar-hide">
                {["round-trip", "one-way", "multi-city"].map((type) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="flex-1 md:flex-none whitespace-nowrap rounded-xl px-7 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl"
                  >
                    {t(`search.${type.replace("-", "_")}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                  <Sparkles className="h-4 w-4 text-coral-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{t("search.midnight_search")}</span>
               </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className={cn(isCompact ? "space-y-4" : "space-y-8")}>
          {tripType !== "multi-city" ? (
             <div className={cn(
              "grid gap-4 items-end",
              isCompact ? "grid-cols-1 md:grid-cols-12" : "grid-cols-1 md:grid-cols-11"
            )}>
              {/* Departure Location */}
              <div className={cn(isCompact ? "md:col-span-3" : "md:col-span-3")}>
                  <LocationSearch
                    label={isCompact ? "" : t("search.from")}
                    value={origin}
                    onChange={setOrigin}
                    placeholder={t("search.from")}
                    isLarge={!isCompact}
                    className="w-full"
                    dark={true}
                  />
              </div>

              {/* Swap Button */}
              <div className={cn(
                "flex items-center justify-center",
                isCompact ? "md:col-span-1" : "md:col-span-1"
              )}>
                <button
                  type="button"
                  onClick={() => { const tmp = origin; setOrigin(destination); setDestination(tmp); }}
                  className={cn(
                    "rounded-2xl border border-white/10 bg-slate-900 shadow-2xl text-blue-400 hover:text-white hover:border-blue-500 hover:bg-blue-600 transition-all active:scale-90 z-20",
                    isCompact ? "h-11 w-11" : "h-14 md:h-20 w-14 md:w-20"
                  )}
                >
                  <ArrowRightLeft className={cn(isCompact ? "h-5 w-5 mx-auto" : "h-6 w-6 mx-auto")} />
                </button>
              </div>

              {/* Arrival Location */}
              <div className={cn(isCompact ? "md:col-span-3" : "md:col-span-3")}>
                <LocationSearch
                  label={isCompact ? "" : t("search.to")}
                  value={destination}
                  onChange={setDestination}
                  placeholder={t("search.to")}
                  isLarge={!isCompact}
                  className="w-full"
                  dark={true}
                />
              </div>

              {/* Dates */}
              <div className={cn(
                "grid gap-4",
                isCompact ? "md:col-span-5 grid-cols-2" : "md:col-span-4 grid-cols-2"
              )}>
                  <div className="relative">
                    {!isCompact && <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block pl-1 mb-2">{t("search.departure")}</label>}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className={cn(
                          "w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 flex items-center justify-between text-left hover:bg-white/5 hover:border-blue-500/50 transition-all group",
                          isCompact ? "h-14 md:h-14" : "h-14 md:h-20"
                        )}>
                          <div className="flex items-center gap-3 truncate">
                            <CalendarIcon className={cn("text-blue-400", isCompact ? "h-4 w-4" : "h-5 w-5")} />
                            <span className={cn("font-black truncate uppercase tracking-widest", !date ? "text-slate-600" : "text-white", isCompact ? "text-[10px]" : "text-xs")}>
                              {date ? format(date, "dd MMM") : t("search.departure")}
                            </span>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 border border-white/10 bg-slate-950 shadow-2xl rounded-3xl overflow-hidden" align="start">
                        <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} className="bg-slate-950 text-white" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="relative">
                    {!isCompact && <label className={cn("text-[10px] font-black uppercase tracking-widest text-slate-500 block pl-1 mb-2", tripType === "one-way" && "opacity-20")}>{t("search.return")}</label>}
                    <Popover>
                      <PopoverTrigger asChild disabled={tripType === "one-way"}>
                        <button type="button" className={cn(
                          "w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 flex items-center justify-between text-left transition-all group",
                          isCompact ? "h-14 md:h-14" : "h-14 md:h-20",
                          tripType === "one-way" ? "opacity-20 cursor-not-allowed" : "hover:bg-white/5 hover:border-blue-500/50"
                        )}>
                          <div className="flex items-center gap-3 truncate">
                            <CalendarIcon className={cn(tripType === "one-way" ? "text-slate-700" : "text-blue-400", isCompact ? "h-4 w-4" : "h-5 w-5")} />
                            <span className={cn("font-black truncate uppercase tracking-widest", !returnDate ? "text-slate-600" : "text-white", isCompact ? "text-[10px]" : "text-xs")}>
                              {tripType === "one-way" ? "—" : returnDate ? format(returnDate, "dd MMM") : t("search.return")}
                            </span>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 border border-white/10 bg-slate-950 shadow-2xl rounded-3xl overflow-hidden" align="start">
                        <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} disabled={(d) => (date ? d < date : d < new Date())} className="bg-slate-950 text-white" />
                      </PopoverContent>
                    </Popover>
                  </div>
              </div>
            </div>
          ) : (
            /* Multi-City Legs */
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {multiCityLegs.map((leg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-1 md:grid-cols-11 gap-4 items-end bg-white/5 p-6 rounded-[32px] border border-white/5 relative group"
                  >
                    <div className="md:col-span-3">
                      <LocationSearch
                        label={t("search.from")}
                        value={leg.origin}
                        onChange={(val) => updateLeg(index, "origin", val)}
                        placeholder={t("search.from")}
                        isLarge={true}
                        dark={true}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-center justify-center pb-2">
                       <div className="h-10 w-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                          <Plane className="h-4 w-4 text-blue-400 md:rotate-0 rotate-90" />
                       </div>
                    </div>
                    <div className="md:col-span-3">
                      <LocationSearch
                        label={t("search.to")}
                        value={leg.destination}
                        onChange={(val) => updateLeg(index, "destination", val)}
                        placeholder={t("search.to")}
                        isLarge={true}
                        dark={true}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block pl-1 mb-2">{t("search.date")}</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="h-14 md:h-20 w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 flex items-center justify-between text-left hover:bg-white/5 hover:border-blue-500/50 transition-all">
                            <div className="flex items-center gap-3 truncate">
                              <CalendarIcon className="text-blue-400 h-5 w-5" />
                              <span className={cn("font-black uppercase tracking-widest text-xs", !leg.date ? "text-slate-600" : "text-white")}>
                                {leg.date ? format(leg.date, "dd MMM") : t("search.departure_date")}
                              </span>
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 border border-white/10 bg-slate-950 shadow-2xl rounded-3xl overflow-hidden" align="start">
                          <Calendar 
                            mode="single" 
                            selected={leg.date} 
                            onSelect={(val) => updateLeg(index, "date", val)} 
                            disabled={(d) => {
                              if (index > 0 && multiCityLegs[index-1].date) {
                                return d < multiCityLegs[index-1].date!;
                              }
                              return d < new Date();
                            }}
                            className="bg-slate-950 text-white" 
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-end pb-2">
                      {multiCityLegs.length > 2 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          onClick={() => removeLeg(index)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={addLeg}
                    disabled={multiCityLegs.length >= 5}
                    className="h-12 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600 hover:text-white transition-all px-8"
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    {t("search.multi_city_add")}
                  </Button>
              </div>
            </div>
          )}

          {/* Passengers & Search Button Row */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-end pt-8 border-t border-white/5">
             {/* Passenger / Class Picker */}
             <div className="md:col-span-7">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block pl-1 mb-2">{t("search.pax_class")}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="h-16 w-full px-6 rounded-2xl bg-slate-950/40 border border-white/10 text-white flex items-center gap-4 hover:border-blue-500/50 hover:bg-white/5 transition-all shadow-xl group">
                      <div className="flex items-center gap-3">
                         <Users className="h-5 w-5 text-blue-400" />
                         <span className="text-xs font-black uppercase tracking-widest">{totalPassengers} {t("search.pax")}</span>
                      </div>
                      <div className="h-4 w-px bg-white/10" />
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-blue-300 transition-colors uppercase">{classLabel(cabinClass)}</span>
                         <ChevronDown className="h-4 w-4 text-slate-600" />
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-8 rounded-[40px] border border-white/10 bg-slate-950 shadow-2xl relative overflow-hidden" align="start">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-coral-500 to-indigo-600" />
                      <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("search.travel_class")}</p>
                          <div className="grid grid-cols-2 gap-3">
                            {["economy", "premium_economy", "business", "first"].map(cls => (
                              <button key={cls} type="button" onClick={() => setCabinClass(cls)} className={cn("py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all", cabinClass === cls ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20" : "bg-white/5 border-white/5 text-slate-500 hover:border-blue-500/30")}>
                                {classLabel(cls)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("search.select_travelers")}</p>
                          {[
                            { label: t("search.adults"), description: "12+ anos", val: adults, set: setAdults, min: 1 },
                            { label: t("search.children"), description: "2-11 anos", val: children, set: setChildren, min: 0 },
                            { label: t("search.infants"), description: "0-2 anos", val: infants, set: setInfants, min: 0 }
                          ].map(p => (
                            <div key={p.label} className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold text-white">{p.label}</p>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{p.description}</p>
                              </div>
                              <div className="flex items-center gap-5">
                                <button type="button" onClick={() => p.set(Math.max(p.min, p.val - 1))} className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-all active:scale-90"><Minus className="h-4 w-4" /></button>
                                <span className="text-base font-black w-4 text-center text-white">{p.val}</span>
                                <button type="button" onClick={() => p.set(Math.min(9, p.val + 1))} className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-all active:scale-90"><Plus className="h-4 w-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                  </PopoverContent>
                </Popover>
             </div>

             <div className="md:col-span-4">
                <Button 
                  onClick={handleSearch}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95",
                    isCompact ? "h-14 md:h-14 rounded-2xl text-[10px]" : "h-14 md:h-20 rounded-[28px] text-xs"
                  )}
                >
                  <Search className="h-5 w-5 mr-3" />
                  {isSubmitting ? t("results.loading") : t("home.hero.cta")}
                </Button>
             </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
