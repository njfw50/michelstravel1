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
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2 pl-1">{label}</label>
      <div className="flex items-center bg-gray-50/80 border border-gray-200 rounded-xl px-4 h-14 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300 hover:border-blue-300 hover:bg-white relative">
        <MapPin className="h-5 w-5 text-blue-500 mr-3 shrink-0" />
        <Input 
          placeholder={placeholder || "City or Airport"} 
          className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-base font-medium placeholder:text-gray-400 w-full bg-transparent text-gray-900"
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
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500 absolute right-4" />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto overflow-x-hidden">
          <div className="p-2 space-y-0.5">
            {results.map((place) => (
              <button
                type="button"
                key={place.id}
                onClick={() => handleSelect(place)}
                data-testid={`place-option-${place.iataCode}`}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-3 group"
              >
                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  {place.type === 'airport' ? <Plane className="h-5 w-5 text-blue-500" /> : <MapPin className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">
                    {place.name} <span className="text-blue-600 font-bold">({place.iataCode})</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
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
