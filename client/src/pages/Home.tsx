import { FlightSearchForm } from "@/components/FlightSearchForm";
import SeniorCardImage from "@/components/SeniorCardImage";
import AppLaunchPromo from "@/components/AppLaunchPromo";
import { FlightBoard } from "@/components/FlightBoard";
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
};

export default function Home() {
  const { data: airlines } = useAirlines(20);
  const { data: airports } = useFeaturedAirports();
  const { data: featuredDeals, isLoading: dealsLoading } = useFeaturedDeals();
  const [, setLocation] = useLocation();
  const { t, language } = useI18n();

  const airlineCount = airlines?.length || 0;
  const catalogDeals = featuredDeals?.slice(0, 4) || [];
  
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

  // --- GOOGLE SEO SUPER SOPHISTICATED SCHEMAS ---
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

      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <Badge className="rounded-full border-blue-200 bg-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-700 shadow-sm mb-8">
              <Sparkles className="mr-2 h-4 w-4" />
              The Intelligence of Travel
            </Badge>
            <h1 className="text-5xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter text-slate-950 mb-8">
              Sua Agência <br />
              <span className="text-blue-600">em Newark & Ironbound.</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-500 max-w-2xl leading-relaxed font-medium mb-12">
              Tarifas exclusivas curadas por tecnologia e suporte humano especializado 24h. Segurança absoluta para brasileiros nos EUA e no mundo.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-20">
               <Button 
                onClick={() => document.getElementById('search-anchor')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-full bg-blue-600 px-10 py-8 text-lg font-bold text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all outline-none"
               >
                 Explorar Destinos <ArrowRight className="ml-3 h-6 w-6" />
               </Button>
               <Button 
                variant="outline"
                className="rounded-full border-slate-200 bg-white px-10 py-8 text-lg font-bold text-slate-800 hover:bg-slate-50 outline-none"
                onClick={() => openChatbotAssistant({ message: "Olá, Mia. Preciso de ajuda para planejar minha viagem.", autoSend: true })}
               >
                 Consultoria IA <MessageCircle className="ml-3 h-6 w-6" />
               </Button>
            </div>
          </div>

          <div id="search-anchor" className="mt-8 rounded-[40px] border border-slate-100 bg-white p-6 shadow-[0_40px_100px_-40px_rgba(15,23,42,0.15)] md:p-10 relative">
             <div className="absolute -top-12 right-12 hidden lg:flex items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-100 p-4 rounded-3xl shadow-lg">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => <div key={i} className="h-10 w-10 rounded-full border-4 border-white bg-blue-100" />)}
                </div>
                <div>
                   <p className="text-xs font-black text-slate-950 leading-none">8.4k+ passageiros</p>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Este mês</p>
                </div>
             </div>
             <div className="mb-8">
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
      <section className="py-24 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <Badge className="bg-blue-50 text-blue-600 border-blue-100 mb-4 px-4 py-1.5 uppercase font-black text-[10px] tracking-widest">Oportunidades de Ouro</Badge>
              <h2 className="text-4xl md:text-6xl font-black text-slate-950 leading-none tracking-tighter">Ofertas em Destaque. <br /><span className="text-slate-400">Exclusividade do Ironbound.</span></h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 grid-rows-none md:grid-rows-2 gap-6 min-h-[800px]">
             {dealsLoading ? Array.from({length: 4}).map((_, i) => (
                <div key={i} className="rounded-[32px] bg-slate-50 animate-pulse border border-slate-100" />
             )) : (
               <>
                 {/* Main Highlight Deal (Card 0) - Large 2x2 */}
                 {catalogDeals[0] && (
                   <div className="md:col-span-2 md:row-span-2">
                     <DealCard deal={catalogDeals[0]} onSelect={openDealSearch} size="large" />
                   </div>
                 )}
                 
                 {/* Card 1 - Medium/Horizontal 2x1 */}
                 {catalogDeals[1] && (
                   <div className="md:col-span-2 md:row-span-1">
                     <DealCard deal={catalogDeals[1]} onSelect={openDealSearch} size="wide" />
                   </div>
                 )}

                 {/* Card 2 - Compact 1x1 */}
                 {catalogDeals[2] && (
                   <div className="md:col-span-1 md:row-span-1">
                     <DealCard deal={catalogDeals[2]} onSelect={openDealSearch} size="small" />
                   </div>
                 )}

                 {/* Card 3 - Compact 1x1 */}
                 {catalogDeals[3] && (
                   <div className="md:col-span-1 md:row-span-1">
                     <DealCard deal={catalogDeals[3]} onSelect={openDealSearch} size="small" />
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

function DealCard({ deal, onSelect, size = "small" }: { deal: PublicFeaturedDeal, onSelect: (deal: PublicFeaturedDeal) => void, size?: "large" | "wide" | "small" }) {
  const coverImage = DESTINATION_IMAGES[deal.destination] || DESTINATION_IMAGES[deal.origin];
  const isLarge = size === "large";
  const isWide = size === "wide";

  return (
    <Card 
      onClick={() => onSelect(deal)}
      className={cn(
        "group h-full overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all duration-500 cursor-pointer overflow-hidden",
        isLarge && "shadow-xl hover:shadow-2xl",
        !isLarge && "hover:shadow-lg"
      )}
    >
      <div className={cn("relative overflow-hidden", isLarge ? "h-[60%]" : isWide ? "h-full" : "h-56")}>
        {coverImage ? (
          <img src={coverImage} alt={deal.destination_city} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
        ) : (
          <div className="h-full w-full bg-blue-600 flex items-center justify-center text-white font-black text-2xl">MT</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-6 left-6 flex gap-2">
          {isLarge && <Badge className="bg-amber-500 text-white border-0 text-[10px] uppercase font-black tracking-widest px-3 py-1">Top Pick</Badge>}
          <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 text-[10px] uppercase font-black tracking-widest px-3 py-1">Oferta Elite</Badge>
        </div>

        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-80">
             <MapPin className="h-3.5 w-3.5 text-blue-400" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">{deal.origin} → {deal.destination}</p>
          </div>
          <h4 className={cn("font-black leading-none truncate", isLarge ? "text-4xl" : "text-2xl")}>
            {deal.destination_city || deal.destination}
          </h4>
          {isWide && (
             <div className="mt-4 flex items-center gap-4">
                <div className="text-2xl font-black">
                  {deal.currency === 'BRL' ? 'R$' : '$'} 
                   {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(deal.price_value || 0)}
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                   <ArrowRight className="h-4 w-4" />
                </div>
             </div>
          )}
        </div>
      </div>

      {!isWide && (
        <CardContent className={cn("p-6 flex flex-col justify-between", isLarge ? "h-[40%]" : "")}>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
              <Ticket className="h-3 w-3" /> Tarifa de Custo Real
            </div>
            <div className={cn("font-black text-slate-950 mb-3", isLarge ? "text-5xl" : "text-2xl")}>
              {deal.currency === 'BRL' ? 'R$' : '$'} 
              {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(deal.price_value || 0)}
            </div>
            <p className={cn("text-slate-500 font-medium leading-relaxed", isLarge ? "text-lg line-clamp-2" : "text-xs line-clamp-1")}>
              {deal.headline}
            </p>
          </div>

          <div className={cn("flex items-center justify-between pt-6 border-t border-slate-50 mt-auto")}>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{deal.cabin_class || 'Economy'}</span>
             <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Ver Voo <ArrowRight className="h-3 w-3" />
             </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
