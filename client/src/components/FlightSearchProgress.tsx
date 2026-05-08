import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Globe, ShieldCheck, Sparkles, CheckCircle2, Navigation } from "lucide-react";

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/98 p-4 md:p-12 overflow-hidden backdrop-blur-sm"
    >
      {/* Premium Cinematic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[180px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-slate-400/5 blur-[180px] rounded-full -translate-x-1/2 translate-y-1/2" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-[0.2]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* Route Header */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center md:items-start text-center md:text-left"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-3 px-4 py-1.5 border border-white/10 rounded-full">Partida Imediata</span>
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">{origin}</h2>
          </motion.div>

          <div className="flex-1 w-full max-w-[300px] flex flex-col items-center gap-4">
             <div className="relative w-full h-[1px] bg-white/10">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
             </div>
             <motion.div
               animate={{ y: [-3, 3, -3], rotate: [0, 5, 0] }}
               transition={{ duration: 4, repeat: Infinity }}
             >
               <Plane className="h-8 w-8 text-blue-400" />
             </motion.div>
             <p className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-500/60 font-display">Conectando Malha Global</p>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center md:items-end text-center md:text-right"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-3 px-4 py-1.5 border border-white/10 rounded-full">Destino Curado</span>
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">{destination}</h2>
          </motion.div>
        </div>

        {/* Central Intelligence Panel */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
           <div className="bg-white/[0.03] border border-white/5 backdrop-blur-3xl rounded-[40px] p-8 md:p-12 shadow-2xl flex flex-col justify-center">
              <div className="flex items-center gap-6 mb-8">
                 <div className="h-14 w-14 rounded-[20px] bg-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      <Globe className="h-6 w-6 text-white" />
                    </motion.div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Motor de Busca Michels Travel</p>
                    <h3 className="text-2xl font-black text-white tracking-tight">{SEARCH_STEPS[currentStep].label}</h3>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Capacidade de Processamento</span>
                    <span className="text-4xl font-black text-white font-mono tracking-tighter">{Math.floor(progress)}<span className="text-blue-500 text-2xl">%</span></span>
                 </div>
                  <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className="absolute h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.8)]"
                      style={{ width: `${progress}%` }}
                      transition={{ type: "spring", stiffness: 50, damping: 20 }}
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
                  <div 
                    key={step.key}
                    className={`flex items-center justify-between p-6 rounded-[32px] transition-all duration-700 border ${
                      isActive ? "bg-white/10 border-white/20 shadow-xl" : "bg-transparent border-white/5 opacity-20"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                        isComplete ? "bg-emerald-500/20 text-emerald-400" : isActive ? "bg-white text-slate-950" : "bg-white/5 text-white/50"
                      }`}>
                        {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{step.label}</span>
                    </div>
                    {isActive && (
                      <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="h-2 w-2 rounded-full bg-blue-400 shadow-glow"
                      />
                    )}
                  </div>
                );
              })}
           </div>
        </div>

        {/* Footer Audit */}
        <div className="mt-16 text-center">
           <p className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-600 flex items-center justify-center gap-4">
             <span className="h-[1px] w-12 bg-white/5" />
             Autenticidade Garantida & Suporte Humano Michels Travel
             <span className="h-[1px] w-12 bg-white/5" />
           </p>
        </div>
      </div>
    </motion.div>
  );
}
