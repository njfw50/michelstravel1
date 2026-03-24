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
import Tesseract from "tesseract.js";

type Step = "select" | "processing" | "review" | "error";
type TesseractWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>;

interface DocumentScannerProps {
  onConfirm: (data: MergedDocumentScanResult) => void;
  onCancel?: () => void;
}

const WARNING_LABELS: Record<string, string> = {
  doc_number_check_failed: "Verificação do número do documento falhou",
  birth_date_check_failed: "Verificação da data de nascimento falhou",
  expiry_date_check_failed: "Verificação da data de validade falhou",
  unexpected_doc_type: "Tipo de documento inesperado",
  low_confidence: "Confiança baixa — confira os dados manualmente",
};

export function DocumentScanner({ onConfirm, onCancel }: DocumentScannerProps) {
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
    setProgressLabel("Preparando imagem...");
    setProgressHint("Segure firme enquanto processamos");

    const preview = await createPreviewUrl(file);
    setImagePreview(preview);

    let mrzWorker: TesseractWorker | null = null;
    let generalWorker: TesseractWorker | null = null;

    try {
      const { original, enhanced, rotated90, rotated270, mrzCropped, mrzWide } =
        await preprocessForMRZ(file);

      setProgressValue(16);
      setProgressLabel("Melhorando qualidade...");
      setProgressHint("Aplicando filtros de contraste");

      mrzWorker = await createOcrWorker("ocrb", mrzProgressRangeRef);
      generalWorker = await createOcrWorker("eng", generalProgressRangeRef);

      const mrzAttempts = [
        { blob: mrzCropped, label: "Lendo zona MRZ...", offset: 20, span: 14 },
        { blob: mrzWide, label: "Tentativa ampliada...", offset: 35, span: 14 },
        { blob: enhanced, label: "Leitura completa...", offset: 50, span: 10 },
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
        generalOcrText = await runGeneralPass(generalWorker, enhanced, "Lendo texto geral...", 62, 10);
      } catch (error) {
        console.warn("[SCANNER] Enhanced OCR pass failed:", error);
      }

      if (!generalOcrText) {
        try {
          generalOcrText = await runGeneralPass(generalWorker, original, "Lendo documento completo...", 72, 10);
        } catch (error) {
          console.warn("[SCANNER] Original OCR pass failed:", error);
        }
      }

      // Extra rotated attempts for landscape docs (DL/ID)
      if (!generalOcrText && !bestMrzResult) {
        try {
          generalOcrText = await runGeneralPass(generalWorker, rotated90, "Tentando rotação...", 72, 10);
        } catch { /* skip */ }
        if (!generalOcrText) {
          try {
            generalOcrText = await runGeneralPass(generalWorker, rotated270, "Tentando rotação...", 72, 10);
          } catch { /* skip */ }
        }
      }

      setProgressValue(88);
      setProgressLabel("Finalizando análise...");
      setProgressHint(null);

      let merged: MergedDocumentScanResult | null = null;

      if (bestMrzResult) {
        merged = mergeFromMRZ(bestMrzResult);
      } else if (generalOcrText) {
        merged = extractLicenseFields(generalOcrText);
      }

      if (!merged || (!merged.givenName && !merged.familyName && !merged.passportNumber)) {
        setErrorMessage(
          bestMrzResult
            ? "Conseguimos ler parcialmente, mas os dados estão incompletos. Tente novamente com melhor iluminação."
            : "Não foi possível identificar dados no documento. Verifique se a imagem está nítida e bem iluminada."
        );
        setStep("error");
        return;
      }

      setEditableData(merged);
      setProgressValue(100);
      setStep("review");
    } catch (error) {
      console.error("[SCANNER] Processing error:", error);
      setErrorMessage("Ocorreu um erro durante o processamento. Tente novamente.");
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
    if (c >= 80) return "Alta";
    if (c >= 60) return "Média";
    return "Baixa";
  }

  // ─── STEP: SELECT ────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="section-eyebrow mx-auto w-fit">
            <ScanLine className="h-3.5 w-3.5" />
            Scanner de Documentos
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-display)" }}>
            Escaneie seu documento
          </h2>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Tire uma foto ou envie uma imagem do seu passaporte, identidade ou carteira de motorista.
            Os dados serão preenchidos automaticamente.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          {/* Camera */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="guide-card p-6 sm:p-8 flex flex-col items-center gap-4 text-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Tirar foto do documento com a câmera"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Tirar Foto
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Use a câmera do celular
              </p>
            </div>
          </button>

          {/* Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="guide-card p-6 sm:p-8 flex flex-col items-center gap-4 text-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Enviar imagem do documento do dispositivo"
          >
            <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center group-hover:bg-accent/80 transition-colors">
              <Upload className="h-8 w-8 text-accent-foreground" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Enviar Imagem
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione do dispositivo
              </p>
            </div>
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 max-w-lg mx-auto">
          <div className="guide-card p-5">
            <p className="text-sm font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Dicas para uma boa leitura
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5">
                <Sun className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Boa iluminação, sem sombras</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Focus className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Imagem nítida e focada</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Maximize2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Documento inteiro visível</span>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Superfície plana, sem dobras</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supported docs */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">Documentos aceitos de qualquer país</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="text-xs">Passaporte</Badge>
            <Badge variant="secondary" className="text-xs">Carteira de Identidade</Badge>
            <Badge variant="secondary" className="text-xs">Carteira de Motorista</Badge>
            <Badge variant="secondary" className="text-xs">Visto</Badge>
            <Badge variant="secondary" className="text-xs">Documento de Viagem</Badge>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Seus dados são processados localmente e nunca são armazenados</span>
        </div>

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
      </div>
    );
  }

  // ─── STEP: PROCESSING ────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="max-w-md mx-auto">
          {/* Scanner viewfinder */}
          {imagePreview && (
            <div className="scanner-viewfinder mb-6 relative">
              <img
                src={imagePreview}
                alt="Documento sendo processado"
                className="w-full max-h-56 object-contain rounded-xl"
              />
              {/* Scan line animation */}
              <div className="absolute left-3 right-3 h-0.5 bg-primary/80 animate-scan-line rounded-full shadow-[0_0_8px_2px] shadow-primary/40" />
              {/* Corner markers */}
              <div className="scanner-corner scanner-corner-tl" />
              <div className="scanner-corner scanner-corner-tr" />
              <div className="scanner-corner scanner-corner-bl" />
              <div className="scanner-corner scanner-corner-br" />
            </div>
          )}

          <div className="mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Processando documento
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{progressLabel}</p>
            {progressHint && (
              <p className="text-xs text-muted-foreground/70 mt-1">{progressHint}</p>
            )}
          </div>

          <Progress value={progress} className="h-2.5 rounded-full" />
          <p className="text-xs text-muted-foreground mt-2">{progress}% concluído</p>
        </div>
      </div>
    );
  }

  // ─── STEP: REVIEW ────────────────────────────────────────
  if (step === "review" && editableData) {
    return (
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Documento lido com sucesso
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Confira os dados abaixo e corrija se necessário
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Sparkles className={`h-4 w-4 ${confidenceColor(editableData.confidence)}`} />
            <span className={`text-sm font-semibold ${confidenceColor(editableData.confidence)}`}>
              Confiança: {confidenceLabel(editableData.confidence)} ({editableData.confidence}%)
            </span>
          </div>
        </div>

        {/* Warnings */}
        {editableData.warnings.length > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Atenção</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
                  {editableData.warnings.map((w, i) => (
                    <li key={i}>{WARNING_LABELS[w] || w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Preview + Data */}
        <div className="guide-card overflow-hidden">
          {imagePreview && (
            <div className="bg-gray-50 border-b border-border p-3 flex justify-center">
              <img
                src={imagePreview}
                alt="Documento escaneado"
                className="max-h-32 object-contain rounded-lg"
              />
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nome
                </label>
                <input
                  value={editableData.givenName}
                  onChange={(e) => setEditableData({ ...editableData, givenName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="Nome"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sobrenome
                </label>
                <input
                  value={editableData.familyName}
                  onChange={(e) => setEditableData({ ...editableData, familyName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="Sobrenome"
                />
              </div>
            </div>

            {/* Doc number + Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Número do Documento
                </label>
                <input
                  value={editableData.passportNumber}
                  onChange={(e) => setEditableData({ ...editableData, passportNumber: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="AB1234567"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Validade
                </label>
                <input
                  type="date"
                  value={editableData.passportExpiryDate}
                  onChange={(e) => setEditableData({ ...editableData, passportExpiryDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Birth + Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={editableData.bornOn}
                  onChange={(e) => setEditableData({ ...editableData, bornOn: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sexo
                </label>
                <select
                  value={editableData.gender}
                  onChange={(e) => setEditableData({ ...editableData, gender: e.target.value as "m" | "f" | "" })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="">Selecione</option>
                  <option value="m">Masculino</option>
                  <option value="f">Feminino</option>
                </select>
              </div>
            </div>

            {/* Nationality + Issuing Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nacionalidade
                </label>
                <input
                  value={editableData.nationality}
                  onChange={(e) => setEditableData({ ...editableData, nationality: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  maxLength={3}
                  placeholder="BRA"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  País Emissor
                </label>
                <input
                  value={editableData.passportIssuingCountry}
                  onChange={(e) => setEditableData({ ...editableData, passportIssuingCountry: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  maxLength={3}
                  placeholder="BRA"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 h-12 text-base border-border"
            onClick={resetState}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button
            className="flex-1 h-12 text-base"
            onClick={handleConfirm}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmar Dados
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP: ERROR ─────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="max-w-md mx-auto">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Não foi possível ler o documento
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            {errorMessage}
          </p>

          {imagePreview && (
            <div className="mt-4 rounded-xl overflow-hidden border border-border max-h-32 flex items-center justify-center bg-gray-50">
              <img src={imagePreview} alt="Documento" className="max-h-32 object-contain opacity-50" />
            </div>
          )}

          {/* Tips */}
          <div className="mt-5 guide-card p-4 text-left">
            <p className="text-sm font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Dicas para tentar novamente
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2">
                <Sun className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Use boa iluminação, sem reflexos</span>
              </div>
              <div className="flex items-start gap-2">
                <Focus className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Mantenha o documento em foco</span>
              </div>
              <div className="flex items-start gap-2">
                <Maximize2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Enquadre o documento inteiro</span>
              </div>
              <div className="flex items-start gap-2">
                <ScanLine className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Para passaportes, mostre a página com MRZ (códigos na parte inferior)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {onCancel && (
              <Button
                variant="outline"
                className="flex-1 h-12 text-base border-border"
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
            <Button
              className="flex-1 h-12 text-base"
              onClick={resetState}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
