import type { MRZResult } from "@/lib/mrz";

export type BookingDocumentType =
  | "passport"
  | "national_id"
  | "drivers_license"
  | "travel_document"
  | "other";

export type DocumentScanSource = "mrz" | "ocr-assisted";

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
    .split(/([-''])/)
    .map((part) => {
      if (!part || part === "-" || part === "'" || part === "\u2019") return part;
      return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
    })
    .join("");
}

function normalizeHumanName(value?: string | null) {
  const cleaned = (value || "")
    .replace(/[^a-zA-Z\u00C0-\u024F\s''-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned.split(" ").filter(Boolean).map(normalizeNameToken).join(" ");
}

function normalizeIsoDate(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slashMatch = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  const compactMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
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
    case "passport": return "passport";
    case "id_card":
    case "national_id": return "national_id";
    case "drivers_license": return "drivers_license";
    case "travel_doc":
    case "travel_document":
    case "visa": return "travel_document";
    default: return "other";
  }
}

export function mergeFromMRZ(mrz: MRZResult): MergedDocumentScanResult {
  return {
    givenName: normalizeHumanName(mrz.givenNames),
    familyName: normalizeHumanName(mrz.surname),
    bornOn: normalizeIsoDate(mrz.dateOfBirth),
    gender: normalizeGender(mrz.gender),
    passportNumber: normalizeDocumentNumber(mrz.documentNumber),
    passportExpiryDate: normalizeIsoDate(mrz.expiryDate),
    nationality: normalizeCode(mrz.nationality),
    passportIssuingCountry: normalizeCode(mrz.issuingCountry),
    documentType: mapScannedDocumentTypeToBooking(mrz.documentType),
    rawDocumentType: mrz.documentType,
    confidence: mrz.confidence,
    warnings: uniqueWarnings(mrz.warnings),
    notes: mrz.confidence >= 85
      ? "Leitura MRZ forte e consistente."
      : "A leitura MRZ encontrou dados, mas pede conferência cuidadosa.",
    source: "mrz",
  };
}

export function extractLicenseFields(ocrText: string): MergedDocumentScanResult | null {
  if (!ocrText) return null;
  const text = ocrText.replace(/\r/g, "").trim();
  if (!text) return null;

  const findDate = (pattern: RegExp) => {
    const match = text.match(pattern);
    if (!match) return "";
    return `${match[3]}-${match[1]}-${match[2]}`;
  };

  const dob = findDate(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  const exp = findDate(/exp|expires|expiry|exp date.*?(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i) || findDate(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);

  const licenseMatch = text.match(/([A-Z0-9]{7,})/);
  const genderMatch = text.match(/\b(M|F)\b/);

  // Try to extract names from common patterns
  const nameMatch = text.match(/(?:name|nome|fn|ln|first|last|given|family|surname)[:\s]*([A-Za-z\s]+)/i);

  return {
    givenName: "",
    familyName: "",
    bornOn: dob,
    gender: genderMatch ? genderMatch[1].toLowerCase() as "m" | "f" : "",
    passportNumber: licenseMatch ? licenseMatch[1] : "",
    passportExpiryDate: exp,
    nationality: "",
    passportIssuingCountry: "",
    documentType: "drivers_license",
    rawDocumentType: "drivers_license",
    confidence: 55,
    warnings: ["low_confidence"],
    notes: "Leitura em modo carteira de motorista — confira os dados.",
    source: "ocr-assisted",
  };
}
