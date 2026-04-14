import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  ArrowLeft, 
  Loader2,
  Plane,
  Target,
  Navigation2,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IBERO_PREMIUM_DESTINATIONS, fetchCityDetails, type CityHighlights } from "@/lib/travel-service";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";

export default function TravelExplorer() {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityHighlights | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

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
    <div className="min-h-screen bg-[#020617] text-slate-300 selection:bg-indigo-500/30 overflow-x-hidden pt-20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        <header className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="outline" className="mb-8 border-indigo-500/30 bg-indigo-500/5 text-indigo-400 font-black px-6 py-2 rounded-full uppercase tracking-[0.3em] text-[10px] backdrop-blur-md">
              Midnight Explorer
            </Badge>
            <h1 className="text-6xl md:text-9xl font-black font-display tracking-[ -0.05em] mb-8 leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
              A Arte de <br/><span className="text-white">Descobrir.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
              Não mapeamos apenas cidades. Curamos experiências imersivas onde o luxo encontra a autenticidade. Sua jornada começa na curiosidade.
            </p>

            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10" />
              <div className="relative bg-white/5 border border-white/10 rounded-[32px] p-2 flex items-center backdrop-blur-2xl shadow-2xl">
                <Search className="ml-6 h-6 w-6 text-slate-400" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("blog.search_placeholder") || "Busque cidades, países ou sensações..."}
                  className="bg-transparent border-none text-xl h-14 focus-visible:ring-0 placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>
          </motion.div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredDestinations.map((dest, idx) => (
            <motion.div
              key={dest.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card 
                className="group relative h-[500px] overflow-hidden rounded-[48px] border border-white/5 bg-slate-900/50 cursor-pointer shadow-2xl hover:border-indigo-500/30 transition-all duration-700"
                onClick={() => handleOpenCity(dest.name)}
              >
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />
                  <div className="w-full h-full bg-slate-800 group-hover:scale-110 transition-transform duration-1000 ease-out flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-white/5" />
                  </div>
                </div>
                
                <CardContent className="absolute inset-0 p-12 z-20 flex flex-col justify-end">
                  <Badge className="w-fit mb-4 bg-white/5 backdrop-blur-md border-white/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {dest.country}
                  </Badge>
                  <h3 className="text-4xl md:text-5xl font-black font-display tracking-tighter mb-6 group-hover:text-indigo-400 transition-colors leading-none">{dest.name}</h3>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                       <Target className="h-3 w-3" /> Trending +{Math.floor(Math.random()*50)+20}%
                     </div>
                     <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <ArrowUpRight className="h-6 w-6" />
                     </div>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 overflow-hidden"
          >
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setSelectedCity(null)} />
            
            <motion.div 
              initial={{ scale: 0.9, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 rounded-[56px] border border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row"
            >
              <div className="relative w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
                <img src={selectedCity.image} alt={selectedCity.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40" />
                <Button 
                  variant="ghost" 
                  className="absolute top-8 left-8 h-14 w-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-black/60 transition-all"
                  onClick={() => setSelectedCity(null)}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </div>

              <div className="w-full md:w-1/2 p-10 md:p-20 overflow-y-auto custom-scrollbar bg-slate-900">
                <div className="flex items-center gap-4 mb-8">
                  <Badge className="bg-indigo-600 text-white border-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30">
                    Insight Exclusivo
                  </Badge>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Michels Travel Intel</span>
                </div>

                <h2 className="text-6xl md:text-7xl font-black font-display tracking-[ -0.05em] mb-10 text-white leading-none">{selectedCity.name}</h2>
                
                <div className="space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {selectedCity.scores.map(s => (
                      <div key={s.name} className="p-6 rounded-[32px] bg-white/5 border border-white/5 group hover:border-indigo-500/30 transition-colors">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">{s.name}</p>
                        <div className="flex items-center gap-4">
                           <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${s.score * 10}%` }}
                               transition={{ duration: 1, delay: 0.5 }}
                               className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                             />
                           </div>
                           <span className="text-lg font-black font-display text-white">{s.score.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-xl text-slate-400 leading-relaxed font-medium">
                      {selectedCity.description || selectedCity.summary}
                    </p>
                  </div>

                  <div className="pt-10">
                    <Button className="w-full h-20 rounded-[32px] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-500 transition-all gap-4 shadow-2xl shadow-indigo-600/30 group">
                      <Navigation2 className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
            className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative h-24 w-24">
                <Loader2 className="h-24 w-24 text-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plane className="h-10 w-10 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-indigo-300 animate-pulse">Sincronizando Destino...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
