import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Users, Search, ArrowRightLeft } from "lucide-react";
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
  const [origin, setOrigin] = useState(defaultValues?.origin || "");
  const [destination, setDestination] = useState(defaultValues?.destination || "");
  const [date, setDate] = useState<Date | undefined>(defaultValues?.date);
  const [passengers, setPassengers] = useState(defaultValues?.passengers || "1");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;

    const params = new URLSearchParams();
    params.set("origin", origin);
    params.set("destination", destination);
    params.set("date", format(date, "yyyy-MM-dd"));
    params.set("passengers", passengers);

    setLocation(`/search?${params.toString()}`);
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      onSubmit={handleSearch}
      className={cn(
        "bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 md:p-8 flex flex-col lg:flex-row gap-4 items-end border border-blue-50 relative z-10",
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Origin */}
        <div className="space-y-2 relative">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">From</Label>
          <div className="relative group">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="City or Airport" 
              className="pl-9 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-primary transition-all text-base font-medium rounded-xl shadow-sm"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Swap Button (Absolute positioned for visual flair) */}
        <div className="hidden lg:flex absolute left-[24%] bottom-9 z-20">
            <button 
                type="button"
                className="bg-white rounded-full p-2 border border-slate-100 shadow-sm text-slate-400 hover:text-primary hover:shadow-md transition-all hover:scale-105"
                onClick={() => {
                    const temp = origin;
                    setOrigin(destination);
                    setDestination(temp);
                }}
            >
                <ArrowRightLeft className="h-4 w-4" />
            </button>
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">To</Label>
          <div className="relative group">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="City or Airport" 
              className="pl-9 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-primary transition-all text-base font-medium rounded-xl shadow-sm"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Departure</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full h-12 justify-start text-left font-medium rounded-xl border-slate-200 bg-slate-50 hover:bg-white hover:border-primary text-base shadow-sm group",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                {date ? format(date, "MMM dd, yyyy") : <span>Pick a date</span>}
              </Button>
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

        {/* Passengers */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Travelers</Label>
          <Select value={passengers} onValueChange={setPassengers}>
            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium text-base shadow-sm focus:ring-primary focus:border-primary">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Passengers" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Adult</SelectItem>
              <SelectItem value="2">2 Adults</SelectItem>
              <SelectItem value="3">3 Adults</SelectItem>
              <SelectItem value="4">4+ Adults</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        type="submit" 
        size="lg" 
        className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all w-full lg:w-auto min-w-[140px]"
      >
        <Search className="mr-2 h-5 w-5" />
        Search
      </Button>
    </motion.form>
  );
}
