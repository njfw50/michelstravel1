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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
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
    
    if (!origin) {
        toast({
            title: "Origem obrigatória",
            description: "Por favor selecione uma cidade ou aeroporto de origem.",
            variant: "destructive",
        });
        return;
    }

    if (!destination) {
        toast({
            title: "Destino obrigatório",
            description: "Por favor selecione uma cidade ou aeroporto de destino.",
            variant: "destructive",
        });
        return;
    }

    if (!date) {
        toast({
            title: "Data obrigatória",
            description: "Por favor selecione a data da viagem.",
            variant: "destructive",
        });
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
        "bg-black/30 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-1 border border-white/10 relative z-10 max-w-5xl mx-auto",
        className
      )}
    >
        <div className="px-6 pt-4 pb-2">
            <Tabs defaultValue="round-trip" value={tripType} onValueChange={setTripType} className="w-full">
                <TabsList className="bg-transparent p-0 h-auto gap-6 justify-start">
                    <TabsTrigger 
                        value="round-trip" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white data-[state=active]:font-bold text-white/60 rounded-none border-b-4 border-transparent data-[state=active]:border-blue-400 px-0 pb-2 transition-all text-sm uppercase tracking-wide font-semibold hover:text-white/80"
                    >
                        Ida e Volta
                    </TabsTrigger>
                    <TabsTrigger 
                        value="one-way" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white data-[state=active]:font-bold text-white/60 rounded-none border-b-4 border-transparent data-[state=active]:border-blue-400 px-0 pb-2 transition-all text-sm uppercase tracking-wide font-semibold hover:text-white/80"
                    >
                        Só Ida
                    </TabsTrigger>
                    <TabsTrigger 
                        value="multi-city" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white data-[state=active]:font-bold text-white/60 rounded-none border-b-4 border-transparent data-[state=active]:border-blue-400 px-0 pb-2 transition-all text-sm uppercase tracking-wide font-semibold hover:text-white/80"
                    >
                        Vários Destinos
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

      <form onSubmit={handleSearch} className="p-4 md:p-6 bg-transparent border-t border-white/10">
        <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Location Group */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <LocationSearch 
                    label="Origem"
                    placeholder="Cidade ou Aeroporto"
                    value={origin}
                    onChange={setOrigin}
                />

                <div className="flex justify-center md:pt-6">
                     <button 
                        type="button"
                        className="bg-white/10 rounded-full p-2 border border-white/20 text-white/70 hover:text-white hover:border-blue-400 hover:bg-blue-500/20 transition-all shadow-lg backdrop-blur-md"
                        onClick={() => {
                            const temp = origin;
                            setOrigin(destination);
                            setDestination(temp);
                        }}
                    >
                        <ArrowRightLeft className="h-4 w-4" />
                    </button>
                </div>

                <LocationSearch 
                    label="Destino"
                    placeholder="Cidade ou Aeroporto"
                    value={destination}
                    onChange={setDestination}
                />
            </div>

            {/* Date Group */}
            <div className="flex-[0.8] grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs font-bold text-white/70 uppercase tracking-wider block">Ida</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button type="button" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 h-14 flex items-center text-left hover:bg-white/15 hover:border-white/20 transition-all shadow-lg backdrop-blur-sm focus:ring-2 focus:ring-blue-400/50">
                                <CalendarIcon className="h-5 w-5 text-blue-300 mr-3" />
                                <span className={cn("text-base font-medium truncate", !date ? "text-white/30" : "text-white")}>
                                    {date ? format(date, "dd/MM/yyyy") : "Data"}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 text-white" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                disabled={(date) => date < new Date()}
                                className="bg-slate-900 text-white rounded-md border border-white/10"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-1">
                    <Label className={cn("text-xs font-bold text-white/70 uppercase tracking-wider block", tripType === "one-way" && "opacity-50")}>Volta</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button 
                                type="button" 
                                className={cn(
                                    "w-full bg-white/10 border border-white/10 rounded-xl px-3 h-14 flex items-center text-left hover:bg-white/15 hover:border-white/20 transition-all shadow-lg backdrop-blur-sm focus:ring-2 focus:ring-blue-400/50 relative",
                                    tripType === "one-way" && "bg-white/5 text-white/20 cursor-not-allowed border-white/5 shadow-none"
                                )}
                                disabled={tripType === "one-way"}
                            >
                                <CalendarIcon className="h-5 w-5 text-blue-300 mr-3" />
                                {tripType === "one-way" ? (
                                    <span className="text-sm font-medium text-white/20">Opcional</span>
                                ) : (
                                    <span className={cn("text-base font-medium truncate", !returnDate ? "text-white/30" : "text-white")}>
                                        {returnDate ? format(returnDate, "dd/MM/yyyy") : "Data"}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 text-white" align="start">
                            <Calendar
                                mode="single"
                                selected={returnDate}
                                onSelect={setReturnDate}
                                initialFocus
                                disabled={(d) => d < (date || new Date())}
                                className="bg-slate-900 text-white rounded-md border border-white/10"
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Travelers & Class */}
            <div className="flex-[0.6] space-y-1">
                <Label className="text-xs font-bold text-white/70 uppercase tracking-wider block">Passageiros & Classe</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 h-14 flex items-center text-left hover:bg-white/15 hover:border-white/20 transition-all shadow-lg backdrop-blur-sm focus:ring-2 focus:ring-blue-400/50">
                             <Users className="h-5 w-5 text-blue-300 mr-3" />
                             <div className="flex flex-col justify-center overflow-hidden">
                                 <span className="text-sm font-bold text-white truncate leading-tight">
                                     {totalPassengers} {totalPassengers !== 1 ? 'Pessoas' : 'Pessoa'}
                                 </span>
                                 <span className="text-xs text-blue-200/70 truncate leading-tight">
                                    {cabinClass === 'economy' ? 'Econômica' : cabinClass === 'premium_economy' ? 'Econ. Premium' : cabinClass === 'business' ? 'Executiva' : 'Primeira'}
                                 </span>
                             </div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-5 rounded-xl shadow-2xl border-white/10 bg-slate-900/95 backdrop-blur-xl text-white" align="end">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="font-bold text-sm text-white border-b border-white/10 pb-2">Classe</h4>
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
                                                "cursor-pointer text-sm p-2 rounded-lg border text-center transition-all font-medium",
                                                cabinClass === cls.id 
                                                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50" 
                                                    : "border-white/10 hover:bg-white/10 text-white/70"
                                            )}
                                        >
                                            {cls.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                 <h4 className="font-bold text-sm text-white border-b border-white/10 pb-2">Passageiros</h4>
                                 
                                 {/* Adults */}
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <div className="font-bold text-sm text-white">Adultos</div>
                                         <div className="text-xs text-white/50">12+ anos</div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <button 
                                            type="button"
                                            onClick={() => setAdults(Math.max(1, adults - 1))}
                                            className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                                            disabled={adults <= 1}
                                         >
                                             <Minus className="h-4 w-4" />
                                         </button>
                                         <span className="text-sm font-bold w-4 text-center text-white">{adults}</span>
                                         <button 
                                            type="button"
                                            onClick={() => setAdults(Math.min(9, adults + 1))}
                                            className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
                                         >
                                             <Plus className="h-4 w-4" />
                                         </button>
                                     </div>
                                 </div>

                                 {/* Children */}
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <div className="font-bold text-sm text-white">Crianças</div>
                                         <div className="text-xs text-white/50">2-11 anos</div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <button 
                                            type="button"
                                            onClick={() => setChildren(Math.max(0, children - 1))}
                                            className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                                            disabled={children <= 0}
                                         >
                                             <Minus className="h-4 w-4" />
                                         </button>
                                         <span className="text-sm font-bold w-4 text-center text-white">{children}</span>
                                         <button 
                                            type="button"
                                            onClick={() => setChildren(Math.min(9, children + 1))}
                                            className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
                                         >
                                             <Plus className="h-4 w-4" />
                                         </button>
                                     </div>
                                 </div>

                                 {/* Infants */}
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <div className="font-bold text-sm text-white">Bebês</div>
                                         <div className="text-xs text-white/50">Menos de 2 anos</div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <button 
                                            type="button"
                                            onClick={() => setInfants(Math.max(0, infants - 1))}
                                            className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                                            disabled={infants <= 0}
                                         >
                                             <Minus className="h-4 w-4" />
                                         </button>
                                         <span className="text-sm font-bold w-4 text-center text-white">{infants}</span>
                                         <button 
                                            type="button"
                                            onClick={() => setInfants(Math.min(adults, infants + 1))} 
                                            className="h-8 w-8 rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
                                         >
                                             <Plus className="h-4 w-4" />
                                         </button>
                                     </div>
                                 </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Search Button */}
            <div className="flex flex-col justify-end">
                <Button 
                    type="submit" 
                    size="lg" 
                    className="h-14 w-full lg:w-auto px-8 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-blue-900/50 hover:shadow-blue-600/50 transition-all uppercase tracking-wide text-sm border-0"
                >
                    <Search className="mr-2 h-4 w-4" />
                    Buscar Voo
                </Button>
            </div>
        </div>
      </form>
    </motion.div>
  );
}

