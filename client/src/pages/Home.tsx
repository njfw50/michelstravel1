import { FlightSearchForm } from "@/components/FlightSearchForm";
import { Layout } from "@/components/Layout";
import { usePopularFlights } from "@/hooks/use-flights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Zap, Globe, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: popularFlights } = usePopularFlights();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center pt-20 pb-32 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-slate-900">
           {/* Unsplash image with descriptive alt */}
           {/* scenic aerial view of tropical islands and blue ocean */}
          <img 
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
            alt="Beautiful beach destination"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 max-w-3xl mx-auto"
          >
            <Badge className="mb-4 bg-blue-500/20 text-blue-100 hover:bg-blue-500/30 border-blue-400/30 backdrop-blur-sm">
              Discover the world
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
              Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white">Adventure</span>
            </h1>
            <p className="text-lg text-slate-300">
              Compare prices from hundreds of airlines and travel agents to find the best deal for your dream trip.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <FlightSearchForm />
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "Secure Booking", desc: "Your data is protected with enterprise-grade encryption." },
              { icon: Zap, title: "Instant Confirmation", desc: "Get your e-ticket delivered to your inbox immediately." },
              { icon: Globe, title: "24/7 Support", desc: "Our travel experts are here to help you around the clock." }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 hover:bg-blue-50/50 transition-colors">
                <div className="p-3 bg-white rounded-xl shadow-sm text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Popular Destinations</h2>
              <p className="text-muted-foreground">Trending flights booked by other travelers</p>
            </div>
            <Button variant="outline">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {popularFlights?.map((flight, i) => (
              <Card key={i} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all cursor-pointer">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={`https://source.unsplash.com/800x600/?${flight.destination}`} 
                    alt={flight.destination}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 text-red-500 hover:scale-110 transition-transform">
                    <Heart className="h-4 w-4" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{flight.destination}</h3>
                      <p className="text-sm text-muted-foreground">From {flight.origin}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Popular
                    </Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">Searched {flight.searchCount} times</span>
                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/10 -mr-2">
                      Search Deals
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Fallback items if no data */}
            {!popularFlights && [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm h-72 animate-pulse">
                <div className="h-48 bg-slate-200 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 w-2/3 rounded" />
                  <div className="h-3 bg-slate-200 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
