import { useState, useRef, useCallback, useEffect, type ChangeEvent, type MutableRefObject } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  Shield,
  FileText,
  RotateCcw,
  Eye,
  X,
  Smartphone,
  Sun,
  Maximize2,
  Focus,
  Sparkles,
  Timer,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { parseMRZ, type MRZResult } from "@/lib/mrz";
import { preprocessForMRZ, createPreviewUrl, blobToDataUrl } from "@/lib/imagePreprocess";
import {
  mergeDocumentScanCandidates,
  type DocumentAiCandidate,
  type MergedDocumentScanResult,
} from "@/lib/documentScan";
import Tesseract from "tesseract.js";

type Step = "select" | "processing" | "review" | "error";
type TesseractWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>;

interface ScanAnalyzeResponse {
  available: boolean;
  candidate: DocumentAiCandidate | null;
}

interface ScanDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: MergedDocumentScanResult) => void;
  passengerIndex: number;
  declaredDocumentType?: string | null;
}

type MobileScannerMessage =
  | { type: "DOCUMENT_SCANNER_RESULT"; payload: Partial<MergedDocumentScanResult> }
  | { type: "DOCUMENT_SCANNER_ERROR"; message?: string };

function createWarningLabels(t: (key: string) => string) {
  return {
    doc_number_check_failed: t("scan.warning_doc_number"),
    birth_date_check_failed: t("scan.warning_birth_date"),
    expiry_date_check_failed: t("scan.warning_expiry"),
    unexpected_doc_type: t("scan.warning_type"),
    ai_manual_review: t("scan.warning_manual_review"),
    low_confidence: t("scan.warning_low_confidence"),
  } satisfies Record<string, string>;
}

