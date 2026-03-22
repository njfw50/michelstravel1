import { useState } from "react";
import { TSA_ACCEPTED_DOCS, type TsaDocumentType } from "@shared/tsaAcceptedDocs";

export interface DocumentScannerRequest {
  documentImageDataUrl: string;
  mrzImageDataUrl?: string | null;
  rawOcrText?: string | null;
  mrzResult?: Record<string, unknown> | null;
  declaredDocumentType?: TsaDocumentType | string | null;
}

export interface DocumentScannerResult {
  available: boolean;
  candidate: {
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
    source?: "mrz" | "ai" | "merge" | null;
  } | null;
  engine?: "mrz" | "ai" | "merge" | "none";
  warnings?: string[];
}

export function useDocumentScanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scan(request: DocumentScannerRequest): Promise<DocumentScannerResult | null> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/document-scanner/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error(`Scanner failed: ${response.status}`);
      }
      return (await response.json()) as DocumentScannerResult;
    } catch (err: any) {
      setError(err?.message || "Unknown scanner error");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { scan, loading, error, TSA_ACCEPTED_DOCS };
}
