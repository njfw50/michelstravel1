import { getChatbotAiClient } from "./chatbotAi";
import { parse as parseMrz } from "mrz";
import { docTypeFromMrzCode, isTsaAcceptedDocument, normalizeDocumentType } from "@shared/tsaAcceptedDocs";

export interface DocumentScannerAiInput {
  documentImageDataUrl: string;
  mrzImageDataUrl?: string | null;
  rawOcrText?: string | null;
  mrzResult?: Record<string, unknown> | null;
  declaredDocumentType?: string | null;
}

export interface DocumentScannerAiCandidate {
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
}

export interface DocumentScannerAiResponse {
  available: boolean;
  candidate: DocumentScannerAiCandidate | null;
  engine?: "mrz" | "ai" | "merge" | "none";
  warnings?: string[];
}

function safeParseCandidate(payload: string | null | undefined): DocumentScannerAiCandidate | null {
  if (!payload) return null;

  try {
    const parsed = JSON.parse(payload) as DocumentScannerAiCandidate;
    return {
      givenName: parsed.givenName || "",
      familyName: parsed.familyName || "",
      bornOn: parsed.bornOn || "",
      gender: parsed.gender || "",
      documentNumber: parsed.documentNumber || "",
      passportExpiryDate: parsed.passportExpiryDate || "",
      nationality: parsed.nationality || "",
      passportIssuingCountry: parsed.passportIssuingCountry || "",
      documentType: parsed.documentType || "",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.filter((warning) => typeof warning === "string") : [],
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      source: parsed.source as any ?? null,
    };
  } catch {
    return null;
  }
}

function parseMrzText(mrzText: string): { candidate: DocumentScannerAiCandidate | null; warnings: string[] } {
  const warnings: string[] = [];
  try {
    const lines = mrzText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
    if (lines.length < 2) return { candidate: null, warnings: ["mrz_not_detected"] };
    const parsed = parseMrz(lines.join("\n"));
    if (!parsed || !parsed.fields) return { candidate: null, warnings: ["mrz_parse_failed"] };
    const f: any = parsed.fields;
    const checksumWarnings = ((parsed as any).errors || (parsed as any).details || []).map((err: any) => `mrz_checksum:${err.code ?? "unknown"}`);
    warnings.push(...checksumWarnings);
    const candidate: DocumentScannerAiCandidate = {
      givenName: (f.firstName || "").replace(/</g, " ").trim(),
      familyName: (f.lastName || "").replace(/</g, " ").trim(),
      bornOn: f.birthDate || "",
      gender: (f.sex || "").toLowerCase() === "f" ? "f" : (f.sex || "").toLowerCase() === "m" ? "m" : "",
      documentNumber: f.documentNumber || "",
      passportExpiryDate: f.expirationDate || "",
      nationality: (f.nationality || "").toUpperCase() || "",
      passportIssuingCountry: (f.country || "").toUpperCase() || "",
      documentType: docTypeFromMrzCode(f.documentType),
      confidence: checksumWarnings.length === 0 ? 85 : 70,
      warnings,
      notes: checksumWarnings.length ? "MRZ checksum warnings present" : "",
      source: "mrz",
    };
    return { candidate, warnings };
  } catch {
    return { candidate: null, warnings: ["mrz_exception"] };
  }
}

function extractMrzFromInput(input: DocumentScannerAiInput): string | null {
  const mrzResult = input.mrzResult as any;
  if (mrzResult) {
    if (typeof mrzResult === "string") return mrzResult;
    if (Array.isArray(mrzResult.lines)) {
      return mrzResult.lines.join("\n");
    }
    if (typeof mrzResult.mrz === "string") return mrzResult.mrz;
  }
  if (input.rawOcrText) {
    const lines = input.rawOcrText.split(/\r?\n/).map(l => l.trim());
    const mrzLines = lines.filter(l => l.includes("<") && l.length >= 25);
    if (mrzLines.length >= 2) return mrzLines.slice(0, 3).join("\n");
  }
  return null;
}

async function recognizeMrzWithTesseract(imageDataUrl: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const base64 = imageDataUrl.split(",")[1] || "";
    const buffer = Buffer.from(base64, "base64");
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("ocrb");
    const timeout = setTimeout(() => worker.terminate(), timeoutMs);
    try {
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
      });
      const { data } = await worker.recognize(buffer);
      return data?.text ?? null;
    } finally {
      clearTimeout(timeout);
      await worker.terminate();
    }
  } catch (error) {
    console.error("[DOCUMENT SCANNER] Tesseract MRZ failed:", error);
    return null;
  }
}

