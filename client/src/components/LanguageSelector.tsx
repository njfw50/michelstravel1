import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Check, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/LOGO_1770751298475.png";

export function LanguageSelector() {
  const { language, setLanguage, isLoading } = useI18n();
  const [step, setStep] = useState<"welcome" | "language">("welcome");

  if (isLoading || language) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <AnimatePresence mode="wait">
          {step === "welcome" ? (
            <motion.div
              key="welcome"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200"
            >
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-8 w-24 h-24 border border-white/30 rounded-full" />
                  <div className="absolute bottom-6 right-6 w-32 h-32 border border-white/20 rounded-full" />
                  <div className="absolute top-12 right-16 w-12 h-12 border border-white/20 rounded-full" />
                </div>
                <div className="relative z-10">
                  <motion.img
                    src={logo}
                    alt="Michels Travel"
                    className="h-20 w-auto mx-auto mb-6 object-contain drop-shadow-lg"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                  >
                    <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight" data-testid="text-welcome-title">
                      BuyFlights.net
                    </h1>
                    <div className="w-12 h-0.5 bg-white/40 mx-auto mb-4 rounded-full" />
                    <p className="text-blue-100 text-sm font-medium tracking-wide uppercase" data-testid="text-welcome-subtitle">
                      A Michels Travel Company
                    </p>
                  </motion.div>
                </div>
              </div>

              <div className="p-6 space-y-3 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="space-y-1.5"
                >
                  <p className="text-gray-700 text-sm font-medium" data-testid="text-welcome-pt">
                    Bem-vindo! Encontre os melhores voos com precos imbativeis.
                  </p>
                  <p className="text-gray-500 text-sm" data-testid="text-welcome-en">
                    Welcome! Find the best flights at unbeatable prices.
                  </p>
                  <p className="text-gray-500 text-sm" data-testid="text-welcome-es">
                    Bienvenido! Encuentra los mejores vuelos a precios inmejorables.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.3 }}
                  className="pt-3"
                >
                  <Button
                    onClick={() => setStep("language")}
                    className="bg-blue-600 text-white w-full"
                    data-testid="button-continue-to-language"
                  >
                    Continuar / Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>

              <div className="p-3 bg-gray-50 text-center border-t border-gray-200">
                <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Michels Travel - Opcao Eficiente</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="language"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200"
            >
              <div className="bg-blue-50 p-8 text-center border-b border-gray-200">
                <img
                  src={logo}
                  alt="Michels Travel"
                  className="h-16 w-auto mx-auto mb-6 object-contain"
                />
                <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display tracking-wide" data-testid="text-language-title">Selecione seu idioma</h2>
                <p className="text-gray-500 text-sm">Por favor, selecione seu idioma para continuar.</p>
                <p className="text-gray-500 text-sm">Please select your language to continue.</p>
                <p className="text-gray-500 text-sm">Por favor, seleccione su idioma para continuar.</p>
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={() => setLanguage("pt")}
                  className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 hover-elevate transition-all group duration-300"
                  data-testid="button-lang-pt"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
                      <Globe className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Portugues</div>
                      <div className="text-xs text-gray-500">Brasil / Portugal</div>
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-blue-500 invisible group-hover:visible transition-all" />
                </button>

                <button
                  onClick={() => setLanguage("en")}
                  className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 hover-elevate transition-all group duration-300"
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
                  <Check className="h-5 w-5 text-blue-500 invisible group-hover:visible transition-all" />
                </button>

                <button
                  onClick={() => setLanguage("es")}
                  className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 hover-elevate transition-all group duration-300"
                  data-testid="button-lang-es"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center border border-orange-200">
                      <Globe className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Espanol</div>
                      <div className="text-xs text-gray-500">Espana / Latinoamerica</div>
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-blue-500 invisible group-hover:visible transition-all" />
                </button>
              </div>

              <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
                <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">BuyFlights.net - Michels Travel</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
