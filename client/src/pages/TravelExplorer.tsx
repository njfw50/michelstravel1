
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Info, 
  ChevronRight, 
  ArrowLeft, 
  Wind, 
  ShieldCheck, 
  DollarSign, 
  Heart,
  Loader2,
  Plane
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IBERO_PREMIUM_DESTINATIONS, fetchCityDetails, type CityHighlights } from "@/lib/travel-service";
import { useToast } from "@/hooks/use-toast";

export default function TravelExplorer() {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityHighlights | null>(null);
  const [loading, setLoading] = useState(false);
  const [featuredDetails, setFeaturedDetails] = useState<Record<string, CityHighlights>>({});
  const { toast } = useToast();

  const filteredDestinations = IBERO_PREMIUM_DESTINATIONS.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCity = async (cityName: string) => {
    setLoading(true);
    try {
      const details = await fetchCityDetails(cityName);
      if (details) {
        setSelectedCity(details);
      } else {
        toast({
          title: "Informações indisponíveis",
          description: "Não conseguimos carregar o guia para este destino no momento.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-cyan-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-bold px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">
              Exploração Ibero-Americana
            </Badge>
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight mb-6">
            Para onde sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">curiosidade</span> te leva?
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl font-medium leading-relaxed mb-10">
            Descubra a alma de cidades fascinantes entre o Atlântico e os Andes. Curadoria exclusiva para viajantes que buscam história, conforto e alma.
          </p>

          <div className="relative max-w-2xl group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative bg-slate-900/50 border border-white/10 rounded-[32px] p-2 flex items-center backdrop-blur-xl">
              <Search className="ml-5 h-6 w-6 text-slate-500" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busque por cidade ou país..."
                className="bg-transparent border-none text-xl h-14 focus-visible:ring-0 placeholder:text-slate-600"
              />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((dest, idx) => (
            <motion.div
              key={dest.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className="group relative h-[450px] overflow-hidden rounded-[40px] border-none bg-slate-900 cursor-pointer shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
                onClick={() => handleOpenCity(dest.name)}
              >
                {/* Image Placeholder/Background Component would go here */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-slate-800 animate-pulse group-hover:scale-110 transition-transform duration-700" />
                
                <CardContent className="absolute inset-0 p-10 z-20 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-300">{dest.country}</span>
                  </div>
                  <h3 className="text-4xl font-black mb-4 group-hover:translate-x-2 transition-transform duration-500">{dest.name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">Ver Guia do Destino</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      </div>

      {/* City Detail Modal */}
      <AnimatePresence>
        {selectedCity && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12 overflow-hidden"
          >
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setSelectedCity(null)} />
            
            <motion.div 
              initial={{ scale: 0.95, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 40 }}
              className="relative w-full max-w-6xl max-h-full bg-slate-900 rounded-[48px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row"
            >
              <div className="relative w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
                <img src={selectedCity.image} alt={selectedCity.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40" />
                <Button 
                  variant="ghost" 
                  className="absolute top-8 left-8 h-12 w-12 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 text-white"
                  onClick={() => setSelectedCity(null)}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-16 overflow-y-auto custom-scrollbar">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-6 rounded-full px-4 font-bold">Guia Estratégico</Badge>
                <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter">{selectedCity.name}</h2>
                
                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCity.scores.map(s => (
                      <div key={s.name} className="p-4 rounded-3xl bg-white/5 border border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">{s.name}</p>
                        <div className="flex items-center gap-3">
                           <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500" style={{ width: `${s.score * 10}%` }} />
                           </div>
                           <span className="text-xs font-bold font-display">{s.score.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-lg text-slate-300 leading-relaxed font-medium">
                      {selectedCity.description || selectedCity.summary}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <Button className="w-full h-16 rounded-[24px] bg-white text-slate-950 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all gap-3 shadow-xl shadow-white/10">
                      <Plane className="h-5 w-5" />
                      Buscar Passagens para {selectedCity.name}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-20 w-20">
                <Loader2 className="h-20 w-20 text-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plane className="h-8 w-8 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 animate-pulse">Sincronizando Guia...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
