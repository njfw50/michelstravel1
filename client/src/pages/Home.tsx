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
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* Hero Section */}
      <section className="relative min-h-[700px] flex items-center justify-center pt-24 pb-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-transparent select-none">
           {/* Tropical beach paradise hero image */}
          <img 
            src={airplaneDestination}
            alt="Airplane wing over clouds"
            className="w-full h-full object-cover opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16 max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold tracking-wide uppercase text-blue-100">Legal em NJ, USA • Seguranca e Confiabilidade</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]">
              Opção Eficiente <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Para Viajar</span>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
              Descubra os melhores destinos com a Michels Travel.
              Compare preços, reserve com segurança e viaje com tranquilidade.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto transform hover:scale-[1.01] transition-transform duration-500">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-black/20 backdrop-blur-sm border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display text-white mb-4 uppercase tracking-wide drop-shadow-lg">Por Que Escolher a Michels Travel?</h2>
            <p className="text-white/60 max-w-2xl mx-auto font-medium">Nós tornamos sua viagem simples e segura. Veja por que somos a escolha de confiança.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: ShieldCheck, title: "Reserva Segura", desc: "Seus dados são protegidos com criptografia de nível empresarial e gateways de pagamento seguros." },
              { icon: Zap, title: "Confirmação Imediata", desc: "Sem espera. Receba seu bilhete eletrônico em seu e-mail segundos após o pagamento." },
              { icon: Globe, title: "Suporte Global 24/7", desc: "Nossa equipe de especialistas em viagens está aqui para ajudar você a qualquer hora." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/5 border border-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 group backdrop-blur-md"
              >
                <div className="h-16 w-16 bg-white/10 rounded-xl shadow-inner border border-white/10 text-blue-400 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-white uppercase tracking-wide">{item.title}</h3>
                <p className="text-white/50 leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-24 bg-transparent border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold font-display text-white mb-2 drop-shadow-md">Trending Destinations</h2>
              <p className="text-white/50">Most booked flights by our community this week</p>
            </div>
            <Button variant="outline" className="hidden md:flex rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm">
              View All Destinations <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/5 rounded-2xl shadow-sm h-80 animate-pulse border border-white/5">
                  <div className="h-48 bg-white/10 rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-white/10 w-2/3 rounded" />
                    <div className="h-4 bg-white/10 w-1/2 rounded" />
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
                  <Card className="group overflow-hidden border border-white/10 shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all cursor-pointer h-full bg-white/5 backdrop-blur-md rounded-2xl">
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={airplaneDestination}
                        alt={flight.destination}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-80" />
                      
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="font-bold text-xl">{flight.destination}</h3>
                        <p className="text-white/80 text-sm">Flights from {flight.origin}</p>
                      </div>

                      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-2 text-white hover:bg-white/20 hover:text-pink-500 transition-colors border border-white/20">
                        <Heart className="h-4 w-4" />
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center mb-4">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border border-blue-500/30 font-semibold hover:bg-blue-500/30">
                          Trending
                        </Badge>
                        <span className="text-xs font-medium text-white/40">{flight.searchCount} searches</span>
                      </div>
                      <Button className="w-full rounded-xl bg-white/10 border border-white/10 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg">
                        Check Prices
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
            
            {/* Fallback if list is empty */}
            {!isLoading && (!popularFlights || popularFlights.length === 0) && (
              <div className="col-span-4 text-center py-12 text-white/40">
                Start searching to see popular destinations appear here!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
