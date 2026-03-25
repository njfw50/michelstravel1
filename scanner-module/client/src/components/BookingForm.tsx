/**
 * ═══════════════════════════════════════════════════════════════
 *  BookingForm — Formulário de Reserva com Módulo de Recepção
 * ═══════════════════════════════════════════════════════════════
 *
 * Design: Michels Travel (Outfit + DM Sans, guide-card, section-eyebrow)
 * Acessibilidade: Textos grandes, botões amplos, instruções claras
 *
 * FLUXO:
 * 1. Recebe MergedDocumentScanResult do scanner
 * 2. Passa pelo módulo de Constatação (verifyDocument)
 * 3. Exibe o VerificationPanel com resultado da constatação
 * 4. Módulo de Recepção distribui dados nos inputs (distributeToForm)
 * 5. Cada campo mostra status visual (verde/amarelo/vermelho)
 * 6. Animação sequencial de preenchimento
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
  AlertTriangle,
  XCircle,
  Brain,
  Loader2,
  ArrowRight,
} from "lucide-react";
import type { MergedDocumentScanResult } from "@/lib/documentScan";
import { verifyDocument, type VerifiedDocumentPayload } from "@/lib/documentVerification";
import {
  distributeToForm,
  toFormData,
  getFieldStatusMap,
  getFieldStatusClass,
  type FormFieldKey,
  type FormDistributionResult,
  type PassengerFormData,
} from "@/lib/formReceiver";
import { VerificationPanel } from "@/components/VerificationPanel";
import { useLocale } from "@/contexts/LocaleContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface BookingFormProps {
  scanData: MergedDocumentScanResult | null;
  onRescan: () => void;
}

type FormPhase = "idle" | "verifying" | "verified" | "distributing" | "ready" | "submitted";

const EMPTY_PASSENGER: PassengerFormData = {
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

function StatusIndicator({ status }: { status: "verified" | "warning" | "error" | "empty" }) {
  if (status === "verified") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-red-500" />;
  return null;
}

export function BookingForm({ scanData, onRescan }: BookingFormProps) {
  const { t } = useLocale();
  const [phase, setPhase] = useState<FormPhase>("idle");
  const [passenger, setPassenger] = useState<PassengerFormData>({ ...EMPTY_PASSENGER });
  const [verification, setVerification] = useState<VerifiedDocumentPayload | null>(null);
  const [distribution, setDistribution] = useState<FormDistributionResult | null>(null);
  const [fieldStatuses, setFieldStatuses] = useState<Record<FormFieldKey, "verified" | "warning" | "error" | "empty">>({} as any);
  const [animatingField, setAnimatingField] = useState<FormFieldKey | null>(null);
  const [showVerificationPanel, setShowVerificationPanel] = useState(false);
  const hasScanData = useRef(false);

  // ─── PIPELINE: scanData → Constatação → Recepção → Distribuição ───
  useEffect(() => {
    if (!scanData || hasScanData.current) return;
    hasScanData.current = true;

    const runPipeline = async () => {
      // FASE 1: Verificação (Constatação)
      setPhase("verifying");
      await new Promise((r) => setTimeout(r, 800)); // Simular processamento AI

      const verified = verifyDocument(scanData);
      setVerification(verified);
      setPhase("verified");
      setShowVerificationPanel(true);

      await new Promise((r) => setTimeout(r, 1500)); // Tempo para o usuário ver a constatação

      // FASE 2: Distribuição (Recepção)
      setPhase("distributing");
      const dist = distributeToForm(verified);
      setDistribution(dist);
      const formData = toFormData(dist);
      const statusMap = getFieldStatusMap(dist);
      setFieldStatuses(statusMap);

      // FASE 3: Animação sequencial de preenchimento
      for (let i = 0; i < dist.animationSequence.length; i++) {
        const fieldKey = dist.animationSequence[i];
        setAnimatingField(fieldKey);
        await new Promise((r) => setTimeout(r, 200));

        setPassenger((prev) => ({
          ...prev,
          [fieldKey]: formData[fieldKey] || prev[fieldKey as keyof PassengerFormData],
        }));

        await new Promise((r) => setTimeout(r, 150));
      }

      setAnimatingField(null);
      setPhase("ready");

      // Toast de resultado
      if (dist.overallStatus === "success") {
        toast.success(t.autoFillComplete);
      } else if (dist.overallStatus === "partial") {
        toast.warning(t.autoFillPartial);
      } else {
        toast.error(t.autoFillFailed);
      }
    };

    runPipeline();
  }, [scanData, t]);

  // Reset quando scanData muda para null
  useEffect(() => {
    if (!scanData) {
      hasScanData.current = false;
      setPhase("idle");
      setPassenger({ ...EMPTY_PASSENGER });
      setVerification(null);
      setDistribution(null);
      setFieldStatuses({} as any);
      setShowVerificationPanel(false);
    }
  }, [scanData]);

  const handleChange = useCallback((field: keyof PassengerFormData, value: string) => {
    setPassenger((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!passenger.givenName || !passenger.familyName) {
      toast.error(t.firstName + " / " + t.lastName);
      return;
    }
    setPhase("submitted");
    toast.success(t.bookingSent);
  }, [passenger, t]);

  const handleRescan = useCallback(() => {
    hasScanData.current = false;
    setPhase("idle");
    setPassenger({ ...EMPTY_PASSENGER });
    setVerification(null);
    setDistribution(null);
    setFieldStatuses({} as any);
    setShowVerificationPanel(false);
    onRescan();
  }, [onRescan]);

  const getInputClass = (fieldKey: FormFieldKey) => {
    const base = "w-full rounded-xl border px-4 py-3 text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40";
    const isAnimating = animatingField === fieldKey;
    const status = fieldStatuses[fieldKey];

    if (isAnimating) return `${base} border-primary bg-primary/5 ring-2 ring-primary/30 scale-[1.02]`;
    if (status) return `${base} ${getFieldStatusClass(status)}`;
    return `${base} border-border bg-white`;
  };

  const getSelectClass = (fieldKey: FormFieldKey) => {
    const base = "w-full rounded-xl border px-4 py-3 text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem]";
    const isAnimating = animatingField === fieldKey;
    const status = fieldStatuses[fieldKey];

    if (isAnimating) return `${base} border-primary bg-primary/5 ring-2 ring-primary/30`;
    if (status) return `${base} ${getFieldStatusClass(status)}`;
    return `${base} border-border bg-white`;
  };

  // ─── FASE: SUBMITTED ────────────────────────────────────────
  if (phase === "submitted") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="guide-card p-6 sm:p-8 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
          {t.bookingSent}
        </h3>
        <p className="text-muted-foreground mb-6">{t.bookingSentDesc}</p>

        <div className="guide-card p-4 text-left mb-6">
          <h4 className="text-sm font-bold text-muted-foreground mb-3">{t.passengerSummary}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.nameLabel}</span>
              <span className="font-medium">{passenger.givenName} {passenger.familyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.docLabel}</span>
              <span className="font-medium">{passenger.documentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.natLabel}</span>
              <span className="font-medium">{passenger.nationality}</span>
            </div>
          </div>
        </div>

        <Button onClick={handleRescan} className="btn-guide-primary w-full text-base py-3">
          <Plane className="h-5 w-5 mr-2" />
          {t.newBooking}
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="section-eyebrow mx-auto w-fit">
          <FileText className="h-3.5 w-3.5" />
          {t.bookingEyebrow}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-display)" }}>
          {t.bookingTitle}
        </h2>
        <p className="text-muted-foreground mt-2 text-base max-w-lg mx-auto">
          {scanData ? t.bookingDescScan : t.bookingDescManual}
        </p>
      </div>

      {/* Status banner — Verifying / Distributing */}
      <AnimatePresence mode="wait">
        {phase === "verifying" && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="guide-card p-4 border-primary/30 bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  {t.verifyingData}
                </p>
                <p className="text-xs text-muted-foreground">{t.securityNote}</p>
              </div>
              <Loader2 className="h-5 w-5 text-primary animate-spin ml-auto" />
            </div>
          </motion.div>
        )}

        {phase === "distributing" && distribution && (
          <motion.div
            key="distributing"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="guide-card p-4 border-green-300 bg-green-50"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-green-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  {t.distributingFields}
                </p>
                <p className="text-xs text-muted-foreground">
                  {distribution.filledCount} {t.fieldsFilled}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-green-600 ml-auto animate-bounce" />
            </div>
          </motion.div>
        )}

        {phase === "ready" && distribution && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`guide-card p-4 ${
              distribution.overallStatus === "success"
                ? "border-green-300 bg-green-50"
                : distribution.overallStatus === "partial"
                ? "border-amber-300 bg-amber-50"
                : "border-red-300 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                distribution.overallStatus === "success" ? "bg-green-100" :
                distribution.overallStatus === "partial" ? "bg-amber-100" : "bg-red-100"
              }`}>
                {distribution.overallStatus === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : distribution.overallStatus === "partial" ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  {distribution.overallStatus === "success" ? t.autoFillComplete :
                   distribution.overallStatus === "partial" ? t.autoFillPartial : t.autoFillFailed}
                </p>
                <p className="text-xs text-muted-foreground">
                  {distribution.filledCount} {t.fieldsFilled}
                  {distribution.skippedCount > 0 && ` · ${distribution.skippedCount} ${t.fieldsNeedReview}`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRescan} className="text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                {t.rescan}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Panel (Constatação) */}
      <AnimatePresence>
        {showVerificationPanel && verification && (phase === "verified" || phase === "distributing" || phase === "ready") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
          >
            <VerificationPanel verification={verification} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* No scan data banner */}
      {!scanData && phase === "idle" && (
        <div className="guide-card p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <ScanLine className="h-5 w-5 text-primary" />
            <p className="text-sm text-foreground">{t.scanFasterBanner}</p>
          </div>
        </div>
      )}

      {/* ─── FORM ──────────────────────────────────────────── */}
      <div className="guide-card p-5 sm:p-6">
        {/* Personal Info Section */}
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t.personalInfo}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.title}</label>
            <div className="relative">
              <select
                value={passenger.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={getSelectClass("title")}
              >
                <option value="mr">{t.titleMr}</option>
                <option value="mrs">{t.titleMrs}</option>
                <option value="ms">{t.titleMs}</option>
                <option value="dr">{t.titleDr}</option>
              </select>
              {fieldStatuses.title && <div className="absolute right-10 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.title} /></div>}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.gender}</label>
            <div className="relative">
              <select
                value={passenger.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className={getSelectClass("gender")}
              >
                <option value="">{t.genderSelect}</option>
                <option value="m">{t.genderMale}</option>
                <option value="f">{t.genderFemale}</option>
              </select>
              {fieldStatuses.gender && <div className="absolute right-10 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.gender} /></div>}
            </div>
          </div>

          {/* Given Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.firstName}</label>
            <div className="relative">
              <input
                type="text"
                value={passenger.givenName}
                onChange={(e) => handleChange("givenName", e.target.value)}
                className={getInputClass("givenName")}
                placeholder="John"
              />
              {fieldStatuses.givenName && <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.givenName} /></div>}
            </div>
          </div>

          {/* Family Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.lastName}</label>
            <div className="relative">
              <input
                type="text"
                value={passenger.familyName}
                onChange={(e) => handleChange("familyName", e.target.value)}
                className={getInputClass("familyName")}
                placeholder="Doe"
              />
              {fieldStatuses.familyName && <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.familyName} /></div>}
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.birthDate}</label>
            <div className="relative">
              <input
                type="date"
                value={passenger.bornOn}
                onChange={(e) => handleChange("bornOn", e.target.value)}
                className={getInputClass("bornOn")}
              />
              {fieldStatuses.bornOn && <div className="absolute right-10 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.bornOn} /></div>}
            </div>
          </div>

          {/* Nationality */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.nationality}</label>
            <div className="relative">
              <input
                type="text"
                value={passenger.nationality}
                onChange={(e) => handleChange("nationality", e.target.value)}
                className={getInputClass("nationality")}
                placeholder="BRA"
                maxLength={3}
              />
              {fieldStatuses.nationality && <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.nationality} /></div>}
            </div>
          </div>
        </div>

        {/* Document Info Section */}
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t.documentInfo}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Document Type */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.documentType}</label>
            <div className="relative">
              <select
                value={passenger.documentType}
                onChange={(e) => handleChange("documentType", e.target.value)}
                className={getSelectClass("documentType")}
              >
                <option value="passport">{t.passportType}</option>
                <option value="national_id">{t.nationalIdType}</option>
                <option value="drivers_license">{t.driversLicenseType}</option>
                <option value="travel_document">{t.travelDocType}</option>
                <option value="other">{t.otherType}</option>
              </select>
              {fieldStatuses.documentType && <div className="absolute right-10 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.documentType} /></div>}
            </div>
          </div>

          {/* Document Number */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.documentNumber}</label>
            <div className="relative">
              <input
                type="text"
                value={passenger.documentNumber}
                onChange={(e) => handleChange("documentNumber", e.target.value)}
                className={getInputClass("documentNumber")}
                placeholder="AB1234567"
              />
              {fieldStatuses.documentNumber && <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.documentNumber} /></div>}
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.expiryDate}</label>
            <div className="relative">
              <input
                type="date"
                value={passenger.documentExpiryDate}
                onChange={(e) => handleChange("documentExpiryDate", e.target.value)}
                className={getInputClass("documentExpiryDate")}
              />
              {fieldStatuses.documentExpiryDate && <div className="absolute right-10 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.documentExpiryDate} /></div>}
            </div>
          </div>

          {/* Issuing Country */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.issuingCountry}</label>
            <div className="relative">
              <input
                type="text"
                value={passenger.documentIssuingCountry}
                onChange={(e) => handleChange("documentIssuingCountry", e.target.value)}
                className={getInputClass("documentIssuingCountry")}
                placeholder="BRA"
                maxLength={3}
              />
              {fieldStatuses.documentIssuingCountry && <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIndicator status={fieldStatuses.documentIssuingCountry} /></div>}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t.contact}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.email}</label>
            <input
              type="email"
              value={passenger.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={getInputClass("email")}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t.phone}</label>
            <input
              type="tel"
              value={passenger.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              className={getInputClass("phoneNumber")}
              placeholder="+55 11 99999-9999"
            />
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
          <Shield className="h-3.5 w-3.5" />
          <span>{t.encryptionNote}</span>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={phase === "verifying" || phase === "distributing"}
          className="btn-guide-primary w-full text-base py-3 h-auto"
        >
          {phase === "verifying" || phase === "distributing" ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {phase === "verifying" ? t.verifyingData : t.distributingFields}
            </>
          ) : (
            <>
              <Plane className="h-5 w-5 mr-2" />
              {t.submitBooking}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
