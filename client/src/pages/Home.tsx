import { FlightSearchForm } from "@/components/FlightSearchForm";
import SeniorCardImage from "@/components/SeniorCardImage";
import AppLaunchPromo from "@/components/AppLaunchPromo";
import { FlightBoard } from "@/components/FlightBoard";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAirlines, useFeaturedAirports, useFeaturedDeals, type PublicFeaturedDeal } from "@/hooks/use-flights";
import { ArrowRight, CheckCircle2, Globe, HeartHandshake, MapPin, MessageCircle, Plane, Sparkles, Ticket, TrendingUp, ShieldCheck, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { SEO } from "@/components/SEO";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
import { MarketInsights } from "@/components/MarketInsights";
import { ConciergePromo } from "@/components/ConciergePromo";
import { AirlineNetwork } from "@/components/AirlineNetwork";
import { openChatbotAssistant } from "@/lib/chatbot";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Imagens de Alta Fidelidade para o Estilo Editorial
import airplaneDestination from "@/assets/images/airplane-destination.jpg";
import imgNewYork from "@/assets/images/destinations/new-york.jpg";
import imgLondon from "@/assets/images/destinations/london.jpg";
import imgParis from "@/assets/images/destinations/paris.jpg";
import imgMiami from "@/assets/images/destinations/miami.jpg";
import imgSaoPaulo from "@/assets/images/destinations/sao-paulo.jpg";
import imgLisbon from "@/assets/images/destinations/lisbon.jpg";
import imgOrlando from "@/assets/images/destinations/orlando.jpg";

const DESTINATION_IMAGES: Record<string, string> = {
  JFK: imgNewYork,
  EWR: imgNewYork,
  LHR: imgLondon,
  CDG: imgParis,
  MIA: imgMiami,
  GRU: imgSaoPaulo,
  LIS: imgLisbon,
  MCO: imgOrlando,
  PAR: imgParis,
  FRA: "https://images.unsplash.com/photo-1541336318489-083908868919?q=80&w=2000&auto=format&fit=crop",
  ROM: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=2000&auto=format&fit=crop",
  RIO: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=2000&auto=format&fit=crop",
  MAD: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=2000&auto=format&fit=crop",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1436491865332-7a61a109c05e?q=80&w=2000&auto=format&fit=crop";

export default function Home() {
  const { data: airlines } = useAirlines(20);
  const { data: airports } = useFeaturedAirports();
  const { t, language } = useI18n();
  const { data: catalogDeals = [], isLoading: dealsLoading } = useFeaturedDeals(language);
  const [, setLocation] = useLocation();

  const airlineCount = airlines?.length || 0;
  
  const contactWhatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: language as any,
      topic: "Planejamento de Viagem",
      details: ["Olá, gostaria de ajuda especializada para planejar minha próxima viagem."],
    }),
  );

  const openDealSearch = (deal: PublicFeaturedDeal) => {
    const searchParams = new URLSearchParams({
      origin: deal.origin,
      destination: deal.destination,
      date: deal.departure_date,
      passengers: "1",
      adults: "1",
      children: "0",
      infants: "0",
      cabinClass: deal.cabin_class || "economy",
      tripType: deal.return_date ? "round-trip" : "one-way",
    });

    if (deal.return_date) {
      searchParams.set("returnDate", deal.return_date);
    }

    setLocation(`/search?dealId=${deal.id}&${searchParams.toString()}`);
  };

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      "name": "Michels Travel",
      "description": "Agência de viagens dedicada para brasileiros em Newark, Ironbound e em todo os EUA. Especialistas em passagens aéreas e suporte sênior.",
      "url": "https://www.michelstravel.agency",
      "telephone": "+1-973-589-1000",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Ironbound",
        "addressLocality": "Newark",
        "addressRegion": "NJ",
        "postalCode": "07105",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 40.7357,
        "longitude": -74.1724
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      },
      "sameAs": [
        "https://www.facebook.com/michelstravel",
        "https://www.instagram.com/michelstravel"
      ]
    }
  ];

  return (
    <div className="bg-[#fcfdff] text-slate-900 font-sans">
      <SEO
        title="Agência de Viagens Ironbound Newark | Michels Travel"
        description="A maior agência de passagens aéreas para brasileiros em Newark e Ironbound. Suporte humano 24h, modo sênior exclusivo e as melhores tarifas dos EUA."
        path="/"
        structuredData={structuredData}
      />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <Badge className="rounded-full border-blue-200 bg-white px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-blue-700 shadow-sm mb-6">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              The Intelligence of Travel
            </Badge>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight text-slate-950 mb-4 mt-2 max-w-sm">
              Sua Agência <br />
              <span className="text-blue-600">em Newark & Ironbound.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-lg leading-relaxed font-medium mb-8">
              Tarifas exclusivas curadas por tecnologia e suporte humano especializado 24h. Segurança absoluta para brasileiros nos EUA e no mundo.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-0">
               <Button 
                onClick={() => document.getElementById('search-anchor')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-full bg-blue-600 px-8 py-6 text-base font-bold text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all outline-none"
               >
                 Explorar Destinos <ArrowRight className="ml-2 h-5 w-5" />
               </Button>
               <Button 
                variant="outline"
                className="rounded-full border-slate-200 bg-white px-8 py-6 text-base font-bold text-slate-800 hover:bg-slate-50 outline-none"
                onClick={() => openChatbotAssistant({ message: "Olá, Mia. Preciso de ajuda para planejar minha viagem.", autoSend: true })}
               >
                 Consultoria IA <MessageCircle className="ml-2 h-5 w-5" />
               </Button>
            </div>
          </div>

          <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-[45%] h-[60%] hidden lg:block z-0 pointer-events-none">
             <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-[#fcfdff] via-transparent to-transparent z-10" />
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-white rounded-[60px] shadow-[0_50px_100px_-20px_rgba(37,99,235,0.1)] flex items-center justify-center relative overflow-hidden">
                   <Plane className="h-64 w-64 text-blue-500/5 rotate-12 absolute -right-10 -bottom-10" />
                   <div className="text-center p-8 relative z-10">
                      <Badge className="bg-blue-600 text-white mb-4">Newark NJ</Badge>
                      <h3 className="text-xl font-bold text-slate-950">Voe com o Michels</h3>
                   </div>
                </div>
                <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-[32px] shadow-2xl border border-blue-50 z-20 max-w-[200px] animate-bounce-slow">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Plane className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-xs font-black text-slate-950 uppercase tracking-tighter">Newark Base</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Tarifas locais direto do NJ para o mundo.</p>
                </div>
             </div>
          </div>

          <div id="search-anchor" className="mt-8 rounded-[32px] border border-slate-100/50 bg-white/70 backdrop-blur-2xl p-5 shadow-[0_48px_100px_-24px_rgba(15,23,42,0.12)] md:p-8 relative z-20 border-t-white/80 overflow-hidden">
             <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/20 to-transparent pointer-events-none" />
             <div className="absolute -top-12 right-12 hidden lg:flex items-center gap-4 bg-white/90 backdrop-blur-md border border-slate-100 p-4 rounded-3xl shadow-xl z-30">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => <div key={i} className="h-10 w-10 rounded-full border-4 border-white bg-blue-100 relative overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=pax${i}`} alt="passenger" className="w-full h-full object-cover" />
                   </div>)}
                </div>
                <div>
                   <p className="text-xs font-black text-slate-950 leading-none">8.4k+ passageiros</p>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Este mês</p>
                </div>
             </div>
             <div className="mb-8 relative z-10">
                <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Onde sua história continua?</h2>
                <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Disponibilidade global em Newark - NJ</p>
             </div>
             <FlightSearchForm />
          </div>
        </div>
      </section>

      {/* --- EXECUTIVE SUMMARY --- */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <SummaryItem 
              icon={<HeartHandshake className="h-8 w-8 text-amber-500" />}
              title="Cuidado Sênior Especializado"
              desc="Processos guiados, letras maiores e calma total para idosos e famílias brasileiras."
            />
            <SummaryItem 
              icon={<Globe className="h-8 w-8 text-blue-600" />}
              title="Malha Global Direta de Newark"
              desc="Conectamos você às maiores cias aéreas com tarifas de baixo custo garantidas."
            />
            <SummaryItem 
              icon={<ShieldCheck className="h-8 w-8 text-emerald-500" />}
              title="Segurança & Suporte 24h"
              desc="Apoio humano real em qualquer fuso horário para sua total tranquilidade."
            />
          </div>
        </div>
      </section>

      {/* --- BENTO DEALS REVOLUTION --- */}
      <section className="py-24 md:py-32 overflow-hidden bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4 px-4 py-1.5 uppercase font-black text-[10px] tracking-widest">Oportunidades de Ouro</Badge>
              <h2 className="text-4xl md:text-7xl font-black text-slate-950 leading-none tracking-tighter">Ofertas em Destaque. <br /><span className="text-slate-300">Exclusividade Ironbound.</span></h2>
            </div>
            <div className="hidden md:block">
               <Button variant="ghost" className="font-black uppercase tracking-widest text-xs text-blue-600 hover:text-blue-700">Ver todas as promoções <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px] md:auto-rows-[400px]">
             {dealsLoading ? Array.from({length: 4}).map((_, i) => (
                <div key={i} className="rounded-[40px] bg-white animate-pulse border border-slate-100 col-span-12 md:col-span-4" />
             )) : (
               <>
                 {/* Main Editorial Hero Card (2x2 span) */}
                 {catalogDeals[0] && (
                   <div className="col-span-1 md:col-span-8 row-span-1 md:row-span-2">
                     <DealCard deal={catalogDeals[0]} onSelect={openDealSearch} type="hero" />
                   </div>
                 )}
                 
                 {/* Secondary Card (1x1 span) */}
                 {catalogDeals[1] && (
                   <div className="col-span-1 md:col-span-4 row-span-1">
                     <DealCard deal={catalogDeals[1]} onSelect={openDealSearch} type="standard" />
                   </div>
                 )}

                 {/* Tertiary Card (1x1 span) */}
                 {catalogDeals[2] && (
                   <div className="col-span-1 md:col-span-4 row-span-1">
                     <DealCard deal={catalogDeals[2]} onSelect={openDealSearch} type="standard" />
                   </div>
                 )}

                 {/* Quaternary Card (if exists, overflow) */}
                 {catalogDeals[3] && (
                   <div className="col-span-1 md:col-span-4 row-span-1">
                     <DealCard deal={catalogDeals[3]} onSelect={openDealSearch} type="standard" />
                   </div>
                 )}
               </>
             )}
          </div>
        </div>
      </section>

      {/* --- PILLARS OF SERVICE --- */}
      <section className="py-24 bg-slate-950 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
               <div>
                  <p className="text-blue-400 font-black uppercase tracking-[0.25em] text-xs mb-4">Legacy & Trust</p>
                  <h2 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tighter">A agência dedicada em Newark.</h2>
                  <p className="text-slate-400 text-lg md:text-xl mt-6 font-medium leading-relaxed">
                    No coração do Ironbound, operamos com a força de um hub global de inteligência aérea. Segurança física e digital unificadas para a comunidade.
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <StatItem label="Cias Aéreas" value={airlineCount > 0 ? `${airlineCount}+` : "500+"} />
                  <StatItem label="Aeroportos" value="3000+" />
                  <StatItem label="Atendimento" value="24/7" />
                  <StatItem label="Hub Ironbound" value="HQ" />
               </div>
               <Button asChild className="rounded-full bg-white text-slate-950 font-black px-10 py-8 text-lg hover:bg-blue-50 outline-none">
                  <a href={contactWhatsAppHref} target="_blank" rel="noreferrer">
                    Falar via WhatsApp <MessageCircle className="ml-3 h-6 w-6" />
                  </a>
               </Button>
            </div>
            <div className="relative">
              <Card className="rounded-[40px] border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-10 shadow-2xl overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl" />
                 <p className="text-amber-500 font-black uppercase tracking-widest text-xs mb-4">Experiência Signature</p>
                 <h3 className="text-3xl font-black mb-6">Suporte Sênior White-Glove</h3>
                 <p className="text-slate-400 leading-relaxed mb-10">
                   Especialistas em brasileiros que vivem nos EUA. Monitoramos cada passo da viagem dos seus pais, garantindo calma, carinho e precisão absoluta.
                 </p>
                 <SeniorCardImage />
                 <Button onClick={() => setLocation("/senior")} className="w-full mt-10 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black h-14 outline-none">
                    Conhecer Atendimento Sênior
                 </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <MarketInsights />
      <ConciergePromo />
      <AirlineNetwork />
      <FlightBoard />
      <AppLaunchPromo className="bg-white" />

      {/* --- MIA REVOLUTION --- */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
           <div className="relative rounded-[48px] overflow-hidden bg-[linear-gradient(135deg,#0e1e3b_0%,#07132d_100%)] p-8 md:p-16 lg:p-24 shadow-2xl">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                 <div>
                    <Badge className="bg-white/10 text-blue-200 border-white/5 mb-8">Consultora Inteligente</Badge>
                    <h2 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter mb-8">
                       Mia: Sua Bússola <br /><span className="text-blue-400">Digital.</span>
                    </h2>
                    <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-10">
                       Pesquisas ilimitadas, cotações em qualquer idioma e um olhar técnico para identificar a melhor tarifa. Mia cuida da busca, nossa equipe cuida de você.
                    </p>
                    <Button 
                      onClick={() => openChatbotAssistant({ message: "Mia, mostre as melhores conexões para o Brasil.", autoSend: true })}
                      className="rounded-full bg-white text-blue-900 font-bold px-10 py-8 text-lg outline-none"
                    >
                      <MessageCircle className="mr-3 h-6 w-6" /> Falar com a Mia
                    </Button>
                 </div>
                 <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className="space-y-6">
                       <div className="flex items-center gap-4 text-white">
                          <CheckCircle2 className="text-blue-400 h-6 w-6" />
                          <span className="font-bold">Apoio em tempo real via Chat</span>
                       </div>
                       <div className="flex items-center gap-4 text-white">
                          <CheckCircle2 className="text-blue-400 h-6 w-6" />
                          <span className="font-bold">Análise de bagagem simplificada</span>
                       </div>
                       <div className="flex items-center gap-4 text-white">
                          <CheckCircle2 className="text-blue-400 h-6 w-6" />
                          <span className="font-bold">Transferência imediata para humanos</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}

function SummaryItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-4">
      <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-6 font-display">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-950 uppercase tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{label}</p>
    </div>
  );
}

