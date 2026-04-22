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
import { CheckCircle2, Plane, Clock, ArrowRight, Shield, Luggage, User, ChevronDown, ChevronUp, RefreshCw, X as XIcon, Briefcase, ScanLine, CreditCard, Lock, ArrowLeft, AlertTriangle, Loader2, HeartHandshake, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { ScanDocumentDialog } from "@/components/ScanDocumentDialog";
import BaggageSelector from "@/components/BaggageSelector";
import PaymentForm from "@/components/PaymentForm";
import SeniorNameCoachDialog, {
  type SeniorNameCoachMode,
  type SeniorNameCoachReason,
} from "@/components/SeniorNameCoachDialog";
import type { FlightOffer } from "@shared/schema";
import {
  AGENCY_WHATSAPP_DISPLAY,
  buildWhatsAppHref,
  buildWhatsAppMessage,
} from "@/lib/contact";
import {
  CHATBOT_PREFILL_BOOKING_EVENT,
  openChatbotAssistant,
  type ChatbotBookingPrefillPayload,
} from "@/lib/chatbot";
import { useVoiceGuide } from "@/hooks/use-voice-guide";
import { Switch } from "@/components/ui/switch";
import { Headphones } from "lucide-react";
import { SeniorIntegrityManager } from "@/lib/senior-integrity";
import { cn } from "@/lib/utils";

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

function createBookingSchema(isDocRequired: boolean, t: any) {
  const baseSchema = z.object({
    passengers: z.array(passengerSchema).min(1),
    contactEmail: z.string().email(t("booking.invalid_email") || "Invalid email"),
    contactPhone: z.string().min(7, t("booking.min_digits", { count: 7 }) || "Min 7 digits").max(20),
    audioGuideConfirmed: z.boolean().refine(v => v === true, {
      message: t("booking.audio_guide_confirm")
    }),
    termsAccepted: z.boolean().refine(v => v === true, {
      message: t("booking.terms_accept")
    }),
  });

  if (!isDocRequired) return baseSchema;

  return baseSchema.superRefine((data, ctx) => {
    data.passengers.forEach((pax, i) => {
      if (!pax.documentNumber || pax.documentNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("booking.doc_number_required") || "Document number is required",
          path: ["passengers", i, "documentNumber"],
        });
      }
      if (!pax.documentExpiryDate || pax.documentExpiryDate.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("booking.doc_expiry_required") || "Document expiry date is required",
          path: ["passengers", i, "documentExpiryDate"],
        });
      }
      if (!pax.documentIssuingCountry || pax.documentIssuingCountry.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("booking.issuing_country_required") || "Issuing country is required",
          path: ["passengers", i, "documentIssuingCountry"],
        });
      }
      if (!pax.nationality || pax.nationality.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("booking.nationality_required") || "Nationality is required",
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
  audioGuideConfirmed?: boolean;
  termsAccepted: boolean;
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

type NameCoachField = "givenName" | "familyName";

type NameReview = {
  suggestedValue: string;
  reason: SeniorNameCoachReason;
};

type NameCoachDialogState =
  | {
      mode: "suggest";
      field: NameCoachField;
      fieldLabel: string;
      typedValue: string;
      suggestedValue: string;
      reason: SeniorNameCoachReason;
      fullName: string;
    }
  | {
      mode: "confirm";
      fullName: string;
    };

function toReadableNameToken(value: string) {
  return value
    .split(/([-'’])/)
    .map((part) => {
      if (part === "-" || part === "'" || part === "’") return part;
      if (!part) return part;
      return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
    })
    .join("");
}

function buildNameReview(value: string): NameReview | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const collapsedSpaces = trimmed.replace(/\s+/g, " ");
  const cleaned = collapsedSpaces.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'’ -]/g, "");
  if (!cleaned.trim()) return null;

  const suggestedValue = cleaned
    .split(" ")
    .filter(Boolean)
    .map(toReadableNameToken)
    .join(" ");

  if (!suggestedValue || suggestedValue === value) return null;

  let reason: SeniorNameCoachReason = "case";
  if (cleaned !== collapsedSpaces) {
    reason = "characters";
  } else if (collapsedSpaces !== value || trimmed !== value) {
    reason = "spacing";
  }

  return { suggestedValue, reason };
}

function PassengerForm({ index, control, register, errors, passengerType, isDocRequired, t, setValue, getValues, isEasyMode, language }: any) {
  const [expanded, setExpanded] = useState(index === 0);
  const [scanOpen, setScanOpen] = useState(false);
  const [nameCoachDialog, setNameCoachDialog] = useState<NameCoachDialogState | null>(null);
  const [nameCoachFeedback, setNameCoachFeedback] = useState<string | null>(null);
  const promptedNameValuesRef = useRef<Partial<Record<NameCoachField, string>>>({});
  const promptedFullNameRef = useRef<string | null>(null);
  const confirmedFullNameRef = useRef<string | null>(null);
  const paxErrors = errors?.passengers?.[index];
  const typeLabel = passengerType === "child" ? t("booking.child") : passengerType === "infant_without_seat" ? t("booking.infant") : t("booking.adult");
  const coachCopy = {
    title: t("booking.name_coach.title"),
    intro: t("booking.name_coach.intro"),
    pending: t("booking.name_coach.pending"),
    corrected: t("booking.name_coach.corrected"),
    review: t("booking.name_coach.review"),
    confirmed: t("booking.name_coach.confirmed"),
  };
  const fieldLabels: Record<NameCoachField, string> = {
    givenName: t("booking.given_name"),
    familyName: t("booking.family_name"),
  };
  const declaredDocType = getValues(`passengers.${index}.documentType`);

  const getPassengerNameValues = () => {
    const givenName = String(getValues(`passengers.${index}.givenName`) || "").trim();
    const familyName = String(getValues(`passengers.${index}.familyName`) || "").trim();
    return { givenName, familyName, fullName: `${givenName} ${familyName}`.trim() };
  };

  const focusNameField = (field: NameCoachField) => {
    window.setTimeout(() => {
      const target = document.querySelector<HTMLInputElement>(
        field === "givenName"
          ? `[data-testid="input-given-name-${index}"]`
          : `[data-testid="input-family-name-${index}"]`,
      );
      target?.focus();
      target?.select();
    }, 40);
  };

  const maybeOpenNameCoach = (field: NameCoachField, rawValue: string) => {
    if (!isEasyMode) return;

    const review = buildNameReview(rawValue);
    if (review) {
      if (promptedNameValuesRef.current[field] === rawValue) return;

      promptedNameValuesRef.current[field] = rawValue;
      const currentValues = getPassengerNameValues();
      const nextFullName = field === "givenName"
        ? `${review.suggestedValue} ${currentValues.familyName}`.trim()
        : `${currentValues.givenName} ${review.suggestedValue}`.trim();

      setNameCoachFeedback(coachCopy.pending);
      setNameCoachDialog({
        mode: "suggest",
        field,
        fieldLabel: fieldLabels[field],
        typedValue: rawValue,
        suggestedValue: review.suggestedValue,
        reason: review.reason,
        fullName: nextFullName,
      });
      return;
    }

    if (field !== "familyName") return;

    const currentValues = getPassengerNameValues();
    if (!currentValues.givenName || !currentValues.familyName) return;
    if (buildNameReview(currentValues.givenName) || buildNameReview(currentValues.familyName)) return;
    if (confirmedFullNameRef.current === currentValues.fullName || promptedFullNameRef.current === currentValues.fullName) return;

    promptedFullNameRef.current = currentValues.fullName;
    setNameCoachFeedback(coachCopy.pending);
    setNameCoachDialog({
      mode: "confirm",
      fullName: currentValues.fullName,
    });
  };

  const givenNameField = register(`passengers.${index}.givenName`);
  const familyNameField = register(`passengers.${index}.familyName`);

  const handleNameCoachPrimary = () => {
    if (!nameCoachDialog) return;

    if (nameCoachDialog.mode === "suggest") {
      setValue(`passengers.${index}.${nameCoachDialog.field}`, nameCoachDialog.suggestedValue, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setNameCoachFeedback(coachCopy.corrected);
      setNameCoachDialog(null);
      focusNameField(nameCoachDialog.field);
      return;
    }

    confirmedFullNameRef.current = nameCoachDialog.fullName;
    setNameCoachFeedback(coachCopy.confirmed);
    setNameCoachDialog(null);
  };

  const handleNameCoachSecondary = () => {
    if (!nameCoachDialog) return;

    if (nameCoachDialog.mode === "suggest") {
      setNameCoachFeedback(coachCopy.review);
      const { field } = nameCoachDialog;
      setNameCoachDialog(null);
      focusNameField(field);
      return;
    }

    setNameCoachFeedback(coachCopy.review);
    setNameCoachDialog(null);
    focusNameField("givenName");
  };

  const handleScanConfirm = (data: any) => {
    const applyScannedValue = (field: string, value: string) => {
      setValue(field, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    };

    if (data.givenName) applyScannedValue(`passengers.${index}.givenName`, data.givenName);
    if (data.familyName) applyScannedValue(`passengers.${index}.familyName`, data.familyName);
    if (data.bornOn) applyScannedValue(`passengers.${index}.bornOn`, data.bornOn);
    if (data.gender) applyScannedValue(`passengers.${index}.gender`, data.gender);
    if (data.passportNumber) applyScannedValue(`passengers.${index}.documentNumber`, data.passportNumber);
    if (data.passportExpiryDate) applyScannedValue(`passengers.${index}.documentExpiryDate`, data.passportExpiryDate);
    if (data.nationality) applyScannedValue(`passengers.${index}.nationality`, data.nationality);
    if (data.passportIssuingCountry) applyScannedValue(`passengers.${index}.documentIssuingCountry`, data.passportIssuingCountry);
    if (data.documentType) {
      applyScannedValue(`passengers.${index}.documentType`, data.documentType);
    } else {
      applyScannedValue(`passengers.${index}.documentType`, "passport");
    }
  };

  return (
    <div className="group/pax relative overflow-hidden rounded-[24px] border border-white/5 bg-slate-950/40 backdrop-blur-md transition-all hover:border-white/10">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors"
        data-testid={`button-toggle-passenger-${index}`}
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover/pax:bg-blue-500 group-hover/pax:text-slate-950 transition-all font-black text-sm">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <span className="text-white font-black text-sm uppercase tracking-wider">{t("booking.passenger")} {index + 1}</span>
               <Badge className="text-[9px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 border-white/5">{typeLabel}</Badge>
            </div>
            {expanded === false && (
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{t("booking.pax_fill_details") || "Click to fill details"}</p>
            )}
          </div>
        </div>
        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white/5 text-slate-500 group-hover/pax:text-white transition-all">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-7 space-y-6 border-t border-white/5 pt-6">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-2 rounded-xl border-blue-500/30 text-blue-400 bg-blue-500/5 hover:bg-blue-500 hover:text-white transition-all font-bold text-xs"
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
            declaredDocumentType={declaredDocType}
          />

          {isEasyMode && (
            <div className="relative overflow-hidden rounded-[24px] border border-blue-500/20 bg-blue-500/5 p-4 backdrop-blur-sm shadow-xl">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{coachCopy.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400 font-medium">{coachCopy.intro}</p>
                  </div>
                  {nameCoachFeedback && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold leading-relaxed text-emerald-300">
                      {nameCoachFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 md:grid-cols-5 gap-5">
            <div className="space-y-2 col-span-1">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.passenger_title")} *</Label>
              <Select
                defaultValue="mr"
                onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.title`, value: val } };
                  register(`passengers.${index}.title`).onChange(event);
                }}
              >
                <SelectTrigger className="h-12 bg-slate-950/40 border-white/10 text-white rounded-xl focus:border-blue-500/50" data-testid={`select-title-${index}`}>
                  <SelectValue placeholder={t("booking.passenger_title")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="mr">{t("booking.title_mr")}</SelectItem>
                  <SelectItem value="mrs">{t("booking.title_mrs")}</SelectItem>
                  <SelectItem value="ms">{t("booking.title_ms")}</SelectItem>
                  <SelectItem value="miss">{t("booking.title_miss")}</SelectItem>
                  <SelectItem value="dr">{t("booking.title_dr")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.given_name")} *</Label>
              <Input
                {...givenNameField}
                onBlur={(event) => {
                  givenNameField.onBlur(event);
                  maybeOpenNameCoach("givenName", event.target.value);
                }}
                className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 rounded-xl px-4 transition-all"
                placeholder="e.g. John"
                data-testid={`input-given-name-${index}`}
              />
              {paxErrors?.givenName && <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wide ml-1">{paxErrors.givenName.message}</p>}
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.family_name")} *</Label>
              <Input
                {...familyNameField}
                onBlur={(event) => {
                  familyNameField.onBlur(event);
                  maybeOpenNameCoach("familyName", event.target.value);
                }}
                className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 rounded-xl px-4 transition-all"
                placeholder="e.g. Smith"
                data-testid={`input-family-name-${index}`}
              />
              {paxErrors?.familyName && <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wide ml-1">{paxErrors.familyName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.date_of_birth")} *</Label>
              <Input
                {...register(`passengers.${index}.bornOn`)}
                type="date"
                className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 rounded-xl px-4 transition-all [color-scheme:dark]"
                data-testid={`input-dob-${index}`}
              />
              {paxErrors?.bornOn && <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wide ml-1">{paxErrors.bornOn.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.gender")} *</Label>
              <Select
                onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.gender`, value: val } };
                  register(`passengers.${index}.gender`).onChange(event);
                }}
              >
                <SelectTrigger className="h-12 bg-slate-950/40 border-white/10 text-white rounded-xl focus:border-blue-500/50" data-testid={`select-gender-${index}`}>
                  <SelectValue placeholder={t("booking.select_gender")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="m">{t("booking.male")}</SelectItem>
                  <SelectItem value="f">{t("booking.female")}</SelectItem>
                </SelectContent>
              </Select>
              {paxErrors?.gender && <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wide ml-1">{paxErrors.gender.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.email")} *</Label>
              <Input
                {...register(`passengers.${index}.email`)}
                type="email"
                className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 rounded-xl px-4 transition-all"
                placeholder="passenger@email.com"
                data-testid={`input-email-${index}`}
              />
              {paxErrors?.email && <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wide ml-1">{paxErrors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.phone")} *</Label>
              <Input
                {...register(`passengers.${index}.phoneNumber`)}
                type="tel"
                className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 rounded-xl px-4 transition-all"
                placeholder="+1 234 567 8900"
                data-testid={`input-phone-${index}`}
              />
              {paxErrors?.phoneNumber && <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wide ml-1">{paxErrors.phoneNumber.message}</p>}
            </div>
          </div>

          <div className="rounded-[22px] bg-slate-950/40 border border-white/5 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
               <div className="flex items-center gap-3">
                 <Briefcase className="h-4 w-4 text-blue-400" />
                 <h4 className="text-sm font-black text-white uppercase tracking-wider">{t("booking.travel_document")}</h4>
               </div>
               {isDocRequired && <Badge className="text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border-red-500/20">{t("booking.required")}</Badge>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.doc_type")} {isDocRequired ? "*" : ""}</Label>
                <Select
                  defaultValue="passport"
                  onValueChange={(val) => {
                    const event = { target: { name: `passengers.${index}.documentType`, value: val } };
                    register(`passengers.${index}.documentType`).onChange(event);
                  }}
                >
                  <SelectTrigger className="h-12 bg-slate-950/40 border-white/10 text-white rounded-xl focus:border-blue-500/50" data-testid={`select-doc-type-${index}`}>
                    <SelectValue placeholder={t("booking.select_doc_type")} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="passport">{t("booking.doc_passport")}</SelectItem>
                    <SelectItem value="national_id">{t("booking.doc_national_id")}</SelectItem>
                    <SelectItem value="drivers_license">{t("booking.doc_drivers_license")}</SelectItem>
                    <SelectItem value="travel_document">{t("booking.doc_travel_doc")}</SelectItem>
                    <SelectItem value="other">{t("booking.doc_other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.doc_number")} {isDocRequired ? "*" : ""}</Label>
                <Input
                  {...register(`passengers.${index}.documentNumber`)}
                  className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 rounded-xl px-4 transition-all"
                  placeholder="AB1234567"
                  data-testid={`input-doc-number-${index}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.doc_expiry")} {isDocRequired ? "*" : ""}</Label>
                <Input
                  {...register(`passengers.${index}.documentExpiryDate`)}
                  type="date"
                  className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 rounded-xl px-4 transition-all [color-scheme:dark]"
                  data-testid={`input-doc-expiry-${index}`}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.nationality")}</Label>
                <Select onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.nationality`, value: val } };
                  register(`passengers.${index}.nationality`).onChange(event);
                }}>
                  <SelectTrigger className="h-12 bg-slate-950/40 border-white/10 text-white rounded-xl focus:border-blue-500/50" data-testid={`select-nationality-${index}`}>
                    <SelectValue placeholder={t("booking.select_country")} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white max-h-60">
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.issuing_country")}</Label>
                <Select onValueChange={(val) => {
                  const event = { target: { name: `passengers.${index}.documentIssuingCountry`, value: val } };
                  register(`passengers.${index}.documentIssuingCountry`).onChange(event);
                }}>
                  <SelectTrigger className="h-12 bg-slate-950/40 border-white/10 text-white rounded-xl focus:border-blue-500/50" data-testid={`select-issuing-country-${index}`}>
                    <SelectValue placeholder={t("booking.select_country")} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white max-h-60">
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] bg-slate-950/40 border border-white/5 p-5 space-y-5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
               <Briefcase className="h-4 w-4 text-blue-400" />
               <h4 className="text-sm font-black text-white uppercase tracking-wider">
                 {t("booking.loyalty_program") || "Frequente Flyer"}
                 <span className="text-[10px] text-slate-500 font-bold ml-2">({t("booking.optional") || "opcional"})</span>
               </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.loyalty_airline") || "Programa da Cia"}</Label>
                <Input
                  {...register(`passengers.${index}.loyaltyProgram`)}
                  className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 rounded-xl px-4 transition-all"
                  placeholder="e.g. LATAM Pass, AAdvantage"
                  data-testid={`input-loyalty-program-${index}`}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-[10px] font-black uppercase tracking-wider ml-1">{t("booking.loyalty_number") || "Número de Membro"}</Label>
                <Input
                  {...register(`passengers.${index}.loyaltyNumber`)}
                  className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50 rounded-xl px-4 transition-all"
                  placeholder="e.g. 123456789"
                  data-testid={`input-loyalty-number-${index}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isEasyMode && nameCoachDialog && (
        <SeniorNameCoachDialog
          open={!!nameCoachDialog}
          onOpenChange={(open) => {
            if (!open) {
              setNameCoachDialog(null);
            }
          }}
          mode={nameCoachDialog.mode as SeniorNameCoachMode}
          fieldLabel={nameCoachDialog.mode === "suggest" ? nameCoachDialog.fieldLabel : undefined}
          typedValue={nameCoachDialog.mode === "suggest" ? nameCoachDialog.typedValue : undefined}
          suggestedValue={nameCoachDialog.mode === "suggest" ? nameCoachDialog.suggestedValue : undefined}
          reason={nameCoachDialog.mode === "suggest" ? nameCoachDialog.reason : undefined}
          fullName={nameCoachDialog.fullName}
          onPrimary={handleNameCoachPrimary}
          onSecondary={handleNameCoachSecondary}
        />
      )}
    </div>
  );
}

function BookingProcessingOverlay({ step, error, onRetry, onCancel, t }: {
  step: "validating" | "creating" | "preparing" | "done" | "error";
  error?: string;
  onRetry: () => void;
  onCancel: () => void;
  t: (k: string) => string;
}) {
  const steps = [
    { id: "validating", icon: RefreshCw, label: t("booking.processing_validating") || "Validating flight availability..." },
    { id: "creating", icon: CreditCard, label: t("booking.processing_creating") || "Creating your booking..." },
    { id: "preparing", icon: Lock, label: t("booking.processing_preparing") || "Preparing secure payment..." },
  ];

  const stepOrder = ["validating", "creating", "preparing", "done"];
  const currentIdx = stepOrder.indexOf(step);

  if (step === "error") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-900 p-8 shadow-2xl">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-red-500/10 blur-[80px]" />
            <div className="relative flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 rounded-[28px] bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="h-10 w-10 text-red-400" />
              </div>
<div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight" data-testid="text-booking-processing-error">
                  {t("booking.processing_error_title") || "Ocorreu um erro"}
                </h3>
                <p className="text-slate-400 font-medium leading-relaxed">
                  {error || t("booking.processing_error_desc") || "Não conseguimos processar sua reserva agora. Nada foi cobrado do seu cartão."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                <Button variant="outline" onClick={onCancel} className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold" data-testid="button-processing-cancel">
                  {t("booking.processing_cancel") || "Voltar"}
                </Button>
                <Button onClick={onRetry} className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold" data-testid="button-processing-retry">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("booking.processing_retry") || "Tentar Novamente"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-900 p-8 shadow-2xl">
           <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
           <div className="relative flex flex-col items-center text-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="h-20 w-20 rounded-[28px] bg-blue-500/10 flex items-center justify-center border border-blue-500/20"
            >
              <Plane className="h-10 w-10 text-blue-400" />
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight" data-testid="text-booking-processing">
                {t("booking.processing_title") || "Processando Reserva"}
              </h3>
              <p className="text-slate-400 font-medium tracking-tight">
                {t("booking.processing_wait") || "Por favor, aguarde um momento..."}
              </p>
            </div>

            <div className="w-full space-y-3 pt-4">
              {steps.map((s, idx) => {
                const isActive = s.id === step;
                const isDone = stepOrder.indexOf(s.id) < currentIdx;
                const StepIcon = s.icon;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: isDone || isActive ? 1 : 0.3 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      isActive ? "bg-blue-500/10 border border-blue-500/30" :
                      isDone ? "bg-emerald-500/10 border border-emerald-500/30" :
                      "bg-slate-950/20 border border-white/5"
                    }`}
                    data-testid={`step-${s.id}`}
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isDone ? "bg-emerald-500/20 text-emerald-400" : isActive ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"
                    }`}>
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${
                      isDone ? "text-emerald-400" : isActive ? "text-blue-400" : "text-slate-600"
                    }`}>{s.label}</span>
                  </motion.div>
                );
              })}
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(((currentIdx + 1) / steps.length) * 100, 100)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FlightLoadingSkeleton({ t }: { t: (k: string) => string }) {
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden" data-testid="loading-flight-skeleton">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.2)_0%,rgba(2,6,23,1)_70%)]" />
      <div className="relative z-10 w-full bg-white/5 backdrop-blur-md border-b border-white/10 py-10 mb-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="h-10 w-64 bg-white/10 rounded-2xl animate-pulse mb-3" />
          <div className="h-4 w-96 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[400px] w-full bg-white/5 rounded-[32px] border border-white/10 animate-pulse p-8 space-y-6">
                <div className="h-12 w-48 bg-white/10 rounded-2xl" />
                <div className="space-y-4 pt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 w-full bg-white/5 rounded-2xl" />
                  ))}
                </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-[300px] w-full bg-white/5 rounded-[32px] border border-white/10 animate-pulse p-6 space-y-4">
                <div className="h-8 w-32 bg-white/10 rounded-xl" />
                <div className="h-24 w-full bg-white/5 rounded-2xl" />
                <div className="space-y-2 pt-2">
                   <div className="h-4 w-full bg-white/5 rounded-lg" />
                   <div className="h-4 w-2/3 bg-white/5 rounded-lg" />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlightLoadError({ error, onRetry, onBack, t }: {
  error: string;
  onRetry: () => void;
  onBack: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden" data-testid="error-flight-load">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1)_0%,rgba(2,6,23,1)_80%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-900 p-10 shadow-2xl text-center space-y-8">
           <div className="h-24 w-24 rounded-[32px] bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto">
             <AlertTriangle className="h-12 w-12 text-red-500" />
           </div>
           <div className="space-y-3">
             <h1 className="text-2xl font-black text-white tracking-tight" data-testid="text-flight-load-error">
                {t("booking.flight_unavailable_title") || "Voo Indisponível"}
             </h1>
             <p className="text-slate-400 font-medium leading-relaxed">
                {error || t("booking.flight_unavailable_desc") || "Infelizmente este voo não está mais disponível. Por favor, tente uma nova busca."}
             </p>
           </div>
           <div className="flex flex-col sm:flex-row gap-4 pt-4">
             <Button variant="outline" onClick={onBack} className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold" data-testid="button-flight-error-back">
               <ArrowLeft className="h-4 w-4 mr-2" />
               {t("booking.back_search") || "Nova Busca"}
             </Button>
             <Button onClick={onRetry} className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold" data-testid="button-flight-error-retry">
               <RefreshCw className="h-4 w-4 mr-2" />
               {t("booking.retry") || "Repetir"}
             </Button>
           </div>
        </div>
      </motion.div>
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
  const { t, language } = useI18n();
  const {
    speak,
    stop: stopPage,
    speaking: speakingPage,
    supported: isVoiceSupported,
  } = useVoiceGuide();
  const audioLang = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const contactAudio = t("booking.audio.contact");
  const paymentAudio = t("booking.audio.payment");
  
  const createBooking = useCreateBooking();

  const [flight, setFlight] = useState<FlightOffer | null>(null);
  const [flightLoading, setFlightLoading] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [baggageSelections, setBaggageSelections] = useState<any[]>([]);
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    bookingId: number;
    referenceCode: string;
    amount: number;
    currency: string;
  } | null>(null);

  const [processingStep, setProcessingStep] = useState<"validating" | "creating" | "preparing" | "done" | "error" | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const lastSubmitDataRef = useRef<BookingFormValues | null>(null);

  const isDocRequired = flight?.passengerIdentityDocumentsRequired ?? false;
  const searchParamsString = typeof window !== "undefined" ? window.location.search : "";
  const searchParams = useMemo(() => new URLSearchParams(searchParamsString), [searchParamsString]);
  const isEasyMode = searchParams.get("ui") === "easy";
  const numAdults = parseInt(searchParams.get("adults") || "1", 10);
  const numChildren = parseInt(searchParams.get("children") || "0", 10);
  const numInfants = parseInt(searchParams.get("infants") || "0", 10);
  const totalPassengers = numAdults + numChildren + numInfants;
  const easyModeCopy = {
    badge: t("booking.easy_mode.badge"),
    title: t("booking.easy_mode.title"),
    description: t("booking.easy_mode.description", { phone: AGENCY_WHATSAPP_DISPLAY }),
    call: t("booking.easy_mode.call", { phone: AGENCY_WHATSAPP_DISPLAY }),
    assistant: t("booking.easy_mode.assistant"),
    back: t("booking.easy_mode.back"),
  };
  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: (language || "pt") as any,
      topic: isEasyMode
        ? language === "en"
          ? "Senior booking"
          : language === "es"
            ? "Reserva senior"
            : "Reserva senior"
        : language === "en"
          ? "Booking help"
          : language === "es"
            ? "Ayuda con reserva"
            : "Ajuda com reserva",
      details: [
          flight?.originCode ? `${language === "en" ? "Origin" : language === "es" ? "Origen" : "Origem"}: ${flight.originCode}` : null,
          flight?.destinationCode ? `${language === "en" ? "Destination" : language === "es" ? "Destino" : "Destino"}: ${flight.destinationCode}` : null,
          flight?.departureTime ? `${language === "en" ? "Departure" : language === "es" ? "Salida" : "Ida"}: ${flight.departureTime}` : null,
          flight?.price ? `${language === "en" ? "Price" : language === "es" ? "Precio" : "Preco"}: ${flight.price} ${flight.currency}` : null,
        ].filter((x): x is string => x !== null),
    }),
  );
  const openAssistantRef = useRef<() => void>(() => {});

  const openAssistant = useCallback(() => {
    openAssistantRef.current();
  }, []);

  const integrityManager = useMemo(() => {
    if (!isEasyMode) return null;
    return new SeniorIntegrityManager({
      onWarning: (msg) => {
        toast({
          title: t("booking.helpful_note"),
          description: msg,
          variant: "default",
        });
      },
      onStuck: () => {
        const text = t("booking.stuck_help");
        speak(text);
        openAssistant();
      }
    });
  }, [isEasyMode, toast, speak, t, openAssistant]);

  // Actual logic for assistant runner
  useEffect(() => {
    openAssistantRef.current = () => {
      const tripSummary = [
        flight?.originCode ? `${flight.originCode}` : null,
        flight?.destinationCode ? `${flight.destinationCode}` : null,
        flight?.departureTime ? format(parseISO(flight.departureTime), "yyyy-MM-dd HH:mm") : null,
      ]
        .filter(Boolean)
        .join(" - ");

      const starter =
        language === "en"
          ? `Mia, help me review this booking calmly before payment: ${tripSummary}.`
          : language === "es"
            ? `Mia, ayúdeme a revisar esta reserva con calma antes del pago: ${tripSummary}.`
            : `Mia, me ajude a revisar esta reserva com calma antes do pagamento: ${tripSummary}.`;

      if (integrityManager) {
        integrityManager.setVoiceConfirmed(true);
      }
      openChatbotAssistant({ message: starter, autoSend: true });
    };
  }, [flight, language, integrityManager]);

  useEffect(() => {
    return () => {
      integrityManager?.destroy();
    };
  }, [integrityManager]);

  const buildDefaultPassengers = () => {
    const pax: any[] = [];
    for (let i = 0; i < numAdults; i++) {
      pax.push({
        title: "mr" as const,
        givenName: i === 0 ? ((user?.displayName || "").split(" ")[0] || "") : "",
        familyName: i === 0 ? ((user?.displayName || "").split(" ").slice(1).join(" ") || "") : "",
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

  const bookingSchema = createBookingSchema(isDocRequired, t);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      passengers: buildDefaultPassengers(),
      contactEmail: user?.email || "",
      contactPhone: "",
      audioGuideConfirmed: true,
      termsAccepted: false,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "passengers",
  });

  useEffect(() => {
    const handleChatbotPrefill = (event: Event) => {
      const payload = (event as CustomEvent<ChatbotBookingPrefillPayload>).detail;
      if (!payload) return;

      if (payload.contactEmail) {
        form.setValue("contactEmail", payload.contactEmail, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      if (payload.contactPhone) {
        form.setValue("contactPhone", payload.contactPhone, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      const passengersFilled = Math.min(payload.passengers?.length || 0, fields.length);
      for (let index = 0; index < passengersFilled; index += 1) {
        const passenger = payload.passengers[index];
        const updates = {
          title: passenger.title,
          givenName: passenger.givenName,
          familyName: passenger.familyName,
          bornOn: passenger.bornOn,
          gender: passenger.gender,
          email: passenger.email,
          phoneNumber: passenger.phoneNumber,
          documentType: passenger.documentType,
          documentNumber: passenger.documentNumber,
          documentExpiryDate: passenger.documentExpiryDate,
          documentIssuingCountry: passenger.documentIssuingCountry,
          nationality: passenger.nationality,
        } satisfies Record<string, string | undefined>;

        for (const [field, value] of Object.entries(updates)) {
          if (!value) continue;
          form.setValue(`passengers.${index}.${field}` as any, value as any, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }
      }

      toast({
        title: t("booking.passenger_details") || "Passenger details",
        description:
          passengersFilled > 0
            ? language === "en"
              ? `Mia filled ${passengersFilled} passenger field${passengersFilled === 1 ? "" : "s"}. Please review the details before payment.`
              : language === "es"
                ? `Mia completó ${passengersFilled} pasajero${passengersFilled === 1 ? "" : "s"}. Revise los datos antes del pago.`
                : `Mia preencheu ${passengersFilled} passageiro${passengersFilled === 1 ? "" : "s"}. Revise os dados antes do pagamento.`
            : language === "en"
              ? "Mia updated the contact details. Please review everything before payment."
              : language === "es"
                ? "Mia actualizó los datos de contacto. Revise todo antes del pago."
                : "Mia atualizou os dados de contato. Revise tudo antes do pagamento.",
      });
    };

    window.addEventListener(CHATBOT_PREFILL_BOOKING_EVENT, handleChatbotPrefill as EventListener);
    return () => {
      window.removeEventListener(CHATBOT_PREFILL_BOOKING_EVENT, handleChatbotPrefill as EventListener);
    };
  }, [fields.length, form, language, t, toast]);

  const baggageExtras = baggageSelections.reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 0), 0);
  const grandTotal = (flight?.price || 0) + baggageExtras;

  const validateFlightPrice = useCallback(async (flightId: string, currentFlight: FlightOffer) => {
    try {
      const refreshRes = await fetch(`/api/flights/${flightId}/refresh`);
      const refreshData = await refreshRes.json();
      
      if (!refreshData.valid) {
        setFlightError(t("booking.offer_expired_desc") || "This flight offer has expired. Please search again.");
        toast({
          title: t("booking.offer_expired") || "Offer Expired",
          description: t("booking.offer_expired_desc") || "This flight offer has expired. Please search again.",
          variant: "destructive",
        });
        const qs = searchParams.toString();
        setLocation(qs ? `/search?${qs}` : "/search");
        return;
      }

      if (refreshData.price && Math.abs(refreshData.price - currentFlight.price) > 0.01) {
        setFlight({ ...currentFlight, price: refreshData.price, currency: refreshData.currency || currentFlight.currency });
        toast({
          title: t("booking.price_updated"),
          description: t("booking.price_updated_desc"),
          variant: "default",
        });
      }
    } catch (err) {
      console.warn("Could not validate price on load:", err);
    }
  }, [t, toast, searchParams, setLocation]);

  const fetchFlight = useCallback(async (flightId: string) => {
    setFlightLoading(true);
    setFlightError(null);
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`/api/flights/${flightId}`);
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setFlight(data);
        setFlightLoading(false);
        
        validateFlightPrice(flightId, data);
        return;
      } catch (err: any) {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        } else {
          const origin = searchParams.get("origin");
          const destination = searchParams.get("destination");
          const date = searchParams.get("date");
          const tripType = searchParams.get("tripType") || "one-way";
          const returnDate = searchParams.get("returnDate");
          const adults = searchParams.get("adults") || "1";
          const children = searchParams.get("children") || "0";
          const infants = searchParams.get("infants") || "0";
          const cabinClass = searchParams.get("cabinClass") || "economy";

          if (origin && destination && date) {
            try {
              const qs = new URLSearchParams({
                origin,
                destination,
                date,
                tripType,
                adults,
                children,
                infants,
                passengers: (
                  (parseInt(adults, 10) || 0) +
                  (parseInt(children, 10) || 0) +
                  (parseInt(infants, 10) || 0) ||
                  1
                ).toString(),
                cabinClass,
              });
              if (tripType === "round-trip" && returnDate) {
                qs.set("returnDate", returnDate);
              }

              const altRes = await fetch(`/api/flights/search?${qs.toString()}`);
              const altData = await altRes.json();
              if (Array.isArray(altData) && altData.length > 0) {
                const best = altData[0];
                setFlight(best);
                setFlightLoading(false);
                setFlightError(null);
                if (best.id && best.id !== params?.id) {
                  setLocation(`/book/${best.id}?${qs.toString()}`);
                }
                return;
              }
            } catch (searchErr) {
              console.warn("Fallback search failed:", searchErr);
            }
          }

          setFlightError(err.message || t("booking.flight_unavailable_desc"));
          setFlightLoading(false);
        }
      }
    }
  }, [t, searchParams, params?.id, setLocation, validateFlightPrice]);

  useEffect(() => {
    if (params?.id) {
      fetchFlight(params.id);
    }
  }, [params?.id, fetchFlight]);

  const executeBooking = useCallback(async (data: BookingFormValues) => {
    if (!flight) return;
    integrityManager?.recordInteraction();
    lastSubmitDataRef.current = data;

    setProcessingStep("validating");
    setProcessingError(null);

    try {
      const refreshRes = await fetch(`/api/flights/${flight.id}/refresh`);
      const refreshData = await refreshRes.json();
      
      if (!refreshData.valid) {
        setProcessingStep("error");
        setProcessingError(t("booking.offer_expired_desc") || "This flight offer has expired. Please search again for updated prices.");
        return;
      }

      if (refreshData.price && Math.abs(refreshData.price - flight.price) > 0.01) {
        setFlight({ ...flight, price: refreshData.price, currency: refreshData.currency || flight.currency });
        setProcessingStep(null);
        toast({ 
          title: t("booking.price_updated") || "Price Updated", 
          description: t("booking.price_updated_desc") || "The flight price has been updated. Please review the new total before proceeding.",
          variant: "default" 
        });
        return;
      }
      
      // INTEGRITY GUARD: Ensure voice confirmation in Senior Flow
      if (isEasyMode && integrityManager) {
        if (!integrityManager.validateTransition('details', 'review')) {
          setProcessingStep(null);
          speak(language === "en" 
            ? "Let's review everything with Mia before paying, just to be safe." 
            : language === "es" 
            ? "Revisemos todo con Mia antes de pagar, para estar seguros." 
            : "Vamos revisar tudo com a Mia antes de pagar, para sua segurança.");
          openAssistant();
          return;
        }
      }
    } catch (err) {
      console.warn("Could not refresh offer, proceeding with current price");
    }

    setProcessingStep("creating");

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
          setProcessingStep("preparing");
          setTimeout(() => {
            setPaymentData({
              clientSecret: response.clientSecret,
              bookingId: response.booking.id,
              referenceCode: response.booking.referenceCode,
              amount: grandTotal,
              currency: flight.currency,
            });
            setProcessingStep(null);
            setPaymentStep(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 800);
        } else {
          setProcessingStep("error");
          setProcessingError(t("booking.failed_desc") || "Could not initialize payment. Please try again.");
        }
      },
      onError: (error: any) => {
        const serverMessage = error?.message || t("booking.failed_desc") || "An error occurred while creating your booking.";
        setProcessingStep("error");
        setProcessingError(serverMessage);
      },
    });
  }, [flight, grandTotal, baggageSelections, createBooking, t, toast, integrityManager, isEasyMode, language, openAssistant, speak]);

  const onSubmit = async (data: BookingFormValues) => {
    await executeBooking(data);
  };

  const handleProcessingRetry = useCallback(() => {
    if (lastSubmitDataRef.current) {
      executeBooking(lastSubmitDataRef.current);
    }
  }, [executeBooking]);

  const handleProcessingCancel = useCallback(() => {
    setProcessingStep(null);
    setProcessingError(null);
  }, []);

  const stopsLabel = flight
    ? (flight.stops === 0
      ? t("flight.direct")
      : t(flight.stops === 1 ? "flight.stop" : "flight.stops", { count: flight.stops }))
    : "";

  if (flightLoading) {
    return <FlightLoadingSkeleton t={t} />;
  }
  if (flightError) {
    return (
      <FlightLoadError
        error={flightError}
        onRetry={() => params?.id && fetchFlight(params.id)}
        onBack={() => setLocation("/")}
        t={t}
      />
    );
  }

  if (!flight && !params?.id) {
    return (
      <FlightLoadError
        error={t("booking.flight_unavailable_desc") || "No flight selected."}
        onRetry={() => {}}
        onBack={() => setLocation("/")}
        t={t}
      />
    );
  }


  const firstPaxBaggage = flight?.passengers?.[0]?.baggages || [];
  const cabinClassName = flight?.passengers?.[0]?.cabinClassName || flight?.cabinClass || "Economy";
  const fareBrand = flight?.passengers?.[0]?.fareBrandName;

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-blue-500/30">
      {processingStep && (
        <BookingProcessingOverlay
          step={processingStep}
          error={processingError || undefined}
          onRetry={handleProcessingRetry}
          onCancel={handleProcessingCancel}
          t={t}
        />
      )}
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full bg-white/5 backdrop-blur-md border-b border-white/10 py-8 md:py-10 mb-8">
        <div className="container mx-auto max-w-6xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {paymentStep && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPaymentStep(false)}
                className="h-10 w-10 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                data-testid="button-back-to-details"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase" data-testid="text-booking-title">
                {paymentStep ? t("payment.title") : t("booking.title")}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                  Secure Checkout
                </Badge>
                {!paymentStep && flight && (
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                     Reference: {flight.flightNumber}
                   </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="hidden md:block text-right">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time to complete login</div>
             <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-xl font-black text-white slashed-zero">14:59</span>
             </div>
          </div>
        </div>
      </div>

      {isEasyMode && (
        <div className="mb-8 container mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-[32px] border border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-slate-900/60 to-slate-900/80 p-6 backdrop-blur-xl shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  {easyModeCopy.badge}
                </span>
                <h2 className="mt-4 text-2xl md:text-3xl font-black tracking-tight text-white">
                  {easyModeCopy.title}
                </h2>
                <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-400 font-medium">
                  {easyModeCopy.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 shadow-xl shadow-blue-900/20" data-testid="button-easy-mode-call-booking">
                  <a href={whatsAppHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {easyModeCopy.call}
                  </a>
                </Button>
                <Button variant="outline" onClick={openAssistant} className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold px-6 backdrop-blur-sm" data-testid="button-easy-mode-chat-booking">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {easyModeCopy.assistant}
                </Button>
                <Button variant="ghost" onClick={() => setLocation("/senior")} className="h-12 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold" data-testid="button-easy-mode-back-booking">
                  {easyModeCopy.back}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {paymentStep && paymentData ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-2xl bg-[#ff7f50]/20 flex items-center justify-center border border-[#ff7f50]/20">
                        <CreditCard className="h-5 w-5 text-[#ffb293]" />
                     </div>
                     <h2 className="text-xl font-black text-white">
                        {t("payment.title") || "Pagamento Seguro"}
                      </h2>
                   </div>
                   <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
                      disabled={!isVoiceSupported}
                      onClick={() => {
                        if (speakingPage) stopPage();
                        else speak(paymentAudio, { lang: audioLang });
                      }}
                    >
                      <Headphones className="h-4 w-4 mr-2" />
                      {speakingPage ? t("booking.audio_stop") : t("booking.audio_play")}
                    </Button>
                </div>
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
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
                  <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />
                  
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-400/20 text-blue-300">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">
                          {t("booking.contact_info")}
                        </h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Primary Contact</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
                      disabled={!isVoiceSupported}
                      onClick={() => {
                        if (speakingPage) stopPage();
                        else speak(contactAudio, { lang: audioLang });
                      }}
                    >
                      <Headphones className="h-4 w-4 mr-2" />
                      {speakingPage ? t("booking.audio_stop") : t("booking.audio_play")}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-[11px] font-black uppercase tracking-wider ml-1">{t("booking.contact_email")} *</Label>
                      <Input
                        {...form.register("contactEmail")}
                        type="email"
                        className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 rounded-xl px-4 transition-all"
                        placeholder="contact@email.com"
                        data-testid="input-contact-email"
                      />
                      {form.formState.errors.contactEmail && (
                        <p className="text-[10px] font-bold text-red-400/90 uppercase tracking-wide ml-1">{form.formState.errors.contactEmail.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-[11px] font-black uppercase tracking-wider ml-1">{t("booking.contact_phone")} *</Label>
                      <Input
                        {...form.register("contactPhone")}
                        type="tel"
                        className="h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 rounded-xl px-4 transition-all"
                        placeholder="+1 234 567 8900"
                        data-testid="input-contact-phone"
                      />
                      {form.formState.errors.contactPhone && (
                        <p className="text-[10px] font-bold text-red-400/90 uppercase tracking-wide ml-1">{form.formState.errors.contactPhone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
                   <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />

                   <div className="relative flex items-center justify-between gap-2 mb-8">
                     <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/20 text-emerald-300">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white tracking-tight">
                            {t("booking.passenger_details")}
                          </h2>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                            {totalPassengers} {totalPassengers > 1 ? t("booking.passengers_label") : t("booking.passenger")}
                          </p>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-5 relative z-10">
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
                        getValues={form.getValues}
                        isEasyMode={isEasyMode}
                        language={language}
                      />
                    ))}
                  </div>
                </div>

                {flight && (
                  <BaggageSelector
                    offerId={flight.id}
                    passengerCount={totalPassengers}
                    onBaggageSelected={setBaggageSelections}
                    includedBaggage={firstPaxBaggage}
                    flight={flight}
                    simplified={isEasyMode}
                  />
                )}

                {flight?.conditions && (
                  <div className="relative overflow-hidden rounded-[32px] border border-amber-500/10 bg-amber-500/5 p-6 backdrop-blur-md">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-amber-500 flex items-center gap-3 uppercase tracking-[0.2em]">
                        <Shield className="h-4 w-4" />
                        {t("booking.fare_rules") || "Fare Rules"}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-bold text-slate-400">
                        {flight.conditions.changeBeforeDeparture && (
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                            {flight.conditions.changeBeforeDeparture.allowed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                              <XIcon className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                            )}
                            <div className="space-y-1">
                               <p className="uppercase tracking-widest text-[9px] text-slate-500">{t("booking.change_before_departure")}</p>
                               <p className="text-slate-300">
                                 {flight.conditions.changeBeforeDeparture.allowed 
                                    ? (flight.conditions.changeBeforeDeparture.penaltyAmount 
                                      ? `${t("booking.allowed_with_fee")} ${flight.conditions.changeBeforeDeparture.penaltyCurrency} ${flight.conditions.changeBeforeDeparture.penaltyAmount}`
                                      : t("booking.allowed_free"))
                                    : t("booking.not_allowed")}
                               </p>
                            </div>
                          </div>
                        )}
                        {flight.conditions.refundBeforeDeparture && (
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                            {flight.conditions.refundBeforeDeparture.allowed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                              <XIcon className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            )}
                            <div className="space-y-1">
                               <p className="uppercase tracking-widest text-[9px] text-slate-500">{t("booking.refund_before_departure")}</p>
                               <p className="text-slate-300">
                                 {flight.conditions.refundBeforeDeparture.allowed 
                                    ? (flight.conditions.refundBeforeDeparture.penaltyAmount 
                                      ? `${t("booking.allowed_with_fee")} ${flight.conditions.refundBeforeDeparture.penaltyCurrency} ${flight.conditions.refundBeforeDeparture.penaltyAmount}`
                                      : t("booking.allowed_free"))
                                    : t("booking.not_allowed")}
                               </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-widest text-center pt-2">
                        {t("booking.conditions_disclaimer") || "By proceeding, you accept these fare conditions."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="relative overflow-hidden rounded-[30px] border border-white/5 bg-slate-900/40 p-6 md:p-8 backdrop-blur-xl shadow-inner shadow-white/5 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <Switch
                        id="audio-guide-switch"
                        checked={form.watch("audioGuideConfirmed")}
                        onCheckedChange={(checked) => form.setValue("audioGuideConfirmed", checked)}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="audio-guide-switch" className="text-base font-bold text-white flex items-center gap-2">
                        <Headphones className="h-4 w-4 text-blue-400" />
                        {t("booking.enable_audio_guide") || "Ativar Guia de Áudio de Auxílio"}
                      </Label>
                      <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest font-bold">
                        Dicas por voz durante o preenchimento.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id="terms-checkbox"
                          {...form.register("termsAccepted")}
                          className="h-5 w-5 rounded-lg border-white/10 bg-slate-950/50 text-blue-500 focus:ring-blue-500/50 transition-all cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="terms-checkbox" className="text-base font-bold text-white flex items-center gap-2 cursor-pointer">
                          <Shield className="h-4 w-4 text-[#ff7f50]" />
                          {t("booking.accept_terms") || "Aceito os Termos e Condições"}
                        </Label>
                        <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest font-bold">
                          Concordo com as políticas da agência e companhia aérea.
                        </p>
                        {form.formState.errors.termsAccepted && (
                          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-2">{form.formState.errors.termsAccepted.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <Button 
                    type="submit" 
                    className={cn(
                      "group relative h-16 w-full overflow-hidden rounded-[22px] border-0 text-base font-black uppercase tracking-[0.25em] shadow-2xl transition-all",
                      form.watch("termsAccepted") 
                        ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white hover:brightness-110 hover:-translate-y-1 active:translate-y-0" 
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    )}
                    disabled={createBooking.isPending || !flight || !form.watch("termsAccepted")}
                    data-testid="button-pay"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff7f50] via-[#ff926f] to-[#ff684a] opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-3">
                      {createBooking.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                      {createBooking.isPending 
                        ? t("booking.processing") 
                        : `${t("booking.continue_to_payment") || "Ir para Pagamento"} - ${flight ? new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(grandTotal) : '...'}`}
                    </div>
                  </Button>
                  <div className="flex items-center justify-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    <div className="h-px w-8 bg-white/5" />
                    <Lock className="h-3 w-3" />
                    <span>{t("booking.secure_payment")}</span>
                    <div className="h-px w-8 bg-white/5" />
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-6">
              <div className="lg:sticky lg:top-6 space-y-5">
                <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl">
                  <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#ff7f50]/5 blur-3xl" />
                  
                  <div className="relative flex items-center justify-between gap-2 mb-6 border-b border-white/5 pb-4">
                    <h2 className="text-lg font-black text-white tracking-tight uppercase tracking-wider">
                      {t("booking.flight_summary")}
                    </h2>
                    <Plane className="h-4 w-4 text-blue-400 animate-pulse" />
                  </div>

                  <div className="relative space-y-6">
                    {flight ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-slate-950/80 rounded-2xl flex items-center justify-center overflow-hidden p-2 border border-white/10 shadow-inner">
                          {flight.logoUrl ? (
                            <img src={flight.logoUrl} className="w-full h-full object-contain brightness-110" alt={flight.airline} />
                          ) : (
                            <Plane className="h-6 w-6 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-base" data-testid="text-airline">{flight.airline}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{flight.flightNumber}</span>
                            {cabinClassName && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffb293]"> - {cabinClassName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {flight.slices && flight.slices.length > 0 ? (
                        <div className="space-y-3">
                          {flight.slices.map((slice, si) => (
                            <div key={si} className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">
                                  {si === 0 ? t("booking.outbound") : t("booking.return_flight")}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                  {slice.originCode} <ArrowRight className="h-3 w-3 text-slate-600" /> {slice.destinationCode}
                                </div>
                              </div>
                              {slice.segments.map((seg, segi) => (
                                <div key={segi} className="flex justify-between items-center text-xs">
                                  <div className="font-bold text-slate-200">{format(parseISO(seg.departureTime), "HH:mm")}</div>
                                  <div className="h-px flex-1 mx-2 bg-white/5" />
                                  <div className="font-bold text-slate-200">{format(parseISO(seg.arrivalTime), "HH:mm")}</div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-950/40 rounded-2xl p-5 border border-white/5">
                           <div className="flex justify-between items-center mb-1">
                               <div className="text-xl font-black text-white">{format(parseISO(flight.departureTime), "HH:mm")}</div>
                               <ArrowRight className="h-4 w-4 text-blue-500" />
                               <div className="text-xl font-black text-white">{format(parseISO(flight.arrivalTime), "HH:mm")}</div>
                           </div>
                           <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                               <span>{flight.originCode}</span>
                               <span>{flight.destinationCode}</span>
                           </div>
                        </div>
                      )}
                      
                      <div className="space-y-3 py-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500 uppercase tracking-widest">{t("booking.base_fare")}</span>
                          <span className="text-slate-200">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.9)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500 uppercase tracking-widest">{t("booking.taxes")}</span>
                          <span className="text-slate-200">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.1)}</span>
                        </div>
                        {baggageExtras > 0 && (
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-[#ffb293] uppercase tracking-widest">{t("booking.extra_baggage")}</span>
                            <span className="text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(baggageExtras)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t("booking.total")}</span>
                          <span className="text-2xl font-black text-white tracking-tight" data-testid="text-total-price">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(grandTotal)}
                          </span>
                        </div>
                      </div>
                    </>
                    ) : (
                      <div className="text-center py-8">
                         <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("booking.loading")}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-[24px] flex gap-4 backdrop-blur-sm">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Pagamento Protegido</p>
                     <p className="text-xs leading-relaxed text-emerald-100/70 font-medium">{t("booking.secure_payment")}</p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
