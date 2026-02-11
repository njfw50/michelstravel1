import { useLocation } from "wouter";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function CheckoutSuccess() {
  const [_, setLocation] = useLocation();
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-white/5 backdrop-blur-md border-white/10 text-white shadow-2xl rounded-2xl">
          <CardContent className="pt-10 pb-10 px-6 flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-display" data-testid="text-checkout-success">{t("checkout.success_title")}</h1>
              <p className="text-white/60">{t("checkout.success_desc")}</p>
            </div>

            <div className="w-full pt-4">
              <Button
                onClick={() => setLocation("/")}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold border-0"
                data-testid="button-back-home"
              >
                {t("checkout.back_home")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
