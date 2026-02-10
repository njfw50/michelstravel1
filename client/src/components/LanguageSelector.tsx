import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Check } from "lucide-react";
import logo from "@assets/LOGO_1770751298475.png";

export function LanguageSelector() {
  const { language, setLanguage, isLoading } = useI18n();

  // If loading or language is already set, don't show the modal
  if (isLoading || language) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10"
        >
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-8 text-center border-b border-white/10">
            <img 
              src={logo} 
              alt="Michels Travel" 
              className="h-16 w-auto mx-auto mb-6 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            />
            <h2 className="text-2xl font-bold text-white mb-2 font-display tracking-wide">Bem-vindo / Welcome</h2>
            <p className="text-white/70 text-sm">Por favor, selecione seu idioma para continuar.</p>
            <p className="text-white/70 text-sm">Please select your language to continue.</p>
          </div>

          <div className="p-6 space-y-3 bg-transparent">
            <button
              onClick={() => setLanguage("pt")}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all group duration-300"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl drop-shadow-md">🇧🇷</span>
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-blue-300 transition-colors">Português</div>
                  <div className="text-xs text-white/50 group-hover:text-white/70">Brasil / Portugal</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
            </button>

            <button
              onClick={() => setLanguage("en")}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all group duration-300"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl drop-shadow-md">🇺🇸</span>
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-purple-300 transition-colors">English</div>
                  <div className="text-xs text-white/50 group-hover:text-white/70">United States / Global</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
            </button>

            <button
              onClick={() => setLanguage("es")}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-400/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all group duration-300"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl drop-shadow-md">🇪🇸</span>
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-orange-300 transition-colors">Español</div>
                  <div className="text-xs text-white/50 group-hover:text-white/70">España / Latinoamérica</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-orange-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
            </button>
          </div>
          
          <div className="p-4 bg-white/5 text-center border-t border-white/10">
            <p className="text-xs text-white/40 font-medium tracking-widest uppercase">Michels Travel • Opção Eficiente</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
