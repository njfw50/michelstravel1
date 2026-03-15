import { getChatbotAiClient } from "./chatbotAi";

export interface DocumentScannerAiInput {
  documentImageDataUrl: string;
  mrzImageDataUrl?: string | null;
  rawOcrText?: string | null;
  mrzResult?: Record<string, unknown> | null;
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
}

export interface DocumentScannerAiResponse {
  available: boolean;
  candidate: DocumentScannerAiCandidate | null;
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
    };
  } catch {
    return null;
  }
}

export async function analyzeDocumentScanWithAi(
  input: DocumentScannerAiInput,
): Promise<DocumentScannerAiResponse> {
  const config = getChatbotAiClient();
  if (!config.available || !config.client || !config.primaryModel) {
    return { available: false, candidate: null };
  }

  try {
    const response = await config.client.chat.completions.create({
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
    });

    const content = response.choices[0]?.message?.content;
    const candidate = safeParseCandidate(content);

    return {
      available: true,
      candidate,
    };
  } catch (error) {
    console.error("[DOCUMENT SCANNER AI] Analysis failed:", error);
    return {
      available: true,
      candidate: null,
    };
  }
}