export function ScanDocumentDialog({
  open,
  onOpenChange,
  onConfirm,
  passengerIndex,
  declaredDocumentType,
}: ScanDocumentDialogProps) {
  const { t } = useI18n();
  const warningLabels = createWarningLabels(t);
  const [step, setStep] = useState<Step>("select");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [progressHint, setProgressHint] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<MergedDocumentScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef(0);
  const mrzProgressRangeRef = useRef({ offset: 20, span: 14 });
  const generalProgressRangeRef = useRef({ offset: 62, span: 10 });

  const isMobileBridge =
    typeof window !== "undefined" && typeof (window as any).ReactNativeWebView !== "undefined";

  const setProgressValue = (value: number) => {
    progressRef.current = value;
    setProgress(value);
  };

  const resetState = useCallback(() => {
    setStep("select");
    setProgressValue(0);
    setProgressLabel("");
    setProgressHint(null);
    setImagePreview(null);
    setEditableData(null);
    setErrorMessage("");
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetState();
    onOpenChange(newOpen);
  };

  // Listen for messages coming back from the mobile app
  useEffect(() => {
    if (!open) return;

    const onMessage = (event: MessageEvent) => {
      let data: any = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== "object") return;
      const msg = data as MobileScannerMessage;

      if (msg.type === "DOCUMENT_SCANNER_RESULT" && msg.payload) {
        const merged: MergedDocumentScanResult = {
          givenName: msg.payload.givenName || "",
          familyName: msg.payload.familyName || "",
          bornOn: msg.payload.bornOn || "",
          gender: (msg.payload.gender as any) || "",
          passportNumber: msg.payload.passportNumber || msg.payload.documentNumber || "",
          passportExpiryDate: msg.payload.passportExpiryDate || "",
          nationality: (msg.payload.nationality || msg.payload.passportIssuingCountry || "").toUpperCase(),
          passportIssuingCountry: (msg.payload.passportIssuingCountry || msg.payload.nationality || "").toUpperCase(),
          documentType: msg.payload.documentType || declaredDocumentType || "passport",
          confidence: msg.payload.confidence ?? 80,
          warnings: msg.payload.warnings || [],
          notes: msg.payload.notes || t("scan.ai_review_ready"),
          source: msg.payload.source || "ai-assisted",
        };
        setEditableData(merged);
        setProgressValue(100);
        setStep("review");
      }

      if (msg.type === "DOCUMENT_SCANNER_ERROR") {
        setErrorMessage(msg.message || t("scan.ocr_error"));
        setStep("error");
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [declaredDocumentType, open, t]);

  // Safety net: if the mobile bridge never responds, surface an error so the user can retry
  useEffect(() => {
    if (!open || step !== "processing" || !isMobileBridge) return;
    const timeout = window.setTimeout(() => {
      setErrorMessage(t("scan.mobile_timeout") || t("scan.ocr_error") || "No response from mobile scanner.");
      setStep("error");
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [isMobileBridge, open, step, t]);

  const requestMobileScan = () => {
    if (!isMobileBridge) return false;
    try {
      setStep("processing");
      setProgressValue(5);
      setProgressLabel(t("scan.step_enhancing"));
      setProgressHint(t("scan.hint_mobile") || t("scan.hint_hold_still") || null);
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "OPEN_DOCUMENT_SCANNER",
          passengerIndex,
          declaredDocumentType: declaredDocumentType || null,
        }),
      );
      return true;
    } catch (err) {
      console.error("Failed to call mobile scanner bridge:", err);
      return false;
    }
  };

  function extractLicenseFields(ocrText: string): DocumentAiCandidate | null {
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

    return {
      givenName: "",
      familyName: "",
      bornOn: dob,
      gender: genderMatch ? genderMatch[1].toLowerCase() as any : "",
      documentNumber: licenseMatch ? licenseMatch[1] : "",
      passportExpiryDate: exp,
      nationality: "USA",
      passportIssuingCountry: "USA",
      documentType: "drivers_license",
      confidence: 55,
      warnings: ["ai_manual_review"],
      notes: "Leitura em modo carteira de motorista",
    };
  }

  /**
   * Builds an OCR worker with a language tuned for the task.
   * - We fetch tessdata from the "best" models (more accurate than default fast models).
   * - For MRZ we use the OCR-B traineddata ("ocrb") which is purpose-built for passports/IDs.
   * - For general text we still use ENG but the best model.
   */
  const createOcrWorker = async (
    lang: "ocrb" | "eng",
    rangeRef: MutableRefObject<{ offset: number; span: number }>,
  ): Promise<TesseractWorker> => {
    const workerPromise = Tesseract.createWorker(lang, Tesseract.OEM.LSTM_ONLY, {
      langPath: "https://tessdata.projectnaptha.com/4.0.0", // mais leve
      logger: (message) => {
        if (message.status === "recognizing text") {
          const nextValue = rangeRef.current.offset + Math.round(message.progress * rangeRef.current.span);
          if (nextValue > progressRef.current) {
            setProgressValue(Math.min(nextValue, 92));
          }
        }
      },
    });

    // Bail out if OCR download is too slow
    const timeoutMs = 8000;
    return Promise.race([
      workerPromise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("ocr_timeout")), timeoutMs)),
    ]);
  };

  const runMrzPass = async (
    worker: TesseractWorker,
    imageBlob: Blob,
    label: string,
    offset: number,
    span: number,
  ): Promise<string> => {
    mrzProgressRangeRef.current = { offset, span };
    setProgressLabel(label);
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
      preserve_interword_spaces: "1",
    });
    const result = await worker.recognize(imageBlob);
    return result.data.text || "";
  };

  const runGeneralPass = async (
    worker: TesseractWorker,
    imageBlob: Blob,
    label: string,
    offset: number,
    span: number,
  ): Promise<string> => {
    generalProgressRangeRef.current = { offset, span };
    setProgressLabel(label);
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: "1",
      tessedit_char_whitelist: "",
    });
    const result = await worker.recognize(imageBlob);
    return result.data.text || "";
  };

  const analyzeWithAi = async (payload: {
    documentImageDataUrl: string;
    mrzImageDataUrl: string;
    rawOcrText: string;
    mrzResult: MRZResult | null;
    declaredDocumentType?: string | null;
  }): Promise<ScanAnalyzeResponse | null> => {
    const response = await fetch("/api/document-scanner/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  };

  const processImage = async (file: File) => {
    setStep("processing");
    setProgressValue(5);
    setProgressLabel(t("scan.step_preparing"));
    setProgressHint(t("scan.hint_hold_still") || null);

    const preview = await createPreviewUrl(file);
    setImagePreview(preview);

    let mrzWorker: TesseractWorker | null = null;
    let generalWorker: TesseractWorker | null = null;

    try {
      const {
        original,
        enhanced,
        rotated90,
        rotated270,
        mrzCropped,
        mrzWide,
        analysisPreview,
        analysisMrzPreview,
      } = await preprocessForMRZ(file);

      setProgressValue(16);
      setProgressLabel(t("scan.step_enhancing"));
      setProgressHint(t("scan.hint_enhancing") || null);

      // MRZ pass: use OCR-B model for better accuracy on passports/IDs
      mrzWorker = await createOcrWorker("ocrb", mrzProgressRangeRef);
      // General pass: keep English best model for names/addresses
      generalWorker = await createOcrWorker("eng", generalProgressRangeRef);

      const mrzAttempts = [
        { blob: mrzCropped, label: t("scan.attempt_mrz_zone"), offset: 20, span: 14 },
        { blob: mrzWide, label: t("scan.attempt_mrz_backup"), offset: 35, span: 14 },
        { blob: enhanced, label: t("scan.attempt_enhanced"), offset: 50, span: 10 },
      ];

      let bestMrzResult: MRZResult | null = null;
      const ocrSnapshots: string[] = [];

      for (const attempt of mrzAttempts) {
        try {
          const ocrText = await runMrzPass(
            mrzWorker,
            attempt.blob,
            attempt.label,
            attempt.offset,
            attempt.span,
          );
          ocrSnapshots.push(ocrText);
          const parsed = parseMRZ(ocrText);

          if (parsed && (!bestMrzResult || parsed.confidence > bestMrzResult.confidence)) {
            bestMrzResult = parsed;
          }

          if (parsed && parsed.confidence >= 90) {
            break;
          }
        } catch (error) {
          console.warn("[DOCUMENT SCANNER] MRZ pass failed:", error);
        }
      }

      let generalOcrText = "";
      try {
        generalOcrText = await runGeneralPass(
          generalWorker,
          enhanced,
          t("scan.attempt_original"),
          62,
          10,
        );
      } catch (error) {
        console.warn("[DOCUMENT SCANNER] Enhanced OCR pass failed:", error);
      }

      if (!generalOcrText) {
        try {
          generalOcrText = await runGeneralPass(
            generalWorker,
            original,
            t("scan.attempt_full_document"),
            72,
            10,
          );
        } catch (error) {
          console.warn("[DOCUMENT SCANNER] Original OCR pass failed:", error);
        }
      }

      // Extra tentativas para DL/ID em modo paisagem
      if (!generalOcrText && (declaredDocumentType || "").includes("license")) {
        try {
          generalOcrText = await runGeneralPass(
            generalWorker,
            rotated90,
            t("scan.attempt_rotated"),
            72,
            10,
          );
        } catch (error) {
          console.warn("[DOCUMENT SCANNER] Rotated90 OCR failed:", error);
        }
        if (!generalOcrText) {
          try {
            generalOcrText = await runGeneralPass(
              generalWorker,
              rotated270,
              t("scan.attempt_rotated"),
              72,
              10,
            );
          } catch (error) {
            console.warn("[DOCUMENT SCANNER] Rotated270 OCR failed:", error);
          }
        }
      }

      setProgressValue(84);
      setProgressLabel(t("scan.step_ai_review"));
      setProgressHint(t("scan.hint_ai_review") || null);

      const [documentImageDataUrl, mrzImageDataUrl] = await Promise.all([
        blobToDataUrl(analysisPreview),
        blobToDataUrl(analysisMrzPreview),
      ]);

      const aiReview = await analyzeWithAi({
        documentImageDataUrl,
        mrzImageDataUrl,
        rawOcrText: [generalOcrText, ...ocrSnapshots].filter(Boolean).join("\n\n"),
        mrzResult: bestMrzResult,
        declaredDocumentType,
      });

      let aiCandidate = aiReview?.candidate || null;
      if ((!aiCandidate || !aiCandidate.documentNumber) && (declaredDocumentType || "").includes("license")) {
        const dlCandidate = extractLicenseFields(generalOcrText);
        if (dlCandidate) {
          aiCandidate = dlCandidate;
        }
      }

      const merged = mergeDocumentScanCandidates({
        mrz: bestMrzResult,
        ai: aiCandidate,
      });

      const warnings = [...merged.warnings];
      if ((aiReview?.available && aiReview.candidate) || merged.source === "ai-assisted") {
        if (!merged.notes) {
          merged.notes = t("scan.ai_review_ready");
        }
      }

      if (merged.confidence < 70 && !warnings.includes("low_confidence")) {
        warnings.push("low_confidence");
      }

      if (!bestMrzResult && aiReview?.candidate && !warnings.includes("ai_manual_review")) {
        warnings.push("ai_manual_review");
      }

      merged.warnings = warnings;

      setProgressValue(96);

      if (!merged.givenName && !merged.familyName && !merged.passportNumber) {
        setErrorMessage(bestMrzResult || aiReview?.candidate ? t("scan.ocr_error") : t("scan.no_mrz_found"));
        setStep("error");
        return;
      }

      setEditableData(merged);
      setProgressValue(100);
      setStep("review");
    } catch (error) {
      console.error("[DOCUMENT SCANNER] Processing error:", error);
      // Fallback: AI-only para evitar travamento quando OCR demora/timeout
      try {
        setProgressLabel(t("scan.step_ai_review"));
        setProgressHint(t("scan.hint_ai_fallback") || null);
        setProgressValue(70);
        const { analysisPreview, analysisMrzPreview } = await preprocessForMRZ(file);
        const [documentImageDataUrl, mrzImageDataUrl] = await Promise.all([
          blobToDataUrl(analysisPreview),
          blobToDataUrl(analysisMrzPreview),
        ]);
        const aiReview = await analyzeWithAi({
          documentImageDataUrl,
          mrzImageDataUrl,
          rawOcrText: "",
          mrzResult: null,
          declaredDocumentType,
        });
        const merged = mergeDocumentScanCandidates({
          mrz: null,
          ai: aiReview?.candidate || null,
        });
        merged.warnings.push("ai_manual_review");
        setEditableData(merged);
        setProgressValue(100);
        setStep("review");
      } catch (fallbackError) {
        console.error("[DOCUMENT SCANNER] Fallback AI review failed:", fallbackError);
        setErrorMessage(t("scan.ocr_error"));
        setStep("error");
      }
    } finally {
      await Promise.allSettled([
        mrzWorker?.terminate(),
        generalWorker?.terminate(),
      ]);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void processImage(file);
    }
    event.target.value = "";
  };

  const handleConfirm = () => {
    if (!editableData) return;
    onConfirm(editableData);
    handleOpenChange(false);
  };

  const docTypeLabel = (type: string) => {
    switch (type) {
      case "passport":
        return t("scan.doc_passport");
      case "id_card":
      case "national_id":
        return t("scan.doc_id_card");
      case "travel_doc":
      case "travel_document":
        return t("scan.doc_travel_doc");
      case "visa":
        return t("scan.doc_visa");
      default:
        return t("scan.doc_document");
    }
  };

  const sourceLabel = (source: MergedDocumentScanResult["source"]) => {
    switch (source) {
      case "mrz":
        return t("scan.source_mrz");
      case "ai-assisted":
        return t("scan.source_ai");
      default:
        return t("scan.source_ocr");
    }
  };

  const confidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-emerald-600";
    if (confidence >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const confidenceBg = (confidence: number) => {
    if (confidence >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (confidence >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const renderWarning = (warning: string) => warningLabels[warning as keyof typeof warningLabels] || warning;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        {step === "select" && (
          <>
            <DialogHeader className="text-center items-center shrink-0">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-2">
                <ScanLine className="h-8 w-8 text-blue-500" />
              </div>
              <DialogTitle className="text-xl font-display text-gray-900" data-testid={`text-scan-title-${passengerIndex}`}>
                {t("scan.title")}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-sm">
                {t("scan.subtitle")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-1 -mr-1">
              <div className="space-y-3 mt-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    {t("scan.supported_docs")}
                  </h4>
                  <ul className="text-xs text-gray-500 space-y-1 ml-6 list-disc">
                    <li>{t("scan.doc_passport")}</li>
                    <li>{t("scan.doc_id_card")}</li>
                    <li>{t("scan.doc_travel_doc")}</li>
                    <li>{t("scan.doc_visa")}</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                    data-testid={`input-scan-camera-${passengerIndex}`}
                  />
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 text-gray-600"
                    onClick={() => {
                      if (requestMobileScan()) return;
                      cameraInputRef.current?.click();
                    }}
                    data-testid={`button-scan-camera-${passengerIndex}`}
                  >
                    <Camera className="h-6 w-6 text-blue-500" />
                    <span className="text-sm font-medium">
                      {isMobileBridge
                        ? t("scan.use_mobile_scanner") || t("scan.use_camera")
                        : t("scan.use_camera")}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {isMobileBridge
                        ? t("scan.mobile_tip") || t("scan.camera_tip")
                        : t("scan.camera_tip")}
                    </span>
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    data-testid={`input-scan-file-${passengerIndex}`}
                  />
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 text-gray-600"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid={`button-scan-upload-${passengerIndex}`}
                  >
                    <Upload className="h-6 w-6 text-blue-500" />
                    <span className="text-sm font-medium">{t("scan.upload_photo")}</span>
                    <span className="text-[10px] text-gray-400">{t("scan.upload_tip")}</span>
                  </Button>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
                  <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5" />
                    {t("scan.photo_tips_title")}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-start gap-2">
                      <Sun className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-blue-600">{t("scan.photo_tip_light")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Focus className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-blue-600">{t("scan.photo_tip_focus")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Maximize2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-blue-600">{t("scan.photo_tip_flat")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ScanLine className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-blue-600">{t("scan.photo_tip_mrz")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <Shield className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {t("scan.privacy_notice")}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {step === "processing" && (
          <>
            <DialogHeader className="text-center items-center">
              <DialogTitle className="text-xl font-display text-gray-900">
                {t("scan.processing")}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-sm">
                {t("scan.processing_desc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {imagePreview && (
                <div className="rounded-xl overflow-hidden border border-gray-200 max-h-48 flex items-center justify-center bg-gray-50">
                  <img src={imagePreview} alt="Document" className="max-h-48 object-contain" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{progressLabel || t("scan.reading_document")}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span>{t("scan.multi_attempt_notice")}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-600"
                  onClick={() => {
                    resetState();
                    cameraInputRef.current?.click();
                  }}
                  data-testid={`button-scan-switch-camera-${passengerIndex}`}
                >
                  {t("scan.use_camera")}
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-gray-500"
                  onClick={resetState}
                  data-testid={`button-scan-cancel-processing-${passengerIndex}`}
                >
                  {t("scan.cancel")}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "review" && editableData && (
          <>
            <DialogHeader className="text-center items-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-2">
                <Eye className="h-7 w-7 text-emerald-500" />
              </div>
              <DialogTitle className="text-xl font-display text-gray-900" data-testid={`text-scan-review-title-${passengerIndex}`}>
                {t("scan.review_title")}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-sm">
                {t("scan.review_subtitle")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-1 -mr-1 mt-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${confidenceBg(editableData.confidence)}`}>
                      {docTypeLabel(editableData.documentType)}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {sourceLabel(editableData.source)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {editableData.confidence >= 80 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span className={`text-xs font-bold ${confidenceColor(editableData.confidence)}`}>
                      {t("scan.confidence")}: {editableData.confidence}%
                    </span>
                  </div>
                </div>

                {editableData.notes && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-xs font-bold text-blue-800 mb-1">{t("scan.ai_notes")}</p>
                    <p className="text-xs text-blue-700 leading-relaxed">{editableData.notes}</p>
                  </div>
                )}

                {editableData.warnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-700">
                      <p className="font-bold mb-1">{t("scan.warnings")}</p>
                      <ul className="space-y-1 list-disc pl-4">
                        {editableData.warnings.map((warning) => (
                          <li key={warning}>{renderWarning(warning)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pb-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{t("booking.family_name")}</Label>
                      <Input
                        value={editableData.familyName}
                        onChange={(event) => setEditableData({ ...editableData, familyName: event.target.value })}
                        className="bg-white border-gray-200 text-gray-900 text-sm"
                        data-testid={`input-scan-family-name-${passengerIndex}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{t("booking.given_name")}</Label>
                      <Input
                        value={editableData.givenName}
                        onChange={(event) => setEditableData({ ...editableData, givenName: event.target.value })}
                        className="bg-white border-gray-200 text-gray-900 text-sm"
                        data-testid={`input-scan-given-name-${passengerIndex}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{t("booking.date_of_birth")}</Label>
                      <Input
                        type="date"
                        value={editableData.bornOn}
                        onChange={(event) => setEditableData({ ...editableData, bornOn: event.target.value })}
                        className="bg-white border-gray-200 text-gray-900 text-sm"
                        data-testid={`input-scan-dob-${passengerIndex}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{t("booking.gender")}</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={editableData.gender === "m" ? "default" : "outline"}
                          className={`flex-1 text-xs ${editableData.gender === "m" ? "" : "border-gray-200 text-gray-500"}`}
                          onClick={() => setEditableData({ ...editableData, gender: "m" })}
                          data-testid={`button-scan-gender-m-${passengerIndex}`}
                        >
                          {t("booking.male")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={editableData.gender === "f" ? "default" : "outline"}
                          className={`flex-1 text-xs ${editableData.gender === "f" ? "" : "border-gray-200 text-gray-500"}`}
                          onClick={() => setEditableData({ ...editableData, gender: "f" })}
                          data-testid={`button-scan-gender-f-${passengerIndex}`}
                        >
                          {t("booking.female")}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{t("scan.doc_number")}</Label>
                      <Input
                        value={editableData.passportNumber}
                        onChange={(event) => setEditableData({ ...editableData, passportNumber: event.target.value.toUpperCase() })}
                        className="bg-white border-gray-200 text-gray-900 text-sm"
                        data-testid={`input-scan-doc-number-${passengerIndex}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{t("booking.passport_expiry")}</Label>
                      <Input
                        type="date"
                        value={editableData.passportExpiryDate}
                        onChange={(event) => setEditableData({ ...editableData, passportExpiryDate: event.target.value })}
                        className="bg-white border-gray-200 text-gray-900 text-sm"
                        data-testid={`input-scan-expiry-${passengerIndex}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{t("booking.nationality")}</Label>
                      <Input
                        value={editableData.nationality}
                        onChange={(event) => setEditableData({ ...editableData, nationality: event.target.value.toUpperCase() })}
                        className="bg-white border-gray-200 text-gray-900 text-sm"
                        maxLength={3}
                        placeholder="BRA"
                        data-testid={`input-scan-nationality-${passengerIndex}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{t("booking.issuing_country")}</Label>
                      <Input
                        value={editableData.passportIssuingCountry}
                        onChange={(event) => setEditableData({ ...editableData, passportIssuingCountry: event.target.value.toUpperCase() })}
                        className="bg-white border-gray-200 text-gray-900 text-sm"
                        maxLength={3}
                        placeholder="BRA"
                        data-testid={`input-scan-issuing-${passengerIndex}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 mt-auto shrink-0 bg-white border-t sm:border-t-0 sm:pt-2 sm:mt-0 sm:bg-transparent -mx-4 px-4 sm:mx-0 sm:px-0">
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-gray-500"
                onClick={resetState}
                data-testid={`button-scan-retry-${passengerIndex}`}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("scan.try_again")}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleConfirm}
                data-testid={`button-scan-confirm-${passengerIndex}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("scan.confirm_data")}
              </Button>
            </div>
          </>
        )}

        {step === "error" && (
          <>
            <DialogHeader className="text-center items-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-2">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
              <DialogTitle className="text-xl font-display text-gray-900">
                {t("scan.error_title")}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-sm">
                {errorMessage}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-1 -mr-1 mt-4">
              <div className="space-y-4">
                {imagePreview && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 max-h-32 flex items-center justify-center bg-gray-50">
                    <img src={imagePreview} alt="Document" className="max-h-32 object-contain opacity-50" />
                  </div>
                )}

                <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3 pb-2">
                  <p className="text-xs font-bold text-gray-700">{t("scan.tips_title")}</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-start gap-2">
                      <Sun className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-gray-500">{t("scan.tip_1")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Focus className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-gray-500">{t("scan.tip_2")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Maximize2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-gray-500">{t("scan.tip_3")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ScanLine className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-gray-500">{t("scan.tip_4")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 mt-auto shrink-0 bg-white border-t sm:border-t-0 sm:pt-2 sm:mt-0 sm:bg-transparent -mx-4 px-4 sm:mx-0 sm:px-0">
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-gray-500"
                onClick={() => handleOpenChange(false)}
                data-testid={`button-scan-cancel-${passengerIndex}`}
              >
                <X className="h-4 w-4 mr-2" />
                {t("scan.cancel")}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={resetState}
                data-testid={`button-scan-retry-error-${passengerIndex}`}
              >
                <RotateCcw className="h-4 w-4" />
                {t("scan.try_again")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
