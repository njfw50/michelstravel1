import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Users, Search, ArrowRightLeft, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
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
        "bg-black/30 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-1 border border-white/10 relative z-10 max-w-5xl mx-auto",
        className
      )}
    >
        <div className="px-6 pt-4 pb-2">
            <Tabs defaultValue="round-trip" value={tripType} onValueChange={setTripType} className="w-full">
                <TabsList className="bg-transparent p-0 h-auto gap-6 justify-start">
                    <TabsTrigger 
                        value="round-trip" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white data-[state=active]:font-bold text-white/60 rounded-none border-b-4 border-transparent data-[state=active]:border-amber-400 px-0 pb-2 transition-all text-sm uppercase tracking-wide font-semibold hover:text-white/80"
                        data-testid="tab-round-trip"
                    >
                        {t("search.round_trip")}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="one-way" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white data-[state=active]:font-bold text-white/60 rounded-none border-b-4 border-transparent data-[state=active]:border-amber-400 px-0 pb-2 transition-all text-sm uppercase tracking-wide font-semibold hover:text-white/80"
                        data-testid="tab-one-way"
                    >
                        {t("search.one_way")}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="multi-city" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white data-[state=active]:font-bold text-white/60 rounded-none border-b-4 border-transparent data-[state=active]:border-amber-400 px-0 pb-2 transition-all text-sm uppercase tracking-wide font-semibold hover:text-white/80"
                        data-testid="tab-multi-city"
                    >
                        {t("search.multi_city")}
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

      <form onSubmit={handleSearch} className="p-4 md:p-6 bg-transparent border-t border-white/10">
        <div className="flex flex-col lg:flex-row gap-4">
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <LocationSearch 
                    label={t("search.origin")}
                    placeholder={t("search.city_placeholder")}
                    value={origin}
                    onChange={setOrigin}
                />

                <div className="flex justify-center md:pt-6">
                     <button 
                        type="button"
                        className="bg-white/10 rounded-full p-2 border border-white/20 text-white/70 hover:text-white hover:border-amber-400 hover:bg-amber-500/20 transition-all shadow-lg backdrop-blur-md"
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

            <div className="flex-[0.8] grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs font-bold text-white/70 uppercase tracking-wider block">{t("search.departure")}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button type="button" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 h-14 flex items-center text-left hover:bg-white/15 hover:border-white/20 transition-all shadow-lg backdrop-blur-sm focus:ring-2 focus:ring-amber-400/50" data-testid="button-departure-date">
                                <CalendarIcon className="h-5 w-5 text-amber-300 mr-3" />
                                <span className={cn("text-base font-medium truncate", !date ? "text-white/30" : "text-white")}>
                                    {date ? format(date, "dd/MM/yyyy") : t("search.date_placeholder")}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[hsl(220,18%,10%)] border-white/10 text-white" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                disabled={(date) => date < new Date()}
                                className="bg-[hsl(220,18%,10%)] text-white rounded-md border border-white/10"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-1">
                    <Label className={cn("text-xs font-bold text-white/70 uppercase tracking-wider block", tripType === "one-way" && "opacity-50")}>{t("search.return")}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button 
                                type="button" 
                                className={cn(
                                    "w-full bg-white/10 border border-white/10 rounded-xl px-3 h-14 flex items-center text-left hover:bg-white/15 hover:border-white/20 transition-all shadow-lg backdrop-blur-sm focus:ring-2 focus:ring-amber-400/50 relative",
                                    tripType === "one-way" && "bg-white/5 text-white/20 cursor-not-allowed border-white/5 shadow-none"
                                )}
                                disabled={tripType === "one-way"}
                                data-testid="button-return-date"
                            >
                                <CalendarIcon className="h-5 w-5 text-amber-300 mr-3" />
                                {tripType === "one-way" ? (
                                    <span className="text-sm font-medium text-white/20">{t("search.optional")}</span>
                                ) : (
                                    <span className={cn("text-base font-medium truncate", !returnDate ? "text-white/30" : "text-white")}>
                                        {returnDate ? format(returnDate, "dd/MM/yyyy") : t("search.date_placeholder")}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[hsl(220,18%,10%)] border-white/10 text-white" align="start">
                            <Calendar
                                mode="single"
                                selected={returnDate}
                                onSelect={setReturnDate}
                                initialFocus
                                disabled={(d) => d < (date || new Date())}
                                className="bg-[hsl(220,18%,10%)] text-white rounded-md border border-white/10"
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="flex-[0.6] space-y-1">
                <Label className="text-xs font-bold text-white/70 uppercase tracking-wider block">{t("search.passengers_class")}</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 h-14 flex items-center text-left hover:bg-white/15 hover:border-white/20 transition-all shadow-lg backdrop-blur-sm focus:ring-2 focus:ring-amber-400/50" data-testid="button-passengers">
                             <Users className="h-5 w-5 text-amber-300 mr-3" />
                             <div className="flex flex-col justify-center overflow-hidden">
                                 <span className="text-sm font-bold text-white truncate leading-tight">
                                     {totalPassengers} {totalPassengers !== 1 ? t("search.people") : t("search.person")}
                                 </span>
                                 <span className="text-xs text-amber-200/70 truncate leading-tight">
                                    {classLabel(cabinClass)}
                                 </span>
                             </div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-5 rounded-xl shadow-2xl border-white/10 bg-[hsl(220,18%,10%)]/95 backdrop-blur-xl text-white" align="end">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="font-bold text-sm text-white border-b border-white/10 pb-2">{t("search.class")}</h4>
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
                                                "cursor-pointer text-sm p-2 rounded-lg border text-center transition-all font-medium",
                                                cabinClass === cls.id 
                                                    ? "bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-900/50" 
                                                    : "border-white/10 hover:bg-white/10 text-white/70"
                                            )}
                                            data-testid={`class-option-${cls.id}`}
                                        >
                                            {classLabel(cls.id)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                 <h4 className="font-bold text-sm text-white border-b border-white/10 pb-2">{t("search.passengers")}</h4>
                                 
                                 {[
                                   { label: t("search.adults"), sub: t("search.adults_desc"), value: adults, set: setAdults, min: 1 },
                                   { label: t("search.children"), sub: t("search.children_desc"), value: children, set: setChildren, min: 0 },
                                   { label: t("search.infants"), sub: t("search.infants_desc"), value: infants, set: setInfants, min: 0 },
                                 ].map((pax) => (
                                   <div key={pax.label} className="flex justify-between items-center">
                                     <div>
                                       <div className="font-bold text-sm text-white">{pax.label}</div>
                                       <div className="text-xs text-white/50">{pax.sub}</div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                       <button 
                                         type="button"
                                         onClick={() => pax.set(Math.max(pax.min, pax.value - 1))}
                                         className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                                         disabled={pax.value <= pax.min}
                                       >
                                         <Minus className="h-4 w-4" />
                                       </button>
                                       <span className="text-sm font-bold w-4 text-center text-white">{pax.value}</span>
                                       <button 
                                         type="button"
                                         onClick={() => pax.set(Math.min(9, pax.value + 1))}
                                         className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
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

            <div className="flex flex-col justify-end">
                <Button 
                    type="submit" 
                    size="lg" 
                    data-testid="button-search-flights"
                    className="h-14 w-full lg:w-auto px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold shadow-lg shadow-amber-900/40 hover:shadow-amber-500/40 transition-all uppercase tracking-wide text-sm border-0"
                >
                    <Search className="mr-2 h-4 w-4" />
                    {t("search.button")}
                </Button>
            </div>
        </div>
      </form>
    </motion.div>
  );
}
