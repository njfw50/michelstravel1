import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FlightOffer } from "@shared/schema";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Info,
  Luggage,
  Package,
  Route,
  UserRound,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface BaggageServiceInfo {
  id: string;
  type: string;
  totalAmount: string;
  totalCurrency: string;
  maxQuantity: number;
  passengerIds: string[];
  segmentIds: string[];
  metadata?: {
    type?: string;
    maximum_weight_kg?: number;
    [key: string]: unknown;
  };
}

interface BaggageInformationHubProps {
  flight?: FlightOffer | null;
  services?: BaggageServiceInfo[];
  includedBaggage?: { type: string; quantity: number }[];
  simplified?: boolean;
}

type DisplayLanguage = "pt" | "en" | "es";

const COPY: Record<
  DisplayLanguage,
  {
    detailedTitle: string;
    simplifiedTitle: string;
    detailedSubtitle: string;
    simplifiedSubtitle: string;
    currentIncluded: string;
    extraOptions: string;
    howToRead: string;
    updatedByAirline: string;
    updatedByAirlineDesc: string;
    passengerScope: string;
    passengerScopeDesc: string;
    segmentScope: string;
    segmentScopeDesc: string;
    priceRule: string;
    priceRuleDesc: string;
    itemPersonal: string;
    itemCarryOn: string;
    itemChecked: string;
    itemIncluded: string;
    itemNotSeen: string;
    extraAvailable: string;
    extraNotAvailable: string;
    appliesTo: string;
    tripPart: string;
    eachPrice: string;
    upTo: string;
    allPassengers: string;
    wholeTrip: string;
    outbound: string;
    inbound: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    supportNote: string;
    serviceTypeChecked: string;
    serviceTypeCarryOn: string;
  }
