/**
 * ═══════════════════════════════════════════════════════════════
 *  MÓDULO DE CONSTATAÇÃO — AI Document Verification Engine
 * ═══════════════════════════════════════════════════════════════
 *
 * Este módulo recebe os dados brutos extraídos pelo OCR/MRZ e executa
 * uma série de verificações inteligentes para constatar a validade,
 * consistência e completude dos dados antes de enviá-los ao módulo
 * de recepção (Form Receiver).
 *
 * PIPELINE DE VERIFICAÇÃO:
 * 1. Validação de formato (regex por tipo de campo)
 * 2. Validação de consistência lógica (datas, checksums, relações)
 * 3. Validação de país (ISO 3166-1 alpha-3)
 * 4. Detecção de tipo de documento
 * 5. Cálculo de score de confiança por campo
 * 6. Geração do payload verificado (VerifiedDocumentPayload)
 */

import type { MergedDocumentScanResult, BookingDocumentType } from "./documentScan";

// ─── TIPOS ─────────────────────────────────────────────────

export type FieldStatus = "verified" | "warning" | "error" | "empty";

export interface FieldVerification {
  value: string;
  status: FieldStatus;
  confidence: number;       // 0-100
  message?: string;         // Mensagem de verificação (i18n key)
  correctedValue?: string;  // Valor corrigido automaticamente (se aplicável)
}

export interface VerifiedDocumentPayload {
  // Campos verificados individualmente
  givenName: FieldVerification;
  familyName: FieldVerification;
  bornOn: FieldVerification;
  gender: FieldVerification;
  documentNumber: FieldVerification;
  documentExpiryDate: FieldVerification;
  nationality: FieldVerification;
  issuingCountry: FieldVerification;
  documentType: FieldVerification;

  // Metadados globais
  overallConfidence: number;
  overallStatus: "approved" | "review_needed" | "rejected";
  verificationTimestamp: string;
  fieldsVerified: number;
  fieldsTotal: number;
  fieldsWithWarnings: number;
  fieldsWithErrors: number;
  source: string;
  summary: string;          // i18n key para resumo
}

// ─── BANCO DE PAÍSES ISO 3166-1 ALPHA-3 ───────────────────

const VALID_COUNTRY_CODES = new Set([
  "AFG","ALB","DZA","AND","AGO","ATG","ARG","ARM","AUS","AUT","AZE","BHS","BHR","BGD","BRB",
  "BLR","BEL","BLZ","BEN","BTN","BOL","BIH","BWA","BRA","BRN","BGR","BFA","BDI","CPV","KHM",
  "CMR","CAN","CAF","TCD","CHL","CHN","COL","COM","COG","COD","CRI","CIV","HRV","CUB","CYP",
  "CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH","FJI","FIN",
  "FRA","GAB","GMB","GEO","DEU","GHA","GRC","GRD","GTM","GIN","GNB","GUY","HTI","HND","HUN",
  "ISL","IND","IDN","IRN","IRQ","IRL","ISR","ITA","JAM","JPN","JOR","KAZ","KEN","KIR","PRK",
  "KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MDG","MWI","MYS",
  "MDV","MLI","MLT","MHL","MRT","MUS","MEX","FSM","MDA","MCO","MNG","MNE","MAR","MOZ","MMR",
  "NAM","NRU","NPL","NLD","NZL","NIC","NER","NGA","MKD","NOR","OMN","PAK","PLW","PAN","PNG",
  "PRY","PER","PHL","POL","PRT","QAT","ROU","RUS","RWA","KNA","LCA","VCT","WSM","SMR","STP",
  "SAU","SEN","SRB","SYC","SLE","SGP","SVK","SVN","SLB","SOM","ZAF","SSD","ESP","LKA","SDN",
  "SUR","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TON","TTO","TUN","TUR","TKM",
  "TUV","UGA","UKR","ARE","GBR","USA","URY","UZB","VUT","VEN","VNM","YEM","ZMB","ZWE",
  // Códigos especiais ICAO
  "D","GBD","GBN","GBO","GBS","UNA","UNK","UNO","XBA","XIM","XXA","XXB","XXC","XXX",
]);

