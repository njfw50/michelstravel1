import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Plane, Printer, Download, MapPin, Calendar, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ETicket() {
  const { reference } = useParams<{ reference: string }>();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const email = searchParams.get("email");
  const { t } = useI18n();

  const { data: booking, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/bookings/lookup", reference, email],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/lookup?reference=${reference}&email=${email}`);
      if (!res.ok) throw new Error("Failed to load booking");
      return res.json();
    },
    enabled: !!reference && !!email,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-12 w-1/3 mx-auto" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">E-Ticket Não Encontrado</h2>
            <p className="text-gray-600 mb-6">Não foi possível localizar o bilhete. Verifique os dados e tente novamente.</p>
            <Button onClick={() => window.close()}>Fechar Aba</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        {/* Actions Bar - Hidden when printing */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Seu E-Ticket Oficial</h1>
            <p className="text-sm text-slate-500">Imprima ou salve como PDF para apresentar no aeroporto.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handlePrint} variant="outline" className="bg-white">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="mr-2 h-4 w-4" /> Salvar PDF
            </Button>
          </div>
        </div>

        {/* E-Ticket Canvas */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
          
          {/* Header */}
          <div className="bg-[#0b1f3c] text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center border-b-[6px] border-amber-500">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center">
                <Plane className="h-6 w-6 text-[#0b1f3c] transform rotate-45" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-wider uppercase">Michels Travel</h2>
                <p className="text-amber-500 text-xs tracking-widest uppercase font-semibold">Official Electronic Ticket</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm text-slate-300 uppercase tracking-widest mb-1">Localizador (PNR)</p>
              <div className="text-3xl font-mono font-bold tracking-[0.2em] bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                {booking.pnr || booking.referenceCode || "N/A"}
              </div>
            </div>
          </div>

          {/* Passenger & Flight Info */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              {/* Passenger Info */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Passageiro (Passenger)</p>
                  <p className="text-lg font-bold text-slate-800">{booking.contactEmail.split("@")[0].toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">E-Ticket Number</p>
                  <p className="text-lg font-mono font-bold text-slate-800">{booking.id.substring(0, 13).toUpperCase()}</p>
                </div>
              </div>

              {/* Flight Details */}
              <div className="relative p-6 rounded-xl border-2 border-slate-100 bg-white">
                <div className="absolute top-0 right-0 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg border-b border-l border-blue-100 uppercase tracking-wider">
                  Confirmed
                </div>
                
                <h3 className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-6 flex items-center gap-2">
                  <Plane className="h-4 w-4" /> Detalhes do Voo (Flight Details)
                </h3>
                
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                  {/* Origin */}
                  <div className="text-center sm:text-left flex-1">
                    <p className="text-4xl font-black text-slate-800 mb-1">{booking.origin}</p>
                    <p className="text-sm font-semibold text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                      <MapPin className="h-3 w-3" /> Origin
                    </p>
                  </div>
                  
                  {/* Divider */}
                  <div className="flex flex-col items-center flex-1 px-4">
                    <p className="text-xs font-bold text-slate-400 mb-2 whitespace-nowrap">FLIGHT {booking.referenceCode?.substring(0, 4) || "MT01"}</p>
                    <div className="w-full flex items-center">
                      <div className="h-[2px] w-full bg-slate-200"></div>
                      <Plane className="h-5 w-5 text-amber-500 mx-2 flex-shrink-0" />
                      <div className="h-[2px] w-full bg-slate-200"></div>
                    </div>
                  </div>
                  
                  {/* Destination */}
                  <div className="text-center sm:text-right flex-1">
                    <p className="text-4xl font-black text-slate-800 mb-1">{booking.destination}</p>
                    <p className="text-sm font-semibold text-slate-500 flex items-center justify-center sm:justify-end gap-1">
                      <MapPin className="h-3 w-3" /> Destination
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Departure Date</p>
                      <p className="font-bold text-slate-800">{booking.departureDate ? new Date(booking.departureDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : "TBD"}</p>
                    </div>
                  </div>
                  {booking.returnDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Return Date</p>
                        <p className="font-bold text-slate-800">{new Date(booking.returnDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Barcode & Rules */}
            <div className="border-t lg:border-t-0 lg:border-l border-dashed border-slate-300 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between relative">
              <div className="absolute -left-[5px] top-1/2 w-2 h-4 bg-gray-100 rounded-r-full hidden lg:block print:hidden"></div>
              
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Informações Importantes</h4>
                <ul className="text-xs text-slate-600 space-y-3">
                  <li className="flex items-start gap-2">
                    <Clock className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                    <span>Chegue ao aeroporto com 3 horas de antecedência para voos internacionais.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Plane className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                    <span>Apresente este bilhete impresso ou no celular junto com seu Passaporte válido.</span>
                  </li>
                </ul>
              </div>

              {/* Fake Barcode */}
              <div className="mt-8 text-center bg-slate-50 p-4 rounded-xl">
                <p className="text-[8px] uppercase tracking-[0.3em] text-slate-400 mb-2">Gate Scan</p>
                {/* Visual Barcode pattern generated with CSS borders */}
                <div className="h-16 w-full flex items-center justify-center gap-[2px] opacity-80">
                  {[...Array(45)].map((_, i) => (
                    <div key={i} className={`h-full bg-slate-800 ${[1,2,4,7,11,16,22,29,37,42].includes(i) ? 'w-1' : [3,5,9,15,25,35].includes(i) ? 'w-1.5' : 'w-[2px]'}`}></div>
                  ))}
                </div>
                <p className="font-mono text-xs mt-2 tracking-widest text-slate-600">
                  *{booking.referenceCode || booking.pnr || booking.id.substring(0,8)}*
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-slate-100 p-4 text-center text-xs text-slate-500">
            Documento gerado automaticamente pelo Ecossistema Soberano Michels Travel. Em caso de dúvidas, contate nosso suporte VIP.
          </div>
        </div>
      </div>
    </div>
  );
}
