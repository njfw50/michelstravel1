import { useBlogPosts } from "@/hooks/use-blog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  Loader2, 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Globe2, 
  MapPin, 
  Navigation2, 
  ArrowUpRight,
  TrendingUp,
  Filter,
  Search,
  Map as MapIcon,
  Sparkles
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { useDestinationHighlights } from "@/hooks/use-destinations";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function estimateReadTime(content: string | null | undefined): number {
  if (!content) return 3;
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

const DESTINATIONS = [
  { city: "Orlando", country: "us", label: "Orlando", accent: "from-blue-500 to-cyan-400" },
  { city: "Miami", country: "us", label: "Miami", accent: "from-pink-500 to-rose-400" },
  { city: "New York", country: "us", label: "Nova York", accent: "from-slate-500 to-slate-400" },
  { city: "Lisboa", country: "pt", label: "Lisboa", accent: "from-orange-500 to-yellow-400" },
  { city: "Rio de Janeiro", country: "br", label: "Rio de Janeiro", accent: "from-green-500 to-emerald-400" },
  { city: "São Paulo", country: "br", label: "São Paulo", accent: "from-slate-700 to-slate-500" },
];

export default function BlogList() {
  const { data: posts, isLoading } = useBlogPosts();
  const { t, language } = useI18n();
  const [selectedDest, setSelectedDest] = useState(DESTINATIONS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: highlights, isLoading: loadingHighlights } = useDestinationHighlights({
    city: selectedDest.city,
    country: selectedDest.country,
    lang: language || "pt",
    limit: 6,
  });

  const featuredPost = posts?.[0];
  const remainingPosts = posts?.filter(p => 
    p.id !== featuredPost?.id && 
    (p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <SEO 
        title="Guia de Viagens de Elite" 
        description="Explore o mundo com curadoria de especialistas. Dicas exclusivas, destinos secretos e roteiros premium." 
        path="/blog" 
      />

      {/* Hero Section - The Revolution */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-[#020617]/80 to-[#020617] z-10" />
          <img 
            src="https://images.unsplash.com/photo-1436491865332-7a61a109c055?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover animate-slow-zoom"
            alt="Hero Background"
          />
        </div>

        <div className="container relative z-20 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 rounded-full text-xs font-black uppercase tracking-[0.3em] backdrop-blur-md">
               {t("blog.elite_experience")}
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black font-display tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 leading-none">
              {t("blog.explore_unexplained").split('.')[0]}.
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed mb-10">
              {t("blog.curated_destinations")}
            </p>

            <div className="max-w-xl mx-auto relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl group-hover:bg-indigo-500/30 transition-all duration-500 -z-10" />
              <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 flex items-center shadow-2xl">
                <div className="pl-6 text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
                <Input 
                  placeholder={t("blog.search_placeholder")}
                  className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-slate-500 h-14 font-medium text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button className="hidden md:flex bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] px-8 h-12 font-black uppercase tracking-widest transition-all">
                  {t("blog.explore")}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute bottom-10 left-10 hidden lg:block animate-bounce-slow">
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                 <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("blog.trending_now")}</p>
                 <p className="text-xs font-bold text-white">Lisboa +240%</p>
              </div>
           </div>
        </div>
      </section>

      {/* Destination Pulse - Interactive Explorer */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
             <div className="flex items-center gap-3 text-indigo-400 mb-3 px-3 py-1 bg-indigo-500/10 rounded-full w-fit">
                <MapIcon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t("blog.curation_city")}</span>
             </div>
             <h2 className="text-4xl font-black font-display tracking-tight">{t("blog.pulse_title")}</h2>
             <p className="text-slate-400 mt-2 font-medium">{t("blog.pulse_desc")}</p>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] overflow-x-auto no-scrollbar">
            {DESTINATIONS.map((d) => (
              <button
                key={d.city}
                onClick={() => setSelectedDest(d)}
                className={`whitespace-nowrap px-6 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  selectedDest.city === d.city 
                    ? `bg-gradient-to-br ${d.accent} text-white shadow-lg` 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="wait">
            {loadingHighlights ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[200px] rounded-[32px] bg-white/5 animate-pulse border border-white/5" />
              ))
            ) : highlights?.items?.map((place, idx) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card className="group h-full bg-slate-900/40 backdrop-blur-md border-white/5 rounded-[32px] p-6 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${selectedDest.accent} blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity`} />
                  
                  <div className="flex flex-col h-full relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${selectedDest.accent} flex items-center justify-center text-white shadow-lg`}>
                        <MapPin className="h-6 w-6" />
                      </div>
                      {place.distance_m && (
                         <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase bg-white/5 px-2 py-1 rounded-lg">
                           {Math.round(place.distance_m)}m de raio
                         </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-black text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {place.name}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-6 font-medium">
                      {place.address || 'Ponto histórico com arquitetura única e atmosfera local envolvente.'}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                       <div className="flex gap-2">
                          {place.website && (
                             <a href={place.website} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 transition-all">
                                <Globe2 className="h-4 w-4" />
                             </a>
                          )}
                          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 transition-all cursor-pointer">
                             <Navigation2 className="h-4 w-4" />
                          </div>
                       </div>
                       <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 gap-2">
                          {t("blog.details")} <ArrowUpRight className="h-3 w-3" />
                       </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* The Magazine - Blog Section */}
      <section className="bg-slate-950/50 py-24 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-16">
             <div>
                <h2 className="text-4xl font-black font-display tracking-tight">{t("blog.chronicles_title")}</h2>
                <p className="text-slate-500 mt-2 font-medium">{t("blog.chronicles_subtitle")}</p>
             </div>
             <Link href="/search">
                <Button className="hidden md:flex gap-2 bg-white/5 hover:bg-white/10 text-white rounded-2xl px-6 h-12 font-black uppercase tracking-widest border border-white/10">
                   <Filter className="h-4 w-4" /> Filtros Avançados
                </Button>
             </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Featured Column */}
            <div className="lg:col-span-8">
              {featuredPost && (
                <Link href={`/blog/${featuredPost.slug}`}>
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="group cursor-pointer relative rounded-[48px] overflow-hidden aspect-[16/9] md:aspect-[21/9] border border-white/10"
                  >
                    <div className="absolute inset-0 z-0">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent z-10" />
                      {featuredPost.coverImage ? (
                        <img 
                          src={featuredPost.coverImage} 
                          alt={featuredPost.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full bg-indigo-900/20 flex items-center justify-center">
                           <BookOpen className="h-20 w-20 text-indigo-500/20" />
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute inset-0 z-20 p-8 md:p-14 flex flex-col justify-end">
                      <div className="flex items-center gap-4 mb-6">
                        <Badge className="bg-indigo-600 text-white border-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30">
                           {t("blog.exclusive_article")}
                        </Badge>
                        <span className="flex items-center gap-2 text-xs text-white/60 font-medium">
                          <Clock className="h-3 w-3" /> {t("blog.immersion_time", { count: estimateReadTime(featuredPost.content) })}
                        </span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-black font-display tracking-tighter mb-4 text-white leading-tight max-w-2xl group-hover:text-indigo-400 transition-colors">
                        {featuredPost.title}
                      </h3>
                      <p className="text-slate-300 text-lg md:text-xl line-clamp-2 max-w-2xl font-medium mb-8">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-full border-2 border-white/20 p-1">
                            <img src="https://i.pravatar.cc/100?u=michel" className="w-full h-full rounded-full object-cover" />
                         </div>
                         <div className="text-left">
                            <p className="text-xs font-black text-white uppercase tracking-widest">Michels Travel</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Curador Chefe</p>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )}
            </div>

            {/* Side Column - Trending / Smart Tips */}
            <div className="lg:col-span-4 space-y-6">
               <Card className="bg-gradient-to-br from-indigo-600 to-indigo-900 border-0 rounded-[32px] p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[50px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                  <Sparkles className="h-10 w-10 text-white/30 mb-6" />
                  <h4 className="text-xl font-black text-white mb-4 leading-tight">{t("blog.mia_guide_prompt")}</h4>
                  <p className="text-indigo-100/70 text-sm font-medium mb-8 leading-relaxed">
                    {t("blog.mia_guide_desc")}
                  </p>
                  <Button 
                    className="w-full bg-white text-indigo-900 hover:bg-slate-100 rounded-[20px] h-12 font-black uppercase tracking-widest"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot', { detail: { message: 'Olá Mia, quero um guia de viagem personalizado!' } }))}
                  >
                    {t("blog.talk_to_mia")}
                  </Button>
               </Card>
               
               <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-6 flex items-center gap-2">
                    <Navigation2 className="h-3 w-3" /> Flash Tips
                  </h4>
                  <div className="space-y-6">
                     {[
                       "Como evitar filas em Orlando (Abr-Mai)",
                       "Novo terminal em Newark: o que mudou?",
                       "Onde comer em Lisboa sem gastar muito"
                     ].map((tip, i) => (
                       <div key={i} className="flex gap-4 group cursor-pointer">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-all font-black">
                             0{i+1}
                          </div>
                          <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{tip}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Regular Posts Grid */}
          <div className="mt-20">
             <div className="flex items-center gap-4 mb-12">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap">Explore o Arquivo</h3>
               <div className="h-px bg-white/10 flex-1" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-[400px] rounded-[32px] bg-white/5 animate-pulse" />
                  ))
               ) : remainingPosts.map((post) => (
                 <Link key={post.slug} href={`/blog/${post.slug}`}>
                   <motion.div 
                     whileHover={{ y: -8 }}
                     className="group cursor-pointer flex flex-col h-full"
                   >
                     <div className="h-64 rounded-[40px] overflow-hidden mb-6 relative">
                       {post.coverImage ? (
                         <img 
                           src={post.coverImage} 
                           alt={post.title}
                           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                         />
                       ) : (
                         <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-slate-600" />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest bg-indigo-600 px-3 py-1 rounded-lg">
                             Ler Agora
                          </span>
                       </div>
                     </div>
                     <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                          {format(new Date(post.createdAt || new Date()), "dd MMM yyyy")}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {estimateReadTime(post.content)} min
                        </span>
                     </div>
                     <h4 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">
                       {post.title}
                     </h4>
                     <p className="text-sm text-slate-400 line-clamp-2 font-medium">
                       {post.excerpt}
                     </p>
                   </motion.div>
                 </Link>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-32 relative text-center overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] -z-10 rounded-full" />
         
         <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black font-display tracking-tight mb-8">{t("blog.high_conversion_headline")}</h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium mb-12">
               {t("blog.next_adventure_desc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link href="/search">
                  <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] px-10 h-16 font-black uppercase tracking-widest text-lg transition-all shadow-xl shadow-indigo-600/30">
                     <Navigation2 className="mr-3 h-6 w-6" /> {t("blog.start_adventure")}
                  </Button>
               </Link>
               <Button variant="outline" className="w-full sm:w-auto border-white/10 text-white hover:bg-white/5 rounded-[24px] px-10 h-16 font-black uppercase tracking-widest text-lg transition-all">
                  Explorar Hotéis
               </Button>
            </div>
         </div>
      </section>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-in-out infinite alternate;
        }
        .animate-bounce-slow {
          animation: bounce 3s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
