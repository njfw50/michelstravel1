import { useLocation } from "wouter";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function CheckoutCancel() {
  const [_, setLocation] = useLocation();
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl rounded-2xl">
          <CardContent className="pt-10 pb-10 px-6 flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center border border-red-200">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-display text-gray-900" data-testid="text-checkout-cancel">{t("checkout.cancel_title")}</h1>
              <p className="text-gray-500">{t("checkout.cancel_desc")}</p>
            </div>

            <div className="w-full pt-4">
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-200 text-gray-700 font-bold"
                data-testid="button-try-again"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("checkout.try_again")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
