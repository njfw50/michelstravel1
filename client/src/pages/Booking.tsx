import { useRoute, useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateBooking } from "@/hooks/use-bookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Plane, Clock, ArrowRight, Shield, Luggage, User, ChevronDown, ChevronUp, RefreshCw, X as XIcon, Briefcase, ScanLine, CreditCard, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { ScanDocumentDialog } from "@/components/ScanDocumentDialog";
import BaggageSelector from "@/components/BaggageSelector";
import PaymentForm from "@/components/PaymentForm";
import type { FlightOffer } from "@shared/schema";

const passengerSchema = z.object({
  title: z.enum(["mr", "mrs", "ms", "miss", "dr"]).default("mr"),
  givenName: z.string().min(1, "Required").max(20),
  familyName: z.string().min(1, "Required").max(20),
  bornOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  gender: z.enum(["m", "f"], { required_error: "Required" }),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().min(7, "Min 7 digits").max(20),
  documentType: z.enum(["passport", "national_id", "drivers_license", "travel_document", "other"]).default("passport"),
  documentNumber: z.string().optional(),
  documentExpiryDate: z.string().optional(),
  documentIssuingCountry: z.string().optional(),
  nationality: z.string().optional(),
  type: z.enum(["adult", "child", "infant_without_seat"]).default("adult"),
  loyaltyProgram: z.string().optional(),
  loyaltyNumber: z.string().optional(),
});

function createBookingSchema(isDocRequired: boolean) {
  const baseSchema = z.object({
    passengers: z.array(passengerSchema).min(1),
    contactEmail: z.string().email("Invalid email"),
    contactPhone: z.string().min(7, "Min 7 digits").max(20),
  });

  if (!isDocRequired) return baseSchema;

  return baseSchema.superRefine((data, ctx) => {
    data.passengers.forEach((pax, i) => {
      if (!pax.documentNumber || pax.documentNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Document number is required",
          path: ["passengers", i, "documentNumber"],
        });
      }
      if (!pax.documentExpiryDate || pax.documentExpiryDate.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Document expiry date is required",
          path: ["passengers", i, "documentExpiryDate"],
        });
      }
      if (!pax.documentIssuingCountry || pax.documentIssuingCountry.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Issuing country is required",
          path: ["passengers", i, "documentIssuingCountry"],
        });
      }
      if (!pax.nationality || pax.nationality.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nationality is required",
          path: ["passengers", i, "nationality"],
        });
      }
    });
  });
}

type BookingFormValues = {
  passengers: z.infer<typeof passengerSchema>[];
  contactEmail: string;
  contactPhone: string;
};

const formatDuration = (duration: string) => {
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? hoursMatch[1] : "0";
  const minutes = minutesMatch ? minutesMatch[1] : "0";
  return `${hours}h ${minutes}m`;
};

