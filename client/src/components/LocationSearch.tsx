import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, Plane } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce"; // Use module path

interface LocationSearchProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface Place {
  id: string;
  name: string;
  iataCode: string;
  cityName: string;
  countryName: string;
  type: string;
}

export function LocationSearch({ label, placeholder, value, onChange, className }: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const debouncedQuery = useDebounce(query, 500); // Use the hook result
  const [results, setResults] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Trigger search on debounced query change
  useEffect(() => {
    if (debouncedQuery && debouncedQuery !== value && debouncedQuery.length >= 2) {
      searchPlaces(debouncedQuery);
    }
  }, [debouncedQuery]); // Correct dependency

  // Update internal state when external value changes (e.g. swap button)
  useEffect(() => {
    if (value !== query) {
        setQuery(value);
    }
  }, [value]);

  const searchPlaces = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/places/search?query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Failed to search places", error);
      setResults([]); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (place: Place) => {
    // Format: "City (IATA)" or "Airport (IATA)"
    const newValue = place.iataCode; 
    setQuery(`${place.cityName || place.name} (${place.iataCode})`);
    onChange(place.iataCode);
    setIsOpen(false);
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      <Label className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-1">{label}</Label>
      <div className="flex items-center bg-white/10 border border-white/10 rounded-xl px-3 h-14 focus-within:ring-2 focus-within:ring-blue-400/50 focus-within:border-blue-400/50 transition-all shadow-lg backdrop-blur-sm hover:bg-white/15 relative">
        <MapPin className="h-5 w-5 text-blue-300 mr-3 shrink-0" />
        <Input 
            placeholder={placeholder || "City or Airport"} 
            className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-lg font-medium placeholder:text-white/30 w-full bg-transparent truncate text-white"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value === "") {
                    onChange("");
                    setIsOpen(false);
                }
            }}
            onFocus={() => {
                if (results.length > 0) setIsOpen(true);
            }}
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/50 absolute right-3" />}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-50 max-h-64 overflow-y-auto overflow-x-hidden">
          <div className="p-2 space-y-1">
            {results.map((place) => (
              <button
                key={place.id}
                onClick={() => handleSelect(place)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3 group"
              >
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    {place.type === 'airport' ? <Plane className="h-4 w-4 text-blue-300" /> : <MapPin className="h-4 w-4 text-blue-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">
                    {place.name} <span className="text-blue-400">({place.iataCode})</span>
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {place.cityName ? `${place.cityName}, ` : ''}{place.countryName}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

