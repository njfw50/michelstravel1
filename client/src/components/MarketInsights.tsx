import { useAirlines, usePopularFlights } from "@/hooks/use-flights";
import { TrendingUp, Globe, Users, Plane, ArrowRight, Sparkles, MonitorCheck, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MarketInsights() {
  const { data: popularFlights } = usePopularFlights();
  const { data: airlines } = useAirlines(20);
  const { t } = useI18n();

  const totalAirlines = airlines?.length || 500;

  return (
    <section className="py-24 relative overflow-hidden bg-[#f8fbff]">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 blur-[120px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/20 blur-[100px] rounded-full -ml-32 -mb-32" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-16 items-center">
          
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="rounded-full border border-blue-200 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 shadow-sm">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Travel Intelligence
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black text-slate-950 leading-[1.1] tracking-tight">
                O Mercado Global em <span className="text-blue-600">Tempo Real</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                Nossa tecnologia cruza dados de centenas de companhias aéreas para mapear as rotas mais seguras, econômicas e rápidas do planeta.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[32px] bg-white border border-slate-200 shadow-[0_15px_40px_-15px_rgba(37,99,235,0.1)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-500" />
                <div className="text-3xl font-black text-slate-950 tracking-tighter">{totalAirlines}+</div>
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-2">Cias Conectadas</div>
                <Globe className="absolute bottom-4 right-4 h-8 w-8 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity" />
              </div>
              <div className="p-6 rounded-[32px] bg-white border border-slate-200 shadow-[0_15px_40px_-15px_rgba(37,99,235,0.1)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-500" />
                <div className="text-3xl font-black text-slate-950 tracking-tighter">24/7</div>
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-2">Monitoramento</div>
                <MonitorCheck className="absolute bottom-4 right-4 h-8 w-8 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity" />
              </div>
            </div>

            <div className="p-4 rounded-3xl border border-blue-100 bg-white shadow-sm flex items-center gap-4">
               <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <ShieldCheck className="h-5 w-5" />
               </div>
               <p className="text-sm font-bold text-slate-700 leading-snug">
                  Dados validados diretamente nos servidores da Duffel e GDS parceiros.
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            <Card className="rounded-[40px] border-slate-200 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.15)] overflow-hidden bg-white group hover:shadow-[0_40px_100px_-30px_rgba(37,99,235,0.2)] transition-all duration-700">
              <CardContent className="p-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-10">
                  <div className="h-14 w-14 bg-blue-600 rounded-2xl text-white flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Alta Demanda
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-black text-slate-950 leading-tight">Rotas em Evidência</h3>
                <p className="text-sm font-medium text-slate-500 mt-2">Conexões com maior volume de buscas hoje</p>
                
                <div className="mt-8 space-y-4">
                  {(popularFlights?.slice(0, 4) || [
                    { origin: 'MIA', destination: 'GRU', searchCount: 842 },
                    { origin: 'JFK', destination: 'LHR', searchCount: 615 },
                    { origin: 'EWR', destination: 'LIS', searchCount: 520 },
                    { origin: 'LAX', destination: 'HND', searchCount: 405 }
                  ]).map((route: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-blue-50 hover:border-blue-100 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-blue-600 tracking-tighter">{route.origin}</span>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                        <span className="text-lg font-black text-slate-950 tracking-tighter">{route.destination}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-100 shadow-sm">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600">{route.searchCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[40px] border-0 shadow-[0_32px_90px_-40px_rgba(2,6,23,0.5)] overflow-hidden bg-[#07132d] text-white group relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full" />
              <CardContent className="p-10 flex flex-col h-full relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl text-white flex items-center justify-center border border-white/10 shadow-lg">
                    <Plane className="h-7 w-7" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-black leading-tight">Elite Network</h3>
                <p className="text-sm font-medium text-blue-300/60 mt-2">Garantia de segurança e pontualidade</p>
                
                <div className="mt-8 flex flex-wrap gap-2.5">
                  {(airlines?.slice(0, 12) || []).map((airline: any, i: number) => (
                    <div key={i} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10 hover:border-white/20 transition-all cursor-default text-blue-100 leading-none max-w-[180px] truncate" title={airline.name}>
                      {airline.name}
                    </div>
                  ))}
                </div>
                
                <div className="mt-auto pt-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-[#07132d] bg-slate-800 shadow-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-[10px] font-black">
                           MT
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] text-blue-300/80 font-bold leading-none">
                      <span className="text-white font-black block text-sm mb-0.5">+12.4k</span>
                      passageiros este mês
                    </div>
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                     <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}