> = {
  pt: {
    detailedTitle: "Bagagem explicada com clareza",
    simplifiedTitle: "Bagagem, do jeito fácil",
    detailedSubtitle:
      "Aqui mostramos o que a tarifa já inclui e como a companhia vende bagagem extra para passageiros e trechos específicos.",
    simplifiedSubtitle:
      "Pense em 3 partes: item pequeno, bagagem de mão e mala despachada. Nós mostramos o que já vem e o que pode custar extra.",
    currentIncluded: "O que aparece incluído agora",
    extraOptions: "Opções extras encontradas",
    howToRead: "Como ler essas opções",
    updatedByAirline: "Dados atualizados da companhia",
    updatedByAirlineDesc:
      "Usamos a versão atualizada da oferta nesta etapa. A bagagem incluída pode mudar conforme a tarifa e a companhia aérea.",
    passengerScope: "Cada extra pode valer só para alguns passageiros",
    passengerScopeDesc:
      "Na Duffel, serviços de bagagem podem ser ligados a passageiros específicos. Por isso uma mesma mala extra pode não valer para todo mundo.",
    segmentScope: "Cada extra pode valer só para parte da viagem",
    segmentScopeDesc:
      "Também pode haver diferença entre ida e volta, ou entre trechos com conexão. Sempre mostramos em que parte da viagem a opção vale.",
    priceRule: "O preço abaixo é por unidade",
    priceRuleDesc:
      "Quando você vê o valor de uma bagagem extra, ele representa uma unidade daquele serviço. O total sobe conforme a quantidade escolhida.",
    itemPersonal: "Item pessoal pequeno",
    itemCarryOn: "Bagagem de mão",
    itemChecked: "Mala despachada",
    itemIncluded: "incluído",
    itemNotSeen: "não identificado nesta oferta",
    extraAvailable: "opções extras disponíveis",
    extraNotAvailable: "Nenhuma bagagem extra disponível para esta oferta.",
    appliesTo: "Vale para",
    tripPart: "Trecho",
    eachPrice: "Preço por unidade",
    upTo: "até",
    allPassengers: "todos os passageiros",
    wholeTrip: "viagem toda",
    outbound: "ida",
    inbound: "volta",
    step1Title: "1. Veja o que já está incluído",
    step1Desc: "Antes de pagar, olhe primeiro se a tarifa já traz bagagem de mão ou mala despachada.",
    step2Title: "2. Se precisar, adicione extra",
    step2Desc: "Quando houver opção extra, mostramos o preço, para quem ela vale e para qual parte da viagem.",
    step3Title: "3. Se algo parecer confuso, pare e confirme",
    step3Desc: "No senior mode, a regra é simples: se a bagagem não estiver clara, fale com a equipe antes de pagar.",
    supportNote:
      "Se você estiver na trilha senior e qualquer regra de bagagem parecer difícil, ligue ou fale no chat antes de concluir.",
    serviceTypeChecked: "Bagagem despachada",
    serviceTypeCarryOn: "Bagagem de mão",
  },
  en: {
    detailedTitle: "Baggage explained clearly",
    simplifiedTitle: "Baggage, the easy way",
    detailedSubtitle:
      "This section shows what the fare already includes and how the airline sells extra baggage for specific passengers and trip segments.",
    simplifiedSubtitle:
      "Think in 3 parts: small personal item, carry-on bag, and checked bag. We show what is already included and what may cost extra.",
    currentIncluded: "What is currently included",
    extraOptions: "Extra options found",
    howToRead: "How to read these options",
    updatedByAirline: "Updated airline data",
    updatedByAirlineDesc:
      "We use the refreshed offer details at this stage. Included baggage can change depending on the fare and airline.",
    passengerScope: "An extra may apply only to some passengers",
    passengerScopeDesc:
      "In Duffel, baggage services can be attached to specific passengers. One extra bag option may not apply to everyone in the booking.",
    segmentScope: "An extra may apply only to part of the trip",
    segmentScopeDesc:
      "The same service can also be limited to outbound, return, or a specific connected segment. We show where it applies.",
    priceRule: "The price below is per unit",
    priceRuleDesc:
      "When you see the price of extra baggage, it refers to one unit of that service. The total increases with quantity.",
    itemPersonal: "Small personal item",
    itemCarryOn: "Carry-on baggage",
    itemChecked: "Checked baggage",
    itemIncluded: "included",
    itemNotSeen: "not identified in this offer",
    extraAvailable: "extra options available",
    extraNotAvailable: "No extra baggage is available for this offer.",
    appliesTo: "Applies to",
    tripPart: "Trip part",
    eachPrice: "Price per unit",
    upTo: "up to",
    allPassengers: "all passengers",
    wholeTrip: "whole trip",
    outbound: "outbound",
    inbound: "return",
    step1Title: "1. Check what is already included",
    step1Desc: "Before paying, first check whether the fare already includes carry-on or checked baggage.",
    step2Title: "2. Add extras only if needed",
    step2Desc: "When extra baggage is available, we show the price, who it applies to, and which part of the trip it covers.",
    step3Title: "3. If anything feels confusing, stop and confirm",
    step3Desc: "In senior mode, the rule is simple: if baggage is not clear, talk to the team before paying.",
    supportNote:
      "If you are using senior mode and any baggage rule feels confusing, call or open the chat before completing payment.",
    serviceTypeChecked: "Checked baggage",
    serviceTypeCarryOn: "Carry-on baggage",
  },
  es: {
    detailedTitle: "Equipaje explicado con claridad",
    simplifiedTitle: "Equipaje, de la forma fácil",
    detailedSubtitle:
      "Aquí mostramos lo que la tarifa ya incluye y cómo la aerolínea vende equipaje extra para pasajeros y tramos específicos.",
    simplifiedSubtitle:
      "Piense en 3 partes: artículo pequeño, equipaje de mano y maleta facturada. Mostramos lo que ya está incluido y lo que puede costar extra.",
    currentIncluded: "Lo que aparece incluido ahora",
    extraOptions: "Opciones extra encontradas",
    howToRead: "Cómo leer estas opciones",
    updatedByAirline: "Datos actualizados por la aerolínea",
    updatedByAirlineDesc:
      "Usamos la versión actualizada de la oferta en esta etapa. El equipaje incluido puede cambiar según la tarifa y la aerolínea.",
    passengerScope: "Un extra puede aplicar solo a algunos pasajeros",
    passengerScopeDesc:
      "En Duffel, los servicios de equipaje pueden estar asociados a pasajeros específicos. Una misma maleta extra puede no aplicar a todos.",
    segmentScope: "Un extra puede aplicar solo a parte del viaje",
    segmentScopeDesc:
      "También puede variar entre ida y vuelta, o entre tramos con conexión. Mostramos exactamente en qué parte del viaje aplica.",
    priceRule: "El precio mostrado es por unidad",
    priceRuleDesc:
      "Cuando ve el valor del equipaje extra, representa una unidad de ese servicio. El total sube según la cantidad elegida.",
    itemPersonal: "Artículo personal pequeño",
    itemCarryOn: "Equipaje de mano",
    itemChecked: "Maleta facturada",
    itemIncluded: "incluido",
    itemNotSeen: "no identificado en esta oferta",
    extraAvailable: "opciones extra disponibles",
    extraNotAvailable: "No hay equipaje extra disponible para esta oferta.",
    appliesTo: "Aplica a",
    tripPart: "Tramo",
    eachPrice: "Precio por unidad",
    upTo: "hasta",
    allPassengers: "todos los pasajeros",
    wholeTrip: "todo el viaje",
    outbound: "ida",
    inbound: "vuelta",
    step1Title: "1. Vea lo que ya está incluido",
    step1Desc: "Antes de pagar, revise si la tarifa ya incluye equipaje de mano o maleta facturada.",
    step2Title: "2. Agregue extra solo si hace falta",
    step2Desc: "Cuando exista equipaje extra, mostramos el precio, para quién aplica y qué parte del viaje cubre.",
    step3Title: "3. Si algo parece confuso, pare y confirme",
    step3Desc: "En el modo senior la regla es simple: si el equipaje no está claro, hable con el equipo antes de pagar.",
    supportNote:
      "Si está usando el modo senior y alguna regla de equipaje parece confusa, llame o abra el chat antes de completar el pago.",
    serviceTypeChecked: "Equipaje facturado",
    serviceTypeCarryOn: "Equipaje de mano",
  },
};

