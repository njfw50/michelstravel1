import { type FlightOffer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, Clock, ArrowRight, Leaf, ArrowRightLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import FlightBaggageHighlights from "@/components/FlightBaggageHighlights";

interface FlightCardProps {
  flight: FlightOffer;
  simplified?: boolean;
}

type FlightSegmentLike = {
  departureTime: string;
  arrivalTime: string;
  destinationCity?: string;
  destinationCode?: string;
  destinationAirportName?: string;
};

type FlightSliceLike = {
  duration: string;
  originCode?: string;
  originCity?: string;
  destinationCode?: string;
  destinationCity?: string;
  segments: FlightSegmentLike[];
};

const formatDuration = (duration?: string) => {
  if (!duration) return "0h 0m";

  if (!duration.startsWith("P")) {
    return duration;
  }

  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);

  const hours = hoursMatch?.[1] ?? "0";
  const minutes = minutesMatch?.[1] ?? "0";

  return `${hours}h ${minutes}m`;
};

const safeFormatTime = (dateString?: string) => {
  if (!dateString) return "--:--";

  try {
    return format(parseISO(dateString), "HH:mm");
  } catch {
    return "--:--";
  }
};

const safeFormatMonthDay = (dateString?: string) => {
  if (!dateString) return "";

  try {
    return format(parseISO(dateString), "MMM d");
  } catch {
    return "";
  }
};

const getStopsLabel = (
  stopsCount: number,
  t: (key: string) => string,
) => {
  if (stopsCount === 0) {
    return t("flight.direct");
  }

  return `${stopsCount} ${stopsCount > 1 ? t("flight.stops") : t("flight.stop")}`;
};

const getConnectionCities = (slice: FlightSliceLike) => {
  if (!slice.segments || slice.segments.length <= 1) {
    return [];
  }

  const connections: { city?: string; code?: string; label: string }[] = [];

  for (let i = 0; i < slice.segments.length - 1; i++) {
    const segment = slice.segments[i];

    const city = segment.destinationCity;
    const code = segment.destinationCode;
    const airport = segment.destinationAirportName;

    const label = city
      ? code
        ? `${city} (${code})`
        : city
      : airport
        ? code
          ? `${airport} (${code})`
          : airport
        : code || "Conexão";

    connections.push({ city, code, label });
  }

  return connections;
};

const formatCurrency = (
  value: number | string,
  currency: string,
  locale: string,
) => {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return "";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
};

