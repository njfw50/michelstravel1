import type { MRZResult } from "@/lib/mrz";

export type BookingDocumentType =
  | "passport"
  | "national_id"
  | "drivers_license"
  | "travel_document"
  | "other";

export type DocumentScanSource = "mrz" | "ai-assisted" | "ocr-assisted";

export interface DocumentAiCandidate {
  givenName?: string | null;
  familyName?: string | null;
  bornOn?: string | null;
  gender?: "m" | "f" | "" | null;
  documentNumber?: string | null;
  passportExpiryDate?: string | null;
  nationality?: string | null;
  passportIssuingCountry?: string | null;
  documentType?: string | null;
  confidence?: number | null;
  warnings?: string[] | null;
  notes?: string | null;
}

export interface MergedDocumentScanResult {
  givenName: string;
  familyName: string;
  bornOn: string;
  gender: "m" | "f" | "";
  passportNumber: string;
  passportExpiryDate: string;
  nationality: string;
  passportIssuingCountry: string;
  documentType: BookingDocumentType;
  rawDocumentType: string;
  confidence: number;
  warnings: string[];
  notes: string;
  source: DocumentScanSource;
}

function uniqueWarnings(...groups: Array<string[] | null | undefined>) {
  return Array.from(new Set(groups.flatMap((group) => group || []).filter(Boolean)));
}

