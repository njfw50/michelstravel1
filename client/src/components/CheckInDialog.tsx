import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldCheck, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface CheckInDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckInDialog({
  booking,
  open,
  onOpenChange,
}: CheckInDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  
  // Initial passengers from booking or empty
  const initialPassengers = (booking.passengerDetails as any[]) || [];
  const [passengers, setPassengers] = useState<any[]>(
    initialPassengers.map(p => ({
      id: p.passengerId || p.id,
      givenName: p.givenName || "",
      familyName: p.familyName || "",
      email: p.email || booking.contactEmail,
      phoneNumber: p.phoneNumber || booking.contactPhone,
      bornOn: p.bornOn || "",
      gender: p.gender || "m",
      documentType: "passport",
      documentNumber: "",
      documentExpiryDate: "",
      documentIssuingCountry: "",
    }))
  );

  const mutation = useMutation({
    mutationFn: async (updatedPassengers: any[]) => {
      const res = await fetch(`/api/bookings/${booking.id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passengers: updatedPassengers.map(p => ({
            id: p.id,
            givenName: p.givenName,
            familyName: p.familyName,
            email: p.email,
            phoneNumber: p.phoneNumber,
            bornOn: p.bornOn,
            gender: p.gender,
            identityDocuments: [{
              type: p.documentType,
              unique_identifier: p.documentNumber,
              expires_on: p.documentExpiryDate,
              issuing_country_code: p.documentIssuingCountry,
            }]
          })),
          referenceCode: booking.referenceCode,
          contactEmail: booking.contactEmail,
        }),
      });
      if (!res.ok) throw new Error("Falha ao realizar check-in");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Check-in Realizado!",
        description: "Suas informações de embarque foram enviadas para a companhia aérea.",
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "Erro no Check-in",
        description: err.message || "Não foi possível processar seus documentos.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (idx: number, field: string, value: string) => {
    setPassengers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleCheckIn = () => {
    // Basic validation
    const invalid = passengers.some(p => !p.documentNumber || !p.documentExpiryDate || !p.documentIssuingCountry);
    if (invalid) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha todos os dados do passaporte.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(passengers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-blue-900">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Check-in Nativo Soberano
          </DialogTitle>
          <DialogDescription>
            Forneça as informações dos passageiros para gerar seu cartão de embarque.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-4">
          {passengers.map((pax, idx) => (
            <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
              <h4 className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs">
                Passageiro {idx + 1}
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={pax.givenName} disabled className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Sobrenome</Label>
                  <Input value={pax.familyName} disabled className="bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="space-y-2">
                  <Label>Número do Passaporte</Label>
                  <Input 
                    placeholder="Ex: AB123456" 
                    value={pax.documentNumber}
                    onChange={(e) => handleInputChange(idx, "documentNumber", e.target.value.toUpperCase())}
                    className="bg-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>País Emissor (Código ISO)</Label>
                  <Input 
                    placeholder="Ex: BR" 
                    maxLength={2}
                    value={pax.documentIssuingCountry}
                    onChange={(e) => handleInputChange(idx, "documentIssuingCountry", e.target.value.toUpperCase())}
                    className="bg-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Expiração</Label>
                  <Input 
                    type="date" 
                    value={pax.documentExpiryDate}
                    onChange={(e) => handleInputChange(idx, "documentExpiryDate", e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select value={pax.gender} onValueChange={(v) => handleInputChange(idx, "gender", v)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Masculino</SelectItem>
                      <SelectItem value="f">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3">
            <AlertCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800 leading-relaxed">
              Ao realizar o check-in nativo, você declara que todas as informações fornecidas são verdadeiras e correspondem aos documentos originais que serão apresentados no embarque.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Fechar
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]" 
            onClick={handleCheckIn}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Finalizar Check-in"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
