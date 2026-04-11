import { useAirlines, usePopularFlights } from "@/hooks/use-flights";
import { TrendingUp, Globe, Users, Plane, ArrowUpRight, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

export function MarketInsights() {
  const { data: popularFlights } = usePopularFlights();
  const { data: airlines } = useAirlines(20);
  const { t } = useI18n();

  const totalAirlines = airlines?.length || 500;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="lg:w-1/3">
            <Badge className="rounded-full bg-blue-50 text-blue-600 border-blue-100 mb-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 mr-2" />
              Travel Intelligence
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-950 leading-tight">
              O Mercado Global em Tempo Real
            </h2>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              Nossa tecnologia cruza dados de centenas de companhias aéreas para mapear as rotas mais seguras, econômicas e rápidas do planeta.
            </p>
            
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-black text-slate-950">{totalAirlines}+</div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Cias Conectadas</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-black text-slate-950">24/7</div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Monitoramento</div>
              </div>
            </div>
          </div>

          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <Card className="rounded-[32px] border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden group">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 px-3 py-1">
                    Alta Demanda
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-950">Rotas em Evidência</h3>
                <p className="text-sm text-slate-500 mt-1">Conexões com maior volume de buscas hoje</p>
                
                <div className="mt-6 space-y-4">
                  {(popularFlights?.slice(0, 4) || [
                    { origin: 'MIA', destination: 'GRU', searchCount: 840 },
                    { origin: 'JFK', destination: 'LHR', searchCount: 620 },
                    { origin: 'EWR', destination: 'LIS', searchCount: 510 }
                  ]).map((route: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="font-mono font-bold text-blue-600">{route.origin}</div>
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                        <div className="font-mono font-bold text-slate-950">{route.destination}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{route.searchCount} buscas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden bg-slate-950 text-white">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl text-white">
                    <Plane className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-xl font-bold">Top Operadoras</h3>
                <p className="text-sm text-slate-400 mt-1">Garantia de segurança e pontualidade</p>
                
                <div className="mt-6 flex flex-wrap gap-3">
                  {(airlines?.slice(0, 10) || []).map((airline: any, i: number) => (
                    <div key={i} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-colors cursor-default">
                      {airline.name}
                    </div>
                  ))}
                </div>
                
                <div className="mt-auto pt-8 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-950 bg-slate-800" />
                    ))}
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="text-white font-bold">+12k</span> viajantes este mês
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
