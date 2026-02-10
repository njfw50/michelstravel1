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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111827]/90 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10"
        >
          <div className="bg-[#354388] p-8 text-center border-b border-white/10">
            <img 
              src={logo} 
              alt="Michels Travel" 
              className="h-16 w-auto mx-auto mb-6 object-contain"
            />
            <h2 className="text-2xl font-bold text-white mb-2 font-display">Bem-vindo / Welcome / Bienvenido</h2>
            <p className="text-blue-100 text-sm">Por favor, selecione seu idioma para continuar.</p>
            <p className="text-blue-100 text-sm">Please select your language to continue.</p>
            <p className="text-blue-100 text-sm">Por favor, seleccione su idioma para continuar.</p>
          </div>

          <div className="p-6 space-y-3 bg-slate-50">
            <button
              onClick={() => setLanguage("pt")}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-[#FF6B6B] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">🇧🇷</span>
                <div className="text-left">
                  <div className="font-bold text-slate-900 group-hover:text-[#354388]">Português</div>
                  <div className="text-xs text-slate-500">Brasil / Portugal</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-[#FF6B6B] transition-all" />
            </button>

            <button
              onClick={() => setLanguage("en")}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-[#FF6B6B] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">🇺🇸</span>
                <div className="text-left">
                  <div className="font-bold text-slate-900 group-hover:text-[#354388]">English</div>
                  <div className="text-xs text-slate-500">United States / Global</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-[#FF6B6B] transition-all" />
            </button>

            <button
              onClick={() => setLanguage("es")}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-[#FF6B6B] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">🇪🇸</span>
                <div className="text-left">
                  <div className="font-bold text-slate-900 group-hover:text-[#354388]">Español</div>
                  <div className="text-xs text-slate-500">España / Latinoamérica</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-[#FF6B6B] transition-all" />
            </button>
          </div>
          
          <div className="p-4 bg-slate-100 text-center border-t border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Michels Travel • Opção Eficiente</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
