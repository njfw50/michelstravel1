import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ScanLine,
  User,
  FileText,
  Plane,
  Mail,
  Shield,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type { MergedDocumentScanResult } from "@/lib/documentScan";
import { useLocale } from "@/contexts/LocaleContext";
import { toast } from "sonner";

interface BookingFormProps {
  scanData: MergedDocumentScanResult | null;
  onRescan: () => void;
}

interface PassengerData {
  title: string;
  givenName: string;
  familyName: string;
  bornOn: string;
  gender: string;
  email: string;
  phoneNumber: string;
  documentType: string;
  documentNumber: string;
  documentExpiryDate: string;
  documentIssuingCountry: string;
  nationality: string;
}

const EMPTY_PASSENGER: PassengerData = {
  title: "mr",
  givenName: "",
  familyName: "",
  bornOn: "",
  gender: "",
  email: "",
  phoneNumber: "",
  documentType: "passport",
  documentNumber: "",
  documentExpiryDate: "",
  documentIssuingCountry: "",
  nationality: "",
};

function mapDocType(raw: string): string {
  switch (raw) {
    case "passport": return "passport";
    case "national_id": return "national_id";
    case "drivers_license": return "drivers_license";
    case "travel_document": return "travel_document";
    default: return "passport";
  }
}

export function BookingForm({ scanData, onRescan }: BookingFormProps) {
  const { t } = useLocale();
  const [passenger, setPassenger] = useState<PassengerData>(EMPTY_PASSENGER);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filledFromScan, setFilledFromScan] = useState(false);

  useEffect(() => {
    if (scanData) {
      setPassenger((prev) => ({
        ...prev,
        givenName: scanData.givenName || prev.givenName,
        familyName: scanData.familyName || prev.familyName,
        bornOn: scanData.bornOn || prev.bornOn,
        gender: scanData.gender || prev.gender,
        documentType: mapDocType(scanData.documentType) || prev.documentType,
        documentNumber: scanData.passportNumber || prev.documentNumber,
        documentExpiryDate: scanData.passportExpiryDate || prev.documentExpiryDate,
        documentIssuingCountry: scanData.passportIssuingCountry || prev.documentIssuingCountry,
        nationality: scanData.nationality || prev.nationality,
      }));
      setFilledFromScan(true);
      toast.success(t.scanAppliedBanner, {
        description: t.bookingDescScan,
        duration: 4000,
      });
    }
  }, [scanData, t]);

  const updateField = (field: keyof PassengerData, value: string) => {
    setPassenger((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success(t.bookingSent, {
      description: t.bookingSentDesc,
      duration: 5000,
    });
  };

  const inputClass = (filled: boolean) =>
    `mt-1 w-full rounded-lg border px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
      filled ? "border-green-300 bg-green-50/50" : "border-border bg-white"
    }`;

  if (submitted) {
    return (
      <div className="animate-fade-in-up text-center py-12">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {t.bookingSent}
        </h2>
        <p className="text-muted-foreground mt-3 text-base max-w-md mx-auto">
          {t.bookingSentDesc}
        </p>
        <div className="guide-card p-5 mt-8 max-w-sm mx-auto text-left">
          <p className="text-sm font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
            {t.passengerSummary}
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">{t.nameLabel}:</span> {passenger.givenName} {passenger.familyName}</p>
            <p><span className="font-medium text-foreground">{t.docLabel}:</span> {passenger.documentNumber}</p>
            <p><span className="font-medium text-foreground">{t.natLabel}:</span> {passenger.nationality}</p>
          </div>
        </div>
        <Button
          className="mt-8 h-14 sm:h-12 px-8 text-base"
          onClick={() => {
            setSubmitted(false);
            setPassenger(EMPTY_PASSENGER);
            setFilledFromScan(false);
            setContactEmail("");
            setContactPhone("");
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t.newBooking}
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="section-eyebrow w-fit">
          <Plane className="h-3.5 w-3.5" />
          {t.bookingEyebrow}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-display)" }}>
          {t.bookingTitle}
        </h2>
        <p className="text-muted-foreground mt-2">
          {filledFromScan ? t.bookingDescScan : t.bookingDescManual}
        </p>
      </div>

      {/* Scan status banner */}
      {filledFromScan && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {t.scanAppliedBanner} ({scanData?.confidence}% {t.confidenceLabel})
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-100"
            onClick={onRescan}
          >
            <ScanLine className="h-3.5 w-3.5 mr-1.5" />
            {t.rescan}
          </Button>
        </div>
      )}

      {!filledFromScan && (
        <div className="rounded-xl bg-accent/50 border border-primary/10 p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">{t.scanFasterBanner}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 text-primary hover:bg-primary/5"
            onClick={onRescan}
          >
            <ScanLine className="h-3.5 w-3.5 mr-1.5" />
            {t.scanDocument}
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="guide-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {t.personalInfo}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.title}</label>
              <select
                value={passenger.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="mr">{t.titleMr}</option>
                <option value="mrs">{t.titleMrs}</option>
                <option value="ms">{t.titleMs}</option>
                <option value="dr">{t.titleDr}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.firstName} *</label>
              <input
                required
                value={passenger.givenName}
                onChange={(e) => updateField("givenName", e.target.value)}
                className={inputClass(filledFromScan && !!passenger.givenName)}
                placeholder={t.firstName}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.lastName} *</label>
              <input
                required
                value={passenger.familyName}
                onChange={(e) => updateField("familyName", e.target.value)}
                className={inputClass(filledFromScan && !!passenger.familyName)}
                placeholder={t.lastName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.birthDate} *</label>
              <input
                required
                type="date"
                value={passenger.bornOn}
                onChange={(e) => updateField("bornOn", e.target.value)}
                className={inputClass(filledFromScan && !!passenger.bornOn)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.gender} *</label>
              <select
                required
                value={passenger.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className={inputClass(filledFromScan && !!passenger.gender)}
              >
                <option value="">{t.genderSelect}</option>
                <option value="m">{t.genderMale}</option>
                <option value="f">{t.genderFemale}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Information */}
        <div className="guide-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {t.documentInfo}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.documentType}</label>
              <select
                value={passenger.documentType}
                onChange={(e) => updateField("documentType", e.target.value)}
                className={inputClass(filledFromScan && passenger.documentType !== "passport")}
              >
                <option value="passport">{t.passportType}</option>
                <option value="national_id">{t.nationalIdType}</option>
                <option value="drivers_license">{t.driversLicenseType}</option>
                <option value="travel_document">{t.travelDocType}</option>
                <option value="other">{t.otherType}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.documentNumber} *</label>
              <input
                required
                value={passenger.documentNumber}
                onChange={(e) => updateField("documentNumber", e.target.value.toUpperCase())}
                className={`${inputClass(filledFromScan && !!passenger.documentNumber)} font-mono`}
                placeholder="AB1234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.expiryDate}</label>
              <input
                type="date"
                value={passenger.documentExpiryDate}
                onChange={(e) => updateField("documentExpiryDate", e.target.value)}
                className={inputClass(filledFromScan && !!passenger.documentExpiryDate)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.nationality}</label>
              <input
                value={passenger.nationality}
                onChange={(e) => updateField("nationality", e.target.value.toUpperCase())}
                maxLength={3}
                className={inputClass(filledFromScan && !!passenger.nationality)}
                placeholder="BRA"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.issuingCountry}</label>
              <input
                value={passenger.documentIssuingCountry}
                onChange={(e) => updateField("documentIssuingCountry", e.target.value.toUpperCase())}
                maxLength={3}
                className={inputClass(filledFromScan && !!passenger.documentIssuingCountry)}
                placeholder="BRA"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="guide-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {t.contact}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.email} *</label>
              <input
                required
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.phone} *</label>
              <input
                required
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>{t.encryptionNote}</span>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            className="flex-1 h-16 sm:h-14 text-lg font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {t.submitBooking}
          </Button>
        </div>
      </form>
    </div>
  );
}
