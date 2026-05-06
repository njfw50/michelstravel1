import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings, useUpdateSettings } from "@/hooks/use-admin";
import { DollarSign, Save, RefreshCw, Percent } from "lucide-react";

export function CommissionControl() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const [commission, setCommission] = useState<string>("8.50");

  useEffect(() => {
    if (settings?.commissionPercentage) {
      setCommission(String(settings.commissionPercentage));
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      const val = parseFloat(commission);
      if (isNaN(val) || val < 0 || val > 100) {
        toast({
          title: "Valor Inválido",
          description: "A comissão deve ser um número entre 0 e 100.",
          variant: "destructive",
        });
        return;
      }

      await updateSettings.mutateAsync({
        ...settings,
        commissionPercentage: commission,
      } as any);

      toast({
        title: "Configuração Salva",
        description: "A margem de comissão foi atualizada com sucesso.",
      });
    } catch (err) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div className="h-48 animate-pulse bg-white/5 rounded-[32px]" />;

  return (
    <Card className="glass-card border-white/5 overflow-hidden shadow-2xl">
      <CardHeader className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white font-display uppercase tracking-tight">Ajustes de Comissão</CardTitle>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gestão de Yield Management & Markup</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid gap-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Margem Global da Agência (%)</Label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:scale-110 transition-transform">
                <Percent className="h-5 w-5" />
              </div>
              <Input 
                type="number"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="h-16 pl-14 bg-slate-950/40 border-white/5 text-white font-bold text-xl rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                placeholder="8.50"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-medium italic ml-1">
              * Esta margem será aplicada sobre a tarifa base do Duffel em todas as novas buscas.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 gap-3 group transition-all"
        >
          {updateSettings.isPending ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />
          )}
          {updateSettings.isPending ? "Sincronizando..." : "Efetivar Alteração de Margem"}
        </Button>
      </CardContent>
    </Card>
  );
}
