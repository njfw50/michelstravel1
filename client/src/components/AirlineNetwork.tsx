import { useAirlines } from "@/hooks/use-flights";
import { Globe, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function AirlineNetwork() {
  const { data: airlines } = useAirlines(40);
  
  // Only show airlines with logos
  const logoAirlines = (airlines || []).filter(a => a.logoSymbolUrl || a.logoUrl).slice(0, 30);

  return (
    <section className="py-20 bg-white border-y border-slate-100 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
          <Globe className="h-3 w-3" />
          Global Airline Network
        </div>
        <h2 className="text-2xl md:text-4xl font-black text-slate-950">Conectando você às melhores do mundo.</h2>
        <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
          Nossa infraestrutura processa tarifas de mais de {airlines?.length || 500} companhias aéreas parceiras para encontrar a rota perfeita.
        </p>
      </div>

      <div className="relative flex overflow-x-hidden border-y border-slate-100 bg-slate-50/30">
        <div className="flex animate-marquee gap-12 py-10 whitespace-nowrap">
          {/* First set of logos */}
          {logoAirlines.map((airline, i) => (
            <div key={`set1-${i}`} className="flex items-center gap-4 px-8 py-5 rounded-[24px] bg-white border border-slate-200 shadow-[0_8px_20px_-10px_rgba(15,23,42,0.1)] transition-all hover:border-blue-200 hover:shadow-lg group">
              {airline.logoSymbolUrl ? (
                <img src={airline.logoSymbolUrl} alt={airline.name} className="h-10 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-500" />
              ) : (
                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs shrink-0">
                  {airline.iataCode}
                </div>
              )}
              <span className="text-sm font-black text-slate-900 tracking-tight truncate max-w-[140px]">{airline.name}</span>
            </div>
          ))}
          {/* Second set of logos (duplicated for seamless loop) */}
          {logoAirlines.map((airline, i) => (
            <div key={`set2-${i}`} className="flex items-center gap-4 px-8 py-5 rounded-[24px] bg-white border border-slate-200 shadow-[0_8px_20px_-10px_rgba(15,23,42,0.1)] transition-all hover:border-blue-200 hover:shadow-lg group">
              {airline.logoSymbolUrl ? (
                <img src={airline.logoSymbolUrl} alt={airline.name} className="h-10 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-500" />
              ) : (
                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs shrink-0">
                  {airline.iataCode}
                </div>
              )}
              <span className="text-sm font-black text-slate-900 tracking-tight truncate max-w-[140px]">{airline.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900">Emissão Certificada</h3>
          <p className="text-sm text-slate-500">Bilhetes emitidos diretamente nos GDS parceiros.</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900">Confirmação Real-Time</h3>
          <p className="text-sm text-slate-500">Seu localizador disponível em segundos.</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900">Suporte Global</h3>
          <p className="text-sm text-slate-500">Atendimento em qualquer fuso horário.</p>
        </div>
      </div>
    </section>
  );
}