function DealCard({ deal, onSelect, type = "standard" }: { deal: PublicFeaturedDeal, onSelect: (deal: PublicFeaturedDeal) => void, type?: "hero" | "standard" }) {
  const coverImage = DESTINATION_IMAGES[deal.destination] || DESTINATION_IMAGES[deal.origin] || DEFAULT_IMAGE;
  const isHero = type === "hero";

  return (
    <Card 
      onClick={() => onSelect(deal)}
      className={cn(
        "group relative h-full overflow-hidden rounded-[48px] border-0 transition-all duration-700 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-2",
        isHero ? "bg-slate-900" : "bg-white"
      )}
    >
      <div className="absolute inset-0 z-0">
        <img 
          src={coverImage} 
          alt={deal.destination_city} 
          className="h-full w-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[3000ms] brightness-75 group-hover:brightness-90" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/10" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-8 md:p-12 text-white">
        <div className="flex justify-between items-start">
           <div className="flex gap-2">
              <Badge className="bg-blue-600 text-white border-0 text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full">Oferta Elite</Badge>
              {isHero && <Badge className="bg-amber-500 text-white border-0 text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full">Destaque do Mês</Badge>}
           </div>
           <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-6 w-6 text-white" />
           </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-4">
             <MapPin className="h-4 w-4 text-blue-400" />
             <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80">{deal.origin} → {deal.destination}</span>
          </div>
          
          <h4 className={cn("font-black leading-[0.9] tracking-tighter mb-6", isHero ? "text-6xl md:text-8xl" : "text-4xl md:text-5xl")}>
             {deal.destination_city || deal.destination}
          </h4>

          <div className="flex flex-col md:flex-row md:items-end gap-6 border-t border-white/10 pt-8">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Passagem Individual</p>
                <div className="text-5xl md:text-6xl font-black flex items-start gap-1">
                   <span className="text-2xl mt-2">{deal.currency === 'BRL' ? 'R$' : '$'}</span>
                   {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(deal.price_value || 0)}
                </div>
             </div>
             
             {isHero && (
               <div className="md:ml-auto max-w-xs">
                  <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                    "{deal.headline || 'Tarifa de custo real negociada diretamente com a malha aérea de Newark.'}"
                  </p>
               </div>
             )}
          </div>
          
          <div className="mt-8 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
             <Plane className="h-4 w-4" />
             <span>{deal.cabin_class || 'Economy Class'}</span>
             <span className="h-1 w-1 rounded-full bg-white/30" />
             <span>{deal.return_date ? 'Round Trip' : 'One Way'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
