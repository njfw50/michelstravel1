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
        "bg-white rounded-2xl shadow-xl border border-gray-100 relative z-10 max-w-5xl mx-auto overflow-hidden",
        className
      )}
    >
        <div className="px-6 pt-5 pb-2">
            <Tabs defaultValue="round-trip" value={tripType} onValueChange={setTripType} className="w-full">
                <TabsList className="bg-transparent p-0 h-auto gap-1 justify-start">
                    {["round-trip", "one-way", "multi-city"].map((type) => (
                        <TabsTrigger
                            key={type}
                            value={type}
                            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-none text-gray-400 rounded-lg px-4 py-2 transition-all text-sm font-semibold"
                            data-testid={`tab-${type}`}
                        >
                            {t(`search.${type.replace("-", "_")}`)}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>

      <form onSubmit={handleSearch} className="p-5 md:p-6 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-4 items-end">
            
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end lg:col-span-2">
                <LocationSearch 
                    label={t("search.origin")}
                    placeholder={t("search.city_placeholder")}
                    value={origin}
                    onChange={setOrigin}
                />

                <div className="flex justify-center pb-2">
                     <button 
                        type="button"
                        className="bg-gray-100 rounded-full p-2.5 border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
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

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">{t("search.departure")}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button type="button" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 h-12 flex items-center text-left hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20" data-testid="button-departure-date">
                                <CalendarIcon className="h-4 w-4 text-blue-500 mr-2.5 flex-shrink-0" />
                                <span className={cn("text-sm font-medium truncate", !date ? "text-gray-400" : "text-gray-900")}>
                                    {date ? format(date, "dd/MM/yyyy") : t("search.date_placeholder")}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
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

                <div className="space-y-1.5">
                    <Label className={cn("text-[11px] font-bold text-gray-400 uppercase tracking-widest block", tripType === "one-way" && "opacity-40")}>{t("search.return")}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button 
                                type="button" 
                                className={cn(
                                    "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 h-12 flex items-center text-left hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20",
                                    tripType === "one-way" && "bg-gray-50/50 text-gray-300 cursor-not-allowed border-gray-100"
                                )}
                                disabled={tripType === "one-way"}
                                data-testid="button-return-date"
                            >
                                <CalendarIcon className="h-4 w-4 text-blue-500 mr-2.5 flex-shrink-0" />
                                {tripType === "one-way" ? (
                                    <span className="text-sm font-medium text-gray-300">{t("search.optional")}</span>
                                ) : (
                                    <span className={cn("text-sm font-medium truncate", !returnDate ? "text-gray-400" : "text-gray-900")}>
                                        {returnDate ? format(returnDate, "dd/MM/yyyy") : t("search.date_placeholder")}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
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
            </div>

            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">{t("search.passengers_class")}</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 h-12 flex items-center text-left hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20" data-testid="button-passengers">
                             <Users className="h-4 w-4 text-blue-500 mr-2.5 flex-shrink-0" />
                             <div className="flex flex-col justify-center overflow-hidden">
                                 <span className="text-sm font-bold text-gray-900 truncate leading-tight">
                                     {totalPassengers} {totalPassengers !== 1 ? t("search.people") : t("search.person")}
                                 </span>
                                 <span className="text-[10px] text-blue-500 truncate leading-tight font-medium">
                                    {classLabel(cabinClass)}
                                 </span>
                             </div>
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

            <div className="flex flex-col justify-end">
                <Button 
                    type="submit" 
                    size="lg" 
                    data-testid="button-search-flights"
                    className="h-12 w-full lg:w-auto px-8 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 transition-all uppercase tracking-wider text-sm"
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