const COUNTRIES = [
  { code: "BR", name: "Brasil" }, { code: "US", name: "United States" }, { code: "PT", name: "Portugal" },
  { code: "AR", name: "Argentina" }, { code: "MX", name: "Mexico" }, { code: "CO", name: "Colombia" },
  { code: "CL", name: "Chile" }, { code: "PE", name: "Peru" }, { code: "ES", name: "Spain" },
  { code: "FR", name: "France" }, { code: "DE", name: "Germany" }, { code: "IT", name: "Italy" },
  { code: "GB", name: "United Kingdom" }, { code: "CA", name: "Canada" }, { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" }, { code: "IN", name: "India" }, { code: "CN", name: "China" },
  { code: "ZA", name: "South Africa" }, { code: "AE", name: "UAE" }, { code: "UY", name: "Uruguay" },
  { code: "PY", name: "Paraguay" }, { code: "BO", name: "Bolivia" }, { code: "EC", name: "Ecuador" },
  { code: "VE", name: "Venezuela" }, { code: "CR", name: "Costa Rica" }, { code: "PA", name: "Panama" },
  { code: "DO", name: "Dominican Republic" }, { code: "GT", name: "Guatemala" }, { code: "HN", name: "Honduras" },
].sort((a, b) => a.name.localeCompare(b.name));

function PassengerForm({ index, control, register, errors, passengerType, isDocRequired, t, setValue }: any) {
  const [expanded, setExpanded] = useState(index === 0);
  const [scanOpen, setScanOpen] = useState(false);
  const paxErrors = errors?.passengers?.[index];
  const typeLabel = passengerType === "child" ? t("booking.child") : passengerType === "infant_without_seat" ? t("booking.infant") : t("booking.adult");

  const handleScanConfirm = (data: any) => {
    if (data.givenName) setValue(`passengers.${index}.givenName`, data.givenName);
    if (data.familyName) setValue(`passengers.${index}.familyName`, data.familyName);
    if (data.bornOn) setValue(`passengers.${index}.bornOn`, data.bornOn);
    if (data.gender) setValue(`passengers.${index}.gender`, data.gender);
    if (data.passportNumber) setValue(`passengers.${index}.documentNumber`, data.passportNumber);
    if (data.passportExpiryDate) setValue(`passengers.${index}.documentExpiryDate`, data.passportExpiryDate);
    if (data.nationality) setValue(`passengers.${index}.nationality`, data.nationality);
    if (data.passportIssuingCountry) setValue(`passengers.${index}.documentIssuingCountry`, data.passportIssuingCountry);
    if (data.documentType) {
      setValue(`passengers.${index}.documentType`, data.documentType);
    } else {
      setValue(`passengers.${index}.documentType`, "passport");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        data-testid={`button-toggle-passenger-${index}`}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
          </div>
          <div>
            <span className="text-gray-900 font-medium text-sm">{t("booking.passenger")} {index + 1}</span>
            <Badge className="ml-2 text-[10px] bg-gray-100 text-gray-500 border-gray-200">{typeLabel}</Badge>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-4 border-t border-gray-100 pt-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-blue-200 text-blue-600 bg-blue-50"
              onClick={() => setScanOpen(true)}
              data-testid={`button-scan-document-${index}`}
            >
              <ScanLine className="h-4 w-4" />
              {t("scan.scan_document")}
            </Button>
          </div>

          <ScanDocumentDialog
            open={scanOpen}
            onOpenChange={setScanOpen}
            onConfirm={handleScanConfirm}
            passengerIndex={index}
          />

          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            <div className="space-y-1.5 col-span-1">
              <Label className="text-gray-500 text-xs font-medium">{t("booking.passenger_title")} *</Label>
              <Select
                defaultValue="mr"
                onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.title`, value: val } };
                  register(`passengers.${index}.title`).onChange(event);
                }}
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900" data-testid={`select-title-${index}`}>
                  <SelectValue placeholder={t("booking.passenger_title")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mr">{t("booking.title_mr")}</SelectItem>
                  <SelectItem value="mrs">{t("booking.title_mrs")}</SelectItem>
                  <SelectItem value="ms">{t("booking.title_ms")}</SelectItem>
                  <SelectItem value="miss">{t("booking.title_miss")}</SelectItem>
                  <SelectItem value="dr">{t("booking.title_dr")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <Label className="text-gray-500 text-xs font-medium">{t("booking.given_name")} *</Label>
              <Input
                {...register(`passengers.${index}.givenName`)}
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                placeholder="e.g. John"
                data-testid={`input-given-name-${index}`}
              />
              {paxErrors?.givenName && <p className="text-xs text-red-400">{paxErrors.givenName.message}</p>}
            </div>
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <Label className="text-gray-500 text-xs font-medium">{t("booking.family_name")} *</Label>
              <Input
                {...register(`passengers.${index}.familyName`)}
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                placeholder="e.g. Smith"
                data-testid={`input-family-name-${index}`}
              />
              {paxErrors?.familyName && <p className="text-xs text-red-400">{paxErrors.familyName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs font-medium">{t("booking.date_of_birth")} *</Label>
              <Input
                {...register(`passengers.${index}.bornOn`)}
                type="date"
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                data-testid={`input-dob-${index}`}
              />
              {paxErrors?.bornOn && <p className="text-xs text-red-400">{paxErrors.bornOn.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs font-medium">{t("booking.gender")} *</Label>
              <Select
                onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.gender`, value: val } };
                  register(`passengers.${index}.gender`).onChange(event);
                }}
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900" data-testid={`select-gender-${index}`}>
                  <SelectValue placeholder={t("booking.select_gender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">{t("booking.male")}</SelectItem>
                  <SelectItem value="f">{t("booking.female")}</SelectItem>
                </SelectContent>
              </Select>
              {paxErrors?.gender && <p className="text-xs text-red-400">{paxErrors.gender.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs font-medium">{t("booking.email")} *</Label>
              <Input
                {...register(`passengers.${index}.email`)}
                type="email"
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                placeholder="passenger@email.com"
                data-testid={`input-email-${index}`}
              />
              {paxErrors?.email && <p className="text-xs text-red-400">{paxErrors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs font-medium">{t("booking.phone")} *</Label>
              <Input
                {...register(`passengers.${index}.phoneNumber`)}
                type="tel"
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                placeholder="+1 234 567 8900"
                data-testid={`input-phone-${index}`}
              />
              {paxErrors?.phoneNumber && <p className="text-xs text-red-400">{paxErrors.phoneNumber.message}</p>}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              {t("booking.travel_document")}
              {isDocRequired && <Badge className="text-[10px] bg-red-50 text-red-600 border-red-200">{t("booking.required")}</Badge>}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs font-medium">{t("booking.doc_type")} {isDocRequired ? "*" : ""}</Label>
                <Select
                  defaultValue="passport"
                  onValueChange={(val) => {
                    const event = { target: { name: `passengers.${index}.documentType`, value: val } };
                    register(`passengers.${index}.documentType`).onChange(event);
                  }}
                >
                  <SelectTrigger className="bg-white border-gray-200 text-gray-900" data-testid={`select-doc-type-${index}`}>
                    <SelectValue placeholder={t("booking.select_doc_type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">{t("booking.doc_passport")}</SelectItem>
                    <SelectItem value="national_id">{t("booking.doc_national_id")}</SelectItem>
                    <SelectItem value="drivers_license">{t("booking.doc_drivers_license")}</SelectItem>
                    <SelectItem value="travel_document">{t("booking.doc_travel_doc")}</SelectItem>
                    <SelectItem value="other">{t("booking.doc_other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs font-medium">{t("booking.doc_number")} {isDocRequired ? "*" : ""}</Label>
                <Input
                  {...register(`passengers.${index}.documentNumber`)}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                  placeholder="AB1234567"
                  data-testid={`input-doc-number-${index}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs font-medium">{t("booking.doc_expiry")} {isDocRequired ? "*" : ""}</Label>
                <Input
                  {...register(`passengers.${index}.documentExpiryDate`)}
                  type="date"
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                  data-testid={`input-doc-expiry-${index}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs font-medium">{t("booking.nationality")}</Label>
                <Select onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.nationality`, value: val } };
                  register(`passengers.${index}.nationality`).onChange(event);
                }}>
                  <SelectTrigger className="bg-white border-gray-200 text-gray-900" data-testid={`select-nationality-${index}`}>
                    <SelectValue placeholder={t("booking.select_country")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs font-medium">{t("booking.issuing_country")}</Label>
                <Select onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.documentIssuingCountry`, value: val } };
                  register(`passengers.${index}.documentIssuingCountry`).onChange(event);
                }}>
                  <SelectTrigger className="bg-white border-gray-200 text-gray-900" data-testid={`select-issuing-country-${index}`}>
                    <SelectValue placeholder={t("booking.select_country")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              {t("booking.loyalty_program") || "Frequent Flyer"}
              <span className="text-xs text-gray-400 font-normal ml-1">({t("booking.optional") || "optional"})</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs font-medium">{t("booking.loyalty_airline") || "Airline Program"}</Label>
                <Input
                  {...register(`passengers.${index}.loyaltyProgram`)}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                  placeholder="e.g. LATAM Pass, AAdvantage"
                  data-testid={`input-loyalty-program-${index}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs font-medium">{t("booking.loyalty_number") || "Member Number"}</Label>
                <Input
                  {...register(`passengers.${index}.loyaltyNumber`)}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                  placeholder="e.g. 123456789"
                  data-testid={`input-loyalty-number-${index}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentDetail({ segment, t }: { segment: any; t: any }) {
  const dur = segment.duration?.startsWith("P") ? formatDuration(segment.duration) : segment.duration;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-center min-w-[60px]">
            <div className="text-base font-bold text-gray-900">{format(parseISO(segment.departureTime), "HH:mm")}</div>
            <div className="text-[10px] text-gray-500 font-medium uppercase">{segment.originCode}</div>
            {segment.originTerminal && <div className="text-[10px] text-gray-400">T{segment.originTerminal}</div>}
          </div>
          <div className="flex flex-col items-center px-2 flex-1 max-w-[120px]">
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />{dur}
            </div>
            <div className="w-full h-[1px] bg-gray-200 my-1 relative">
              <Plane className="h-3 w-3 text-blue-500 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-[10px] text-gray-400">{segment.flightNumber}</div>
          </div>
          <div className="text-center min-w-[60px]">
            <div className="text-base font-bold text-gray-900">{format(parseISO(segment.arrivalTime), "HH:mm")}</div>
            <div className="text-[10px] text-gray-500 font-medium uppercase">{segment.destinationCode}</div>
            {segment.destinationTerminal && <div className="text-[10px] text-gray-400">T{segment.destinationTerminal}</div>}
          </div>
        </div>
        {segment.aircraftType && (
          <div className="text-[10px] text-gray-400 mt-1 text-center">{segment.carrierName} - {segment.aircraftType}</div>
        )}
      </div>
    </div>
  );
}

export default function Booking() {
  const [match, params] = useRoute("/book/:id");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();
  
  const createBooking = useCreateBooking();

  const [flight, setFlight] = useState<FlightOffer | null>(null);
  const [baggageSelections, setBaggageSelections] = useState<any[]>([]);
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    bookingId: number;
    referenceCode: string;
    amount: number;
    currency: string;
  } | null>(null);
  const isDocRequired = flight?.passengerIdentityDocumentsRequired ?? false;
  const searchParams = new URLSearchParams(window.location.search);
  const numAdults = parseInt(searchParams.get("adults") || "1", 10);
  const numChildren = parseInt(searchParams.get("children") || "0", 10);
  const numInfants = parseInt(searchParams.get("infants") || "0", 10);
  const totalPassengers = numAdults + numChildren + numInfants;

  const buildDefaultPassengers = () => {
    const pax: any[] = [];
    for (let i = 0; i < numAdults; i++) {
      pax.push({
        title: "mr" as const,
        givenName: i === 0 ? (user?.firstName || "") : "",
        familyName: i === 0 ? (user?.lastName || "") : "",
        bornOn: "",
        gender: "" as any,
        email: i === 0 ? (user?.email || "") : "",
        phoneNumber: "",
        documentType: "passport" as const,
        documentNumber: "",
        documentExpiryDate: "",
        documentIssuingCountry: "",
        nationality: "",
        type: "adult",
        loyaltyProgram: "",
        loyaltyNumber: "",
      });
    }
    for (let i = 0; i < numChildren; i++) {
      pax.push({ title: "mr" as const, givenName: "", familyName: "", bornOn: "", gender: "" as any, email: "", phoneNumber: "", documentType: "passport" as const, documentNumber: "", documentExpiryDate: "", documentIssuingCountry: "", nationality: "", type: "child", loyaltyProgram: "", loyaltyNumber: "" });
    }
    for (let i = 0; i < numInfants; i++) {
      pax.push({ title: "mr" as const, givenName: "", familyName: "", bornOn: "", gender: "" as any, email: "", phoneNumber: "", documentType: "passport" as const, documentNumber: "", documentExpiryDate: "", documentIssuingCountry: "", nationality: "", type: "infant_without_seat", loyaltyProgram: "", loyaltyNumber: "" });
    }
    return pax;
  };

  const bookingSchema = createBookingSchema(isDocRequired);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      passengers: buildDefaultPassengers(),
      contactEmail: user?.email || "",
      contactPhone: "",
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "passengers",
  });

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/flights/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            toast({ title: t("booking.error"), description: t("booking.error_desc"), variant: "destructive" });
          } else {
            setFlight(data);
          }
        })
        .catch(err => console.error("Failed to fetch flight", err));
    }
  }, [params?.id]);

  const onSubmit = async (data: BookingFormValues) => {
    if (!flight) return;

    try {
      const refreshRes = await fetch(`/api/flights/${flight.id}/refresh`);
      const refreshData = await refreshRes.json();
      
      if (!refreshData.valid) {
        toast({ 
          title: t("booking.offer_expired") || "Offer Expired", 
          description: t("booking.offer_expired_desc") || "This flight offer has expired. Please search again for updated prices.",
          variant: "destructive" 
        });
        return;
      }

      if (refreshData.price && Math.abs(refreshData.price - flight.price) > 0.01) {
        setFlight({ ...flight, price: refreshData.price, currency: refreshData.currency || flight.currency });
        toast({ 
          title: t("booking.price_updated") || "Price Updated", 
          description: t("booking.price_updated_desc") || "The flight price has been updated. Please review the new total before proceeding.",
          variant: "default" 
        });
        return;
      }
    } catch (err) {
      console.warn("Could not refresh offer, proceeding with current price");
    }

    const passengerDetails = data.passengers.map((p, i) => ({
      ...p,
      passengerId: flight.passengers?.[i]?.passengerId || `pax_${i}`,
    }));

    const bookingData = {
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      totalPrice: grandTotal.toString(),
      currency: flight.currency,
      flightData: {
        id: flight.id,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        origin: flight.originCode || "N/A",
        destination: flight.destinationCode || "N/A",
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        cabinClass: flight.cabinClass,
        slices: flight.slices,
        logoUrl: flight.logoUrl,
        baggageSelections: baggageSelections.filter(b => b.quantity > 0).length > 0
          ? baggageSelections.filter(b => b.quantity > 0) : undefined,
      },
      passengerDetails,
    };

    createBooking.mutate(bookingData as any, {
      onSuccess: (response: any) => {
        if (response.clientSecret) {
          setPaymentData({
            clientSecret: response.clientSecret,
            bookingId: response.booking.id,
            referenceCode: response.booking.referenceCode,
            amount: grandTotal,
            currency: flight.currency,
          });
          setPaymentStep(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          toast({ title: t("booking.failed"), description: t("booking.failed_desc") || "Could not initialize payment. Please try again.", variant: "destructive" });
        }
      },
      onError: (error: any) => {
        const serverMessage = error?.message || t("booking.failed_desc");
        toast({ title: t("booking.failed"), description: serverMessage, variant: "destructive" });
      },
    });
  };

  const stopsLabel = flight
    ? (flight.stops === 0
      ? t("flight.direct")
      : `${flight.stops} ${flight.stops > 1 ? t("flight.stops") : t("flight.stop")}`)
    : "";

  if (!flight && !params?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t("booking.loading")}</div>
      </div>
    );
  }

  const firstPaxBaggage = flight?.passengers?.[0]?.baggages || [];
  const cabinClassName = flight?.passengers?.[0]?.cabinClassName || flight?.cabinClass || "Economy";
  const fareBrand = flight?.passengers?.[0]?.fareBrandName;

  const baggageExtras = baggageSelections.reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 0), 0);
  const grandTotal = (flight?.price || 0) + baggageExtras;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="flex items-center gap-4 mb-2">
            {paymentStep && !paymentData && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPaymentStep(false)}
                data-testid="button-back-to-details"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900 mb-1" data-testid="text-booking-title">
                {paymentStep ? (t("payment.title") || "Payment Details") : t("booking.title")}
              </h1>
              <p className="text-gray-400 text-sm">
                {paymentStep ? (t("payment.subtitle") || "Complete your payment to confirm the booking") : t("booking.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${!paymentStep ? 'text-blue-600' : 'text-emerald-600'}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs ${!paymentStep ? 'bg-blue-600' : 'bg-emerald-500'}`}>
                {paymentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : '1'}
              </div>
              {t("booking.step_details") || "Passenger Details"}
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={`flex items-center gap-1.5 text-xs font-medium ${paymentStep ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${paymentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              {t("booking.step_payment") || "Payment"}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {paymentStep && paymentData ? (
              <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white">
                <CardContent className="p-5 md:p-6">
                  <PaymentForm
                    clientSecret={paymentData.clientSecret}
                    bookingId={paymentData.bookingId}
                    referenceCode={paymentData.referenceCode}
                    amount={paymentData.amount}
                    currency={paymentData.currency}
                    onSuccess={() => {
                      setLocation(`/checkout/success?bookingId=${paymentData.bookingId}`);
                    }}
                    onError={(error) => {
                      toast({ title: t("payment.error") || "Payment Error", description: error, variant: "destructive" });
                    }}
                  />
                </CardContent>
              </Card>
            ) : (

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white">
                <CardHeader className="border-b border-gray-100 gap-2">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <User className="h-5 w-5 text-blue-500" />
                    {t("booking.contact_info")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 md:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-gray-500 text-xs font-medium">{t("booking.contact_email")} *</Label>
                      <Input
                        {...form.register("contactEmail")}
                        type="email"
                        className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                        placeholder="contact@email.com"
                        data-testid="input-contact-email"
                      />
                      {form.formState.errors.contactEmail && (
                        <p className="text-xs text-red-400">{form.formState.errors.contactEmail.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-500 text-xs font-medium">{t("booking.contact_phone")} *</Label>
                      <Input
                        {...form.register("contactPhone")}
                        type="tel"
                        className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                        placeholder="+1 234 567 8900"
                        data-testid="input-contact-phone"
                      />
                      {form.formState.errors.contactPhone && (
                        <p className="text-xs text-red-400">{form.formState.errors.contactPhone.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white">
                <CardHeader className="border-b border-gray-100 gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      {t("booking.passenger_details")}
                    </CardTitle>
                    <span className="text-xs text-gray-400">
                      {totalPassengers} {totalPassengers > 1 ? t("booking.passengers_label") : t("booking.passenger")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {fields.map((field, index) => (
                    <PassengerForm
                      key={field.id}
                      index={index}
                      control={form.control}
                      register={form.register}
                      errors={form.formState.errors}
                      passengerType={field.type}
                      isDocRequired={isDocRequired}
                      t={t}
                      setValue={form.setValue}
                    />
                  ))}
                </CardContent>
              </Card>

              {flight && (
                <BaggageSelector
                  offerId={flight.id}
                  passengerCount={totalPassengers}
                  onBaggageSelected={setBaggageSelections}
                  includedBaggage={firstPaxBaggage}
                />
              )}

              {flight?.conditions && (
                <Card className="border border-amber-200 bg-amber-50 rounded-xl">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t("booking.fare_rules") || "Fare Rules"}
                    </h4>
                    <div className="space-y-1.5 text-xs text-amber-700">
                      {flight.conditions.changeBeforeDeparture && (
                        <div className="flex items-start gap-2">
                          {flight.conditions.changeBeforeDeparture.allowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          ) : (
                            <XIcon className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <span>
                            {t("booking.change_before_departure")}: {flight.conditions.changeBeforeDeparture.allowed 
                              ? (flight.conditions.changeBeforeDeparture.penaltyAmount 
                                ? `${t("booking.allowed_with_fee")} ${flight.conditions.changeBeforeDeparture.penaltyCurrency} ${flight.conditions.changeBeforeDeparture.penaltyAmount}`
                                : t("booking.allowed_free"))
                              : t("booking.not_allowed")}
                          </span>
                        </div>
                      )}
                      {flight.conditions.refundBeforeDeparture && (
                        <div className="flex items-start gap-2">
                          {flight.conditions.refundBeforeDeparture.allowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          ) : (
                            <XIcon className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <span>
                            {t("booking.refund_before_departure")}: {flight.conditions.refundBeforeDeparture.allowed 
                              ? (flight.conditions.refundBeforeDeparture.penaltyAmount 
                                ? `${t("booking.allowed_with_fee")} ${flight.conditions.refundBeforeDeparture.penaltyCurrency} ${flight.conditions.refundBeforeDeparture.penaltyAmount}`
                                : t("booking.allowed_free"))
                              : t("booking.not_allowed")}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-600 pt-1">
                      {t("booking.conditions_disclaimer") || "By proceeding, you accept these fare conditions and the airline's terms of carriage."}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-bold bg-blue-600 shadow-lg shadow-blue-600/20 transition-all border-0 text-white rounded-xl gap-2" 
                  disabled={createBooking.isPending || !flight}
                  data-testid="button-pay"
                >
                  <CreditCard className="h-5 w-5" />
                  {createBooking.isPending 
                    ? t("booking.processing") 
                    : `${t("booking.continue_to_payment") || "Continue to Payment"} - ${flight ? new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(grandTotal) : '...'}`}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Lock className="h-3 w-3" />
                  <span>{t("booking.secure_payment")}</span>
                </div>
              </div>
            </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="lg:sticky lg:top-6 space-y-5">
              <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white">
                <CardHeader className="border-b border-gray-100 gap-2">
                  <CardTitle className="text-lg text-gray-900">{t("booking.flight_summary")}</CardTitle>
                </CardHeader>
                <CardContent className="p-5 md:p-6 space-y-5">
                  {flight ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden p-2 border border-gray-200">
                        {flight.logoUrl ? <img src={flight.logoUrl} className="w-full h-full object-contain" alt={flight.airline} /> : <Plane className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900" data-testid="text-airline">{flight.airline}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400">{flight.flightNumber}</span>
                          {cabinClassName && (
                            <span className="text-xs text-gray-400"> - {cabinClassName}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {fareBrand && (
                      <div className="text-xs text-gray-400">{t("booking.fare_brand")}: <span className="text-gray-600 font-medium">{fareBrand}</span></div>
                    )}

                    {flight.slices && flight.slices.length > 0 ? (
                      flight.slices.map((slice, si) => (
                        <div key={si} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-medium text-gray-500">
                              {si === 0 ? t("booking.outbound") : t("booking.return_flight")}
                            </span>
                            <span className="text-xs text-gray-400">
                              {slice.originCode} <ArrowRight className="h-3 w-3 inline" /> {slice.destinationCode}
                            </span>
                          </div>
                          {slice.segments.map((seg, segi) => (
                            <SegmentDetail key={segi} segment={seg} t={t} />
                          ))}
                          {slice.segments.length > 1 && (
                            <div className="text-[10px] text-blue-500 text-center pt-1">
                              {slice.segments.length - 1} {t("booking.connection")}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{format(parseISO(flight.departureTime), "HH:mm")}</div>
                            <div className="text-xs text-gray-500 font-medium uppercase">{flight.originCode || "DEP"}</div>
                            {flight.originCity && <div className="text-[10px] text-gray-400">{flight.originCity}</div>}
                          </div>
                          <div className="flex flex-col items-center px-3">
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {flight.duration.startsWith("P") ? formatDuration(flight.duration) : flight.duration}
                            </div>
                            <ArrowRight className="h-4 w-4 text-blue-500 my-1" />
                            <div className={`text-xs font-medium ${flight.stops === 0 ? "text-emerald-600" : "text-blue-500"}`}>
                              {stopsLabel}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{format(parseISO(flight.arrivalTime), "HH:mm")}</div>
                            <div className="text-xs text-gray-500 font-medium uppercase">{flight.destinationCode || "ARR"}</div>
                            {flight.destinationCity && <div className="text-[10px] text-gray-400">{flight.destinationCity}</div>}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 text-center">
                          {format(parseISO(flight.departureTime), "EEEE, MMMM d, yyyy")}
                        </div>
                      </div>
                    )}

                    {firstPaxBaggage.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
                          <Luggage className="h-3.5 w-3.5 text-blue-500" /> {t("booking.baggage_included")}
                        </p>
                        {firstPaxBaggage.map((bag: any, bi: number) => (
                          <div key={bi} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {bag.quantity}x {bag.type === "checked" ? t("booking.checked_bag") : bag.type === "carry_on" ? t("booking.carry_on") : bag.type}
                          </div>
                        ))}
                      </div>
                    )}

                    {flight.conditions && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
                          <RefreshCw className="h-3.5 w-3.5 text-blue-500" /> {t("booking.fare_conditions")}
                        </p>
                        {flight.conditions.changeBeforeDeparture && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {flight.conditions.changeBeforeDeparture.allowed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <XIcon className="h-3.5 w-3.5 text-red-500" />
                            )}
                            {t("booking.change_allowed")}: {flight.conditions.changeBeforeDeparture.allowed ? t("booking.yes") : t("booking.no")}
                            {flight.conditions.changeBeforeDeparture.penaltyAmount && (
                              <span className="text-blue-500 ml-1">({flight.conditions.changeBeforeDeparture.penaltyCurrency} {flight.conditions.changeBeforeDeparture.penaltyAmount})</span>
                            )}
                          </div>
                        )}
                        {flight.conditions.refundBeforeDeparture && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {flight.conditions.refundBeforeDeparture.allowed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <XIcon className="h-3.5 w-3.5 text-red-500" />
                            )}
                            {t("booking.refund_allowed")}: {flight.conditions.refundBeforeDeparture.allowed ? t("booking.yes") : t("booking.no")}
                            {flight.conditions.refundBeforeDeparture.penaltyAmount && (
                              <span className="text-blue-500 ml-1">({flight.conditions.refundBeforeDeparture.penaltyCurrency} {flight.conditions.refundBeforeDeparture.penaltyAmount})</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Separator className="bg-gray-100" />
                    
                    <div className="space-y-2">
                      {flight.baseAmount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t("booking.base_fare")}</span>
                          <span className="font-medium text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(parseFloat(flight.baseAmount))}</span>
                        </div>
                      )}
                      {flight.taxAmount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t("booking.taxes")}</span>
                          <span className="font-medium text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(parseFloat(flight.taxAmount))}</span>
                        </div>
                      )}
                      {!flight.baseAmount && !flight.taxAmount && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{t("booking.base_fare")}</span>
                            <span className="font-medium text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.9)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{t("booking.taxes")}</span>
                            <span className="font-medium text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.1)}</span>
                          </div>
                        </>
                      )}
                      {totalPassengers > 1 && (
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{t("booking.per_passenger")}</span>
                          <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price / totalPassengers)}</span>
                        </div>
                      )}
                      {baggageExtras > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t("booking.extra_baggage") || "Extra Baggage"}</span>
                          <span className="font-medium text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(baggageExtras)}</span>
                        </div>
                      )}
                    </div>
                    
                    <Separator className="bg-gray-100" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">{t("booking.total")}</span>
                      <span className="text-xl font-bold text-blue-600" data-testid="text-total-price">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(grandTotal)}
                      </span>
                    </div>
                  </>
                  ) : (
                    <div className="text-center py-4 text-gray-400">{t("booking.loading")}</div>
                  )}
                </CardContent>
              </Card>

              <div className="bg-emerald-50 p-4 rounded-xl flex gap-3 text-emerald-700 text-sm border border-emerald-100">
                <Shield className="h-5 w-5 shrink-0 text-emerald-500" />
                <p className="text-xs leading-relaxed">{t("booking.secure_payment")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
