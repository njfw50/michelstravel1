import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Users, Search, ArrowRightLeft, Plus, Minus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

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
  const [tripType, setTripType] = useState("round-trip");
  
  // Basic Search State
  const [origin, setOrigin] = useState(defaultValues?.origin || "");
  const [destination, setDestination] = useState(defaultValues?.destination || "");
  const [date, setDate] = useState<Date | undefined>(defaultValues?.date);
  const [returnDate, setReturnDate] = useState<Date | undefined>();

  // Advanced State
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("economy");

  const totalPassengers = adults + children + infants;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;

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
        "bg-white rounded-3xl shadow-2xl shadow-blue-900/10 p-1 border border-white/50 backdrop-blur-sm relative z-10 max-w-5xl mx-auto",
        className
      )}
    >
        <div className="px-6 pt-4 pb-2">
            <Tabs defaultValue="round-trip" value={tripType} onValueChange={setTripType} className="w-full">
                <TabsList className="bg-transparent p-0 h-auto gap-6 justify-start">
                    <TabsTrigger 
                        value="round-trip" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-bold text-slate-500 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-2 transition-all"
                    >
                        Ida e Volta
                    </TabsTrigger>
                    <TabsTrigger 
                        value="one-way" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-bold text-slate-500 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-2 transition-all"
                    >
                        Só Ida
                    </TabsTrigger>
                    <TabsTrigger 
                        value="multi-city" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-bold text-slate-500 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-2 transition-all"
                    >
                        Vários Destinos
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

      <form onSubmit={handleSearch} className="p-4 md:p-6 bg-slate-50/50 rounded-[1.25rem]">
        <div className="flex flex-col lg:flex-row gap-2">
            
            {/* Location Group */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="relative pl-4">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Origem</Label>
                    <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                        <Input 
                            placeholder="Cidade ou Aeroporto" 
                            className="border-none shadow-none focus-visible:ring-0 p-0 h-7 text-base font-semibold placeholder:text-slate-300 w-full bg-transparent truncate"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-center -my-3 md:my-0 relative z-10">
                     <button 
                        type="button"
                        className="bg-slate-50 rounded-full p-2 border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all hover:rotate-180"
                        onClick={() => {
                            const temp = origin;
                            setOrigin(destination);
                            setDestination(temp);
                        }}
                    >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="relative pl-4 md:pl-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Destino</Label>
                    <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                        <Input 
                            placeholder="Cidade ou Aeroporto" 
                            className="border-none shadow-none focus-visible:ring-0 p-0 h-7 text-base font-semibold placeholder:text-slate-300 w-full bg-transparent truncate"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Date Group */}
            <div className="flex-[0.8] grid grid-cols-2 gap-0.5 bg-slate-200 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className="bg-white p-3 h-full flex flex-col justify-center text-left hover:bg-slate-50 transition-colors w-full">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5 cursor-pointer">Ida</Label>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-base font-semibold truncate", !date && "text-slate-300")}>
                                    {date ? format(date, "MMM dd, yyyy") : "Escolher data"}
                                </span>
                            </div>
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

                <Popover>
                    <PopoverTrigger asChild>
                        <button 
                            type="button" 
                            className={cn(
                                "bg-white p-3 h-full flex flex-col justify-center text-left hover:bg-slate-50 transition-colors w-full relative",
                                tripType === "one-way" && "opacity-50 cursor-not-allowed bg-slate-50"
                            )}
                            disabled={tripType === "one-way"}
                        >
                            {tripType === "one-way" && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-medium text-slate-400">Só Ida</span>
                                </div>
                            )}
                            <div className={tripType === "one-way" ? "opacity-0" : ""}>
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5 cursor-pointer">Volta</Label>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-base font-semibold truncate", !returnDate && "text-slate-300")}>
                                        {returnDate ? format(returnDate, "MMM dd, yyyy") : "Escolher data"}
                                    </span>
                                </div>
                            </div>
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

            {/* Travelers & Class */}
            <Popover>
                <PopoverTrigger asChild>
                    <button type="button" className="flex-[0.6] bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center text-left hover:bg-slate-50 transition-colors">
                         <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5 cursor-pointer">Passageiros & Classe</Label>
                         <div className="flex items-center gap-2">
                             <span className="text-base font-semibold truncate text-slate-900">
                                 {totalPassengers} {totalPassengers !== 1 ? 'Viajantes' : 'Viajante'}, {cabinClass === 'economy' ? 'Econ' : cabinClass === 'premium_economy' ? 'Prem' : cabinClass === 'business' ? 'Exec' : 'Prim'}
                             </span>
                         </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-5 rounded-xl shadow-xl" align="end">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-slate-900 border-b pb-2">Classe</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: "economy", label: "Econômica" },
                                    { id: "premium_economy", label: "Econ. Premium" },
                                    { id: "business", label: "Executiva" },
                                    { id: "first", label: "Primeira" },
                                ].map((cls) => (
                                    <div 
                                        key={cls.id}
                                        onClick={() => setCabinClass(cls.id)}
                                        className={cn(
                                            "cursor-pointer text-sm p-2 rounded-lg border text-center transition-all",
                                            cabinClass === cls.id 
                                                ? "bg-primary/5 border-primary text-primary font-medium" 
                                                : "border-slate-100 hover:bg-slate-50 text-slate-600"
                                        )}
                                    >
                                        {cls.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                             <h4 className="font-medium text-sm text-slate-900 border-b pb-2">Passageiros</h4>
                             
                             {/* Adults */}
                             <div className="flex justify-between items-center">
                                 <div>
                                     <div className="font-medium text-sm text-slate-900">Adultos</div>
                                     <div className="text-xs text-slate-500">12+ anos</div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <button 
                                        type="button"
                                        onClick={() => setAdults(Math.max(1, adults - 1))}
                                        className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                                        disabled={adults <= 1}
                                     >
                                         <Minus className="h-3 w-3" />
                                     </button>
                                     <span className="text-sm font-semibold w-4 text-center">{adults}</span>
                                     <button 
                                        type="button"
                                        onClick={() => setAdults(Math.min(9, adults + 1))}
                                        className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors"
                                     >
                                         <Plus className="h-3 w-3" />
                                     </button>
                                 </div>
                             </div>

                             {/* Children */}
                             <div className="flex justify-between items-center">
                                 <div>
                                     <div className="font-medium text-sm text-slate-900">Crianças</div>
                                     <div className="text-xs text-slate-500">2-11 anos</div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <button 
                                        type="button"
                                        onClick={() => setChildren(Math.max(0, children - 1))}
                                        className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                                        disabled={children <= 0}
                                     >
                                         <Minus className="h-3 w-3" />
                                     </button>
                                     <span className="text-sm font-semibold w-4 text-center">{children}</span>
                                     <button 
                                        type="button"
                                        onClick={() => setChildren(Math.min(9, children + 1))}
                                        className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors"
                                     >
                                         <Plus className="h-3 w-3" />
                                     </button>
                                 </div>
                             </div>

                             {/* Infants */}
                             <div className="flex justify-between items-center">
                                 <div>
                                     <div className="font-medium text-sm text-slate-900">Bebês</div>
                                     <div className="text-xs text-slate-500">Menos de 2 anos</div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <button 
                                        type="button"
                                        onClick={() => setInfants(Math.max(0, infants - 1))}
                                        className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                                        disabled={infants <= 0}
                                     >
                                         <Minus className="h-3 w-3" />
                                     </button>
                                     <span className="text-sm font-semibold w-4 text-center">{infants}</span>
                                     <button 
                                        type="button"
                                        onClick={() => setInfants(Math.min(adults, infants + 1))} 
                                        className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors"
                                     >
                                         <Plus className="h-3 w-3" />
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Search Button */}
            <Button 
                type="submit" 
                size="lg" 
                className="h-auto py-3 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all lg:w-auto min-w-[120px]"
            >
                <Search className="mr-2 h-5 w-5" />
                Buscar
            </Button>
        </div>
      </form>
    </motion.div>
  );
}
