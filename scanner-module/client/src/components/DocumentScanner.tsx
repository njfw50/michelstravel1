import { useState, useRef, useCallback, type MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  Shield,
  RotateCcw,
  X,
  Sun,
  Maximize2,
  Focus,
  FileText,
  Sparkles,
} from "lucide-react";
import { parseMRZ, type MRZResult } from "@/lib/mrz";
import { preprocessForMRZ, createPreviewUrl } from "@/lib/imagePreprocess";
import {
  mergeFromMRZ,
  extractLicenseFields,
  type MergedDocumentScanResult,
} from "@/lib/documentScan";
import { useLocale } from "@/contexts/LocaleContext";
import { getWarningLabel } from "@/lib/i18n";
import Tesseract from "tesseract.js";

type Step = "select" | "processing" | "review" | "error";
type TesseractWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>;

interface DocumentScannerProps {
  onConfirm: (data: MergedDocumentScanResult) => void;
  onCancel?: () => void;
}

export function DocumentScanner({ onConfirm, onCancel }: DocumentScannerProps) {
  const { t } = useLocale();
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

  const createOcrWorker = async (
    lang: string,
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
    const timeoutMs = 12000;
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

  const processImage = async (file: File) => {
    setStep("processing");
    setProgressValue(5);
    setProgressLabel(t.preparingImage);
    setProgressHint(t.holdSteady);

    const preview = await createPreviewUrl(file);
    setImagePreview(preview);

    let mrzWorker: TesseractWorker | null = null;
    let generalWorker: TesseractWorker | null = null;

    try {
      const { original, enhanced, rotated90, rotated270, mrzCropped, mrzWide } =
        await preprocessForMRZ(file);

      setProgressValue(16);
      setProgressLabel(t.enhancingQuality);
      setProgressHint(t.applyingFilters);

      mrzWorker = await createOcrWorker("ocrb", mrzProgressRangeRef);
      generalWorker = await createOcrWorker("eng", generalProgressRangeRef);

      const mrzAttempts = [
        { blob: mrzCropped, label: t.readingMrz, offset: 20, span: 14 },
        { blob: mrzWide, label: t.expandedAttempt, offset: 35, span: 14 },
        { blob: enhanced, label: t.fullRead, offset: 50, span: 10 },
      ];

      let bestMrzResult: MRZResult | null = null;

      for (const attempt of mrzAttempts) {
        try {
          const ocrText = await runMrzPass(mrzWorker, attempt.blob, attempt.label, attempt.offset, attempt.span);
          const parsed = parseMRZ(ocrText);
          if (parsed && (!bestMrzResult || parsed.confidence > bestMrzResult.confidence)) {
            bestMrzResult = parsed;
          }
          if (parsed && parsed.confidence >= 90) break;
        } catch (error) {
          console.warn("[SCANNER] MRZ pass failed:", error);
        }
      }

      let generalOcrText = "";
      try {
        generalOcrText = await runGeneralPass(generalWorker, enhanced, t.readingGeneral, 62, 10);
      } catch (error) {
        console.warn("[SCANNER] Enhanced OCR pass failed:", error);
      }

      if (!generalOcrText) {
        try {
          generalOcrText = await runGeneralPass(generalWorker, original, t.readingFull, 72, 10);
        } catch (error) {
          console.warn("[SCANNER] Original OCR pass failed:", error);
        }
      }

      if (!generalOcrText && !bestMrzResult) {
        try {
          generalOcrText = await runGeneralPass(generalWorker, rotated90, t.tryingRotation, 72, 10);
        } catch { /* skip */ }
        if (!generalOcrText) {
          try {
            generalOcrText = await runGeneralPass(generalWorker, rotated270, t.tryingRotation, 72, 10);
          } catch { /* skip */ }
        }
      }

      setProgressValue(88);
      setProgressLabel(t.finalizing);
      setProgressHint(null);

      let merged: MergedDocumentScanResult | null = null;

      if (bestMrzResult) {
        merged = mergeFromMRZ(bestMrzResult);
      } else if (generalOcrText) {
        merged = extractLicenseFields(generalOcrText);
      }

      if (!merged || (!merged.givenName && !merged.familyName && !merged.passportNumber)) {
        setErrorMessage(bestMrzResult ? t.errorPartial : t.errorNoData);
        setStep("error");
        return;
      }

      setEditableData(merged);
      setProgressValue(100);
      setStep("review");
    } catch (error) {
      console.error("[SCANNER] Processing error:", error);
      setErrorMessage(t.errorGeneric);
      setStep("error");
    } finally {
      try { await mrzWorker?.terminate(); } catch { /* ignore */ }
      try { await generalWorker?.terminate(); } catch { /* ignore */ }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = "";
  };

  const handleConfirm = () => {
    if (editableData) onConfirm(editableData);
  };

  function confidenceColor(c: number) {
    if (c >= 80) return "confidence-high";
    if (c >= 60) return "confidence-medium";
    return "confidence-low";
  }

  function confidenceLabel(c: number) {
    if (c >= 80) return t.confidenceHigh;
    if (c >= 60) return t.confidenceMedium;
    return t.confidenceLow;
  }

  // ─── STEP: SELECT ────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="animate-fade-in-up flex flex-col min-h-[calc(100vh-5rem)] sm:min-h-0">
        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
          aria-hidden="true"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="section-eyebrow mx-auto w-fit">
            <ScanLine className="h-3.5 w-3.5" />
            {t.scannerEyebrow}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-display)" }}>
            {t.scannerTitle}
          </h2>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            {t.scannerDesc}
          </p>
        </div>

        {/* Action cards — large touch targets for mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto w-full flex-1 sm:flex-none">
          {/* Camera — primary action on mobile */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="guide-card p-6 sm:p-8 flex flex-col items-center gap-4 text-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[140px] active:scale-[0.98] transition-transform"
            aria-label={t.takePhoto}
          >
            <div className="h-16 w-16 sm:h-14 sm:w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Camera className="h-8 w-8 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div>
              <p className="text-lg sm:text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {t.takePhoto}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{t.takePhotoDesc}</p>
            </div>
          </button>

          {/* Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="guide-card p-6 sm:p-8 flex flex-col items-center gap-4 text-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[140px] active:scale-[0.98] transition-transform"
            aria-label={t.uploadImage}
          >
            <div className="h-16 w-16 sm:h-14 sm:w-14 rounded-2xl bg-accent flex items-center justify-center group-hover:bg-accent/80 transition-colors">
              <Upload className="h-8 w-8 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div>
              <p className="text-lg sm:text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {t.uploadImage}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{t.uploadImageDesc}</p>
            </div>
          </button>
        </div>

        {/* Tips — collapsible on mobile */}
        <div className="mt-6 sm:mt-8 guide-card p-4 sm:p-5 max-w-lg mx-auto w-full">
          <p className="text-sm font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
            {t.tipsTitle}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Sun, text: t.tipLight },
              { icon: Focus, text: t.tipFocus },
              { icon: Maximize2, text: t.tipFull },
              { icon: FileText, text: t.tipFlat },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <tip.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Accepted docs */}
        <div className="mt-4 text-center max-w-lg mx-auto w-full">
          <p className="text-xs text-muted-foreground mb-2">{t.acceptedDocs}</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {[t.passport, t.nationalId, t.driversLicense, t.visa].map((doc) => (
              <Badge key={doc} variant="secondary" className="text-xs">
                {doc}
              </Badge>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground max-w-lg mx-auto">
          <Shield className="h-3.5 w-3.5" />
          <span>{t.securityLocal}</span>
        </div>
      </div>
    );
  }

  // ─── STEP: PROCESSING ────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] sm:min-h-[400px]">
        <div className="max-w-md mx-auto text-center w-full">
          {/* Preview */}
          {imagePreview && (
            <div className="mb-6 rounded-2xl overflow-hidden border border-border max-h-48 flex items-center justify-center bg-gray-50">
              <img src={imagePreview} alt="Document" className="max-h-48 object-contain" />
            </div>
          )}

          {/* Spinner */}
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>

          <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t.processingTitle}
          </h3>

          <div className="mt-4 space-y-2">
            <Progress value={progress} className="h-3 rounded-full" />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{progressLabel}</p>
              <span className="text-sm font-mono text-primary font-bold">{progress}%</span>
            </div>
            {progressHint && (
              <p className="text-xs text-muted-foreground/70">{progressHint}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: REVIEW ────────────────────────────────────────
  if (step === "review" && editableData) {
    return (
      <div className="animate-fade-in-up">
        {/* Success header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t.reviewSuccess}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{t.reviewDesc}</p>

          {/* Confidence */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge className={confidenceColor(editableData.confidence)}>
              <Sparkles className="h-3 w-3 mr-1" />
              {t.confidenceLabel}: {confidenceLabel(editableData.confidence)} ({editableData.confidence}%)
            </Badge>
          </div>

          {/* Warnings */}
          {editableData.warnings && editableData.warnings.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {editableData.warnings.map((w, i) => (
                <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {getWarningLabel(w, t)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {imagePreview && (
          <div className="mb-5 rounded-xl overflow-hidden border border-border max-h-32 flex items-center justify-center bg-gray-50">
            <img src={imagePreview} alt="Document" className="max-h-32 object-contain" />
          </div>
        )}

        {/* Editable fields — large inputs for mobile */}
        <div className="guide-card p-4 sm:p-5">
          <div className="space-y-4">
            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.firstName}
                </label>
                <input
                  value={editableData.givenName}
                  onChange={(e) => setEditableData({ ...editableData, givenName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder={t.firstName}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.lastName}
                </label>
                <input
                  value={editableData.familyName}
                  onChange={(e) => setEditableData({ ...editableData, familyName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder={t.lastName}
                />
              </div>
            </div>

            {/* Doc number + Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.documentNumber}
                </label>
                <input
                  value={editableData.passportNumber}
                  onChange={(e) => setEditableData({ ...editableData, passportNumber: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="AB1234567"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.expiryDate}
                </label>
                <input
                  type="date"
                  value={editableData.passportExpiryDate}
                  onChange={(e) => setEditableData({ ...editableData, passportExpiryDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Birth + Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.birthDate}
                </label>
                <input
                  type="date"
                  value={editableData.bornOn}
                  onChange={(e) => setEditableData({ ...editableData, bornOn: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.gender}
                </label>
                <select
                  value={editableData.gender}
                  onChange={(e) => setEditableData({ ...editableData, gender: e.target.value as "m" | "f" | "" })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="">{t.genderSelect}</option>
                  <option value="m">{t.genderMale}</option>
                  <option value="f">{t.genderFemale}</option>
                </select>
              </div>
            </div>

            {/* Nationality + Issuing Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.nationality}
                </label>
                <input
                  value={editableData.nationality}
                  onChange={(e) => setEditableData({ ...editableData, nationality: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  maxLength={3}
                  placeholder="BRA"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.issuingCountry}
                </label>
                <input
                  value={editableData.passportIssuingCountry}
                  onChange={(e) => setEditableData({ ...editableData, passportIssuingCountry: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-3 sm:py-2.5 text-base sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  maxLength={3}
                  placeholder="BRA"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions — large touch targets */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 h-14 sm:h-12 text-base border-border"
            onClick={resetState}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t.tryAgain}
          </Button>
          <Button
            className="flex-1 h-14 sm:h-12 text-base"
            onClick={handleConfirm}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t.confirmData}
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP: ERROR ─────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="animate-fade-in-up text-center flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] sm:min-h-0">
        <div className="max-w-md mx-auto">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t.errorTitle}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            {errorMessage}
          </p>

          {imagePreview && (
            <div className="mt-4 rounded-xl overflow-hidden border border-border max-h-32 flex items-center justify-center bg-gray-50">
              <img src={imagePreview} alt="Document" className="max-h-32 object-contain opacity-50" />
            </div>
          )}

          {/* Tips */}
          <div className="mt-5 guide-card p-4 text-left">
            <p className="text-sm font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
              {t.retryTipsTitle}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: Sun, text: t.retryTipLight },
                { icon: Focus, text: t.retryTipFocus },
                { icon: Maximize2, text: t.retryTipFull },
                { icon: ScanLine, text: t.retryTipMrz },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <tip.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {onCancel && (
              <Button
                variant="outline"
                className="flex-1 h-14 sm:h-12 text-base border-border"
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-2" />
                {t.cancel}
              </Button>
            )}
            <Button
              className="flex-1 h-14 sm:h-12 text-base"
              onClick={resetState}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t.tryAgain}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
