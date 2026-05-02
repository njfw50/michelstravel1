import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plane, Check, X, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface SeatMapDialogProps {
  bookingId: string;
  referenceCode: string;
  contactEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeatMapDialog({
  bookingId,
  referenceCode,
  contactEmail,
  open,
  onOpenChange,
}: SeatMapDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selectedSeats, setSelectedSeats] = useState<Record<string, { id: string; designator: string; price: string; currency: string }>>({});
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  const { data: seatData, isLoading, isError } = useQuery({
    queryKey: ["/api/bookings", bookingId, "seat-map"],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}/seat-map`);
      if (!res.ok) throw new Error("Failed to fetch seat map");
      return res.json();
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (services: any[]) => {
      const res = await fetch(`/api/bookings/${bookingId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services,
          referenceCode,
          contactEmail,
        }),
      });
      if (!res.ok) throw new Error("Failed to add services");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Assentos reservados com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível reservar os assentos.",
        variant: "destructive",
      });
    },
  });

  const seatMaps = seatData?.seatMaps || [];
  const currentSeatMap = seatMaps[activeSegmentIndex];

  const handleSeatClick = (segmentId: string, element: any) => {
    if (!element.available || element.type !== "seat") return;

    setSelectedSeats((prev) => {
      const key = segmentId;
      if (prev[key]?.designator === element.designator) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: {
          id: element.serviceId,
          designator: element.designator,
          price: element.price,
          currency: element.currency,
        },
      };
    });
  };

  const handleConfirm = () => {
    const services = Object.values(selectedSeats).map((s) => ({
      id: s.id,
      quantity: 1,
    }));
    if (services.length === 0) {
      onOpenChange(false);
      return;
    }
    mutation.mutate(services);
  };

  const totalPrice = Object.values(selectedSeats).reduce(
    (acc, s) => acc + parseFloat(s.price || "0"),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Plane className="h-6 w-6 text-blue-600" />
            Escolha seu Assento
          </DialogTitle>
          <DialogDescription>
            Selecione o assento desejado para cada trecho da sua viagem.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-medium">Carregando mapa da aeronave...</p>
          </div>
        ) : isError || !seatData?.available ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-6">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Mapa Indisponível</h3>
            <p className="text-slate-500 max-w-md">
              A companhia aérea ainda não liberou o mapa de assentos para este voo ou o check-in ainda não está aberto.
            </p>
          </div>
        ) : (
          <>
            {/* Segment Selector */}
            {seatMaps.length > 1 && (
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4 self-center">
                {seatMaps.map((sm: any, idx: number) => (
                  <Button
                    key={sm.segmentId}
                    variant={activeSegmentIndex === idx ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveSegmentIndex(idx)}
                    className="rounded-md"
                  >
                    Trecho {idx + 1}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
              {/* Airplane Layout */}
              <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-4 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4 px-2">
                  <div className="flex gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm border border-slate-300 bg-white"></div>
                      Livre
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
                      Selecionado
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-slate-300"></div>
                      Ocupado
                    </div>
                  </div>
                  <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                    FRENTE DO AVIÃO
                  </div>
                </div>

                <ScrollArea className="flex-1 pr-4">
                  <div className="flex flex-col items-center gap-2 pb-8">
                    {currentSeatMap?.cabins?.map((cabin: any, cIdx: number) => (
                      <div key={cIdx} className="w-full space-y-4">
                        <div className="text-center py-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {cabin.cabinClass}
                          </span>
                        </div>
                        {cabin.rows?.map((row: any, rIdx: number) => (
                          <div key={rIdx} className="flex justify-center gap-1">
                            {row.sections?.map((section: any, sIdx: number) => (
                              <React.Fragment key={sIdx}>
                                <div className="flex gap-1">
                                  {section.elements?.map((el: any, eIdx: number) => {
                                    if (el.type === "empty") {
                                      return <div key={eIdx} className="w-8 h-8"></div>;
                                    }
                                    if (el.type === "seat") {
                                      const isSelected = selectedSeats[currentSeatMap.segmentId]?.designator === el.designator;
                                      return (
                                        <button
                                          key={eIdx}
                                          disabled={!el.available}
                                          onClick={() => handleSeatClick(currentSeatMap.segmentId, el)}
                                          className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-all
                                            ${!el.available ? "bg-slate-200 text-slate-400 cursor-not-allowed" : 
                                              isSelected ? "bg-blue-600 text-white shadow-lg scale-110" : 
                                              "bg-white border-2 border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50"}`}
                                          title={el.available ? `${el.designator} - ${el.currency} ${el.price}` : "Ocupado"}
                                        >
                                          {el.designator}
                                        </button>
                                      );
                                    }
                                    return <div key={eIdx} className="w-8 h-8 flex items-center justify-center opacity-20"><Info className="h-4 w-4" /></div>;
                                  })}
                                </div>
                                {sIdx < row.sections.length - 1 && (
                                  <div className="w-6 flex items-center justify-center text-[8px] font-bold text-slate-300">
                                    AISLE
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Selection Summary */}
              <div className="w-full lg:w-72 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3 text-sm border-b pb-2">Resumo da Seleção</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedSeats).map(([segmentId, seat]) => {
                      const segIdx = seatMaps.findIndex((sm: any) => sm.segmentId === segmentId);
                      return (
                        <div key={segmentId} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-bold">
                              {segIdx + 1}
                            </span>
                            Assento {seat.designator}
                          </div>
                          <span className="font-bold text-slate-800">
                            {seat.currency} {seat.price}
                          </span>
                        </div>
                      );
                    })}
                    {Object.keys(selectedSeats).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4 italic">
                        Nenhum assento selecionado
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Total</span>
                    <span className="text-lg font-black text-blue-600">
                      {seatMaps[0]?.cabins?.[0]?.rows?.[0]?.sections?.[0]?.elements?.find((el: any) => el.currency)?.currency || "USD"} {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                    <Info className="inline h-3 w-3 mr-1 -mt-0.5" />
                    A seleção de assentos é processada instantaneamente através da API Duffel. 
                    Cancelamentos ou alterações podem estar sujeitos a taxas da companhia aérea.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]" 
            onClick={handleConfirm}
            disabled={mutation.isPending || (isLoading || !seatData?.available)}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reservando...
              </>
            ) : (
              "Confirmar Seleção"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
