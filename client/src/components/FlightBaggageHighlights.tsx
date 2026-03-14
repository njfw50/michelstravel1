import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { FlightOffer, FlightPassengerInfo } from "@shared/schema";
import { AlertCircle, Luggage, Package } from "lucide-react";

type DisplayLanguage = "pt" | "en" | "es";
type SummaryTone = "positive" | "info" | "warning" | "neutral";

interface FlightBaggageHighlightsProps {
  flight?: FlightOffer | null;
  simplified?: boolean;
  compact?: boolean;
  className?: string;
}

type BaggageCopy = {
  checkedIncluded: (quantity: number) => string;
  checkedNone: string;
  checkedVaries: string;
  carryIncluded: (quantity: number) => string;
  carryNone: string;
  carryVaries: string;
  perTraveler: string;
  nextStep: string;
  lightFare: string;
  unavailable: string;
};

const COPY: Record<DisplayLanguage, BaggageCopy> = {
  pt: {
    checkedIncluded: (quantity) =>
      quantity === 1 ? "1 mala despachada incluída" : `${quantity} malas despachadas incluídas`,
    checkedNone: "Sem mala despachada incluída",
    checkedVaries: "Mala despachada varia por passageiro",
    carryIncluded: (quantity) =>
      quantity === 1 ? "1 bagagem de mão incluída" : `${quantity} bagagens de mão incluídas`,
    carryNone: "Sem bagagem de mão incluída",
    carryVaries: "Bagagem de mão varia por passageiro",
    perTraveler: "por passageiro",
    nextStep: "Na próxima tela mostramos a bagagem completa por passageiro e por trecho.",
    lightFare: "Tarifa leve: confirme a bagagem antes de pagar.",
    unavailable: "Veja os detalhes de bagagem antes de concluir.",
  },
  en: {
    checkedIncluded: (quantity) =>
      quantity === 1 ? "1 checked bag included" : `${quantity} checked bags included`,
    checkedNone: "No checked bag included",
    checkedVaries: "Checked baggage varies by traveler",
    carryIncluded: (quantity) =>
      quantity === 1 ? "1 carry-on included" : `${quantity} carry-ons included`,
    carryNone: "No carry-on included",
    carryVaries: "Carry-on varies by traveler",
    perTraveler: "per traveler",
    nextStep: "On the next screen we show baggage details by traveler and by segment.",
    lightFare: "Light fare: confirm baggage before paying.",
    unavailable: "Check baggage details before completing the booking.",
  },
  es: {
    checkedIncluded: (quantity) =>
      quantity === 1 ? "1 maleta facturada incluida" : `${quantity} maletas facturadas incluidas`,
    checkedNone: "Sin maleta facturada incluida",
    checkedVaries: "La maleta facturada varía por pasajero",
    carryIncluded: (quantity) =>
      quantity === 1 ? "1 equipaje de mano incluido" : `${quantity} equipajes de mano incluidos`,
    carryNone: "Sin equipaje de mano incluido",
    carryVaries: "El equipaje de mano varía por pasajero",
    perTraveler: "por pasajero",
    nextStep: "En la siguiente pantalla mostramos el equipaje completo por pasajero y por tramo.",
    lightFare: "Tarifa ligera: confirme el equipaje antes de pagar.",
    unavailable: "Revise el detalle del equipaje antes de finalizar.",
  },
};

function getDisplayLanguage(language: string | undefined): DisplayLanguage {
  if (language === "en" || language === "es") return language;
  return "pt";
}

function sumBaggage(passenger: FlightPassengerInfo, type: string) {
  return (passenger.baggages || [])
    .filter((baggage) => baggage.type === type)
    .reduce((total, baggage) => total + (baggage.quantity || 0), 0);
}

function getRelevantPassengers(passengers: FlightPassengerInfo[]) {
  const nonInfants = passengers.filter((passenger) => passenger.passengerType !== "infant_without_seat");
  return nonInfants.length > 0 ? nonInfants : passengers;
}

function getToneClasses(tone: SummaryTone) {
  if (tone === "positive") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "info") return "border-blue-200 bg-blue-50 text-blue-800";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function buildSummary(
  passengers: FlightPassengerInfo[],
  type: "checked" | "carry_on",
  copy: BaggageCopy,
) {
  if (passengers.length === 0) {
    return {
      label: copy.unavailable,
      detail: undefined,
      tone: "neutral" as SummaryTone,
    };
  }

  const quantities = passengers.map((passenger) => sumBaggage(passenger, type));
  const uniqueQuantities = Array.from(new Set(quantities));
  const sameAcrossPassengers = uniqueQuantities.length === 1;
  const commonQuantity = sameAcrossPassengers ? uniqueQuantities[0] || 0 : 0;
  const hasIncludedBaggage = quantities.some((quantity) => quantity > 0);

  if (sameAcrossPassengers && commonQuantity > 0) {
    return {
      label: type === "checked" ? copy.checkedIncluded(commonQuantity) : copy.carryIncluded(commonQuantity),
      detail: passengers.length > 1 ? copy.perTraveler : undefined,
      tone: (type === "checked" ? "positive" : "info") as SummaryTone,
    };
  }

  if (!hasIncludedBaggage) {
    return {
      label: type === "checked" ? copy.checkedNone : copy.carryNone,
      detail: undefined,
      tone: (type === "checked" ? "warning" : "neutral") as SummaryTone,
    };
  }

  return {
    label: type === "checked" ? copy.checkedVaries : copy.carryVaries,
    detail: undefined,
    tone: "warning" as SummaryTone,
  };
}

export default function FlightBaggageHighlights({
  flight,
  simplified = false,
  compact = false,
  className,
}: FlightBaggageHighlightsProps) {
  const { language } = useI18n();
  const copy = COPY[getDisplayLanguage(language)];
  const passengers = getRelevantPassengers(flight?.passengers || []);
  const checkedSummary = buildSummary(passengers, "checked", copy);
  const carryOnSummary = buildSummary(passengers, "carry_on", copy);
  const shouldShowLightFareNote =
    simplified &&
    checkedSummary.label === copy.checkedNone &&
    (carryOnSummary.label === copy.carryNone || carryOnSummary.label === copy.carryVaries);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white",
        compact ? "px-3 py-3" : "px-4 py-4",
        className,
      )}
      data-testid="flight-baggage-highlights"
    >
      <div className="flex flex-wrap gap-2">
        {[
          { icon: Luggage, summary: checkedSummary },
          { icon: Package, summary: carryOnSummary },
        ].map(({ icon: Icon, summary }, index) => (
          <div
            key={`${index}-${summary.label}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
              compact ? "text-[11px]" : "text-xs",
              getToneClasses(summary.tone),
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold">{summary.label}</span>
            {summary.detail && <span className="opacity-80">{summary.detail}</span>}
          </div>
        ))}
      </div>

      <p className={cn("mt-2 flex items-start gap-2 leading-relaxed text-slate-500", compact ? "text-[11px]" : "text-xs")}>
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>{shouldShowLightFareNote ? copy.lightFare : copy.nextStep}</span>
      </p>
    </div>
  );
}
