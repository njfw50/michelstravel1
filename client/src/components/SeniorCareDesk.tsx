import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mic, HeartHandshake, AlertTriangle, AlertCircle } from "lucide-react";

export function SeniorCareDesk() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-violet-200 shadow-sm">
        <CardHeader className="border-b border-violet-100 bg-gradient-to-r from-violet-950 via-violet-900 to-indigo-900 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-white/20 bg-white/10 text-white">Senior Care</Badge>
                <Badge className="border border-white/10 bg-white/5 text-white/80">Ao vivo</Badge>
              </div>
              <CardTitle className="mt-4 text-3xl font-bold tracking-tight text-white">
                Assistência Sênior
              </CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-white/75">
                Monitoramento e suporte direto para passageiros idosos. Responda a pedidos de ajuda humana ou guie-os com áudios simples por aqui.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 xl:grid-cols-2">
            
            {/* Exemplo de Card de Passageiro Sênior Precisando de Ajuda */}
            <div className="rounded-[30px] border border-red-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-900">João Silva, 78</p>
                    <Badge className="border-red-200 bg-red-50 text-red-700">Atenção</Badge>
                    <Badge className="border-violet-200 bg-violet-50 text-violet-700">Sênior</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    GRU → LIS · Solicitou Assistência Humana (Botão Pânico)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Voo</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">TP88</p>
                  <p className="mt-1 text-xs text-red-500">Portão alterado</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-red-100 bg-red-50 p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Cliente possivelmente confuso</p>
                    <p className="mt-1 text-sm text-slate-600">O portão de embarque mudou de G4 para H1. O passageiro tocou em "Chamar Humano".</p>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Phone className="h-4 w-4" />
                    Ligar para o Tlm
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Mic className="h-4 w-4" />
                    Gravar Áudio Simples (Envio App)
                  </Button>
                  <Button variant="outline" className="gap-2 border-slate-200">
                    <HeartHandshake className="h-4 w-4" />
                    Avisar Familiar
                  </Button>
                </div>
              </div>
            </div>

            {/* Exemplo de Card Monitorado Normal */}
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-900">Maria Oliveira, 82</p>
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Tranquilo</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    JFK → MIA · Aguardando Embarque
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Voo</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">AA102</p>
                  <p className="mt-1 text-xs text-emerald-600">No horário</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">IA de voz orientou a cliente há 15min. Ela compreendeu e não pediu humano.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" className="gap-2">
                    <Mic className="h-4 w-4" />
                    Mandar Olá em Áudio
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
