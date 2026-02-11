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
import { CheckCircle2, Plane, Clock, ArrowRight, Shield, Luggage, User, ChevronDown, ChevronUp, RefreshCw, X as XIcon, Briefcase, ScanLine } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { ScanDocumentDialog } from "@/components/ScanDocumentDialog";
import type { FlightOffer } from "@shared/schema";

const passengerSchema = z.object({
  givenName: z.string().min(1, "Required").max(20),
  familyName: z.string().min(1, "Required").max(20),
  bornOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  gender: z.enum(["m", "f"], { required_error: "Required" }),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().min(7, "Min 7 digits").max(20),
  passportNumber: z.string().optional(),
  passportExpiryDate: z.string().optional(),
  passportIssuingCountry: z.string().optional(),
  nationality: z.string().optional(),
  type: z.enum(["adult", "child", "infant_without_seat"]).default("adult"),
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
      if (!pax.passportNumber || pax.passportNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passport number is required",
          path: ["passengers", i, "passportNumber"],
        });
      }
      if (!pax.passportExpiryDate || pax.passportExpiryDate.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passport expiry date is required",
          path: ["passengers", i, "passportExpiryDate"],
        });
      }
      if (!pax.passportIssuingCountry || pax.passportIssuingCountry.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Issuing country is required",
          path: ["passengers", i, "passportIssuingCountry"],
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
    if (data.passportNumber) setValue(`passengers.${index}.passportNumber`, data.passportNumber);
    if (data.passportExpiryDate) setValue(`passengers.${index}.passportExpiryDate`, data.passportExpiryDate);
    if (data.nationality) setValue(`passengers.${index}.nationality`, data.nationality);
    if (data.passportIssuingCountry) setValue(`passengers.${index}.passportIssuingCountry`, data.passportIssuingCountry);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
        data-testid={`button-toggle-passenger-${index}`}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
            <User className="h-4 w-4" />
          </div>
          <div>
            <span className="text-white font-bold text-sm">{t("booking.passenger")} {index + 1}</span>
            <Badge className="ml-2 text-[10px] bg-white/10 text-white/60 border-white/10">{typeLabel}</Badge>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-4 border-t border-white/5 pt-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-teal-500/30 text-teal-300 bg-teal-500/5"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.given_name")} *</Label>
              <Input
                {...register(`passengers.${index}.givenName`)}
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50"
                placeholder="e.g. John"
                data-testid={`input-given-name-${index}`}
              />
              {paxErrors?.givenName && <p className="text-xs text-red-400">{paxErrors.givenName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.family_name")} *</Label>
              <Input
                {...register(`passengers.${index}.familyName`)}
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50"
                placeholder="e.g. Smith"
                data-testid={`input-family-name-${index}`}
              />
              {paxErrors?.familyName && <p className="text-xs text-red-400">{paxErrors.familyName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.date_of_birth")} *</Label>
              <Input
                {...register(`passengers.${index}.bornOn`)}
                type="date"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50"
                data-testid={`input-dob-${index}`}
              />
              {paxErrors?.bornOn && <p className="text-xs text-red-400">{paxErrors.bornOn.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.gender")} *</Label>
              <Select
                onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.gender`, value: val } };
                  register(`passengers.${index}.gender`).onChange(event);
                }}
              >
                <SelectTrigger className="bg-white/5 border-white/15 text-white" data-testid={`select-gender-${index}`}>
                  <SelectValue placeholder={t("booking.select_gender")} />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(220,18%,10%)] border-white/10 text-white">
                  <SelectItem value="m">{t("booking.male")}</SelectItem>
                  <SelectItem value="f">{t("booking.female")}</SelectItem>
                </SelectContent>
              </Select>
              {paxErrors?.gender && <p className="text-xs text-red-400">{paxErrors.gender.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.email")} *</Label>
              <Input
                {...register(`passengers.${index}.email`)}
                type="email"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50"
                placeholder="passenger@email.com"
                data-testid={`input-email-${index}`}
              />
              {paxErrors?.email && <p className="text-xs text-red-400">{paxErrors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.phone")} *</Label>
              <Input
                {...register(`passengers.${index}.phoneNumber`)}
                type="tel"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50"
                placeholder="+1 234 567 8900"
                data-testid={`input-phone-${index}`}
              />
              {paxErrors?.phoneNumber && <p className="text-xs text-red-400">{paxErrors.phoneNumber.message}</p>}
            </div>
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white/80 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-400" />
              {t("booking.travel_document")} {isDocRequired && <Badge className="text-[10px] bg-red-500/20 text-red-300 border-red-500/30">{t("booking.required")}</Badge>}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.passport_number")} {isDocRequired ? "*" : ""}</Label>
                <Input
                  {...register(`passengers.${index}.passportNumber`)}
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50"
                  placeholder="AB1234567"
                  data-testid={`input-passport-${index}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.passport_expiry")} {isDocRequired ? "*" : ""}</Label>
                <Input
                  {...register(`passengers.${index}.passportExpiryDate`)}
                  type="date"
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50"
                  data-testid={`input-passport-expiry-${index}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.nationality")}</Label>
                <Select onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.nationality`, value: val } };
                  register(`passengers.${index}.nationality`).onChange(event);
                }}>
                  <SelectTrigger className="bg-white/5 border-white/15 text-white" data-testid={`select-nationality-${index}`}>
                    <SelectValue placeholder={t("booking.select_country")} />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(220,18%,10%)] border-white/10 text-white max-h-60">
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.issuing_country")}</Label>
                <Select onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.passportIssuingCountry`, value: val } };
                  register(`passengers.${index}.passportIssuingCountry`).onChange(event);
                }}>
                  <SelectTrigger className="bg-white/5 border-white/15 text-white" data-testid={`select-issuing-country-${index}`}>
                    <SelectValue placeholder={t("booking.select_country")} />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(220,18%,10%)] border-white/10 text-white max-h-60">
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-center min-w-[60px]">
            <div className="text-base font-bold text-white">{format(parseISO(segment.departureTime), "HH:mm")}</div>
            <div className="text-[10px] text-white/50 font-medium uppercase">{segment.originCode}</div>
            {segment.originTerminal && <div className="text-[10px] text-white/30">T{segment.originTerminal}</div>}
          </div>
          <div className="flex flex-col items-center px-2 flex-1 max-w-[120px]">
            <div className="text-[10px] text-white/50 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />{dur}
            </div>
            <div className="w-full h-[1px] bg-white/10 my-1 relative">
              <Plane className="h-3 w-3 text-amber-400 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-[10px] text-white/40">{segment.flightNumber}</div>
          </div>
          <div className="text-center min-w-[60px]">
            <div className="text-base font-bold text-white">{format(parseISO(segment.arrivalTime), "HH:mm")}</div>
            <div className="text-[10px] text-white/50 font-medium uppercase">{segment.destinationCode}</div>
            {segment.destinationTerminal && <div className="text-[10px] text-white/30">T{segment.destinationTerminal}</div>}
          </div>
        </div>
        {segment.aircraftType && (
          <div className="text-[10px] text-white/30 mt-1 text-center">{segment.carrierName} - {segment.aircraftType}</div>
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
        givenName: i === 0 ? (user?.firstName || "") : "",
        familyName: i === 0 ? (user?.lastName || "") : "",
        bornOn: "",
        gender: "" as any,
        email: i === 0 ? (user?.email || "") : "",
        phoneNumber: "",
        passportNumber: "",
        passportExpiryDate: "",
        passportIssuingCountry: "",
        nationality: "",
        type: "adult",
      });
    }
    for (let i = 0; i < numChildren; i++) {
      pax.push({ givenName: "", familyName: "", bornOn: "", gender: "" as any, email: "", phoneNumber: "", passportNumber: "", passportExpiryDate: "", passportIssuingCountry: "", nationality: "", type: "child" });
    }
    for (let i = 0; i < numInfants; i++) {
      pax.push({ givenName: "", familyName: "", bornOn: "", gender: "" as any, email: "", phoneNumber: "", passportNumber: "", passportExpiryDate: "", passportIssuingCountry: "", nationality: "", type: "infant_without_seat" });
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

  const onSubmit = (data: BookingFormValues) => {
    if (!flight) return;

    const passengerDetails = data.passengers.map((p, i) => ({
      ...p,
      passengerId: flight.passengers?.[i]?.passengerId || `pax_${i}`,
    }));

    const bookingData = {
      contactEmail: data.contactEmail,
      totalPrice: flight.price.toString(),
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
      },
      passengerDetails,
    };

    createBooking.mutate(bookingData as any, {
      onSuccess: (response: any) => {
        toast({ title: t("booking.initiated"), description: t("booking.redirect") });
        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
        } else {
          setLocation("/");
        }
      },
      onError: () => {
        toast({ title: t("booking.failed"), description: t("booking.failed_desc"), variant: "destructive" });
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
        <div className="text-white/50">{t("booking.loading")}</div>
      </div>
    );
  }

  const firstPaxBaggage = flight?.passengers?.[0]?.baggages || [];
  const cabinClassName = flight?.passengers?.[0]?.cabinClassName || flight?.cabinClass || "Economy";
  const fareBrand = flight?.passengers?.[0]?.fareBrandName;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white mb-2 drop-shadow-md" data-testid="text-booking-title">{t("booking.title")}</h1>
          <p className="text-white/50">{t("booking.subtitle")}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md rounded-2xl">
                <CardHeader className="border-b border-white/10 gap-2">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <User className="h-5 w-5 text-amber-400" />
                    {t("booking.contact_info")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.contact_email")} *</Label>
                      <Input
                        {...form.register("contactEmail")}
                        type="email"
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50"
                        placeholder="contact@email.com"
                        data-testid="input-contact-email"
                      />
                      {form.formState.errors.contactEmail && (
                        <p className="text-xs text-red-400">{form.formState.errors.contactEmail.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("booking.contact_phone")} *</Label>
                      <Input
                        {...form.register("contactPhone")}
                        type="tel"
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50"
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

              <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md rounded-2xl">
                <CardHeader className="border-b border-white/10 gap-2">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    {t("booking.passenger_details")}
                    <Badge className="ml-auto text-xs bg-white/10 text-white/60 border-white/10">{totalPassengers} {totalPassengers > 1 ? t("booking.passengers_label") : t("booking.passenger")}</Badge>
                  </CardTitle>
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

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/30 transition-all border-0 text-white rounded-xl" 
                disabled={createBooking.isPending || !flight}
                data-testid="button-pay"
              >
                {createBooking.isPending ? t("booking.processing") : `${t("booking.pay")} ${flight ? new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price) : '...'}`}
              </Button>
            </form>
          </div>

          <div className="space-y-6">
            <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md rounded-2xl">
              <CardHeader className="border-b border-white/10 gap-2">
                <CardTitle className="text-lg text-white">{t("booking.flight_summary")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {flight ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center overflow-hidden p-2 border border-white/15 shadow-inner">
                      {flight.logoUrl ? <img src={flight.logoUrl} className="w-full h-full object-contain" alt={flight.airline} /> : <Plane className="h-5 w-5 text-white/50" />}
                    </div>
                    <div>
                      <div className="font-bold text-white" data-testid="text-airline">{flight.airline}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-200 border border-amber-500/20 text-xs">
                          {flight.flightNumber}
                        </Badge>
                        {cabinClassName && (
                          <Badge variant="secondary" className="bg-teal-500/10 text-teal-200 border border-teal-500/20 text-xs">
                            {cabinClassName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {fareBrand && (
                    <div className="text-xs text-white/40 px-1">{t("booking.fare_brand")}: <span className="text-white/60 font-medium">{fareBrand}</span></div>
                  )}

                  {flight.slices && flight.slices.length > 0 ? (
                    flight.slices.map((slice, si) => (
                      <div key={si} className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-[10px] bg-white/10 text-white/50 border-white/10">
                            {si === 0 ? t("booking.outbound") : t("booking.return_flight")}
                          </Badge>
                          <span className="text-xs text-white/40">
                            {slice.originCode} <ArrowRight className="h-3 w-3 inline" /> {slice.destinationCode}
                          </span>
                        </div>
                        {slice.segments.map((seg, segi) => (
                          <SegmentDetail key={segi} segment={seg} t={t} />
                        ))}
                        {slice.segments.length > 1 && (
                          <div className="text-[10px] text-amber-300 text-center pt-1">
                            {slice.segments.length - 1} {t("booking.connection")}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{format(parseISO(flight.departureTime), "HH:mm")}</div>
                          <div className="text-xs text-white/50 font-medium uppercase">{flight.originCode || "DEP"}</div>
                          {flight.originCity && <div className="text-[10px] text-white/40">{flight.originCity}</div>}
                        </div>
                        <div className="flex flex-col items-center px-3">
                          <div className="text-xs text-white/50 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {flight.duration.startsWith("P") ? formatDuration(flight.duration) : flight.duration}
                          </div>
                          <ArrowRight className="h-4 w-4 text-amber-400 my-1" />
                          <div className={`text-xs font-bold ${flight.stops === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                            {stopsLabel}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{format(parseISO(flight.arrivalTime), "HH:mm")}</div>
                          <div className="text-xs text-white/50 font-medium uppercase">{flight.destinationCode || "ARR"}</div>
                          {flight.destinationCity && <div className="text-[10px] text-white/40">{flight.destinationCity}</div>}
                        </div>
                      </div>
                      <div className="text-xs text-white/40 text-center">
                        {format(parseISO(flight.departureTime), "EEEE, MMMM d, yyyy")}
                      </div>
                    </div>
                  )}

                  {firstPaxBaggage.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                        <Luggage className="h-3.5 w-3.5 text-amber-400" /> {t("booking.baggage_included")}
                      </h4>
                      {firstPaxBaggage.map((bag: any, bi: number) => (
                        <div key={bi} className="flex items-center gap-2 text-sm text-white/60">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {bag.quantity}x {bag.type === "checked" ? t("booking.checked_bag") : bag.type === "carry_on" ? t("booking.carry_on") : bag.type}
                        </div>
                      ))}
                    </div>
                  )}

                  {flight.conditions && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 text-amber-400" /> {t("booking.fare_conditions")}
                      </h4>
                      {flight.conditions.changeBeforeDeparture && (
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          {flight.conditions.changeBeforeDeparture.allowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <XIcon className="h-3.5 w-3.5 text-red-400" />
                          )}
                          {t("booking.change_allowed")}: {flight.conditions.changeBeforeDeparture.allowed ? t("booking.yes") : t("booking.no")}
                          {flight.conditions.changeBeforeDeparture.penaltyAmount && (
                            <span className="text-amber-300 ml-1">({flight.conditions.changeBeforeDeparture.penaltyCurrency} {flight.conditions.changeBeforeDeparture.penaltyAmount})</span>
                          )}
                        </div>
                      )}
                      {flight.conditions.refundBeforeDeparture && (
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          {flight.conditions.refundBeforeDeparture.allowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <XIcon className="h-3.5 w-3.5 text-red-400" />
                          )}
                          {t("booking.refund_allowed")}: {flight.conditions.refundBeforeDeparture.allowed ? t("booking.yes") : t("booking.no")}
                          {flight.conditions.refundBeforeDeparture.penaltyAmount && (
                            <span className="text-amber-300 ml-1">({flight.conditions.refundBeforeDeparture.penaltyCurrency} {flight.conditions.refundBeforeDeparture.penaltyAmount})</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Separator className="bg-white/10" />
                  
                  <div className="space-y-2">
                    {flight.baseAmount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">{t("booking.base_fare")}</span>
                        <span className="font-medium text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(parseFloat(flight.baseAmount))}</span>
                      </div>
                    )}
                    {flight.taxAmount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">{t("booking.taxes")}</span>
                        <span className="font-medium text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(parseFloat(flight.taxAmount))}</span>
                      </div>
                    )}
                    {!flight.baseAmount && !flight.taxAmount && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/50">{t("booking.base_fare")}</span>
                          <span className="font-medium text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.9)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/50">{t("booking.taxes")}</span>
                          <span className="font-medium text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.1)}</span>
                        </div>
                      </>
                    )}
                    {totalPassengers > 1 && (
                      <div className="flex justify-between text-xs text-white/40">
                        <span>{t("booking.per_passenger")}</span>
                        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price / totalPassengers)}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="bg-white/10" />
                  
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-white">{t("booking.total")}</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400" data-testid="text-total-price">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price)}
                    </span>
                  </div>
                </>
                ) : (
                  <div className="text-center py-4 text-white/40">{t("booking.loading")}</div>
                )}
              </CardContent>
            </Card>

            <div className="bg-emerald-500/10 p-4 rounded-xl flex gap-3 text-emerald-300 text-sm border border-emerald-500/20">
              <Shield className="h-5 w-5 shrink-0 text-emerald-400" />
              <p>{t("booking.secure_payment")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
