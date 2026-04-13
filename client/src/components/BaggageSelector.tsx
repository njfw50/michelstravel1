import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Luggage, Plus, Minus, Package, Check, ShieldCheck, Ruler, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { FlightOffer } from "@shared/schema";
import BaggageInformationHub from "@/components/BaggageInformationHub";
import personalItemImg from "@/assets/images/personal-item-backpack.png";

interface BaggageService {
  id: string;
  type: string;
  totalAmount: string;
  totalCurrency: string;
  maxQuantity: number;
  passengerIds: string[];
  segmentIds: string[];
  metadata: {
    type: string;
    maximum_weight_kg?: number;
  };
}

interface BaggageSelection {
  serviceId: string;
  quantity: number;
  price: number;
  currency: string;
  passengerIndex: number;
}

interface BaggageServicesResponse {
  baggage: BaggageService[];
  seats: unknown[];
  other: unknown[];
}

interface BaggageSelectorProps {
  offerId: string;
  onBaggageSelected: (selections: BaggageSelection[]) => void;
  passengerCount: number;
  includedBaggage?: { type: string; quantity: number }[];
  flight?: FlightOffer | null;
  simplified?: boolean;
}

export default function BaggageSelector({
  offerId,
  onBaggageSelected,
  passengerCount,
  includedBaggage = [],
  flight,
  simplified = false,
}: BaggageSelectorProps) {
  const { t, language } = useI18n();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data, isLoading, isError } = useQuery<BaggageServicesResponse>({
    queryKey: ["/api/flights", offerId, "services"],
    enabled: !!offerId,
  });

  const baggageServices = data?.baggage ?? [];

  const grouped = useMemo(() => {
    const groups: Record<string, BaggageService[]> = {};
    baggageServices.forEach((svc) => {
      const bagType = svc.metadata?.type || "checked";
      if (!groups[bagType]) groups[bagType] = [];
      groups[bagType].push(svc);
    });
    return groups;
  }, [baggageServices]);

  const getKey = (serviceId: string, passengerIndex: number) =>
    `${serviceId}_${passengerIndex}`;

  const handleIncrement = (service: BaggageService, passengerIndex: number) => {
    const key = getKey(service.id, passengerIndex);
    const current = quantities[key] || 0;
    if (current < service.maxQuantity) {
      setQuantities((prev) => ({ ...prev, [key]: current + 1 }));
    }
  };

  const handleDecrement = (service: BaggageService, passengerIndex: number) => {
    const key = getKey(service.id, passengerIndex);
    const current = quantities[key] || 0;
    if (current > 0) {
      setQuantities((prev) => ({ ...prev, [key]: current - 1 }));
    }
  };

  const selections = useMemo(() => {
    const result: BaggageSelection[] = [];
    Object.entries(quantities).forEach(([key, qty]) => {
      if (qty > 0) {
        const [serviceId, paxIdx] = key.split("_");
        const svc = baggageServices.find((s) => s.id === serviceId);
        if (svc) {
          result.push({
            serviceId,
            quantity: qty,
            price: parseFloat(svc.totalAmount) * qty,
            currency: svc.totalCurrency,
            passengerIndex: parseInt(paxIdx, 10),
          });
        }
      }
    });
    return result;
  }, [quantities, baggageServices]);

  useEffect(() => {
    onBaggageSelected(selections);
  }, [selections, onBaggageSelected]);

  const totalExtraCost = selections.reduce((sum, s) => sum + s.price, 0);
  const currency = baggageServices[0]?.totalCurrency || "USD";
  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const passengerIndexById = useMemo(
    () => new Map((flight?.passengers || []).map((passenger, index) => [passenger.passengerId, index])),
    [flight?.passengers],
  );

  const formatPrice = (amount: number, cur: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: cur }).format(amount);

  const tReplace = (key: string, replacements: Record<string, string | number>) => {
    let text = t(key);
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
    return text;
  };

  const getTypeLabel = (type: string) => {
    if (type === "carry_on") return t("baggage.carry_on");
    return t("baggage.checked");
  };

  const totalIncluded = includedBaggage.reduce((sum, b) => sum + b.quantity, 0);
  const getEligiblePassengerIndexes = (service: BaggageService) => {
    if (!service.passengerIds?.length) {
      return Array.from({ length: passengerCount }, (_, index) => index);
    }

    const mappedIndexes = service.passengerIds
      .map((passengerId) => passengerIndexById.get(passengerId))
      .filter((value): value is number => value !== undefined);

    return mappedIndexes.length > 0
      ? mappedIndexes
      : Array.from({ length: passengerCount }, (_, index) => index);
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl" data-testid="baggage-selector-loading">
        <div className="flex items-center gap-4 mb-8">
           <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
             <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
           </div>
           <div className="space-y-2">
             <div className="h-6 w-48 bg-white/10 rounded-lg animate-pulse" />
             <div className="h-3 w-32 bg-white/5 rounded-md animate-pulse" />
           </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
          <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="relative overflow-hidden rounded-[32px] border border-red-500/10 bg-red-500/5 p-8 backdrop-blur-xl" data-testid="baggage-selector-error">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
             <Luggage className="h-6 w-6 text-red-400" />
           </div>
           <div>
             <h3 className="text-white font-black uppercase tracking-wider">{t("baggage.title")}</h3>
             <p className="text-red-400 text-xs font-bold mt-1" data-testid="text-baggage-error">{t("baggage.error")}</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl" data-testid="baggage-selector">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/5 blur-[100px]" />
      
      <div className="relative flex items-center justify-between flex-wrap gap-4 mb-8 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
               <Luggage className="h-6 w-6" />
             </div>
             <div>
               <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-wider">
                 {t("baggage.title")}
               </h3>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5 leading-none">{t("baggage.subtitle")}</p>
             </div>
          </div>
        </div>
        {totalIncluded > 0 && (
          <Badge className="h-10 px-4 rounded-xl bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs font-black uppercase tracking-widest no-default-active-elevate">
            <Check className="h-4 w-4 mr-2" />
            {tReplace("baggage.bags_included", { count: totalIncluded })}
          </Badge>
        )}
      </div>

      <div className="relative space-y-8">
        <BaggageInformationHub
          flight={flight}
          services={baggageServices}
          includedBaggage={includedBaggage}
          simplified={simplified}
        />

        <div
          className="relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-sm"
          data-testid="personal-item-card"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-950/80 border border-emerald-500/20 flex items-center justify-center shrink-0 p-3 shadow-inner">
              <img
                src={personalItemImg}
                alt={t("baggage.personal_item")}
                className="w-full h-full object-contain brightness-110"
                data-testid="img-personal-item"
              />
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                <h4 className="text-lg font-black text-white uppercase tracking-tight" data-testid="text-personal-item-title">
                  {t("baggage.personal_item")}
                </h4>
                <Badge className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-[0.15em] py-1 no-default-active-elevate" data-testid="badge-personal-item-included">
                  <ShieldCheck className="h-3 w-3 mr-1.5" />
                  {t("baggage.personal_item_included")}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed" data-testid="text-personal-item-desc">
                {t("baggage.personal_item_desc")}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-4 text-emerald-400/70">
                <Ruler className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300" data-testid="text-personal-item-dimensions">
                  {t("baggage.personal_item_dimensions")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {baggageServices.length > 0 ? (
          <div className="space-y-8 pt-4">
            <div className="relative flex items-center">
              <div className="h-px flex-1 bg-white/5" />
              <span className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                {t("baggage.extra_options")}
              </span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            {Object.entries(grouped).map(([type, services]) => (
              <div key={type} className="space-y-5" data-testid={`baggage-group-${type}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <p className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{getTypeLabel(type)}</p>
                </div>

                {services.map((service) => (
                  <div
                    key={service.id}
                    className="overflow-hidden rounded-[24px] border border-white/5 bg-slate-950/40 transition-all hover:border-white/10"
                    data-testid={`baggage-service-${service.id}`}
                  >
                    <div className="flex items-center justify-between px-6 py-5 bg-white/5 border-b border-white/5 flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                          {type === "carry_on" ? <Package className="h-6 w-6 text-blue-400" /> : <Luggage className="h-6 w-6 text-blue-400" />}
                        </div>
                        <div>
                          <p className="text-base font-black text-white tracking-tight uppercase">{getTypeLabel(type)}</p>
                          {service.metadata?.maximum_weight_kg && (
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5" data-testid={`text-weight-${service.id}`}>
                              {tReplace("baggage.weight", { weight: service.metadata.maximum_weight_kg })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-white" data-testid={`text-price-${service.id}`}>
                          {formatPrice(parseFloat(service.totalAmount), service.totalCurrency)}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{t("baggage.per_unit")}</p>
                      </div>
                    </div>

                    <div className="px-6 py-4 space-y-4">
                      {getEligiblePassengerIndexes(service).map((paxIdx) => {
                        const key = getKey(service.id, paxIdx);
                        const qty = quantities[key] || 0;
                        return (
                          <div
                            key={paxIdx}
                            className="flex items-center justify-between gap-4 p-3 rounded-2xl transition-colors hover:bg-white/5"
                            data-testid={`baggage-passenger-row-${service.id}-${paxIdx}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center">
                                <span className="text-[10px] font-black text-slate-400">{paxIdx + 1}</span>
                              </div>
                              <span className="text-sm font-bold text-slate-300 uppercase tracking-tighter">
                                {t("booking.passenger") || "Passageiro"} {paxIdx + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg bg-slate-900 border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-30 transition-all"
                                disabled={qty === 0}
                                onClick={() => handleDecrement(service, paxIdx)}
                                data-testid={`button-decrement-${service.id}-${paxIdx}`}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span
                                className="w-6 text-center text-base font-black text-white"
                                data-testid={`text-quantity-${service.id}-${paxIdx}`}
                              >
                                {qty}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg bg-slate-900 border border-white/5 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20 disabled:opacity-30 transition-all"
                                disabled={qty >= service.maxQuantity}
                                onClick={() => handleIncrement(service, paxIdx)}
                                data-testid={`button-increment-${service.id}-${paxIdx}`}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-white/5 rounded-2xl bg-white/5">
            <p className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]" data-testid="text-no-extras">{t("baggage.no_extras")}</p>
          </div>
        )}

        {totalExtraCost > 0 && (
          <div className="relative overflow-hidden flex items-center justify-between rounded-[24px] border border-[#ff7f50]/20 bg-[#ff7f50]/5 px-6 py-6" data-testid="baggage-total">
            <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-[#ff7f50]/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-black text-[#ffb293] uppercase tracking-widest mb-1">{t("baggage.extra_total")}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("baggage.added_to_total")}</p>
            </div>
            <span className="relative text-2xl font-black text-white tracking-tight" data-testid="text-baggage-total-price">
              {formatPrice(totalExtraCost, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
