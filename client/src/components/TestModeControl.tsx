import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, Zap } from "lucide-react";
import { 
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter 
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { api } from "@shared/routes";

export function TestModeControl() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<boolean | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [preflightData, setPreflightData] = useState<any>(null);

  const { data: testModeData, isLoading } = useQuery({
    queryKey: ['/api/test-mode'],
  });

  const toggleMutation = useMutation({
    mutationFn: async (testMode: boolean) => {
      const res = await apiRequest('POST', api.admin.test_mode_toggle.path, { testMode, confirmed: true });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-mode'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] }); // Ensure global sync
      toast({
        title: "Sincronização Completa",
        description: `O terminal foi transicionado para modo ${pendingMode ? 'TESTE (Sandbox)' : 'PRODUÇÃO'} com sucesso.`,
      });
      setShowConfirmDialog(false);
    }
  });

  const handleToggleClick = async (newTestMode: boolean) => {
    setPendingMode(newTestMode);
    setShowConfirmDialog(true);
    setPreflightLoading(true);
    try {
      const url = `${api.admin.test_mode_preflight.path}?target=${newTestMode ? 'test' : 'production'}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setPreflightData(data);
    } catch (e) {
      setPreflightData({
        ready: false,
        duffelReady: false,
        stripeReady: false,
        issues: ["Falha ao conectar com o serviço de preflight"],
        targetMode: newTestMode ? 'test' : 'production',
      });
    } finally {
      setPreflightLoading(false);
    }
  };

  const handleConfirm = () => {
    if (pendingMode !== null) {
      toggleMutation.mutate(pendingMode);
    }
  };

  if (isLoading) return <div className="h-48 animate-pulse bg-white/5 rounded-[32px]" />;

  const currentTestMode = (testModeData as any)?.testMode ?? true;

  return (
    <Card className="glass-card border-white/5 overflow-hidden shadow-2xl">
      <CardHeader className="p-8 border-b border-white/5 bg-gradient-to-br from-rose-500/10 to-transparent flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-white font-display uppercase tracking-tight">Terminal de Comutação</CardTitle>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ambiente de Execução Duffel & Stripe</p>
        </div>
        <Badge className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border ${currentTestMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {currentTestMode ? "Sandbox (Teste)" : "Live (Produção)"}
        </Badge>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-[24px] bg-white/5 border border-white/5">
           <div className="space-y-1 text-center md:text-left">
             <p className="text-sm font-bold text-white uppercase tracking-wide">Alternância de Barramento</p>
             <p className="text-xs text-slate-400 leading-relaxed max-w-md">Mude o estado do sistema entre homologação e transações reais de mercado.</p>
           </div>
           <Button 
             onClick={() => handleToggleClick(!currentTestMode)}
             className={`h-14 px-10 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg ${
               currentTestMode 
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' 
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
             }`}
           >
             {currentTestMode ? "Mudar para Produção" : "Entrar em Modo Teste"}
           </Button>
        </div>
        
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="glass-card border-white/10 bg-slate-950/95 backdrop-blur-2xl text-white max-w-lg rounded-[32px] p-0 overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
              <AlertDialogHeader>
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 mx-auto md:mx-0">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <AlertDialogTitle className="text-2xl font-black font-display tracking-tight uppercase">Confirmação de Operação Crítica</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400 pt-4 text-base leading-relaxed">
                  Você está prestes a alternar o barramento global para <strong>{pendingMode ? 'TESTE (SANDBOX)' : 'PRODUÇÃO (LIVE)'}</strong>. 
                  Esta ação invalida sessões de pagamento ativas e reinicia os tokens de emissão imediatamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>

            <div className="p-8 space-y-6">
               <div className="flex items-center gap-3">
                 <Zap className="h-4 w-4 text-indigo-400" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Diagnóstico de Pré-vôo</span>
               </div>
               
               {preflightLoading ? (
                 <div className="flex items-center gap-4 text-indigo-400 animate-pulse bg-white/5 p-6 rounded-2xl">
                   <Loader2 className="h-6 w-6 animate-spin" />
                   <span className="text-xs font-bold uppercase tracking-widest">Validando integridade das APIs...</span>
                 </div>
               ) : preflightData && (
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className={`p-5 rounded-2xl border flex flex-col gap-2 transition-all ${preflightData.duffelReady ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/5 border-amber-500/20 text-amber-400'}`}>
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Duffel API</span>
                       <span className="text-sm font-black uppercase">{preflightData.duffelReady ? 'Operacional' : 'Atenção'}</span>
                     </div>
                     <div className={`p-5 rounded-2xl border flex flex-col gap-2 transition-all ${preflightData.stripeReady ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/5 border-amber-500/20 text-amber-400'}`}>
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Stripe Gateway</span>
                       <span className="text-sm font-black uppercase">{preflightData.stripeReady ? 'Operacional' : 'Atenção'}</span>
                     </div>
                   </div>
                   {/* Avisos informativos — NÃO bloqueiam a transição (Lei 9: simplicidade) */}
                   {preflightData.issues && preflightData.issues.length > 0 && (
                     <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                       <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 opacity-70">⚠ Avisos de Configuração</p>
                       {preflightData.issues.map((issue: string, idx: number) => (
                         <p key={idx} className="text-xs text-amber-300/80 leading-relaxed">{issue}</p>
                       ))}
                       <p className="text-[9px] text-amber-400/50 pt-1">Você pode prosseguir, mas verifique as variáveis de ambiente no servidor.</p>
                     </div>
                   )}
                 </div>
               )}
            </div>

            <AlertDialogFooter className="p-8 bg-white/5 flex flex-col sm:flex-row gap-3 border-t border-white/5">
              <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-2xl h-14 px-8 font-bold order-2 sm:order-1">Abortar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirm} 
                disabled={preflightLoading || toggleMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl h-14 px-10 shadow-xl shadow-indigo-600/30 order-1 sm:order-2"
              >
                {toggleMutation.isPending ? "Processando..." : "Confirmar Transição"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
