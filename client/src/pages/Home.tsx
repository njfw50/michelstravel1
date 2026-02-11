import { FlightSearchForm } from "@/components/FlightSearchForm";
import { usePopularFlights, useAirlines, useFeaturedAirports } from "@/hooks/use-flights";
import { FlightBoard } from "@/components/FlightBoard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Zap, Globe, ArrowRight, MapPin, Plane, Search, CreditCard, Ticket, Star, Clock, Headphones, Users, TrendingUp, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

import airplaneDestination from "@/assets/images/airplane-destination.jpg";
import airplaneLightHero from "@/assets/images/airplane-light-hero.png";

import imgNewYork from "@/assets/images/destinations/new-york.jpg";
import imgLondon from "@/assets/images/destinations/london.jpg";
import imgParis from "@/assets/images/destinations/paris.jpg";
import imgMiami from "@/assets/images/destinations/miami.jpg";
import imgLosAngeles from "@/assets/images/destinations/los-angeles.jpg";
import imgDubai from "@/assets/images/destinations/dubai.jpg";
import imgTokyo from "@/assets/images/destinations/tokyo.jpg";
import imgBarcelona from "@/assets/images/destinations/barcelona.jpg";
import imgSaoPaulo from "@/assets/images/destinations/sao-paulo.jpg";
import imgRome from "@/assets/images/destinations/rome.jpg";
import imgLisbon from "@/assets/images/destinations/lisbon.jpg";
import imgCancun from "@/assets/images/destinations/cancun.jpg";
import imgOrlando from "@/assets/images/destinations/orlando.jpg";
import imgSanFrancisco from "@/assets/images/destinations/san-francisco.jpg";
import imgChicago from "@/assets/images/destinations/chicago.jpg";

const DESTINATION_IMAGES: Record<string, string> = {
  JFK: imgNewYork,
  EWR: imgNewYork,
  LHR: imgLondon,
  CDG: imgParis,
  MIA: imgMiami,
  LAX: imgLosAngeles,
  DXB: imgDubai,
  NRT: imgTokyo,
  BCN: imgBarcelona,
  GRU: imgSaoPaulo,
  FCO: imgRome,
  LIS: imgLisbon,
  CUN: imgCancun,
  MCO: imgOrlando,
  SFO: imgSanFrancisco,
  ORD: imgChicago,
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", BR: "Brazil", GB: "United Kingdom", FR: "France", ES: "Spain",
  MX: "Mexico", AE: "United Arab Emirates", JP: "Japan", IT: "Italy", PT: "Portugal",
  DE: "Germany", CA: "Canada", AU: "Australia", AR: "Argentina", CL: "Chile",
  CO: "Colombia", PE: "Peru", NL: "Netherlands", CH: "Switzerland", SE: "Sweden",
  NO: "Norway", DK: "Denmark", IE: "Ireland", AT: "Austria", BE: "Belgium",
  GR: "Greece", TR: "Turkey", TH: "Thailand", SG: "Singapore", KR: "South Korea",
  IN: "India", CN: "China", HK: "Hong Kong", EG: "Egypt", ZA: "South Africa",
  IL: "Israel", QA: "Qatar", SA: "Saudi Arabia", MY: "Malaysia", ID: "Indonesia",
  PH: "Philippines", NZ: "New Zealand", CZ: "Czech Republic", PL: "Poland",
};

function countryCodeToName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

