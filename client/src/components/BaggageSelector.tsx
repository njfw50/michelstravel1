import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Luggage, Plus, Minus, Package, Check, ShieldCheck, Ruler } from "lucide-react";
import { useI18n } from "@/lib/i18n";
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
}

export default function BaggageSelector({
  offerId,
  onBaggageSelected,
  passengerCount,
  includedBaggage = [],
}: BaggageSelectorProps) {
  const { t } = useI18n();
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

  const formatPrice = (amount: number, cur: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(amount);

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

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm rounded-2xl" data-testid="baggage-selector-loading">
        <CardHeader className="border-b border-gray-100 gap-2">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Luggage className="h-5 w-5 text-blue-500" />
            {t("baggage.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border border-gray-200 shadow-sm rounded-2xl" data-testid="baggage-selector-error">
        <CardHeader className="border-b border-gray-100 gap-2">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Luggage className="h-5 w-5 text-blue-500" />
            {t("baggage.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-red-500" data-testid="text-baggage-error">{t("baggage.error")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm rounded-2xl" data-testid="baggage-selector">
      <CardHeader className="border-b border-gray-100 gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Luggage className="h-5 w-5 text-blue-500" />
              {t("baggage.title")}
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">{t("baggage.subtitle")}</p>
          </div>
          {totalIncluded > 0 && (
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs no-default-active-elevate">
              <Check className="h-3 w-3 mr-1" />
              {tReplace("baggage.bags_included", { count: totalIncluded })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-5">

        <div
          className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4"
          data-testid="personal-item-card"
        >
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shrink-0 p-1.5">
              <img
                src={personalItemImg}
                alt={t("baggage.personal_item")}
                className="w-full h-full object-contain"
                data-testid="img-personal-item"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-gray-900" data-testid="text-personal-item-title">
                  {t("baggage.personal_item")}
                </h4>
                <Badge className="bg-emerald-500 text-white text-[10px] no-default-active-elevate" data-testid="badge-personal-item-included">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {t("baggage.personal_item_included")}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed" data-testid="text-personal-item-desc">
                {t("baggage.personal_item_desc")}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Ruler className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-600" data-testid="text-personal-item-dimensions">
                  {t("baggage.personal_item_dimensions")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {baggageServices.length > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {t("baggage.extra_options")}
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {Object.entries(grouped).map(([type, services]) => (
              <div key={type} className="space-y-3" data-testid={`baggage-group-${type}`}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{getTypeLabel(type)}</p>

                {services.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-xl border border-gray-200 bg-white"
                    data-testid={`baggage-service-${service.id}`}
                  >
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          {type === "carry_on" ? <Package className="h-5 w-5 text-blue-500" /> : <Luggage className="h-5 w-5 text-blue-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getTypeLabel(type)}</p>
                          {service.metadata?.maximum_weight_kg && (
                            <p className="text-xs text-gray-400" data-testid={`text-weight-${service.id}`}>
                              {tReplace("baggage.weight", { weight: service.metadata.maximum_weight_kg })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900" data-testid={`text-price-${service.id}`}>
                          {formatPrice(parseFloat(service.totalAmount), service.totalCurrency)}
                        </p>
                        <p className="text-[10px] text-gray-400">{t("baggage.per_unit")}</p>
                      </div>
                    </div>

                    <div className="px-4 py-3 space-y-2.5">
                      {Array.from({ length: passengerCount }).map((_, paxIdx) => {
                        const key = getKey(service.id, paxIdx);
                        const qty = quantities[key] || 0;
                        return (
                          <div
                            key={paxIdx}
                            className="flex items-center justify-between flex-wrap gap-2"
                            data-testid={`baggage-passenger-row-${service.id}-${paxIdx}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-gray-500">{paxIdx + 1}</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {t("booking.passenger") || "Passenger"} {paxIdx + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                disabled={qty === 0}
                                onClick={() => handleDecrement(service, paxIdx)}
                                data-testid={`button-decrement-${service.id}-${paxIdx}`}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span
                                className="w-8 text-center text-sm font-bold text-gray-900"
                                data-testid={`text-quantity-${service.id}-${paxIdx}`}
                              >
                                {qty}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                disabled={qty >= service.maxQuantity}
                                onClick={() => handleIncrement(service, paxIdx)}
                                data-testid={`button-increment-${service.id}-${paxIdx}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
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
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400" data-testid="text-no-extras">{t("baggage.no_extras")}</p>
          </div>
        )}

        {totalExtraCost > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-5 py-4" data-testid="baggage-total">
            <div>
              <p className="text-sm font-medium text-gray-700">{t("baggage.extra_total")}</p>
              <p className="text-xs text-gray-400">{t("baggage.added_to_total")}</p>
            </div>
            <span className="text-lg font-bold text-blue-600" data-testid="text-baggage-total-price">
              {formatPrice(totalExtraCost, currency)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
