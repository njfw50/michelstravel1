import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Plane } from "lucide-react";
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
  isLarge
}: LocationSearchProps) {
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
      <label className={cn(
        "font-black text-slate-400 block mb-2 pl-1 uppercase tracking-[0.2em] text-[10px]",
      )}>{label}</label>
      
      <div className={cn(
        "flex items-center bg-slate-50 border border-slate-50 relative transition-all duration-300 hover:bg-white hover:border-blue-200 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-8 focus-within:ring-blue-600/5",
        isLarge ? "rounded-[24px] px-6 h-16 md:h-20 shadow-sm" : "rounded-2xl px-4 h-14",
      )}>
        <MapPin className={cn("text-blue-500 shrink-0", isLarge ? "h-6 w-6 mr-4" : "h-4 w-4 mr-3")} />
        <Input 
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder || "Cidade ou Aeroporto"} 
          className={cn(
            "border-none shadow-none focus-visible:ring-0 p-0 h-full w-full bg-transparent text-slate-900 placeholder:text-slate-300 appearance-none",
            isLarge ? "text-lg md:text-xl font-black" : "text-sm font-bold",
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
          "absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] z-[200] max-h-80 overflow-y-auto rounded-3xl p-2",
        )}>
          <div className="space-y-1">
            {results.map((place) => (
              <button
                type="button"
                key={place.id}
                onClick={() => handleSelect(place)}
                className="w-full text-left transition-all flex items-center gap-4 p-3 rounded-2xl hover:bg-blue-50 group"
              >
                <div className="h-12 w-12 min-w-[48px] rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  {place.type === 'airport'
                    ? <Plane className="h-5 w-5 text-blue-500 group-hover:text-white transition-colors" />
                    : <MapPin className="h-5 w-5 text-blue-500 group-hover:text-white transition-colors" />}
                </div>
                <div className="flex-1 truncate">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900 text-sm truncate">{place.name}</span> 
                    <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-md shadow-sm shrink-0">{place.iataCode}</span>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] truncate mt-1">
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
