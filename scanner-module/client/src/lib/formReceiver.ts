/**
 * ═══════════════════════════════════════════════════════════════
 *  MÓDULO DE RECEPÇÃO — Form Receiver (Distribuidor de Dados)
 * ═══════════════════════════════════════════════════════════════
 *
 * Este módulo recebe o payload verificado pelo módulo de Constatação
 * e distribui os dados nos inputs corretos do formulário de reserva.
 *
 * RESPONSABILIDADES:
 * 1. Mapear campos verificados → campos do formulário
 * 2. Aplicar valores com status visual (verde=verificado, amarelo=warning, vermelho=erro)
 * 3. Priorizar valores corrigidos automaticamente
 * 4. Gerar relatório de distribuição
 * 5. Emitir eventos para animação de preenchimento
 */

import type {
  VerifiedDocumentPayload,
  FieldVerification,
  FieldStatus,
} from "./documentVerification";

// ─── TIPOS ─────────────────────────────────────────────────

export type FormFieldKey =
  | "title"
  | "givenName"
  | "familyName"
  | "bornOn"
  | "gender"
  | "email"
  | "phoneNumber"
  | "documentType"
  | "documentNumber"
  | "documentExpiryDate"
  | "documentIssuingCountry"
  | "nationality";

export interface FormFieldMapping {
  formField: FormFieldKey;
  value: string;
  status: FieldStatus;
  confidence: number;
  autoFilled: boolean;
  message?: string;
}

export interface FormDistributionResult {
  mappings: FormFieldMapping[];
  filledCount: number;
  totalMapped: number;
  skippedCount: number;
  overallStatus: "success" | "partial" | "failed";
  animationSequence: FormFieldKey[];
}

// ─── MAPEAMENTO VERIFICADO → FORMULÁRIO ────────────────────

interface FieldMapEntry {
  formField: FormFieldKey;
  getVerification: (payload: VerifiedDocumentPayload) => FieldVerification;
  transform?: (value: string) => string;
}

const FIELD_MAP: FieldMapEntry[] = [
  {
    formField: "givenName",
    getVerification: (p) => p.givenName,
  },
  {
    formField: "familyName",
    getVerification: (p) => p.familyName,
  },
  {
    formField: "bornOn",
    getVerification: (p) => p.bornOn,
  },
  {
    formField: "gender",
    getVerification: (p) => p.gender,
  },
  {
    formField: "documentType",
    getVerification: (p) => p.documentType,
  },
  {
    formField: "documentNumber",
    getVerification: (p) => p.documentNumber,
    transform: (v) => v.toUpperCase(),
  },
  {
    formField: "documentExpiryDate",
    getVerification: (p) => p.documentExpiryDate,
  },
  {
    formField: "nationality",
    getVerification: (p) => p.nationality,
    transform: (v) => v.toUpperCase(),
  },
  {
    formField: "documentIssuingCountry",
    getVerification: (p) => p.issuingCountry,
    transform: (v) => v.toUpperCase(),
  },
];

// ─── INFERÊNCIA DE TÍTULO ──────────────────────────────────

function inferTitle(gender: string): string {
  if (gender === "m") return "mr";
  if (gender === "f") return "mrs";
  return "mr"; // default
}

// ─── DISTRIBUIDOR PRINCIPAL ────────────────────────────────

export function distributeToForm(
  payload: VerifiedDocumentPayload
): FormDistributionResult {
  const mappings: FormFieldMapping[] = [];
  const animationSequence: FormFieldKey[] = [];
  let filledCount = 0;
  let skippedCount = 0;

  for (const entry of FIELD_MAP) {
    const verification = entry.getVerification(payload);

    // Usar valor corrigido se disponível, senão o original
    let value = verification.correctedValue || verification.value;

    // Aplicar transformação se definida
    if (value && entry.transform) {
      value = entry.transform(value);
    }

    const autoFilled = verification.status !== "empty" && !!value;

    if (autoFilled) {
      filledCount++;
      animationSequence.push(entry.formField);
    } else {
      skippedCount++;
    }

    mappings.push({
      formField: entry.formField,
      value: value || "",
      status: verification.status,
      confidence: verification.confidence,
      autoFilled,
      message: verification.message,
    });
  }

  // Inferir título a partir do gênero
  const genderMapping = mappings.find(m => m.formField === "gender");
  if (genderMapping && genderMapping.autoFilled) {
    const titleValue = inferTitle(genderMapping.value);
    mappings.push({
      formField: "title",
      value: titleValue,
      status: "verified",
      confidence: genderMapping.confidence,
      autoFilled: true,
    });
    filledCount++;
    animationSequence.unshift("title"); // Título primeiro na animação
  }

  const totalMapped = mappings.length;

  // Determinar status geral
  let overallStatus: "success" | "partial" | "failed";
  if (filledCount >= 6) {
    overallStatus = "success";
  } else if (filledCount >= 3) {
    overallStatus = "partial";
  } else {
    overallStatus = "failed";
  }

  return {
    mappings,
    filledCount,
    totalMapped,
    skippedCount,
    overallStatus,
    animationSequence,
  };
}

// ─── CONVERTER PARA OBJETO DE FORMULÁRIO ───────────────────

export interface PassengerFormData {
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

const EMPTY_FORM: PassengerFormData = {
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

/**
 * Converte o resultado da distribuição em um objeto de formulário pronto para uso
 */
export function toFormData(distribution: FormDistributionResult): PassengerFormData {
  const formData = { ...EMPTY_FORM };

  for (const mapping of distribution.mappings) {
    if (mapping.autoFilled && mapping.value) {
      (formData as Record<string, string>)[mapping.formField] = mapping.value;
    }
  }

  return formData;
}

/**
 * Retorna o mapa de status de cada campo para coloração visual
 */
export function getFieldStatusMap(distribution: FormDistributionResult): Record<FormFieldKey, FieldStatus> {
  const statusMap: Partial<Record<FormFieldKey, FieldStatus>> = {};

  for (const mapping of distribution.mappings) {
    statusMap[mapping.formField] = mapping.autoFilled ? mapping.status : "empty";
  }

  return statusMap as Record<FormFieldKey, FieldStatus>;
}

/**
 * Retorna o mapa de confiança de cada campo
 */
export function getFieldConfidenceMap(distribution: FormDistributionResult): Record<FormFieldKey, number> {
  const confMap: Partial<Record<FormFieldKey, number>> = {};

  for (const mapping of distribution.mappings) {
    confMap[mapping.formField] = mapping.confidence;
  }

  return confMap as Record<FormFieldKey, number>;
}

/**
 * Gera a classe CSS para o status de um campo
 */
export function getFieldStatusClass(status: FieldStatus): string {
  switch (status) {
    case "verified":
      return "border-green-400 bg-green-50/60 ring-1 ring-green-200";
    case "warning":
      return "border-amber-400 bg-amber-50/60 ring-1 ring-amber-200";
    case "error":
      return "border-red-400 bg-red-50/60 ring-1 ring-red-200";
    case "empty":
    default:
      return "border-border bg-white";
  }
}

/**
 * Gera o ícone indicador para o status de um campo
 */
export function getFieldStatusIcon(status: FieldStatus): "check" | "alert" | "error" | null {
  switch (status) {
    case "verified": return "check";
    case "warning": return "alert";
    case "error": return "error";
    default: return null;
  }
}