function normalizeNameToken(token: string) {
  return token
    .split(/([-'’])/)
    .map((part) => {
      if (!part || part === "-" || part === "'" || part === "’") return part;
      return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
    })
    .join("");
}

function normalizeHumanName(value?: string | null) {
  const cleaned = (value || "")
    .replace(/[^\p{L}\p{M}\s'’-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map(normalizeNameToken)
    .join(" ");
}

function normalizeIsoDate(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const slashMatch = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  }

  const compactMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  }

  return "";
}

function normalizeCode(value?: string | null) {
  return (value || "").replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 3);
}

function normalizeDocumentNumber(value?: string | null) {
  return (value || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function normalizeGender(value?: string | null): "m" | "f" | "" {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "m" || normalized === "male") return "m";
  if (normalized === "f" || normalized === "female") return "f";
  return "";
}

export function mapScannedDocumentTypeToBooking(value?: string | null): BookingDocumentType {
  const normalized = (value || "").trim().toLowerCase();
  switch (normalized) {
    case "passport":
      return "passport";
    case "id_card":
    case "national_id":
      return "national_id";
    case "drivers_license":
      return "drivers_license";
    case "travel_doc":
    case "travel_document":
    case "visa":
      return "travel_document";
    default:
      return "other";
  }
}

function buildLocalFallbackFromMrz(mrz?: MRZResult | null): DocumentAiCandidate | null {
  if (!mrz) return null;
  return {
    givenName: mrz.givenNames,
    familyName: mrz.surname,
    bornOn: mrz.dateOfBirth,
    gender: mrz.gender,
    documentNumber: mrz.documentNumber,
    passportExpiryDate: mrz.expiryDate,
    nationality: mrz.nationality,
    passportIssuingCountry: mrz.issuingCountry,
    documentType: mrz.documentType,
    confidence: mrz.confidence,
    warnings: mrz.warnings,
    notes: mrz.confidence >= 85
      ? "Leitura MRZ forte e consistente."
      : "A leitura MRZ encontrou dados, mas pede conferência cuidadosa.",
  };
}

function preferAiValue(aiValue: string, mrzValue: string, mrzConfidence: number, aiConfidence: number) {
  if (!aiValue) return false;
  if (!mrzValue) return true;
  if (mrzConfidence < 75 && aiConfidence >= mrzConfidence) return true;
  if (aiValue.length > mrzValue.length && mrzValue.replace(/\s+/g, "").length < aiValue.replace(/\s+/g, "").length) return true;
  return false;
}

export function mergeDocumentScanCandidates(options: {
  mrz?: MRZResult | null;
  ai?: DocumentAiCandidate | null;
}) {
  const mrzCandidate = buildLocalFallbackFromMrz(options.mrz);
  const aiCandidate = options.ai || null;

  const mrzConfidence = mrzCandidate?.confidence || 0;
  const aiConfidence = aiCandidate?.confidence || 0;

  const givenName = normalizeHumanName(
    aiCandidate && preferAiValue(normalizeHumanName(aiCandidate.givenName), normalizeHumanName(mrzCandidate?.givenName), mrzConfidence, aiConfidence)
      ? aiCandidate.givenName
      : mrzCandidate?.givenName || aiCandidate?.givenName,
  );
  const familyName = normalizeHumanName(
    aiCandidate && preferAiValue(normalizeHumanName(aiCandidate.familyName), normalizeHumanName(mrzCandidate?.familyName), mrzConfidence, aiConfidence)
      ? aiCandidate.familyName
      : mrzCandidate?.familyName || aiCandidate?.familyName,
  );
  const passportNumber = normalizeDocumentNumber(
    aiCandidate && preferAiValue(
      normalizeDocumentNumber(aiCandidate.documentNumber),
      normalizeDocumentNumber(mrzCandidate?.documentNumber),
      mrzConfidence,
      aiConfidence,
    )
      ? aiCandidate?.documentNumber
      : mrzCandidate?.documentNumber || aiCandidate?.documentNumber,
  );

  const bornOn = normalizeIsoDate(
    aiCandidate && preferAiValue(aiCandidate.bornOn || "", mrzCandidate?.bornOn || "", mrzConfidence, aiConfidence)
      ? aiCandidate?.bornOn
      : mrzCandidate?.bornOn || aiCandidate?.bornOn,
  );
  const passportExpiryDate = normalizeIsoDate(
    aiCandidate && preferAiValue(aiCandidate.passportExpiryDate || "", mrzCandidate?.passportExpiryDate || "", mrzConfidence, aiConfidence)
      ? aiCandidate?.passportExpiryDate
      : mrzCandidate?.passportExpiryDate || aiCandidate?.passportExpiryDate,
  );
  const nationality = normalizeCode(
    aiCandidate && preferAiValue(normalizeCode(aiCandidate.nationality), normalizeCode(mrzCandidate?.nationality), mrzConfidence, aiConfidence)
      ? aiCandidate?.nationality
      : mrzCandidate?.nationality || aiCandidate?.nationality,
  );
  const passportIssuingCountry = normalizeCode(
    aiCandidate && preferAiValue(normalizeCode(aiCandidate.passportIssuingCountry), normalizeCode(mrzCandidate?.passportIssuingCountry), mrzConfidence, aiConfidence)
      ? aiCandidate?.passportIssuingCountry
      : mrzCandidate?.passportIssuingCountry || aiCandidate?.passportIssuingCountry,
  );
  const gender = normalizeGender(
    aiCandidate && preferAiValue(normalizeGender(aiCandidate.gender), normalizeGender(mrzCandidate?.gender), mrzConfidence, aiConfidence)
      ? aiCandidate?.gender
      : mrzCandidate?.gender || aiCandidate?.gender,
  );
  const rawDocumentType = ((aiCandidate?.documentType && aiConfidence >= mrzConfidence)
    ? aiCandidate.documentType
    : mrzCandidate?.documentType || aiCandidate?.documentType || "passport").trim().toLowerCase();

  let source: DocumentScanSource = "ocr-assisted";
  if (aiCandidate) source = "ai-assisted";
  else if (mrzCandidate) source = "mrz";

  const confidence = Math.max(
    Math.min(100, Math.round((mrzConfidence * 0.65) + (aiConfidence * 0.35))),
    mrzConfidence,
    aiConfidence,
  );

  const notes = aiCandidate?.notes?.trim() || mrzCandidate?.notes?.trim() || "";
  const warnings = uniqueWarnings(mrzCandidate?.warnings, aiCandidate?.warnings);

  return {
    givenName,
    familyName,
    bornOn,
    gender,
    passportNumber,
    passportExpiryDate,
    nationality,
    passportIssuingCountry,
    documentType: mapScannedDocumentTypeToBooking(rawDocumentType),
    rawDocumentType,
    confidence,
    warnings,
    notes,
    source,
  } satisfies MergedDocumentScanResult;
}
