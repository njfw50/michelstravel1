export type TsaDocumentType =
  | "passport"
  | "passport_card"
  | "drivers_license_real_id"
  | "drivers_license"
  | "state_id_real_id"
  | "state_id"
  | "military_id"
  | "resident_card"
  | "ead_card"
  | "tribal_id"
  | "trusted_traveler_card"
  | "twic"
  | "merchant_mariner"
  | "visa"
  | "other";

interface TsaDocMeta {
  label: string;
  mrzLikely: boolean;
  description: string;
}

export const TSA_ACCEPTED_DOCS: Record<TsaDocumentType, TsaDocMeta> = {
  passport: { label: "Passport (ICAO MRZ)", mrzLikely: true, description: "Passport book with MRZ" },
  passport_card: { label: "Passport Card", mrzLikely: true, description: "Card format, MRZ on back" },
  drivers_license_real_id: { label: "Driver's License (REAL ID)", mrzLikely: false, description: "REAL ID compliant DL" },
  drivers_license: { label: "Driver's License (non-REAL ID)", mrzLikely: false, description: "Standard DL; secondary screening may apply" },
  state_id_real_id: { label: "State ID (REAL ID)", mrzLikely: false, description: "REAL ID state identification card" },
  state_id: { label: "State ID (non-REAL ID)", mrzLikely: false, description: "Standard state ID" },
  military_id: { label: "Military ID (CAC)", mrzLikely: false, description: "Common Access Card" },
  resident_card: { label: "Permanent Resident Card", mrzLikely: false, description: "Green Card" },
  ead_card: { label: "Employment Authorization (EAD)", mrzLikely: false, description: "I-766" },
  tribal_id: { label: "Tribal ID", mrzLikely: false, description: "Federally recognized tribal photo ID" },
  trusted_traveler_card: { label: "Trusted Traveler Card", mrzLikely: false, description: "Global Entry / NEXUS / SENTRI / FAST" },
  twic: { label: "TWIC / Transportation Worker", mrzLikely: false, description: "Transportation Worker Identification Credential" },
  merchant_mariner: { label: "Merchant Mariner Credential", mrzLikely: false, description: "U.S. Merchant Mariner Credential" },
  visa: { label: "Visa (foil)", mrzLikely: true, description: "MRZ present on visa label" },
  other: { label: "Other", mrzLikely: false, description: "Any other government-issued photo ID" },
};

const MRZ_DOC_MAP: Record<string, TsaDocumentType> = {
  P: "passport",
  A: "diplomatic_passport" as any, // will normalize to passport
  C: "passport_card",
  I: "state_id",
  V: "visa",
  D: "passport",
};

export function docTypeFromMrzCode(code: string | undefined): TsaDocumentType {
  if (!code) return "other";
  const normalized = MRZ_DOC_MAP[code.toUpperCase()];
  if (normalized === "diplomatic_passport") return "passport";
  // no longer needed as MRZ_DOC_MAP now uses state_id directly
  return normalized || "other";
}

export function normalizeDocumentType(input: string | null | undefined): TsaDocumentType {
  if (!input) return "other";
  const value = input.toString().trim().toLowerCase();
  if (value.includes("passport card")) return "passport_card";
  if (value.startsWith("passport")) return "passport";
  if (value.includes("real") && value.includes("driver")) return "drivers_license_real_id";
  if (value.includes("driver")) return "drivers_license";
  if (value.includes("state") && value.includes("real")) return "state_id_real_id";
  if (value.includes("state id")) return "state_id";
  if (value.includes("military") || value.includes("cac")) return "military_id";
  if (value.includes("resident") || value.includes("green")) return "resident_card";
  if (value.includes("ead")) return "ead_card";
  if (value.includes("tribal")) return "tribal_id";
  if (value.includes("global entry") || value.includes("nexus") || value.includes("sentri") || value.includes("fast")) return "trusted_traveler_card";
  if (value.includes("twic")) return "twic";
  if (value.includes("mariner")) return "merchant_mariner";
  if (value.includes("visa")) return "visa";
  if (value.includes("mrz") || value === "p") return "passport";
  return "other";
}

export function isTsaAcceptedDocument(type: string | null | undefined): boolean {
  return normalizeDocumentType(type) in TSA_ACCEPTED_DOCS;
}
