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
  ArrowLeft,
  Check,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { parseMRZ, type MRZResult } from "@/lib/mrz";
import { preprocessForMRZ, createPreviewUrl, blobToDataUrl } from "@/lib/imagePreprocess";
import {
  mergeDocumentScanCandidates,
  mapScannedDocumentTypeToBooking,
  type BookingDocumentType,
  type DocumentAiCandidate,
  type MergedDocumentScanResult,
} from "@/lib/documentScan";
import {
  generateSessionId,
  buildScannerLink,
  listenForScanResult,
} from "@/lib/scannerBridge";
import Tesseract from "tesseract.js";
import { motion } from "framer-motion";

type Step = "select" | "processing" | "review" | "error" | "remote";
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
  const { t, language } = useI18n();
  const warningLabels = createWarningLabels(t);
  const [step, setStep] = useState<Step>("select");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [progressHint, setProgressHint] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<MergedDocumentScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [remoteSessionId, setRemoteSessionId] = useState<string | null>(null);
  const [remoteQrUrl, setRemoteQrUrl] = useState<string | null>(null);
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
    setRemoteSessionId(null);
    setRemoteQrUrl(null);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetState();
    onOpenChange(newOpen);
  };

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
          passportNumber: msg.payload.passportNumber || (msg.payload as any).documentNumber || "",
          passportExpiryDate: msg.payload.passportExpiryDate || "",
          nationality: (msg.payload.nationality || msg.payload.passportIssuingCountry || "").toUpperCase(),
          passportIssuingCountry: (msg.payload.passportIssuingCountry || msg.payload.nationality || "").toUpperCase(),
          documentType: mapScannedDocumentTypeToBooking(msg.payload.documentType || (declaredDocumentType as string) || "passport") as BookingDocumentType,
          rawDocumentType: msg.payload.documentType || (declaredDocumentType as string) || "passport",
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

  useEffect(() => {
    if (!open || step !== "processing" || !isMobileBridge) return;
    const timeout = window.setTimeout(() => {
      setErrorMessage(t("scan.mobile_timeout") || t("scan.ocr_error") || "No response from mobile scanner.");
      setStep("error");
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [isMobileBridge, open, step, t]);

  const requestMobileScan = () => {
    const sessionId = generateSessionId();
    const url = buildScannerLink({
      sessionId,
      lang: language || "pt",
      callback: window.location.origin + window.location.pathname + "?session=" + sessionId,
      origin: window.location.origin,
    });

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobileBridge || isMobile) {
      window.location.href = url;
      return true;
    }

    setRemoteSessionId(sessionId);
    setRemoteQrUrl(url);
    setStep("remote");
    return true;
  };

  useEffect(() => {
    if (step !== "remote" || !remoteSessionId) return;

    const cleanup = listenForScanResult(remoteSessionId, (data) => {
      setEditableData(data);
      setStep("review");
    });

    return cleanup;
  }, [step, remoteSessionId]);

  const createOcrWorker = async (
    lang: "ocrb" | "eng",
    rangeRef: MutableRefObject<{ offset: number; span: number }>,
  ): Promise<TesseractWorker> => {
    const workerPromise = Tesseract.createWorker(lang, Tesseract.OEM.LSTM_ONLY, {
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
      logger: (message) => {
        if (message.status === "recognizing text") {
          const nextValue = rangeRef.current.offset + Math.round(message.progress * rangeRef.current.span);
          if (nextValue > progressRef.current) {
            setProgressValue(Math.min(nextValue, 92));
          }
        }
      },
    });

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

      mrzWorker = await createOcrWorker("ocrb", mrzProgressRangeRef);
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

      const merged = mergeDocumentScanCandidates({
        mrz: bestMrzResult,
        ai: aiReview?.candidate || null,
      });

      const warnings = [...merged.warnings];
      if (merged.confidence < 70 && !warnings.includes("low_confidence")) {
        warnings.push("low_confidence");
      }

      merged.warnings = warnings;
      setEditableData(merged);
      setProgressValue(100);
      setStep("review");
    } catch (error) {
      console.error("[DOCUMENT SCANNER] Processing error:", error);
      setErrorMessage(t("scan.ocr_error"));
      setStep("error");
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
      case "passport": return t("scan.doc_passport");
      case "id_card": 
      case "national_id": return t("scan.doc_id_card");
      case "travel_doc":
      case "travel_document": return t("scan.doc_travel_doc");
      default: return t("scan.doc_document");
    }
  };

  const sourceLabel = (source: MergedDocumentScanResult["source"]) => {
    switch (source) {
      case "mrz": return t("scan.source_mrz");
      case "ai-assisted": return t("scan.source_ai");
      default: return t("scan.source_ocr");
    }
  };

  const confidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-emerald-400";
    if (confidence >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const confidenceBg = (confidence: number) => {
    if (confidence >= 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (confidence >= 60) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  const renderWarning = (warning: string) => warningLabels[warning as keyof typeof warningLabels] || warning;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] flex flex-col p-0 overflow-hidden bg-slate-950 border border-white/10 shadow-2xl rounded-[40px]">
        {step === "select" && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.2)_0%,rgba(2,6,23,0)_70%)] pointer-events-none" />
            
            <DialogHeader className="text-center items-center shrink-0 p-8 pb-4 relative z-10">
              <div className="mx-auto h-20 w-20 rounded-[28px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/5">
                <ScanLine className="h-10 w-10 text-blue-400" />
              </div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase" data-testid={`text-scan-title-${passengerIndex}`}>
                {t("scan.title")}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm font-medium mt-2">
                {t("scan.subtitle")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10 custom-scrollbar">
              <div className="space-y-6 mt-4">
                <div className="rounded-[28px] border border-white/5 bg-white/5 p-6 space-y-4">
                  <h4 className="text-xs font-black text-blue-400 flex items-center gap-3 uppercase tracking-widest">
                    <FileText className="h-4 w-4" />
                    {t("scan.supported_docs")}
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-2 ml-7 list-disc font-medium">
                    <li>{t("scan.doc_passport")}</li>
                    <li>{t("scan.doc_id_card")}</li>
                    <li>{t("scan.doc_travel_doc")}</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                  <Button
                    variant="ghost"
                    className="h-auto py-6 flex flex-col items-center gap-3 border border-white/5 bg-slate-900/40 text-white rounded-[32px] hover:bg-blue-600 hover:border-blue-500 transition-all group shadow-xl"
                    onClick={() => requestMobileScan()}
                  >
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Smartphone className="h-6 w-6 text-blue-400 group-hover:text-white" />
                    </div>
                    <div className="text-center">
                      <span className="block text-sm font-black uppercase tracking-tight">{t("scan.use_mobile_scanner")}</span>
                      <span className="block text-[10px] text-slate-500 group-hover:text-blue-100 font-bold mt-1 uppercase tracking-widest">{t("scan.mobile_tip")}</span>
                    </div>
                  </Button>

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <Button
                    variant="ghost"
                    className="h-auto py-6 flex flex-col items-center gap-3 border border-white/5 bg-slate-900/40 text-white rounded-[32px] hover:bg-emerald-600 hover:border-emerald-500 transition-all group shadow-xl"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Upload className="h-6 w-6 text-emerald-400 group-hover:text-white" />
                    </div>
                    <div className="text-center">
                      <span className="block text-sm font-black uppercase tracking-tight">{t("scan.upload_photo")}</span>
                      <span className="block text-[10px] text-slate-500 group-hover:text-emerald-100 font-bold mt-1 uppercase tracking-widest">{t("scan.upload_tip")}</span>
                    </div>
                  </Button>
                </div>

                <div className="rounded-[28px] border border-blue-500/10 bg-blue-500/5 p-6 space-y-4">
                  <h4 className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("scan.photo_tips_title")}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Sun className="h-4 w-4 text-blue-500/40 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-slate-400 font-medium leading-tight">{t("scan.photo_tip_light")}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Focus className="h-4 w-4 text-blue-500/40 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-slate-400 font-medium leading-tight">{t("scan.photo_tip_focus")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <Shield className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider">{t("scan.privacy_notice")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "remote" && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.2)_0%,rgba(2,6,23,0)_70%)] pointer-events-none" />
            <DialogHeader className="text-center items-center shrink-0 p-8 pb-4 relative z-10">
              <div className="mx-auto h-20 w-20 rounded-[28px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <Smartphone className="h-10 w-10 text-blue-400" />
              </div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">{t("scan.scan_remote_title")}</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm font-medium mt-2">{t("scan.scan_remote_subtitle")}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col items-center justify-center py-8 relative z-10">
              <div className="bg-white rounded-[40px] p-6 border-4 border-white/5 shadow-2xl mb-8 group transition-all hover:scale-105">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(remoteQrUrl || "")}&format=svg`} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="flex items-center gap-4 text-blue-400 animate-pulse bg-blue-500/10 px-6 py-3 rounded-2xl border border-blue-500/20">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest">{t("scan.scan_remote_waiting")}</span>
              </div>
              <Button variant="ghost" size="sm" className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white" onClick={() => remoteQrUrl && navigator.clipboard.writeText(remoteQrUrl)}>
                <FileText className="h-4 w-4 mr-2" />
                {t("scan.scan_remote_copy_link")}
              </Button>
            </div>

            <div className="mt-auto p-8 pt-4 border-t border-white/5 relative z-10">
              <Button variant="ghost" className="w-full h-14 rounded-2xl bg-white/5 text-white font-black uppercase tracking-widest hover:bg-white/10" onClick={() => setStep("select")}>
                {t("scan.back") || "Voltar"}
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.2)_0%,rgba(2,6,23,0)_70%)] pointer-events-none" />
            <DialogHeader className="text-center items-center shrink-0 p-8 pb-4 relative z-10">
              <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">{t("scan.processing")}</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm font-medium mt-2">{t("scan.processing_desc")}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 px-8 pb-8 relative z-10 space-y-8 mt-4 overflow-y-auto">
              {imagePreview && (
                <div className="rounded-[32px] overflow-hidden border border-white/10 bg-slate-900/60 p-4 h-64 flex items-center justify-center relative">
                  <div className="absolute inset-x-0 h-px bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan-line top-0 z-20" />
                  <img src={imagePreview} alt="Document" className="h-full w-full object-contain rounded-2xl brightness-75 grayscale-[0.2]" />
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{progressLabel || t("scan.reading_document")}</span>
                  <span className="text-xs font-black text-white">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 bg-white/5 py-4 rounded-2xl border border-white/5">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("scan.multi_attempt_notice")}</span>
              </div>
            </div>
          </div>
        )}

        {step === "review" && editableData && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05)_0%,rgba(2,6,23,0)_70%)] pointer-events-none" />
            <DialogHeader className="text-center items-center shrink-0 p-8 pb-4 relative z-10">
              <div className="mx-auto h-20 w-20 rounded-[28px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Eye className="h-10 w-10 text-emerald-400" />
              </div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase" data-testid={`text-scan-review-title-${passengerIndex}`}>{t("scan.review_title")}</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm font-medium">{t("scan.review_subtitle")}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-8 pb-4 relative z-10 custom-scrollbar">
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 ${confidenceBg(editableData.confidence)}`}>{docTypeLabel(editableData.documentType)}</Badge>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 border-white/10 text-slate-400"><Sparkles className="h-3 w-3 mr-1.5" />{sourceLabel(editableData.source)}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {editableData.confidence >= 80 ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${confidenceColor(editableData.confidence)}`}>{t("scan.confidence")}: {editableData.confidence}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">{t("booking.family_name")}</Label>
                    <Input value={editableData.familyName} onChange={e => setEditableData({...editableData, familyName: e.target.value})} className="h-12 bg-slate-900/60 border-white/10 text-white rounded-xl focus:border-blue-500/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">{t("booking.given_name")}</Label>
                    <Input value={editableData.givenName} onChange={e => setEditableData({...editableData, givenName: e.target.value})} className="h-12 bg-slate-900/60 border-white/10 text-white rounded-xl focus:border-blue-500/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">{t("booking.date_of_birth")}</Label>
                    <Input type="date" value={editableData.bornOn} onChange={e => setEditableData({...editableData, bornOn: e.target.value})} className="h-12 bg-slate-900/60 border-white/10 text-white rounded-xl focus:border-blue-500/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">{t("booking.gender")}</Label>
                    <div className="flex gap-2">
                      <Button variant="ghost" className={`flex-1 h-12 rounded-xl border border-white/10 transition-all ${editableData.gender === 'm' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-slate-400'}`} onClick={() => setEditableData({...editableData, gender: 'm'})}>M</Button>
                      <Button variant="ghost" className={`flex-1 h-12 rounded-xl border border-white/10 transition-all ${editableData.gender === 'f' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-slate-400'}`} onClick={() => setEditableData({...editableData, gender: 'f'})}>F</Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">{t("scan.doc_number")}</Label>
                    <Input value={editableData.passportNumber} onChange={e => setEditableData({...editableData, passportNumber: e.target.value.toUpperCase()})} className="h-12 bg-slate-900/60 border-white/10 text-white rounded-xl focus:border-blue-500/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">{t("booking.passport_expiry")}</Label>
                    <Input type="date" value={editableData.passportExpiryDate} onChange={e => setEditableData({...editableData, passportExpiryDate: e.target.value})} className="h-12 bg-slate-900/60 border-white/10 text-white rounded-xl focus:border-blue-500/50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 pt-4 border-t border-white/5 flex gap-4 relative z-10 shrink-0">
              <Button variant="ghost" className="flex-1 h-14 rounded-2xl bg-white/5 text-white font-black uppercase tracking-widest hover:bg-white/10" onClick={resetState}><RotateCcw className="h-4 w-4 mr-2" />{t("scan.try_again")}</Button>
              <Button className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest hover:bg-blue-500" onClick={handleConfirm}><Check className="h-4 w-4 mr-2" />{t("scan.confirm_data")}</Button>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.1)_0%,rgba(2,6,23,0)_70%)] pointer-events-none" />
            <DialogHeader className="text-center items-center shrink-0 p-8 pb-4 relative z-10">
              <div className="mx-auto h-20 w-20 rounded-[28px] bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-lg shadow-red-500/5">
                <AlertTriangle className="h-10 w-10 text-red-400" />
              </div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">{t("scan.error_title")}</DialogTitle>
              <DialogDescription className="text-red-400 text-sm font-medium mt-2">{errorMessage}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 px-8 pb-8 flex flex-col items-center justify-center relative z-10 space-y-8">
               <div className="rounded-[28px] border border-white/5 bg-white/5 p-6 w-full space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{t("scan.tips_title")}</p>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <Sun className="h-4 w-4 text-blue-500/40" />
                      <span className="text-xs font-medium">{t("scan.tip_1")}</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <Focus className="h-4 w-4 text-blue-500/40" />
                      <span className="text-xs font-medium">{t("scan.tip_2")}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-8 pt-4 border-t border-white/5 flex gap-4 relative z-10">
              <Button variant="ghost" className="flex-1 h-14 rounded-2xl bg-white/5 text-white font-black uppercase tracking-widest" onClick={() => handleOpenChange(false)}><X className="h-4 w-4 mr-2" />{t("scan.cancel")}</Button>
              <Button className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest" onClick={resetState}><RotateCcw className="h-4 w-4 mr-2" />{t("scan.try_again")}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
