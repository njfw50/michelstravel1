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

export function FlightSearchForm({ className, defaultValues, extraSearchParams }: FlightSearchFormProps) {
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
        if (!leg.origin) {
          toast({ title: `${t("search.leg") || "Leg"} ${i + 1}: ${t("search.origin")}`, description: t("search.city_placeholder"), variant: "destructive" });
          return;
        }
        if (!leg.destination) {
          toast({ title: `${t("search.leg") || "Leg"} ${i + 1}: ${t("search.destination")}`, description: t("search.city_placeholder"), variant: "destructive" });
          return;
        }
        if (!leg.date) {
          toast({ title: `${t("search.leg") || "Leg"} ${i + 1}: ${t("search.departure")}`, description: t("search.date_placeholder"), variant: "destructive" });
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
      params.set("passengers", totalPassengers.toString());
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

    if (!originCode) {
        toast({ title: t("search.origin"), description: t("search.city_placeholder"), variant: "destructive" });
        return;
    }
    if (!destinationCode) {
        toast({ title: t("search.destination"), description: t("search.city_placeholder"), variant: "destructive" });
        return;
    }

    if (!/^[A-Z]{3}$/i.test(originCode)) {
        setIsSubmitting(true);
        originCode = await resolveToIata(originCode);
        setIsSubmitting(false);
        if (!originCode) {
            toast({ title: t("search.origin"), description: t("search.city_placeholder"), variant: "destructive" });
            return;
        }
        setOrigin(originCode);
    }

    if (!/^[A-Z]{3}$/i.test(destinationCode)) {
        setIsSubmitting(true);
        destinationCode = await resolveToIata(destinationCode);
        setIsSubmitting(false);
        if (!destinationCode) {
            toast({ title: t("search.destination"), description: t("search.city_placeholder"), variant: "destructive" });
            return;
        }
        setDestination(destinationCode);
    }
    if (!date) {
        toast({ title: t("search.departure"), description: t("search.date_placeholder"), variant: "destructive" });
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
    params.set("passengers", totalPassengers.toString());
    params.set("adults", adults.toString());
    params.set("children", children.toString());
    params.set("infants", infants.toString());
    params.set("cabinClass", cabinClass);
    appendExtraSearchParams(params);

    setLocation(`/search?${params.toString()}`);
    requestAnimationFrame(() => {
      const form = document.getElementById("flight-search-form");
      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        const firstInput = form.querySelector("input");
        if (firstInput instanceof HTMLInputElement) firstInput.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "relative z-10 mx-auto max-w-6xl rounded-[40px] border border-slate-100 bg-white p-2 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)]",
        className
      )}
      id="flight-search-form"
    >
      <div className="p-4 md:p-8">
        {/* Tabs for Trip Type */}
        <div className="mb-8 flex justify-center md:justify-start">
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

        <form onSubmit={handleSearch} className="space-y-8">
          {tripType === "multi-city" ? (
            <div className="space-y-4">
              {multiCityLegs.map((leg, i) => (
                <div key={i} className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-blue-200">
                  <div className="md:col-span-4">
                    <LocationSearch
                      label={`${t("search.leg") || "Leg"} ${i + 1}: ${t("search.origin")}`}
                      value={leg.origin}
                      onChange={(v) => updateLeg(i, "origin", v)}
                      placeholder={t("search.city_placeholder")}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <LocationSearch
                      label={t("search.destination")}
                      value={leg.destination}
                      onChange={(v) => updateLeg(i, "destination", v)}
                      placeholder={t("search.city_placeholder")}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{t("search.departure")}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-4 flex items-center justify-between text-left hover:border-blue-300 transition-all group">
                          <span className={cn("text-sm font-bold", !leg.date ? "text-slate-300" : "text-slate-900")}>
                            {leg.date ? format(leg.date, "dd MMM yyyy") : t("search.date_placeholder")}
                          </span>
                          <CalendarIcon className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                        <Calendar mode="single" selected={leg.date} onSelect={(d) => updateLeg(i, "date", d)} disabled={(d) => d < new Date()} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="md:col-span-1 flex items-end pb-1 justify-center">
                    {multiCityLegs.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLeg(i)} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {multiCityLegs.length < 5 && (
                <button type="button" onClick={addLeg} className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> {t("search.add_leg") || "Adicionar novo trecho"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Search Row */}
              <div className="relative grid grid-cols-1 md:grid-cols-11 gap-4 items-end">
                <div className="md:col-span-5">
                  <LocationSearch
                    label={t("search.from") || "Origem"}
                    value={origin}
                    onChange={setOrigin}
                    placeholder={t("search.origin_placeholder") || "De onde você sai?"}
                    isLarge
                  />
                </div>
                
                <div className="md:col-span-1 flex items-center justify-center -my-4 md:my-0 md:pt-8 z-10">
                  <button
                    type="button"
                    onClick={() => { const tmp = origin; setOrigin(destination); setDestination(tmp); }}
                    className="h-12 w-12 rounded-full border border-slate-100 bg-white shadow-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all active:scale-90"
                  >
                    <ArrowRightLeft className="h-5 w-5" />
                  </button>
                </div>

                <div className="md:col-span-5">
                  <LocationSearch
                    label={t("search.to") || "Destino"}
                    value={destination}
                    onChange={setDestination}
                    placeholder={t("search.destination_placeholder") || "Para onde você vai?"}
                    isLarge
                  />
                </div>
              </div>

              {/* Date and Passengers Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pl-1">{t("search.departure")}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-full h-16 bg-slate-50 border border-slate-50 rounded-2xl px-5 flex items-center justify-between text-left hover:bg-white hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-blue-500" />
                          <span className={cn("text-base font-bold", !date ? "text-slate-300" : "text-slate-900")}>
                            {date ? format(date, "dd MMM yyyy") : t("search.date_placeholder")}
                          </span>
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                      <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest text-slate-400 block pl-1", tripType === "one-way" && "opacity-20")}>{t("search.return")}</label>
                  <Popover>
                    <PopoverTrigger asChild disabled={tripType === "one-way"}>
                      <button type="button" className={cn("w-full h-16 bg-slate-50 border border-slate-50 rounded-2xl px-5 flex items-center justify-between text-left transition-all group", tripType === "one-way" ? "opacity-40 cursor-not-allowed" : "hover:bg-white hover:border-blue-200")}>
                        <div className="flex items-center gap-3">
                          <CalendarIcon className={cn("h-5 w-5", tripType === "one-way" ? "text-slate-300" : "text-blue-500")} />
                          <span className={cn("text-base font-bold", !returnDate ? "text-slate-300" : "text-slate-900")}>
                            {tripType === "one-way" ? t("search.optional") : returnDate ? format(returnDate, "dd MMM yyyy") : t("search.date_placeholder")}
                          </span>
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                      <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} disabled={(d) => d < (date || new Date())} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pl-1">{t("search.passengers")}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-full h-16 bg-slate-50 border border-slate-50 rounded-2xl px-5 flex items-center justify-between text-left hover:bg-white hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-blue-500" />
                          <span className="text-base font-bold text-slate-900">{totalPassengers} {totalPassengers !== 1 ? t("search.people") : t("search.person")}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-300" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-6 rounded-3xl border-none shadow-2xl" align="end">
                       <div className="space-y-6">
                         <div className="space-y-3">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classe</p>
                           <div className="grid grid-cols-2 gap-2">
                             {["economy", "business"].map(cls => (
                               <button key={cls} type="button" onClick={() => setCabinClass(cls)} className={cn("py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all", cabinClass === cls ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30" : "border-slate-100 text-slate-400 hover:border-blue-200")}>
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

                <div className="flex items-end">
                  <Button type="submit" className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 active:scale-95">
                    {t("search.button")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