function mergeCandidates(primary: DocumentScannerAiCandidate | null, secondary: DocumentScannerAiCandidate | null): DocumentScannerAiCandidate | null {
  if (!primary && !secondary) return null;
  if (primary && !secondary) return primary;
  if (!primary && secondary) return secondary;
  const merged: DocumentScannerAiCandidate = {
    givenName: primary!.givenName || secondary!.givenName || "",
    familyName: primary!.familyName || secondary!.familyName || "",
    bornOn: primary!.bornOn || secondary!.bornOn || "",
    gender: primary!.gender || secondary!.gender || "",
    documentNumber: primary!.documentNumber || secondary!.documentNumber || "",
    passportExpiryDate: primary!.passportExpiryDate || secondary!.passportExpiryDate || "",
    nationality: primary!.nationality || secondary!.nationality || "",
    passportIssuingCountry: primary!.passportIssuingCountry || secondary!.passportIssuingCountry || "",
    documentType: primary!.documentType || secondary!.documentType || "",
    confidence: Math.max(primary!.confidence ?? 0, secondary!.confidence ?? 0),
    warnings: [...(primary!.warnings || []), ...(secondary!.warnings || [])],
    notes: primary!.notes || secondary!.notes || "",
    source: "merge",
  };
  return merged;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => void): Promise<T | null> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<null>((resolve) => {
      timer = setTimeout(() => {
        onTimeout();
        resolve(null);
      }, ms);
    }),
  ]);
}

export async function analyzeDocumentScanWithAi(
  input: DocumentScannerAiInput,
): Promise<DocumentScannerAiResponse> {
  const config = getChatbotAiClient();
  if (!config.available || !config.client || !config.primaryModel) {
    return { available: false, candidate: null, engine: "none", warnings: ["ai_not_configured"] };
  }

  const warnings: string[] = [];

  // Basic size guard (5MB)
  const base64 = input.documentImageDataUrl.split(",")[1] || "";
  const imgBytes = Buffer.byteLength(base64, "base64");
  if (imgBytes > 5 * 1024 * 1024) {
    warnings.push("image_too_large");
  }

  // Step 1: MRZ from provided data or OCR fallback
  let mrzCandidate: DocumentScannerAiCandidate | null = null;
  const mrzTextFromInput = extractMrzFromInput(input);
  if (mrzTextFromInput) {
    const parsed = parseMrzText(mrzTextFromInput);
    warnings.push(...parsed.warnings);
    mrzCandidate = parsed.candidate;
  } else {
    const mrzFromOcr = await recognizeMrzWithTesseract(input.mrzImageDataUrl || input.documentImageDataUrl).catch(() => null);
    if (mrzFromOcr) {
      const parsed = parseMrzText(mrzFromOcr);
      warnings.push(...parsed.warnings);
      mrzCandidate = parsed.candidate;
    }
  }

  // Step 2: AI extraction with timeout
  let aiCandidate: DocumentScannerAiCandidate | null = null;
  try {
    const response = await withTimeout(
      config.client.chat.completions.create({
        model: config.primaryModel,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text:
                  "You read travel documents and return only JSON. Prefer exact values from MRZ when they look valid. Use the document photo to repair OCR mistakes like O/0, I/1, B/8 and split first name vs family name. Dates must be YYYY-MM-DD. Gender must be m, f, or empty. Nationality and issuing country must be 3-letter ISO codes when visible. documentType must be one of passport, id_card, national_id, drivers_license, travel_doc, travel_document, visa, or other. confidence must be a number from 0 to 100. warnings must be plain string tokens. notes must explain briefly what still needs manual review.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  task: "Read the document and extract booking fields.",
                  rawOcrText: input.rawOcrText || "",
                  mrzResult: input.mrzResult || null,
                  requiredJsonShape: {
                    givenName: "",
                    familyName: "",
                    bornOn: "",
                    gender: "",
                    documentNumber: "",
                    passportExpiryDate: "",
                    nationality: "",
                    passportIssuingCountry: "",
                    documentType: "",
                    confidence: 0,
                    warnings: [],
                    notes: "",
                  },
                }),
              },
              {
                type: "image_url",
                image_url: {
                  url: input.documentImageDataUrl,
                },
              },
              ...(input.mrzImageDataUrl
                ? [
                    {
                      type: "image_url" as const,
                      image_url: {
                        url: input.mrzImageDataUrl,
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
      }),
      12000,
      () => warnings.push("ai_timeout"),
    );

    if (response) {
      const content = (response as any).choices?.[0]?.message?.content;
      aiCandidate = safeParseCandidate(content);
      if (aiCandidate) {
        aiCandidate.source = "ai";
      }
    }
  } catch (error) {
    console.error("[DOCUMENT SCANNER AI] Analysis failed:", error);
    warnings.push("ai_exception");
  }

  const merged = mergeCandidates(aiCandidate, mrzCandidate);
  const engine: DocumentScannerAiResponse["engine"] =
    merged?.source === "merge" ? "merge" : merged?.source === "mrz" ? "mrz" : merged ? "ai" : "none";

  const declaredType = normalizeDocumentType(input.declaredDocumentType);
  const detectedType = normalizeDocumentType(merged?.documentType);

  if (merged && detectedType !== "other") {
    merged.documentType = detectedType;
  }

  if (declaredType !== "other" && detectedType !== "other" && declaredType !== detectedType) {
    warnings.push("id_type_mismatch");
  }

  const effectiveType = detectedType !== "other" ? detectedType : declaredType;
  if (effectiveType && !isTsaAcceptedDocument(effectiveType)) {
    warnings.push("tsa_not_accepted");
  }

  const dedupedWarnings = Array.from(new Set(warnings));

  return {
    available: true,
    candidate: merged,
    engine,
    warnings: dedupedWarnings,
  };
}