// Mapeamento de códigos comuns de MRZ para ISO 3166-1
const COUNTRY_CODE_ALIASES: Record<string, string> = {
  "D": "DEU",
  "GBD": "GBR",
  "GBN": "GBR",
  "GBO": "GBR",
  "GBS": "GBR",
  "ROU": "ROU",
  "EUE": "EUR",
};

// ─── VALIDADORES DE CAMPO ──────────────────────────────────

function verifyName(value: string, fieldKey: string): FieldVerification {
  if (!value || !value.trim()) {
    return { value: "", status: "empty", confidence: 0, message: `verify_${fieldKey}_empty` };
  }

  const cleaned = value.trim();
  const warnings: string[] = [];
  let confidence = 100;

  // Verificar se contém apenas letras, espaços, hífens e apóstrofos
  if (/[0-9]/.test(cleaned)) {
    confidence -= 30;
    warnings.push("contains_numbers");
  }

  // Verificar comprimento mínimo
  if (cleaned.length < 2) {
    confidence -= 20;
    warnings.push("too_short");
  }

  // Verificar se não é tudo maiúscula (OCR pode ter lido errado)
  // Não penalizar — MRZ sempre retorna maiúsculas

  // Verificar caracteres especiais estranhos
  if (/[!@#$%^&*()+=\[\]{};:"\\|,.<>?/~`]/.test(cleaned)) {
    confidence -= 25;
    warnings.push("special_chars");
  }

  // Verificar se parece com um nome real (pelo menos uma vogal)
  if (!/[aeiouAEIOUÀ-ÿ]/.test(cleaned)) {
    confidence -= 15;
    warnings.push("no_vowels");
  }

  const status: FieldStatus = confidence >= 80 ? "verified" : confidence >= 50 ? "warning" : "error";

  return {
    value: cleaned,
    status,
    confidence: Math.max(0, confidence),
    message: warnings.length > 0 ? `verify_${fieldKey}_${warnings[0]}` : undefined,
  };
}

function verifyDate(value: string, fieldKey: string, type: "birth" | "expiry"): FieldVerification {
  if (!value || !value.trim()) {
    return { value: "", status: "empty", confidence: 0, message: `verify_${fieldKey}_empty` };
  }

  const cleaned = value.trim();
  let confidence = 100;
  const warnings: string[] = [];

  // Verificar formato ISO
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return { value: cleaned, status: "error", confidence: 20, message: `verify_${fieldKey}_format` };
  }

  const date = new Date(cleaned);
  const now = new Date();

  // Verificar se é uma data válida
  if (isNaN(date.getTime())) {
    return { value: cleaned, status: "error", confidence: 10, message: `verify_${fieldKey}_invalid` };
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Verificar mês válido
  if (month < 1 || month > 12) {
    confidence -= 40;
    warnings.push("invalid_month");
  }

  // Verificar dia válido
  if (day < 1 || day > 31) {
    confidence -= 40;
    warnings.push("invalid_day");
  }

  if (type === "birth") {
    // Data de nascimento não pode ser no futuro
    if (date > now) {
      confidence -= 50;
      warnings.push("future_birth");
    }

    // Verificar idade razoável (0-120 anos)
    const age = now.getFullYear() - year;
    if (age > 120) {
      confidence -= 30;
      warnings.push("too_old");
    }
    if (age < 0) {
      confidence -= 50;
      warnings.push("negative_age");
    }

    // Verificar se é bebê (menos de 1 ano) — possível mas flag
    if (age === 0) {
      confidence -= 5;
      warnings.push("infant");
    }
  }

  if (type === "expiry") {
    // Verificar se já expirou
    if (date < now) {
      confidence -= 20;
      warnings.push("expired");
    }

    // Verificar se a validade é razoável (não mais de 15 anos no futuro)
    const yearsAhead = year - now.getFullYear();
    if (yearsAhead > 15) {
      confidence -= 25;
      warnings.push("too_far_future");
    }

    // Verificar se a validade é no passado distante (mais de 10 anos)
    if (yearsAhead < -10) {
      confidence -= 30;
      warnings.push("long_expired");
    }
  }

  const status: FieldStatus = confidence >= 80 ? "verified" : confidence >= 50 ? "warning" : "error";

  return {
    value: cleaned,
    status,
    confidence: Math.max(0, confidence),
    message: warnings.length > 0 ? `verify_${fieldKey}_${warnings[0]}` : undefined,
  };
}

function verifyDocumentNumber(value: string): FieldVerification {
  if (!value || !value.trim()) {
    return { value: "", status: "empty", confidence: 0, message: "verify_docnum_empty" };
  }

  const cleaned = value.trim().toUpperCase();
  let confidence = 100;
  const warnings: string[] = [];

  // Verificar comprimento (maioria dos documentos tem 6-12 caracteres)
  if (cleaned.length < 4) {
    confidence -= 30;
    warnings.push("too_short");
  }
  if (cleaned.length > 20) {
    confidence -= 20;
    warnings.push("too_long");
  }

  // Verificar se contém apenas alfanuméricos
  if (/[^A-Z0-9]/.test(cleaned)) {
    confidence -= 25;
    warnings.push("special_chars");
  }

  // Verificar se não é tudo zeros ou tudo letras iguais
  if (/^(.)\1+$/.test(cleaned)) {
    confidence -= 40;
    warnings.push("repeated_chars");
  }

  // Verificar se tem pelo menos um número (maioria dos documentos)
  if (!/\d/.test(cleaned)) {
    confidence -= 10;
    warnings.push("no_digits");
  }

  const status: FieldStatus = confidence >= 80 ? "verified" : confidence >= 50 ? "warning" : "error";

  return {
    value: cleaned,
    status,
    confidence: Math.max(0, confidence),
    message: warnings.length > 0 ? `verify_docnum_${warnings[0]}` : undefined,
  };
}

function verifyGender(value: string): FieldVerification {
  if (!value || !value.trim()) {
    return { value: "", status: "empty", confidence: 0, message: "verify_gender_empty" };
  }

  const cleaned = value.trim().toLowerCase();
  if (cleaned === "m" || cleaned === "f") {
    return { value: cleaned, status: "verified", confidence: 100 };
  }

  // Tentar corrigir
  if (cleaned === "male" || cleaned === "masculino" || cleaned === "masculin") {
    return { value: "m", status: "verified", confidence: 95, correctedValue: "m" };
  }
  if (cleaned === "female" || cleaned === "feminino" || cleaned === "femenino" || cleaned === "féminin") {
    return { value: "f", status: "verified", confidence: 95, correctedValue: "f" };
  }

  return { value: cleaned, status: "warning", confidence: 40, message: "verify_gender_unknown" };
}

function verifyCountryCode(value: string, fieldKey: string): FieldVerification {
  if (!value || !value.trim()) {
    return { value: "", status: "empty", confidence: 0, message: `verify_${fieldKey}_empty` };
  }

  let cleaned = value.trim().toUpperCase();
  let confidence = 100;
  const warnings: string[] = [];

  // Verificar se é um alias conhecido
  if (COUNTRY_CODE_ALIASES[cleaned]) {
    cleaned = COUNTRY_CODE_ALIASES[cleaned];
  }

  // Verificar comprimento
  if (cleaned.length !== 3 && cleaned.length !== 1) {
    confidence -= 30;
    warnings.push("invalid_length");
  }

  // Verificar se é um código válido
  if (!VALID_COUNTRY_CODES.has(cleaned)) {
    confidence -= 25;
    warnings.push("unknown_code");
  }

  // Verificar se contém apenas letras
  if (/[^A-Z]/.test(cleaned)) {
    confidence -= 30;
    warnings.push("non_alpha");
  }

  const status: FieldStatus = confidence >= 80 ? "verified" : confidence >= 50 ? "warning" : "error";

  return {
    value: cleaned,
    status,
    confidence: Math.max(0, confidence),
    correctedValue: COUNTRY_CODE_ALIASES[value.trim().toUpperCase()] || undefined,
    message: warnings.length > 0 ? `verify_${fieldKey}_${warnings[0]}` : undefined,
  };
}

function verifyDocumentType(value: string): FieldVerification {
  if (!value || !value.trim()) {
    return { value: "other", status: "warning", confidence: 50, message: "verify_doctype_unknown" };
  }

  const validTypes: BookingDocumentType[] = ["passport", "national_id", "drivers_license", "travel_document", "other"];
  const cleaned = value.trim().toLowerCase() as BookingDocumentType;

  if (validTypes.includes(cleaned)) {
    return { value: cleaned, status: "verified", confidence: cleaned === "other" ? 60 : 95 };
  }

  return { value: "other", status: "warning", confidence: 40, message: "verify_doctype_unknown" };
}

// ─── VALIDAÇÕES CRUZADAS ───────────────────────────────────

function crossValidateDates(
  birthVerified: FieldVerification,
  expiryVerified: FieldVerification
): { birth: FieldVerification; expiry: FieldVerification } {
  const birth = { ...birthVerified };
  const expiry = { ...expiryVerified };

  if (birth.status === "empty" || expiry.status === "empty") return { birth, expiry };

  const birthDate = new Date(birth.value);
  const expiryDate = new Date(expiry.value);

  if (isNaN(birthDate.getTime()) || isNaN(expiryDate.getTime())) return { birth, expiry };

  // Documento não pode expirar antes do nascimento
  if (expiryDate < birthDate) {
    expiry.confidence = Math.max(0, expiry.confidence - 30);
    expiry.status = "warning";
    expiry.message = "verify_expiry_before_birth";
    birth.confidence = Math.max(0, birth.confidence - 10);
  }

  // Verificar se a pessoa tinha pelo menos 0 anos quando o documento foi emitido
  // (validade - 10 anos = emissão aproximada)
  const approxIssueDate = new Date(expiryDate);
  approxIssueDate.setFullYear(approxIssueDate.getFullYear() - 10);
  if (approxIssueDate < birthDate) {
    // Documento emitido antes do nascimento — possível para passaportes de bebês
    // Não penalizar muito
  }

  return { birth, expiry };
}

function crossValidateNationality(
  nationality: FieldVerification,
  issuingCountry: FieldVerification
): { nationality: FieldVerification; issuingCountry: FieldVerification } {
  const nat = { ...nationality };
  const iss = { ...issuingCountry };

  // Se ambos estão presentes e são iguais, aumentar confiança
  if (nat.value && iss.value && nat.value === iss.value) {
    nat.confidence = Math.min(100, nat.confidence + 5);
    iss.confidence = Math.min(100, iss.confidence + 5);
  }

  return { nationality: nat, issuingCountry: iss };
}

// ─── PIPELINE PRINCIPAL ────────────────────────────────────

export function verifyDocument(raw: MergedDocumentScanResult): VerifiedDocumentPayload {
  // 1. Verificar cada campo individualmente
  const givenName = verifyName(raw.givenName, "given_name");
  const familyName = verifyName(raw.familyName, "family_name");
  let bornOn = verifyDate(raw.bornOn, "birth_date", "birth");
  let documentExpiryDate = verifyDate(raw.passportExpiryDate, "expiry_date", "expiry");
  const gender = verifyGender(raw.gender);
  const documentNumber = verifyDocumentNumber(raw.passportNumber);
  let nationality = verifyCountryCode(raw.nationality, "nationality");
  let issuingCountry = verifyCountryCode(raw.passportIssuingCountry, "issuing_country");
  const documentType = verifyDocumentType(raw.documentType);

  // 2. Validações cruzadas
  const datesCross = crossValidateDates(bornOn, documentExpiryDate);
  bornOn = datesCross.birth;
  documentExpiryDate = datesCross.expiry;

  const countryCross = crossValidateNationality(nationality, issuingCountry);
  nationality = countryCross.nationality;
  issuingCountry = countryCross.issuingCountry;

  // 3. Calcular métricas globais
  const allFields = [givenName, familyName, bornOn, gender, documentNumber, documentExpiryDate, nationality, issuingCountry, documentType];
  const nonEmpty = allFields.filter(f => f.status !== "empty");
  const fieldsVerified = allFields.filter(f => f.status === "verified").length;
  const fieldsWithWarnings = allFields.filter(f => f.status === "warning").length;
  const fieldsWithErrors = allFields.filter(f => f.status === "error").length;

  // Confiança global = média ponderada
  const weights: Record<string, number> = {
    givenName: 15,
    familyName: 15,
    bornOn: 12,
    gender: 5,
    documentNumber: 20,
    documentExpiryDate: 10,
    nationality: 8,
    issuingCountry: 8,
    documentType: 7,
  };

  const fieldMap: Record<string, FieldVerification> = {
    givenName, familyName, bornOn, gender, documentNumber, documentExpiryDate, nationality, issuingCountry, documentType,
  };

  let totalWeight = 0;
  let weightedSum = 0;
  for (const [key, field] of Object.entries(fieldMap)) {
    const w = weights[key] || 10;
    totalWeight += w;
    weightedSum += field.confidence * w;
  }

  const overallConfidence = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // 4. Determinar status global
  let overallStatus: "approved" | "review_needed" | "rejected";
  if (overallConfidence >= 75 && fieldsWithErrors === 0) {
    overallStatus = "approved";
  } else if (overallConfidence >= 45 || fieldsVerified >= 4) {
    overallStatus = "review_needed";
  } else {
    overallStatus = "rejected";
  }

  // 5. Gerar resumo
  let summary: string;
  if (overallStatus === "approved") {
    summary = "verification_approved";
  } else if (overallStatus === "review_needed") {
    summary = "verification_review";
  } else {
    summary = "verification_rejected";
  }

  return {
    givenName,
    familyName,
    bornOn,
    gender,
    documentNumber,
    documentExpiryDate,
    nationality,
    issuingCountry,
    documentType,
    overallConfidence,
    overallStatus,
    verificationTimestamp: new Date().toISOString(),
    fieldsVerified,
    fieldsTotal: allFields.length,
    fieldsWithWarnings,
    fieldsWithErrors,
    source: raw.source,
    summary,
  };
}

// ─── UTILITÁRIOS ───────────────────────────────────────────

/**
 * Converte o payload verificado de volta para MergedDocumentScanResult
 * (usando valores corrigidos quando disponíveis)
 */
export function toMergedResult(verified: VerifiedDocumentPayload): MergedDocumentScanResult {
  return {
    givenName: verified.givenName.correctedValue || verified.givenName.value,
    familyName: verified.familyName.correctedValue || verified.familyName.value,
    bornOn: verified.bornOn.correctedValue || verified.bornOn.value,
    gender: (verified.gender.correctedValue || verified.gender.value) as "m" | "f" | "",
    passportNumber: verified.documentNumber.correctedValue || verified.documentNumber.value,
    passportExpiryDate: verified.documentExpiryDate.correctedValue || verified.documentExpiryDate.value,
    nationality: verified.nationality.correctedValue || verified.nationality.value,
    passportIssuingCountry: verified.issuingCountry.correctedValue || verified.issuingCountry.value,
    documentType: (verified.documentType.correctedValue || verified.documentType.value) as BookingDocumentType,
    rawDocumentType: verified.documentType.value,
    confidence: verified.overallConfidence,
    warnings: getVerificationWarnings(verified),
    notes: verified.summary,
    source: verified.source as "mrz" | "ocr-assisted",
  };
}

/**
 * Extrai todas as warnings do payload verificado
 */
export function getVerificationWarnings(verified: VerifiedDocumentPayload): string[] {
  const warnings: string[] = [];
  const fields = [
    verified.givenName, verified.familyName, verified.bornOn, verified.gender,
    verified.documentNumber, verified.documentExpiryDate, verified.nationality,
    verified.issuingCountry, verified.documentType,
  ];
  for (const field of fields) {
    if (field.message) warnings.push(field.message);
  }
  return warnings;
}

/**
 * Verifica se o payload está pronto para distribuição automática
 */
export function isReadyForAutoFill(verified: VerifiedDocumentPayload): boolean {
  return verified.overallStatus !== "rejected" && verified.fieldsVerified >= 3;
}
