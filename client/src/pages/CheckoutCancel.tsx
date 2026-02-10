import { useLocation } from "wouter";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function CheckoutCancel() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/10 text-white shadow-2xl">
          <CardContent className="pt-10 pb-10 px-6 flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-display">Pagamento Cancelado</h1>
              <p className="text-white/60">
                O processo de pagamento foi interrompido. Nenhuma cobrança foi realizada no seu cartão.
              </p>
            </div>

            <div className="w-full pt-4">
              <Button 
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full h-12 rounded-xl border-white/20 hover:bg-white/10 text-white font-bold"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
