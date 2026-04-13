import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Plane } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface LocationSearchProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: "default" | "large";
}

interface Place {
  id: string;
  name: string;
  iataCode: string;
  cityName: string;
  countryName: string;
  type: string;
}

export function LocationSearch({ label, placeholder, value, onChange, className, size = "default" }: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [displayText, setDisplayText] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(false);
  const isLarge = size === "large";

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
      <label className={cn(
        "font-semibold text-gray-500 block mb-2 pl-1",
        isLarge ? "text-sm tracking-[0.08em]" : "text-xs uppercase tracking-wider",
      )}>{label}</label>
      <div className={cn(
        "flex items-center bg-white border border-slate-200 relative transition-all duration-300 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-8 focus-within:ring-blue-600/5",
        isLarge ? "rounded-3xl px-6 h-16 md:h-20" : "rounded-2xl px-4 h-14",
      )}>
        <MapPin className={cn("text-slate-400 shrink-0", isLarge ? "h-6 w-6 mr-4" : "h-5 w-5 mr-3")} />
        <Input 
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder || "City or Airport"} 
          className={cn(
            "border-none shadow-none focus-visible:ring-0 p-0 h-full w-full bg-transparent text-gray-900 placeholder:text-gray-400 appearance-none",
            isLarge ? "text-lg md:text-xl font-semibold" : "text-base font-medium",
          )}
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
        {isLoading && <Loader2 className={cn("animate-spin text-blue-500 absolute", isLarge ? "h-6 w-6 right-5" : "h-5 w-5 right-4")} />}
      </div>

      {isOpen && results.length > 0 && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl z-[100] max-h-72 overflow-y-auto rounded-2xl",
        )}>
          <div className="p-1.5 space-y-0.5">
            {results.map((place) => (
              <button
                type="button"
                key={place.id}
                onClick={() => handleSelect(place)}
                className="w-full text-left transition-all flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 group px-4"
              >
                <div className="h-10 w-10 min-w-[40px] rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  {place.type === 'airport'
                    ? <Plane className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                    : <MapPin className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />}
                </div>
                <div className="flex-1 truncate">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="truncate">{place.name}</span> 
                    <span className="text-blue-600 font-black shrink-0">{place.iataCode}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                    {place.cityName || place.name}, {place.countryName}
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
