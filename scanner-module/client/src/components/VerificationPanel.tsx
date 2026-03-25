/**
 * VerificationPanel — Painel visual que mostra o resultado da constatação AI
 * Exibe cada campo com seu status (verificado/warning/erro) e confiança
 */

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Sparkles,
  Brain,
  FileCheck,
} from "lucide-react";
import type { VerifiedDocumentPayload, FieldVerification, FieldStatus } from "@/lib/documentVerification";
import { useLocale } from "@/contexts/LocaleContext";
import { motion } from "framer-motion";

interface VerificationPanelProps {
  verification: VerifiedDocumentPayload;
}

function StatusIcon({ status }: { status: FieldStatus }) {
  switch (status) {
    case "verified":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "empty":
      return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
  }
}

function statusBgClass(status: FieldStatus): string {
  switch (status) {
    case "verified": return "bg-green-50 border-green-200";
    case "warning": return "bg-amber-50 border-amber-200";
    case "error": return "bg-red-50 border-red-200";
    case "empty": return "bg-gray-50 border-gray-200";
  }
}

function FieldRow({ label, field, delay }: { label: string; field: FieldVerification; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`flex items-center justify-between p-2.5 rounded-lg border ${statusBgClass(field.status)}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <StatusIcon status={field.status} />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {field.value ? (
          <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
            {field.correctedValue ? (
              <span>
                <span className="line-through text-muted-foreground/50 mr-1">{field.value}</span>
                <span className="text-green-700">{field.correctedValue}</span>
              </span>
            ) : (
              field.value
            )}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">—</span>
        )}
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${
            field.confidence >= 80 ? "border-green-300 text-green-700" :
            field.confidence >= 50 ? "border-amber-300 text-amber-700" :
            "border-red-300 text-red-700"
          }`}
        >
          {field.confidence}%
        </Badge>
      </div>
    </motion.div>
  );
}

export function VerificationPanel({ verification }: VerificationPanelProps) {
  const { t } = useLocale();

  const overallColor = verification.overallStatus === "approved"
    ? "text-green-600"
    : verification.overallStatus === "review_needed"
    ? "text-amber-600"
    : "text-red-600";

  const overallBg = verification.overallStatus === "approved"
    ? "bg-green-50 border-green-200"
    : verification.overallStatus === "review_needed"
    ? "bg-amber-50 border-amber-200"
    : "bg-red-50 border-red-200";

  const overallIcon = verification.overallStatus === "approved"
    ? CheckCircle2
    : verification.overallStatus === "review_needed"
    ? AlertTriangle
    : XCircle;

  const OverallIcon = overallIcon;

  const statusLabel = verification.overallStatus === "approved"
    ? t.verificationApproved
    : verification.overallStatus === "review_needed"
    ? t.verificationReview
    : t.verificationRejected;

  const fields: { label: string; field: FieldVerification }[] = [
    { label: t.firstName, field: verification.givenName },
    { label: t.lastName, field: verification.familyName },
    { label: t.birthDate, field: verification.bornOn },
    { label: t.gender, field: verification.gender },
    { label: t.documentNumber, field: verification.documentNumber },
    { label: t.expiryDate, field: verification.documentExpiryDate },
    { label: t.nationality, field: verification.nationality },
    { label: t.issuingCountry, field: verification.issuingCountry },
    { label: t.documentType, field: verification.documentType },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="guide-card p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {t.verificationTitle}
        </h3>
      </div>

      {/* Overall status */}
      <div className={`rounded-xl border p-3 mb-4 ${overallBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OverallIcon className={`h-5 w-5 ${overallColor}`} />
            <span className={`text-sm font-bold ${overallColor}`} style={{ fontFamily: "var(--font-display)" }}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold text-primary">{verification.overallConfidence}%</span>
          </div>
        </div>
        <div className="mt-2">
          <Progress
            value={verification.overallConfidence}
            className="h-2 rounded-full"
          />
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            {verification.fieldsVerified} {t.verified}
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            {verification.fieldsWithWarnings} {t.warnings}
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            {verification.fieldsWithErrors} {t.errors}
          </span>
        </div>
      </div>

      {/* Field-by-field verification */}
      <div className="space-y-1.5">
        {fields.map((item, i) => (
          <FieldRow
            key={item.label}
            label={item.label}
            field={item.field}
            delay={0.05 * i}
          />
        ))}
      </div>

      {/* Security footer */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <FileCheck className="h-3.5 w-3.5" />
        <span>{t.verificationFooter}</span>
      </div>
    </motion.div>
  );
}
