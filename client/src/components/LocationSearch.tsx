import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Plane, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface LocationSearchProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isLarge?: boolean;
  size?: string;
  dark?: boolean;
}

interface Place {
  id: string;
  name: string;
  iataCode: string;
  cityName: string;
  countryName: string;
  type: string;
}

export function LocationSearch({
  label,
  value,
  onChange,
  placeholder,
  className,
  isLarge: isLargeProp,
  size,
  dark = false
}: LocationSearchProps) {
  const isLarge = isLargeProp || size === "large";
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
      {label && (
        <label className={cn(
          "font-black block mb-2 pl-1 uppercase tracking-[0.25em] text-[10px]",
          dark ? "text-slate-500" : "text-slate-400"
        )}>{label}</label>
      )}
      
      <div className={cn(
        "flex items-center relative transition-all duration-500",
        dark 
          ? "bg-slate-950/40 border-white/10 hover:bg-white/5 hover:border-blue-500/50 focus-within:bg-white/5 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10" 
          : "bg-slate-50 border-slate-50 hover:bg-white hover:border-blue-200 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-8 focus-within:ring-blue-600/5",
        isLarge ? "rounded-[24px] px-6 h-16 md:h-20 shadow-xl border" : "rounded-2xl px-5 h-12 md:h-14 border",
      )}>
        <MapPin className={cn(dark ? "text-blue-400" : "text-blue-500", "shrink-0", isLarge ? "h-6 w-6 mr-4" : "h-5 w-5 mr-3")} />
        <Input 
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder || "Cidade ou Aeroporto"} 
          className={cn(
            "border-none shadow-none focus-visible:ring-0 p-0 h-full w-full bg-transparent appearance-none",
            dark ? "text-white placeholder:text-slate-800" : "text-slate-900 placeholder:text-slate-400",
            isLarge ? "text-base md:text-lg font-black" : "text-[11px] md:text-sm font-bold",
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
        {isLoading && <Loader2 className={cn("animate-spin absolute", dark ? "text-blue-400" : "text-blue-500", isLarge ? "h-6 w-6 right-5" : "h-5 w-5 right-4")} />}
      </div>

      {isOpen && results.length > 0 && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-3 z-[200] max-h-80 overflow-y-auto rounded-3xl p-3 border border-white/10 shadow-2xl backdrop-blur-3xl",
          dark ? "bg-slate-950/95 shadow-black/80" : "bg-white/95 border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)]"
        )}>
          <div className="space-y-1.5">
            {results.map((place) => (
              <button
                type="button"
                key={place.id}
                onClick={() => handleSelect(place)}
                className={cn(
                  "w-full text-left transition-all flex items-center gap-4 p-3 rounded-2xl group",
                  dark ? "hover:bg-blue-600/20" : "hover:bg-blue-50"
                )}
              >
                <div className={cn(
                  "h-12 w-12 min-w-[48px] rounded-xl flex items-center justify-center transition-colors shadow-lg",
                  dark ? "bg-white/5 border border-white/5 group-hover:bg-blue-600 group-hover:border-blue-600" : "bg-slate-50 group-hover:bg-blue-600"
                )}>
                  {place.type === 'airport'
                    ? <Plane className={cn("h-5 w-5 transition-colors", dark ? "text-blue-400 group-hover:text-white" : "text-blue-500 group-hover:text-white")} />
                    : <Globe className={cn("h-5 w-5 transition-colors", dark ? "text-blue-400 group-hover:text-white" : "text-blue-500 group-hover:text-white")} />}
                </div>
                <div className="flex-1 truncate">
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn("font-black text-sm truncate", dark ? "text-white" : "text-slate-900")}>{place.name}</span> 
                    <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-md shadow-lg shrink-0">{place.iataCode}</span>
                  </div>
                  <div className={cn(
                    "text-[10px] font-black uppercase tracking-[0.15em] truncate mt-1.5",
                    dark ? "text-slate-500" : "text-slate-400"
                  )}>
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
