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
        "bg-white rounded-lg shadow-xl shadow-slate-900/10 p-1 border border-slate-200 relative z-10 max-w-5xl mx-auto",
        className
      )}
    >
        <div className="px-6 pt-4 pb-2">
            <Tabs defaultValue="round-trip" value={tripType} onValueChange={setTripType} className="w-full">
                <TabsList className="bg-transparent p-0 h-auto gap-6 justify-start">
                    <TabsTrigger 
                        value="round-trip" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-bold text-slate-600 rounded-none border-b-4 border-transparent data-[state=active]:border-primary px-0 pb-2 transition-all text-sm uppercase tracking-wide font-semibold"
                    >
                        Ida e Volta
                    </TabsTrigger>
                    <TabsTrigger 
                        value="one-way" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-bold text-slate-600 rounded-none border-b-4 border-transparent data-[state=active]:border-primary px-0 pb-2 transition-all text-sm uppercase tracking-wide font-semibold"
                    >
                        Só Ida
                    </TabsTrigger>
                    <TabsTrigger 
                        value="multi-city" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-bold text-slate-600 rounded-none border-b-4 border-transparent data-[state=active]:border-primary px-0 pb-2 transition-all text-sm uppercase tracking-wide font-semibold"
                    >
                        Vários Destinos
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

      <form onSubmit={handleSearch} className="p-4 md:p-6 bg-slate-50 border-t border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Location Group */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div className="relative">
                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Origem</Label>
                    <div className="flex items-center bg-white border border-slate-300 rounded-md px-3 h-12 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
                        <MapPin className="h-5 w-5 text-slate-500 mr-3" />
                        <Input 
                            placeholder="Cidade ou Aeroporto" 
                            className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-base font-medium placeholder:text-slate-400 w-full bg-transparent truncate text-slate-900"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-center md:pt-6">
                     <button 
                        type="button"
                        className="bg-white rounded-full p-2 border border-slate-300 text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50 transition-all shadow-sm"
                        onClick={() => {
                            const temp = origin;
                            setOrigin(destination);
                            setDestination(temp);
                        }}
                    >
                        <ArrowRightLeft className="h-4 w-4" />
                    </button>
                </div>

                <div className="relative">
                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Destino</Label>
                    <div className="flex items-center bg-white border border-slate-300 rounded-md px-3 h-12 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
                        <MapPin className="h-5 w-5 text-slate-500 mr-3" />
                        <Input 
                            placeholder="Cidade ou Aeroporto" 
                            className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-base font-medium placeholder:text-slate-400 w-full bg-transparent truncate text-slate-900"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Date Group */}
            <div className="flex-[0.8] grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Ida</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button type="button" className="w-full bg-white border border-slate-300 rounded-md px-3 h-12 flex items-center text-left hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm focus:ring-2 focus:ring-primary/20">
                                <CalendarIcon className="h-5 w-5 text-slate-500 mr-3" />
                                <span className={cn("text-base font-medium truncate", !date ? "text-slate-400" : "text-slate-900")}>
                                    {date ? format(date, "dd/MM/yyyy") : "Data"}
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

                <div className="space-y-1">
                    <Label className={cn("text-xs font-bold text-slate-600 uppercase tracking-wider block", tripType === "one-way" && "opacity-50")}>Volta</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button 
                                type="button" 
                                className={cn(
                                    "w-full bg-white border border-slate-300 rounded-md px-3 h-12 flex items-center text-left hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm focus:ring-2 focus:ring-primary/20 relative",
                                    tripType === "one-way" && "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200 shadow-none"
                                )}
                                disabled={tripType === "one-way"}
                            >
                                <CalendarIcon className="h-5 w-5 text-slate-500 mr-3" />
                                {tripType === "one-way" ? (
                                    <span className="text-sm font-medium text-slate-400">Opcional</span>
                                ) : (
                                    <span className={cn("text-base font-medium truncate", !returnDate ? "text-slate-400" : "text-slate-900")}>
                                        {returnDate ? format(returnDate, "dd/MM/yyyy") : "Data"}
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

            {/* Travelers & Class */}
            <div className="flex-[0.6] space-y-1">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Passageiros & Classe</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className="w-full bg-white border border-slate-300 rounded-md px-3 h-12 flex items-center text-left hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm focus:ring-2 focus:ring-primary/20">
                             <Users className="h-5 w-5 text-slate-500 mr-3" />
                             <div className="flex flex-col justify-center overflow-hidden">
                                 <span className="text-sm font-bold text-slate-900 truncate leading-tight">
                                     {totalPassengers} {totalPassengers !== 1 ? 'Pessoas' : 'Pessoa'}
                                 </span>
                                 <span className="text-xs text-slate-500 truncate leading-tight">
                                    {cabinClass === 'economy' ? 'Econômica' : cabinClass === 'premium_economy' ? 'Econ. Premium' : cabinClass === 'business' ? 'Executiva' : 'Primeira'}
                                 </span>
                             </div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-5 rounded-lg shadow-xl border-slate-200" align="end">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Classe</h4>
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
                                                "cursor-pointer text-sm p-2 rounded border text-center transition-all font-medium",
                                                cabinClass === cls.id 
                                                    ? "bg-slate-900 text-white border-slate-900" 
                                                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                                            )}
                                        >
                                            {cls.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                 <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Passageiros</h4>
                                 
                                 {/* Adults */}
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <div className="font-bold text-sm text-slate-900">Adultos</div>
                                         <div className="text-xs text-slate-500">12+ anos</div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <button 
                                            type="button"
                                            onClick={() => setAdults(Math.max(1, adults - 1))}
                                            className="h-8 w-8 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors disabled:opacity-50"
                                            disabled={adults <= 1}
                                         >
                                             <Minus className="h-4 w-4" />
                                         </button>
                                         <span className="text-sm font-bold w-4 text-center text-slate-900">{adults}</span>
                                         <button 
                                            type="button"
                                            onClick={() => setAdults(Math.min(9, adults + 1))}
                                            className="h-8 w-8 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                         >
                                             <Plus className="h-4 w-4" />
                                         </button>
                                     </div>
                                 </div>

                                 {/* Children */}
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <div className="font-bold text-sm text-slate-900">Crianças</div>
                                         <div className="text-xs text-slate-500">2-11 anos</div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <button 
                                            type="button"
                                            onClick={() => setChildren(Math.max(0, children - 1))}
                                            className="h-8 w-8 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors disabled:opacity-50"
                                            disabled={children <= 0}
                                         >
                                             <Minus className="h-4 w-4" />
                                         </button>
                                         <span className="text-sm font-bold w-4 text-center text-slate-900">{children}</span>
                                         <button 
                                            type="button"
                                            onClick={() => setChildren(Math.min(9, children + 1))}
                                            className="h-8 w-8 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                         >
                                             <Plus className="h-4 w-4" />
                                         </button>
                                     </div>
                                 </div>

                                 {/* Infants */}
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <div className="font-bold text-sm text-slate-900">Bebês</div>
                                         <div className="text-xs text-slate-500">Menos de 2 anos</div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <button 
                                            type="button"
                                            onClick={() => setInfants(Math.max(0, infants - 1))}
                                            className="h-8 w-8 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors disabled:opacity-50"
                                            disabled={infants <= 0}
                                         >
                                             <Minus className="h-4 w-4" />
                                         </button>
                                         <span className="text-sm font-bold w-4 text-center text-slate-900">{infants}</span>
                                         <button 
                                            type="button"
                                            onClick={() => setInfants(Math.min(adults, infants + 1))} 
                                            className="h-8 w-8 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors"
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
                    className="h-12 w-full lg:w-auto px-8 rounded-md bg-primary hover:bg-primary/90 text-white font-bold shadow-md hover:shadow-lg transition-all uppercase tracking-wide text-sm"
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
