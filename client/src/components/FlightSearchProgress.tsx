import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Globe, ShieldCheck, Sparkles, CheckCircle2, Navigation } from "lucide-react";
import { createPortal } from "react-dom";

interface FlightSearchProgressProps {
  origin: string;
  destination: string;
  onComplete?: () => void;
}

const SEARCH_STEPS = [
  { key: "sync", icon: Globe, label: "Sincronizando Malha Aérea Global" },
  { key: "filter", icon: Sparkles, label: "Filtrando Melhores Tarifas e Conexões" },
  { key: "validate", icon: ShieldCheck, label: "Validando Assentos e Regras VIP" },
  { key: "finalize", icon: CheckCircle2, label: "Finalizando Seleção Exclusiva" },
];

export default function FlightSearchProgress({ origin, destination }: FlightSearchProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Lock scroll with gutter compensation to prevent layout shifts
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < SEARCH_STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) return 99;
        return Math.min(prev + (Math.random() * 0.8 + 0.2), 99);
      });
    }, 120);

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950 p-6 md:p-20 overflow-hidden"
    >
      {/* Premium Cinematic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/10 blur-[200px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-slate-400/5 blur-[200px] rounded-full -translate-x-1/2 translate-y-1/2" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-[0.2]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        {/* Route Header */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
          <motion.div 
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-center md:items-start text-center md:text-left"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4 px-4 py-1.5 border border-white/10 rounded-full bg-white/5">Partida Imediata</span>
            <h2 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 tracking-tighter leading-none">{origin}</h2>
          </motion.div>

          <div className="flex-1 w-full max-w-[400px] flex flex-col items-center gap-6">
             <div className="relative w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
             </div>
             <motion.div
               animate={{ y: [-5, 5, -5], rotate: [0, 8, 0] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             >
               <Plane className="h-12 w-12 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
             </motion.div>
             <p className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500/80 font-display">Conectando Malha Global</p>
          </div>

          <motion.div 
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center md:items-end text-center md:text-right"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4 px-4 py-1.5 border border-white/10 rounded-full bg-white/5">Destino Curado</span>
            <h2 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 tracking-tighter leading-none">{destination}</h2>
          </motion.div>
        </div>

        {/* Central Intelligence Panel */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
           <div className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[48px] p-10 md:p-16 shadow-2xl flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-transparent opacity-50" />
              <div className="flex items-center gap-8 mb-10 relative z-10">
                 <div className="h-16 w-16 rounded-[24px] bg-blue-600 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.5)]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    >
                      <Globe className="h-8 w-8 text-white" />
                    </motion.div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Motor de Busca Michels Travel</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">{SEARCH_STEPS[currentStep].label}</h3>
                 </div>
              </div>

              <div className="space-y-8 relative z-10">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Status de Processamento</span>
                    <span className="text-5xl font-black text-white font-mono tracking-tighter">{Math.floor(progress)}<span className="text-blue-500 text-3xl">%</span></span>
                 </div>
                  <div className="relative h-3 w-full bg-white/10 rounded-full overflow-hidden shadow-inner p-[2px]">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500 shadow-[0_0_30px_rgba(37,99,235,0.8)]"
                      style={{ width: `${progress}%` }}
                      transition={{ type: "spring", stiffness: 40, damping: 20 }}
                    />
                  </div>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {SEARCH_STEPS.map((step, idx) => {
                const isActive = idx === currentStep;
                const isComplete = idx < currentStep;
                const Icon = step.icon;
                return (
                  <motion.div 
                    key={step.key}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: isActive || isComplete ? 1 : 0.2, x: 0 }}
                    className={`flex items-center justify-between p-6 rounded-[32px] transition-all duration-700 border ${
                      isActive ? "bg-white/10 border-white/20 shadow-2xl scale-105" : "bg-transparent border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        isComplete ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]" : isActive ? "bg-white text-slate-950" : "bg-white/5 text-white/30"
                      }`}>
                        {isComplete ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-[0.25em] transition-colors ${isActive ? "text-white" : "text-white/40"}`}>{step.label}</span>
                    </div>
                    {isActive && (
                      <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"
                      />
                    )}
                  </motion.div>
                );
              })}
           </div>
        </div>

        {/* Footer Audit */}
        <div className="mt-20 text-center">
           <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-700 flex items-center justify-center gap-6">
             <span className="h-[1px] w-16 bg-white/5" />
             Autenticidade Garantida Michels Travel
             <span className="h-[1px] w-16 bg-white/5" />
           </p>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(content, document.body);
}
