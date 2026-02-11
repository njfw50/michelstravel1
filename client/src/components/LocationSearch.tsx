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
  const [displayText, setDisplayText] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(false);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2 && !selectedRef.current) {
      searchPlaces(debouncedQuery);
    }
    selectedRef.current = false;
  }, [debouncedQuery]);

  useEffect(() => {
    if (value === "" && query !== "") {
      setQuery("");
      setDisplayText("");
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
    const text = `${place.cityName || place.name} (${place.iataCode})`;
    selectedRef.current = true;
    setQuery(text);
    setDisplayText(text);
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
      <Label className="text-[11px] font-bold text-white/50 uppercase tracking-widest block mb-1.5">{label}</Label>
      <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 h-14 focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:border-amber-500/30 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.1] relative">
        <MapPin className="h-5 w-5 text-amber-400 mr-3 shrink-0" />
        <Input 
            placeholder={placeholder || "City or Airport"} 
            className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-lg font-medium placeholder:text-white/30 w-full bg-transparent truncate text-white"
            data-testid={`input-${label.toLowerCase()}`}
            value={displayText || query}
            onChange={(e) => {
                setDisplayText("");
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-[hsl(225,25%,8%)]/98 border border-white/[0.08] rounded-xl shadow-2xl backdrop-blur-xl z-50 max-h-64 overflow-y-auto overflow-x-hidden">
          <div className="p-1.5 space-y-0.5">
            {results.map((place) => (
              <button
                type="button"
                key={place.id}
                onClick={() => handleSelect(place)}
                data-testid={`place-option-${place.iataCode}`}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.06] transition-colors flex items-center gap-3 group"
              >
                <div className="h-8 w-8 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    {place.type === 'airport' ? <Plane className="h-4 w-4 text-amber-400" /> : <MapPin className="h-4 w-4 text-teal-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">
                    {place.name} <span className="text-amber-400 font-bold">({place.iataCode})</span>
                  </div>
                  <div className="text-xs text-white/40 truncate">
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

