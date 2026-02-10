import { FlightSearchForm } from "@/components/FlightSearchForm";
import { usePopularFlights, useAirlines, useFeaturedAirports } from "@/hooks/use-flights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Zap, Globe, ArrowRight, MapPin, Plane } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

import airplaneDestination from "@/assets/images/airplane-destination.jpg";

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

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <section className="relative min-h-[700px] flex items-center justify-center pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-transparent select-none">
          <img 
            src={airplaneDestination}
            alt="Airplane wing over clouds"
            className="w-full h-full object-cover opacity-25 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16 max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 text-white border border-white/15 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold tracking-wide uppercase text-amber-100" data-testid="text-badge">{t("home.badge")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]" data-testid="text-hero-title">
              {t("home.title.1")} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">{t("home.title.2")}</span>
            </h1>
            <p className="text-lg text-white/75 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md" data-testid="text-hero-subtitle">
              {t("home.subtitle")}
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto transform hover:scale-[1.005] transition-transform duration-500">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      <section className="py-20 bg-black/20 backdrop-blur-sm border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold font-display text-white mb-4 uppercase tracking-wide drop-shadow-lg">{t("home.trust.title")}</h2>
            <p className="text-white/50 max-w-2xl mx-auto font-medium">{t("home.trust.subtitle")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: ShieldCheck, titleKey: "home.trust.secure", descKey: "home.trust.secure_desc", color: "text-emerald-400", bg: "group-hover:bg-emerald-500" },
              { icon: Zap, titleKey: "home.trust.instant", descKey: "home.trust.instant_desc", color: "text-amber-400", bg: "group-hover:bg-amber-500" },
              { icon: Globe, titleKey: "home.trust.support", descKey: "home.trust.support_desc", color: "text-teal-400", bg: "group-hover:bg-teal-500" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/5 border border-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 group backdrop-blur-md"
              >
                <div className={`h-16 w-16 bg-white/10 rounded-xl shadow-inner border border-white/10 ${item.color} flex items-center justify-center mb-6 ${item.bg} group-hover:text-white transition-colors duration-300`}>
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-white uppercase tracking-wide">{t(item.titleKey)}</h3>
                <p className="text-white/45 leading-relaxed font-medium">{t(item.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {topAirlines.length > 0 && (
        <section className="py-16 bg-transparent border-b border-white/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold font-display text-white mb-2">{t("home.airlines")}</h2>
              <p className="text-white/40 text-sm">{t("home.airlines_sub")}</p>
            </div>
            
            <div className="relative overflow-hidden">
              <div className="flex animate-marquee gap-8 py-4">
                {[...topAirlines, ...topAirlines].map((airline, i) => (
                  <div
                    key={`${airline.id}-${i}`}
                    className="flex-shrink-0 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3 backdrop-blur-sm hover:bg-white/10 transition-colors"
                    data-testid={`airline-card-${airline.iataCode}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      {airline.logoSymbolUrl ? (
                        <img src={airline.logoSymbolUrl} alt={airline.name} className="h-6 w-6 object-contain" />
                      ) : (
                        <Plane className="h-4 w-4 text-white/40" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white whitespace-nowrap">{airline.name}</span>
                      {airline.iataCode && (
                        <span className="text-xs text-amber-300/70 ml-2">({airline.iataCode})</span>
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
        <section className="py-20 bg-transparent border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold font-display text-white mb-2 drop-shadow-md">{t("home.popular.title")}</h2>
                <p className="text-white/45">{t("home.popular.subtitle")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {airports.slice(0, 8).map((airport, i) => (
                <motion.div
                  key={airport.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card 
                    className="group overflow-hidden border border-white/10 shadow-lg hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] transition-all cursor-pointer h-full bg-white/5 backdrop-blur-md rounded-2xl"
                    onClick={() => {
                      if (airport.iataCode) {
                        setLocation(`/search?origin=EWR&destination=${airport.iataCode}&date=2026-03-15&passengers=1&adults=1&children=0&infants=0&cabinClass=economy`);
                      }
                    }}
                    data-testid={`destination-card-${airport.iataCode}`}
                  >
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-amber-500/20 via-teal-500/10 to-transparent">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-white/15 text-white/90 border border-white/20 backdrop-blur-sm text-xs">
                          {airport.iataCode}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs text-white/60 truncate">{countryCodeToName(airport.countryName || "")}</span>
                        </div>
                        <h3 className="font-bold text-lg text-white leading-tight truncate">
                          {airport.cityName || airport.name}
                        </h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs text-white/40 mb-3 truncate">{airport.name}</p>
                      <Button className="w-full rounded-xl bg-white/10 border border-white/10 text-white hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 transition-all shadow-md text-sm" size="sm">
                        {t("home.popular.check_prices")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {popularFlights && popularFlights.length > 0 && (
        <section className="py-20 bg-black/10 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold font-display text-white mb-2 drop-shadow-md">{t("home.popular.title")}</h2>
                <p className="text-white/45">{t("home.popular.subtitle")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularFlights.map((flight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card 
                    className="group overflow-hidden border border-white/10 shadow-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all cursor-pointer bg-white/5 backdrop-blur-md rounded-2xl"
                    onClick={() => setLocation(`/search?origin=${flight.origin}&destination=${flight.destination}&date=2026-03-15&passengers=1&adults=1&cabinClass=economy`)}
                    data-testid={`popular-flight-${i}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                            <Plane className="h-4 w-4 text-amber-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{flight.origin}</div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/30" />
                        <div>
                          <div className="text-sm font-bold text-white">{flight.destination}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-200 border border-amber-500/20 text-xs">
                          {t("home.trending")}
                        </Badge>
                        <span className="text-xs font-medium text-white/35">{flight.searchCount} {t("home.popular.searches")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(!airports || airports.length === 0) && !airportsLoading && (!popularFlights || popularFlights.length === 0) && (
        <section className="py-20 bg-transparent">
          <div className="container mx-auto px-4 text-center">
            <div className="text-white/30 py-12">
              {t("search.button")}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
