import { api } from "../lib/api";

export type DocumentScannerCandidate = {
  givenName?: string | null;
  familyName?: string | null;
  bornOn?: string | null;
  gender?: "m" | "f" | "" | null;
  documentNumber?: string | null;
  passportNumber?: string | null;
  passportExpiryDate?: string | null;
  nationality?: string | null;
  passportIssuingCountry?: string | null;
  documentType?: string | null;
  confidence?: number | null;
  warnings?: string[] | null;
  notes?: string | null;
  source?: "mrz" | "ai" | "merge" | "none" | null;
};

export type DocumentScannerResponse = {
  available: boolean;
  candidate: DocumentScannerCandidate | null;
  engine?: "mrz" | "ai" | "merge" | "none";
  warnings?: string[];
};

export async function analyzeDocumentScan(payload: {
  documentImageDataUrl: string;
  declaredDocumentType?: string | null;
}) {
  const response = await api.post<DocumentScannerResponse>(
    "/api/document-scanner/analyze",
    payload,
    { timeout: 20000 },
  );

  return response.data;
}
