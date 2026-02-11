import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Check, Globe } from "lucide-react";
import logo from "@assets/LOGO_1770751298475.png";

export function LanguageSelector() {
  const { language, setLanguage, isLoading } = useI18n();

  if (isLoading || language) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200"
        >
          <div className="bg-blue-50 p-8 text-center border-b border-gray-200">
            <img 
              src={logo} 
              alt="Michels Travel" 
              className="h-16 w-auto mx-auto mb-6 object-contain"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display tracking-wide">Bem-vindo / Welcome</h2>
            <p className="text-gray-500 text-sm">Por favor, selecione seu idioma para continuar.</p>
            <p className="text-gray-500 text-sm">Please select your language to continue.</p>
          </div>

          <div className="p-6 space-y-3">
            <button
              onClick={() => setLanguage("pt")}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all group duration-300"
              data-testid="button-lang-pt"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
                  <Globe className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Português</div>
                  <div className="text-xs text-gray-500">Brasil / Portugal</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
            </button>

            <button
              onClick={() => setLanguage("en")}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all group duration-300"
              data-testid="button-lang-en"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">English</div>
                  <div className="text-xs text-gray-500">United States / Global</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
            </button>

            <button
              onClick={() => setLanguage("es")}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all group duration-300"
              data-testid="button-lang-es"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center border border-orange-200">
                  <Globe className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Español</div>
                  <div className="text-xs text-gray-500">España / Latinoamérica</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
            </button>
          </div>
          
          <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
            <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Michels Travel - Opção Eficiente</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
