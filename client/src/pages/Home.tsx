import { FlightSearchForm } from "@/components/FlightSearchForm";
import { usePopularFlights } from "@/hooks/use-flights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Zap, Globe, Heart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import airplaneDestination from "@/assets/images/airplane-destination.jpg";

export default function Home() {
  const { data: popularFlights, isLoading } = usePopularFlights();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[700px] flex items-center justify-center pt-24 pb-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-slate-900 select-none">
           {/* Tropical beach paradise hero image */}
          <img 
            src={airplaneDestination}
            alt="Airplane wing over clouds"
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16 max-w-4xl mx-auto"
          >
            <Badge className="mb-6 px-4 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md transition-all text-sm font-medium">
              ✨ The easiest way to travel
            </Badge>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Discover Your Next <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-200 to-white">Dream Destination</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              Compare prices from hundreds of airlines and book with confidence. 
              Secure payments, 24/7 support, and instant confirmation.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto transform hover:scale-[1.01] transition-transform duration-500">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display text-slate-900 mb-4">Why Book With Us?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">We make travel simple and secure. Here is why millions of travelers trust us with their journeys.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: ShieldCheck, title: "Secure Booking", desc: "Your data is protected with enterprise-grade encryption and secure payment gateways." },
              { icon: Zap, title: "Instant Confirmation", desc: "No waiting around. Get your e-ticket delivered to your inbox seconds after payment." },
              { icon: Globe, title: "24/7 Global Support", desc: "Our team of travel experts is here to help you around the clock, in your language." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group"
              >
                <div className="h-16 w-16 bg-white rounded-2xl shadow-sm text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-slate-900">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold font-display text-slate-900 mb-2">Trending Destinations</h2>
              <p className="text-slate-500">Most booked flights by our community this week</p>
            </div>
            <Button variant="outline" className="hidden md:flex rounded-full border-slate-300 hover:bg-white hover:text-primary">
              View All Destinations <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm h-80 animate-pulse">
                  <div className="h-48 bg-slate-200 rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-slate-200 w-2/3 rounded" />
                    <div className="h-4 bg-slate-200 w-1/2 rounded" />
                  </div>
                </div>
              ))
            ) : (
              popularFlights?.map((flight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all cursor-pointer h-full bg-white rounded-2xl">
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={airplaneDestination}
                        alt={flight.destination}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                      
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="font-bold text-xl">{flight.destination}</h3>
                        <p className="text-white/80 text-sm">Flights from {flight.origin}</p>
                      </div>

                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 text-white hover:bg-white hover:text-red-500 transition-colors">
                        <Heart className="h-4 w-4" />
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center mb-4">
                        <Badge variant="secondary" className="bg-blue-50 text-primary font-semibold hover:bg-blue-100">
                          Trending
                        </Badge>
                        <span className="text-xs font-medium text-slate-400">{flight.searchCount} searches</span>
                      </div>
                      <Button className="w-full rounded-xl bg-slate-900 text-white hover:bg-primary transition-colors">
                        Check Prices
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
            
            {/* Fallback if list is empty */}
            {!isLoading && (!popularFlights || popularFlights.length === 0) && (
              <div className="col-span-4 text-center py-12 text-slate-500">
                Start searching to see popular destinations appear here!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