function getBagLabel(type: string, copy: (typeof COPY)[DisplayLanguage]) {
  if (type === "carry_on") return copy.serviceTypeCarryOn;
  return copy.serviceTypeChecked;
}

function getDisplayLanguage(language: string | undefined): DisplayLanguage {
  if (language === "en" || language === "es") return language;
  return "pt";
}

export default function BaggageInformationHub({
  flight,
  services = [],
  includedBaggage = [],
  simplified = false,
}: BaggageInformationHubProps) {
  const { language } = useI18n();
  const lang = getDisplayLanguage(language);
  const copy = COPY[lang];
  const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR";
  const passengers = flight?.passengers ?? [];
  const slices = flight?.slices ?? [];

  const passengerIndexById = new Map(passengers.map((passenger, index) => [passenger.passengerId, index]));

  const segmentDetails = slices.flatMap((slice, sliceIndex) =>
    slice.segments.map((segment) => ({
      segmentId: segment.segmentId,
      label: `${segment.originCode} -> ${segment.destinationCode}`,
      sliceLabel: sliceIndex === 0 ? copy.outbound : copy.inbound,
    })),
  );

  const includedSource =
    passengers.length > 0
      ? passengers.flatMap((passenger) => passenger.baggages || [])
      : includedBaggage;

  const includedByType = includedSource.reduce<Record<string, number>>((acc, bag) => {
    const type = bag.type || "checked";
    acc[type] = (acc[type] || 0) + (bag.quantity || 0);
    return acc;
  }, {});

  const includedCards = [
    {
      key: "personal_item",
      icon: BriefcaseBusiness,
      title: copy.itemPersonal,
      value: copy.itemIncluded,
      detail: simplified
        ? copy.step1Desc
        : lang === "en"
          ? "Usually the smallest item you keep under the seat."
          : lang === "es"
            ? "Normalmente es el artículo más pequeño que va debajo del asiento."
            : "Normalmente é o item menor que vai embaixo do assento.",
    },
    {
      key: "carry_on",
      icon: Package,
      title: copy.itemCarryOn,
      value:
        includedByType.carry_on && includedByType.carry_on > 0
          ? `${includedByType.carry_on} ${copy.itemIncluded}`
          : copy.itemNotSeen,
      detail:
        passengers.length > 1 && includedByType.carry_on
          ? lang === "en"
            ? `Across ${passengers.length} passengers in this offer`
            : lang === "es"
              ? `Sumado entre ${passengers.length} pasajeros en esta oferta`
              : `Somado entre ${passengers.length} passageiros nesta oferta`
          : undefined,
    },
    {
      key: "checked",
      icon: Luggage,
      title: copy.itemChecked,
      value:
        includedByType.checked && includedByType.checked > 0
          ? `${includedByType.checked} ${copy.itemIncluded}`
          : copy.itemNotSeen,
      detail:
        passengers.length > 1 && includedByType.checked
          ? lang === "en"
            ? `Across ${passengers.length} passengers in this offer`
            : lang === "es"
              ? `Sumado entre ${passengers.length} pasajeros en esta oferta`
              : `Somado entre ${passengers.length} passageiros nesta oferta`
          : undefined,
    },
  ];

  const serviceSummaries = services.map((service) => {
    const eligiblePassengerIndexes =
      service.passengerIds?.length > 0
        ? service.passengerIds
            .map((passengerId) => passengerIndexById.get(passengerId))
            .filter((value): value is number => value !== undefined)
        : passengers.map((_, index) => index);

    const eligiblePassengerLabels =
      eligiblePassengerIndexes.length > 0
        ? eligiblePassengerIndexes.map((index) => `${lang === "en" ? "Passenger" : lang === "es" ? "Pasajero" : "Passageiro"} ${index + 1}`)
        : [copy.allPassengers];

    const segmentLabels =
      service.segmentIds?.length > 0
        ? service.segmentIds
            .map((segmentId) => segmentDetails.find((segment) => segment.segmentId === segmentId))
            .filter((value): value is (typeof segmentDetails)[number] => Boolean(value))
            .map((segment) => `${segment.sliceLabel}: ${segment.label}`)
        : [copy.wholeTrip];

    return {
      ...service,
      bagType: service.metadata?.type || service.type || "checked",
      eligiblePassengerLabels,
      segmentLabels,
    };
  });

  const cheapestExtra = serviceSummaries.reduce<number | null>((lowest, service) => {
    const current = Number.parseFloat(service.totalAmount);
    if (!Number.isFinite(current)) return lowest;
    if (lowest === null || current < lowest) return current;
    return lowest;
  }, null);

  const formatPrice = (amount: number | string, currency: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      typeof amount === "string" ? Number.parseFloat(amount) : amount,
    );

  return (
    <Card
      className={
        simplified
          ? "border border-blue-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(239,246,255,0.9))] shadow-sm rounded-2xl"
          : "border border-slate-200 bg-white shadow-sm rounded-2xl"
      }
      data-testid={simplified ? "baggage-info-simplified" : "baggage-info-detailed"}
    >
      <CardHeader className="border-b border-slate-100 gap-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className={simplified ? "text-xl text-slate-950" : "text-lg text-slate-950"}>
              {simplified ? copy.simplifiedTitle : copy.detailedTitle}
            </CardTitle>
            <p className={simplified ? "mt-2 text-sm md:text-base leading-relaxed text-slate-600" : "mt-1 text-sm text-slate-500"}>
              {simplified ? copy.simplifiedSubtitle : copy.detailedSubtitle}
            </p>
          </div>
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 no-default-active-elevate">
            {services.length > 0
              ? `${services.length} ${copy.extraAvailable}`
              : copy.extraNotAvailable}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 md:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {includedCards.map((item) => (
            <div
              key={item.key}
              className={
                simplified
                  ? "rounded-2xl border border-blue-100 bg-white px-4 py-4"
                  : "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              }
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className={simplified ? "text-base font-bold text-slate-900" : "text-sm font-semibold text-slate-900"}>
                  {item.title}
                </span>
              </div>
              <p className={simplified ? "mt-3 text-base font-extrabold text-slate-950" : "mt-3 text-sm font-bold text-slate-950"}>
                {item.value}
              </p>
              {item.detail && <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</p>}
            </div>
          ))}
        </div>

        {simplified ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: copy.step1Title, desc: copy.step1Desc },
              { title: copy.step2Title, desc: copy.step2Desc },
              { title: copy.step3Title, desc: copy.step3Desc },
            ].map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-4">
                <div className="text-sm font-bold text-blue-700">{index + 1}</div>
                <div className="mt-2 text-base font-bold text-slate-950">{item.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Info className="h-4 w-4 text-blue-600" />
                {copy.updatedByAirline}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.updatedByAirlineDesc}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <UserRound className="h-4 w-4 text-blue-600" />
                {copy.passengerScope}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.passengerScopeDesc}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Route className="h-4 w-4 text-blue-600" />
                {copy.segmentScope}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.segmentScopeDesc}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">{copy.priceRule}</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">{copy.priceRuleDesc}</p>
              {simplified && <p className="mt-2 text-sm font-medium text-amber-900">{copy.supportNote}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold text-slate-700">{copy.extraOptions}</p>
            {cheapestExtra !== null && serviceSummaries[0]?.totalCurrency && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 no-default-active-elevate">
                {lang === "en" ? "From" : lang === "es" ? "Desde" : "A partir de"}{" "}
                {formatPrice(cheapestExtra, serviceSummaries[0].totalCurrency)}
              </Badge>
            )}
          </div>

          {serviceSummaries.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {serviceSummaries.map((service) => (
                <div
                  key={service.id}
                  className={
                    simplified
                      ? "rounded-2xl border border-blue-100 bg-white px-4 py-4"
                      : "rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  }
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 no-default-active-elevate">
                          {getBagLabel(service.bagType, copy)}
                        </Badge>
                        {service.metadata?.maximum_weight_kg && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 no-default-active-elevate">
                            {copy.upTo} {service.metadata.maximum_weight_kg}kg
                          </Badge>
                        )}
                      </div>
                      <div className={simplified ? "mt-3 text-base font-bold text-slate-950" : "mt-3 text-sm font-bold text-slate-950"}>
                        {copy.eachPrice}: {formatPrice(service.totalAmount, service.totalCurrency)}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {service.maxQuantity > 1 ? `${copy.upTo} ${service.maxQuantity}` : null}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="font-semibold text-slate-700">{copy.appliesTo}</p>
                      <p className="mt-1 text-slate-600 leading-relaxed">{service.eligiblePassengerLabels.join(", ")}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="font-semibold text-slate-700">{copy.tripPart}</p>
                      <p className="mt-1 text-slate-600 leading-relaxed">{service.segmentLabels.join(", ")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              {copy.extraNotAvailable}
            </div>
          )}
        </div>

        {!simplified && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">{copy.howToRead}</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                  {lang === "en"
                    ? "Included baggage comes from the refreshed offer. Extra baggage comes from airline services and may be limited by passenger and segment."
                    : lang === "es"
                      ? "El equipaje incluido viene de la oferta actualizada. El equipaje extra viene de los servicios de la aerolínea y puede limitarse por pasajero y tramo."
                      : "A bagagem incluída vem da oferta atualizada. A bagagem extra vem dos serviços da companhia e pode ser limitada por passageiro e trecho."}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