export default function Home() {
  const { data: popularFlights, isLoading: popularLoading } = usePopularFlights();
  const { data: airlines, isLoading: airlinesLoading } = useAirlines(40);
  const { data: airports, isLoading: airportsLoading } = useFeaturedAirports();
  const [_, setLocation] = useLocation();
  const { t } = useI18n();

  const topAirlines = airlines?.filter(a => a.logoSymbolUrl && a.iataCode) || [];
  const airlineCount = airlines?.length || 0;
  const airportCount = airports?.length || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 select-none">
          <img 
            src={airplaneLightHero}
            alt="Airplane flying through bright sky"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-blue-50/20 to-white/80" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12 md:mb-16 max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-full px-5 py-2 mb-8 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("home.stats.secure")} &middot; {t("home.stats.support")}</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold text-gray-900 mb-6 leading-[0.95] tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]" data-testid="text-hero-title">
              {t("home.title.1")} <br/>
              <span className="text-blue-600">{t("home.title.2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed" data-testid="text-hero-subtitle">
              {t("home.subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-6xl mx-auto"
          >
            <FlightSearchForm />
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </section>

      <section className="relative mt-8 z-20 pb-8">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: airlineCount > 0 ? `${airlineCount}+` : "500+", labelKey: "home.stats.airlines", icon: Plane, color: "text-blue-500", bg: "bg-blue-50" },
                { value: airportCount > 0 ? `${airportCount.toLocaleString()}+` : "3,000+", labelKey: "home.stats.destinations", icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
                { value: "24/7", labelKey: "home.stats.support", icon: Headphones, color: "text-emerald-500", bg: "bg-emerald-50" },
                { value: "100%", labelKey: "home.stats.secure", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4"
                >
                  <div className={`h-12 w-12 rounded-xl ${stat.bg} border border-gray-100 flex items-center justify-center ${stat.color} flex-shrink-0`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-2xl md:text-3xl font-extrabold font-display text-gray-900 block leading-none">{stat.value}</span>
                    <span className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-widest font-semibold block">{t(stat.labelKey)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-3 block">{t("home.how.title")}</span>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-gray-900 mb-4">{t("home.how.subtitle")}</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Search, step: "01", titleKey: "home.how.step1_title", descKey: "home.how.step1_desc", color: "bg-blue-500" },
              { icon: CreditCard, step: "02", titleKey: "home.how.step2_title", descKey: "home.how.step2_desc", color: "bg-blue-600" },
              { icon: Ticket, step: "03", titleKey: "home.how.step3_title", descKey: "home.how.step3_desc", color: "bg-emerald-500" },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative group flex flex-col items-center text-center p-8 md:p-10 rounded-2xl bg-white border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200"
              >
                <span className="text-[11px] font-bold text-blue-500 tracking-[0.3em] mb-6 block">{item.step}</span>
                <div className={`h-16 w-16 rounded-2xl ${item.color} flex items-center justify-center mb-6 mx-auto shadow-md`}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-gray-900">{t(item.titleKey)}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{t(item.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-3 block">{t("home.trust.title")}</span>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-gray-900 mb-4">{t("home.trust.subtitle")}</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: ShieldCheck, titleKey: "home.trust.secure", descKey: "home.trust.secure_desc", color: "bg-emerald-500" },
              { icon: Zap, titleKey: "home.trust.instant", descKey: "home.trust.instant_desc", color: "bg-blue-500" },
              { icon: Globe, titleKey: "home.trust.support", descKey: "home.trust.support_desc", color: "bg-blue-600" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-visible rounded-2xl bg-gray-50 border border-gray-200 p-8 md:p-10 transition-all duration-300 hover:shadow-lg hover:border-blue-200"
              >
                <div className={`h-14 w-14 rounded-xl ${item.color} flex items-center justify-center mb-6 shadow-md`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">{t(item.titleKey)}</h3>
                <p className="text-gray-500 leading-relaxed">{t(item.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {topAirlines.length > 0 && (
        <section className="py-16 bg-gray-50 border-y border-gray-200">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold font-display text-gray-900 mb-2">{t("home.airlines")}</h2>
              <p className="text-gray-500 text-sm">{t("home.airlines_sub")}</p>
            </div>
            
            <div className="relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
              <div className="flex animate-marquee gap-4 py-4">
                {[...topAirlines, ...topAirlines].map((airline, i) => (
                  <div
                    key={`${airline.id}-${i}`}
                    className="flex-shrink-0 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3 transition-all hover:shadow-md hover:border-blue-200"
                    data-testid={`airline-card-${airline.iataCode}`}
                  >
                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {airline.logoSymbolUrl ? (
                        <img src={airline.logoSymbolUrl} alt={airline.name} className="h-5 w-5 object-contain" />
                      ) : (
                        <Plane className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{airline.name}</span>
                      {airline.iataCode && (
                        <span className="text-xs text-blue-500 ml-2 font-mono">({airline.iataCode})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {airports && airports.length > 0 && (
        <section className="py-24 md:py-32 bg-white" data-testid="section-destinations">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex justify-between items-end mb-12 flex-wrap gap-4"
            >
              <div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-3 block">{t("home.popular.title")}</span>
                <h2 className="text-3xl md:text-5xl font-extrabold font-display text-gray-900 mb-2">{t("home.popular.subtitle")}</h2>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {airports.slice(0, 8).map((airport, i) => {
                const destImage = airport.iataCode ? DESTINATION_IMAGES[airport.iataCode] : null;
                return (
                  <motion.div
                    key={airport.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div
                      className="group relative overflow-hidden rounded-2xl cursor-pointer h-72 bg-gray-100 border border-gray-200 hover:shadow-xl transition-all duration-300"
                      onClick={() => {
                        if (airport.iataCode) {
                          const d = new Date();
                          d.setDate(d.getDate() + 14);
                          const dateStr = d.toISOString().split("T")[0];
                          setLocation(`/search?origin=EWR&destination=${airport.iataCode}&date=${dateStr}&passengers=1&adults=1&children=0&infants=0&cabinClass=economy`);
                        }
                      }}
                      data-testid={`destination-card-${airport.iataCode}`}
                    >
                      {destImage ? (
                        <img 
                          src={destImage} 
                          alt={airport.cityName || airport.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-200 via-blue-100 to-transparent" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 backdrop-blur-md text-gray-900 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-white/20">
                          {airport.iataCode}
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <MapPin className="h-3 w-3 text-blue-300" />
                          <span className="text-[11px] text-white/70 truncate font-medium">{countryCodeToName(airport.countryName || "")}</span>
                        </div>
                        <h3 className="font-bold text-xl text-white leading-tight truncate mb-3">
                          {airport.cityName || airport.name}
                        </h3>
                        <div className="flex items-center gap-2 text-blue-300 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                          {t("home.popular.check_prices")} <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <FlightBoard />

      <section className="py-24 md:py-32 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-3 block">{t("home.testimonials.title")}</span>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-gray-900">{t("home.testimonials.subtitle")}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { nameKey: "home.testimonials.t1_name", locKey: "home.testimonials.t1_loc", textKey: "home.testimonials.t1_text" },
              { nameKey: "home.testimonials.t2_name", locKey: "home.testimonials.t2_loc", textKey: "home.testimonials.t2_text" },
              { nameKey: "home.testimonials.t3_name", locKey: "home.testimonials.t3_loc", textKey: "home.testimonials.t3_text" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200"
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">"{t(item.textKey)}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {t(item.nameKey).charAt(0)}
                  </div>
                  <div>
                    <span className="text-gray-900 font-semibold text-sm block">{t(item.nameKey)}</span>
                    <span className="text-gray-400 text-xs">{t(item.locKey)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-blue-50/50 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-extrabold font-display text-gray-900 mb-6 leading-tight">{t("home.cta.title")}</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto leading-relaxed">{t("home.cta.subtitle")}</p>
            <Button 
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="rounded-full px-10 py-6 text-lg font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all"
              data-testid="button-cta-search"
            >
              {t("home.cta.button")} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {(!airports || airports.length === 0) && !airportsLoading && (!popularFlights || popularFlights.length === 0) && (
        <section className="py-20 bg-transparent">
          <div className="container mx-auto px-4 text-center">
            <div className="text-gray-400 py-12">
              {t("search.button")}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
