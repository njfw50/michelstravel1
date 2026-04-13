import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Banknote, 
  ArrowRightLeft, 
  TrendingUp, 
  RefreshCcw,
  Info,
  Globe2,
  Calendar,
  CloudSun
} from "lucide-react";

interface CurrencyData {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export default function Toolbox() {
  const { t } = useI18n();
  const [usdAmount, setUsdAmount] = useState<string>("100");
  const [brlAmount, setBrlAmount] = useState<string>("");

  const { data: rates, isLoading, refetch, isFetching } = useQuery<CurrencyData>({
    queryKey: ["/api/external/currency"],
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  useEffect(() => {
    if (rates?.rates?.BRL && usdAmount) {
      const converted = parseFloat(usdAmount) * rates.rates.BRL;
      setBrlAmount(converted.toFixed(2));
    }
  }, [rates, usdAmount]);

  const handleBrlChange = (val: string) => {
    setBrlAmount(val);
    if (rates?.rates?.BRL && val) {
      const converted = parseFloat(val) / rates.rates.BRL;
      setUsdAmount(converted.toFixed(2));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <SEO 
        title="Ferramentas do Viajante | Michels Travel" 
        description="Acesse ferramentas reais para sua viagem: conversor de moedas ao vivo, clima e guias de documentação."
        path="/toolbox"
      />

      <section className="pt-20 pb-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <Badge className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Real-Time Data</Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-950 tracking-tighter uppercase leading-tight mb-4">
            Traveler's <span className="text-blue-600">Toolbox</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">
            Dados reais e ferramentas essenciais para planejar sua jornada com precisão profissional.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Currency Converter - REAL DATA */}
            <div className="lg:col-span-2">
               <Card className="p-8 md:p-12 rounded-[40px] shadow-sm border-slate-100 bg-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => refetch()} 
                        disabled={isFetching}
                        className="rounded-full hover:bg-slate-50"
                     >
                        <RefreshCcw className={`h-5 w-5 text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
                     </Button>
                  </div>

                  <div className="flex items-center gap-4 mb-10">
                     <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Banknote className="h-7 w-7" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Conversor de Moedas</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Live Rates (Frankfurter API)</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dólar Americano (USD)</label>
                        <div className="relative">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">U$</span>
                           <Input 
                              type="number"
                              value={usdAmount}
                              onChange={(e) => setUsdAmount(e.target.value)}
                              className="h-20 pl-16 text-3xl font-black rounded-3xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-blue-600/10"
                           />
                        </div>
                     </div>

                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                        <div className="h-12 w-12 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center text-blue-600">
                           <ArrowRightLeft className="h-5 w-5" />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Real Brasileiro (BRL)</label>
                        <div className="relative">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">R$</span>
                           <Input 
                              type="number"
                              value={brlAmount}
                              onChange={(e) => handleBrlChange(e.target.value)}
                              className="h-20 pl-16 text-3xl font-black rounded-3xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-blue-600/10"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="mt-12 p-6 rounded-3xl bg-blue-50/50 border border-blue-100 flex flex-wrap items-center justify-between gap-6">
                     <div className="flex items-center gap-4">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <div>
                           <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest">Cotação do Dia</p>
                           <p className="text-xl font-black text-blue-900 leading-none">
                              1 USD = {isLoading ? "..." : rates?.rates?.BRL?.toFixed(4)} BRL
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           Última atualização: {rates?.date}
                        </span>
                     </div>
                  </div>
               </Card>
            </div>

            {/* Weather Widget - REAL DATA */}
            <div className="space-y-8">
               <WeatherWidget city="Sao Paulo" label="São Paulo (GRU)" />
               <WeatherWidget city="Orlando" label="Orlando (MCO)" />
               <WeatherWidget city="Lisbon" label="Lisboa (LIS)" />

               <Card className="p-8 rounded-[40px] border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <Info className="h-5 w-5 text-blue-600" />
                     <h3 className="text-lg font-black uppercase tracking-tight">Dica Concierge</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                     Lembre-se que as cotações de cartões de crédito costumam incluir IOF (4.38%). Use esta ferramenta para estimar o valor base da sua viagem.
                  </p>
               </Card>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

function WeatherWidget({ city, label }: { city: string; label: string }) {
  const { data, isLoading } = useQuery<{ temp: string; condition: string; humidity: string; feelsLike: string }>({
    queryKey: [`/api/external/weather/${city}`],
    staleTime: 1000 * 60 * 30, // 30 min
  });

  return (
    <Card className="p-8 rounded-[40px] border-slate-100 bg-slate-900 text-white shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
         <CloudSun className="h-20 w-20" />
      </div>
      
      <div className="relative z-10">
         <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{label}</span>
         </div>
         
         <div className="flex items-end gap-4 mb-4">
            <span className="text-5xl font-black tracking-tighter">
               {isLoading ? "--" : `${data?.temp}°C`}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
               {isLoading ? "Fetching..." : data?.condition}
            </span>
         </div>

         <div className="flex gap-6 mt-6 border-t border-white/10 pt-6">
            <div>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Sensação</p>
               <p className="text-xs font-bold text-slate-300">{data?.feelsLike || "--"}°C</p>
            </div>
            <div>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Umidade</p>
               <p className="text-xs font-bold text-slate-300">{data?.humidity || "--"}%</p>
            </div>
         </div>
      </div>
    </Card>
  );
}