function SliceTimeline({
  slice,
  index,
  t,
}: {
  slice: FlightSliceLike;
  index: number;
  t: (key: string) => string;
}) {
  const firstSegment = slice.segments?.[0];
  const lastSegment = slice.segments?.[slice.segments.length - 1];

  if (!firstSegment || !lastSegment) {
    return null;
  }

  const stopsCount = Math.max((slice.segments?.length ?? 1) - 1, 0);
  const stopsLabel = getStopsLabel(stopsCount, t);
  const connectionCities = getConnectionCities(slice);

  return (
    <div className="border-b pb-3 last:border-0 last:pb-0">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-600">
        <span>{index === 0 ? t("booking.outbound") : t("booking.return_flight")}</span>
        <span className="text-[10px] font-normal text-gray-400">
          {safeFormatMonthDay(firstSegment.departureTime)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-center">
          <div className="text-xl font-bold leading-none text-gray-900">
            {safeFormatTime(firstSegment.departureTime)}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {slice.originCode || "DEP"}
          </div>
          {slice.originCity && (
            <div className="mt-0.5 max-w-[80px] truncate text-[10px] text-gray-400">
              {slice.originCity}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center px-2 sm:px-4">
          <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {formatDuration(slice.duration)}
          </div>

          <div className="relative my-1 h-[2px] w-full bg-gray-200">
            <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-1">
              <div className="h-2 w-2 rounded-full border-2 border-white bg-blue-400" />
              <Plane className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-[1px] rotate-90 text-blue-500" />
              <div className="h-2 w-2 rounded-full border-2 border-white bg-blue-400" />
            </div>
          </div>

          <div
            className={`mt-1 text-xs font-medium ${stopsCount === 0 ? "text-emerald-600" : "text-amber-600"
              }`}
          >
            {stopsLabel}
          </div>

          {connectionCities.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-blue-700">
              <span className="font-semibold">
                {t("flight.connection_in") || "Conexão em"}
              </span>
              {connectionCities.map((conn, idx) => (
                <span
                  key={`${conn.code || conn.label}-${idx}`}
                  className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-800"
                >
                  {conn.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-xl font-bold leading-none text-gray-900">
            {safeFormatTime(lastSegment.arrivalTime)}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {slice.destinationCode || "ARR"}
          </div>
          {slice.destinationCity && (
            <div className="mt-0.5 max-w-[80px] truncate text-[10px] text-gray-400">
              {slice.destinationCity}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SingleFlightTimeline({
  flight,
  t,
}: {
  flight: FlightOffer;
  t: (key: string) => string;
}) {
  const stopsLabel =
    flight.stops === 0
      ? t("flight.direct")
      : `${flight.stops} ${flight.stops > 1 ? t("flight.stops") : t("flight.stop")}`;

  return (
    <div className="mb-2 flex items-end justify-between gap-2">
      <div className="text-center">
        <div
          className="text-xl font-bold leading-none text-gray-900 sm:text-2xl"
          data-testid="text-departure-time"
        >
          {safeFormatTime(flight.departureTime)}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {flight.originCode || "DEP"}
        </div>
        {flight.originCity && (
          <div className="mt-0.5 max-w-[80px] truncate text-[10px] text-gray-400">
            {flight.originCity}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center px-2 sm:px-6">
        <div className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
          <Clock className="h-3 w-3" />
          {formatDuration(flight.duration)}
        </div>

        <div className="relative my-1 h-[2px] w-full bg-gray-200">
          <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-1">
            <div className="h-2 w-2 rounded-full border-2 border-white bg-blue-400" />
            <Plane className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-[1px] rotate-90 text-blue-500" />
            <div className="h-2 w-2 rounded-full border-2 border-white bg-blue-400" />
          </div>
        </div>

        <div
          className={`mt-1 text-xs font-bold ${flight.stops === 0 ? "text-emerald-600" : "text-amber-600"
            }`}
          data-testid="text-stops"
        >
          {stopsLabel}
        </div>
      </div>

      <div className="text-center">
        <div
          className="text-xl font-bold leading-none text-gray-900 sm:text-2xl"
          data-testid="text-arrival-time"
        >
          {safeFormatTime(flight.arrivalTime)}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {flight.destinationCode || "ARR"}
        </div>
        {flight.destinationCity && (
          <div className="mt-0.5 max-w-[80px] truncate text-[10px] text-gray-400">
            {flight.destinationCity}
          </div>
        )}
      </div>
    </div>
  );
}

export function FlightCard({ flight, simplified = false }: FlightCardProps) {
  const { t, language } = useI18n();

  const locale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";

  const cabinClassName = flight.passengers?.[0]?.cabinClassName;
  const fareBrand = flight.passengers?.[0]?.fareBrandName;
  const changeAllowed = flight.conditions?.changeBeforeDeparture?.allowed;
  const refundAllowed = flight.conditions?.refundBeforeDeparture?.allowed;

  const currentSearch =
    typeof window !== "undefined" ? window.location.search : "";

  const searchParams = new URLSearchParams(currentSearch);
  const bookUrl = `/book/${flight.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const slices = Array.isArray(flight.slices) ? flight.slices : [];
  const hasSlices = slices.length > 0;

  const totalEmissionsKg = (flight as FlightOffer & { totalEmissionsKg?: number })
    .totalEmissionsKg;

  return (
    <Card
      data-testid={`flight-card-${flight.id}`}
      className="group overflow-hidden rounded-[24px] border border-gray-200 bg-white p-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_32px_-8px_hsl(213_90%_50%/0.18)] md:rounded-2xl"
    >
      <div className="grid grid-cols-1 items-start gap-4 p-4 sm:gap-5 sm:p-5 md:grid-cols-12 md:gap-6 md:p-6">
        {/* Airline Info */}
        <div className="flex items-start gap-3 sm:items-center sm:gap-4 md:col-span-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 p-2 sm:h-12 sm:w-12" aria-label="Logo da companhia aérea">
            {flight.logoUrl ? (
              <img
                src={flight.logoUrl}
                alt={flight.airline}
                className="h-full w-full object-contain"
                loading="lazy"
                aria-label={`Logo da companhia ${flight.airline}`}
              />
            ) : (
              <Plane className="h-6 w-6 text-gray-400" aria-label="Ícone de avião" />
            )}
          </div>

          <div>
            <h3
              className="leading-tight font-bold text-gray-900"
              data-testid="text-airline-name"
            >
              {flight.airline}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="guide-tag" data-testid="text-flight-number" aria-label={`Número do voo: ${flight.flightNumber}`}
                title={`Número do voo: ${flight.flightNumber}`}>
                {flight.flightNumber}
              </span>

              {cabinClassName && (
                <span className="inline-block rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600"
                  aria-label={`Classe: ${cabinClassName}`}
                  title={`Classe: ${cabinClassName}`}>
                  {cabinClassName}
                </span>
              )}
            </div>

            {fareBrand && (
              <div className="mt-1 text-[10px] text-gray-400" aria-label={`Tarifa: ${fareBrand}`} title={`Tarifa: ${fareBrand}`}>{fareBrand}</div>
            )}
          </div>
        </div>

        {/* Flight Details */}
        <div className="flex flex-col justify-center md:col-span-5">
          {hasSlices ? (
            <div className="space-y-4">
              {slices.map((slice, index) => (
                <SliceTimeline
                  key={`${flight.id}-slice-${index}`}
                  slice={slice as FlightSliceLike}
                  index={index}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <SingleFlightTimeline flight={flight} t={t} />
          )}

          <div className="mt-3 space-y-2">
            <FlightBaggageHighlights
              flight={flight}
              simplified={simplified}
              compact
            />

            {(flight.aircraftType || totalEmissionsKg) && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {flight.aircraftType && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"
                    aria-label={`Tipo de aeronave: ${flight.aircraftType}`}
                    title={`Tipo de aeronave: ${flight.aircraftType}`}>
                    <Plane className="h-2.5 w-2.5" />
                    {flight.aircraftType}
                  </span>
                )}

                {typeof totalEmissionsKg === "number" && (
                  <span
                    className="flex items-center gap-1 text-[10px] text-emerald-500"
                    data-testid="text-co2-emissions"
                    aria-label={`Emissão estimada de CO2: ${Math.round(totalEmissionsKg)} kg`}
                    title={`Emissão estimada de CO2: ${Math.round(totalEmissionsKg)} kg`}>
                    <Leaf className="h-2.5 w-2.5" />
                    {Math.round(totalEmissionsKg)} kg CO₂
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fare Conditions + Price and Select Button */}
        <div className="mt-1 flex flex-col items-stretch justify-center gap-3 rounded-[22px] border border-gray-100 bg-slate-50/80 px-4 py-4 md:col-span-4 md:mt-0 md:items-end md:rounded-none md:border-0 md:border-l md:border-gray-200 md:bg-transparent md:px-0 md:py-0 md:pl-6">
          <div className="flex w-full flex-wrap items-center justify-between gap-2 text-left md:block md:w-auto md:text-right">
            {fareBrand && (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                {fareBrand}
              </span>
            )}
            <div className="flex flex-wrap gap-2 md:justify-end">
              {typeof changeAllowed === "boolean" && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${changeAllowed ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                  <ArrowRightLeft className="h-3 w-3" />
                  {changeAllowed ? (t("flight.changeable") || "Changeable") : (t("flight.not_changeable") || "Not changeable")}
                </span>
              )}
              {typeof refundAllowed === "boolean" && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${refundAllowed ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                  <ArrowRightLeft className="h-3 w-3 rotate-45" />
                  {refundAllowed ? (t("flight.refundable") || "Refundable") : (t("flight.non_refundable") || "Non refundable")}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full items-center justify-between text-left md:block md:w-auto md:text-right">
            <span className="hidden text-xs font-medium text-gray-500 md:block">
              {t("flight.total_price")}
            </span>
            <span className="text-sm text-gray-500 md:hidden">
              {t("flight.price_per_adult")}
            </span>

            <div
              className="font-display text-2xl font-bold text-gray-900 sm:text-3xl"
              data-testid="text-price"
            >
              {formatCurrency(flight.price, flight.currency, locale)}
            </div>

            {flight.baseAmount && flight.taxAmount && (
              <div className="mt-0.5 flex flex-col gap-0 text-[10px] text-gray-400 md:items-end">
                <span>
                  {t("flight.base_fare") || "Base"}:{" "}
                  {formatCurrency(flight.baseAmount, flight.currency, locale)}
                </span>
                <span>
                  {t("flight.taxes") || "Taxes"}:{" "}
                  {formatCurrency(flight.taxAmount, flight.currency, locale)}
                </span>
              </div>
            )}
          </div>

          <Link href={bookUrl} className="w-full" tabIndex={0} aria-label="Selecionar este voo">
            <Button
              data-testid="button-select-flight"
              className="h-12 w-full rounded-xl border-0 bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              tabIndex={0}
              aria-label="Selecionar este voo"
            >
              {t("flight.select")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
