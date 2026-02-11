import { useState, useRef, useCallback } from "react";
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
  ArrowRight,
  RotateCcw,
  Eye,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { parseMRZ, type MRZResult } from "@/lib/mrz";
import Tesseract from "tesseract.js";

type Step = "select" | "processing" | "review" | "error";

interface ExtractedData {
  givenName: string;
  familyName: string;
  bornOn: string;
  gender: "m" | "f" | "";
  passportNumber: string;
  passportExpiryDate: string;
  nationality: string;
  passportIssuingCountry: string;
  documentType: string;
  confidence: number;
  warnings: string[];
}

interface ScanDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ExtractedData) => void;
  passengerIndex: number;
}

export function ScanDocumentDialog({
  open,
  onOpenChange,
  onConfirm,
  passengerIndex,
}: ScanDocumentDialogProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("select");
  const [progress, setProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [editableData, setEditableData] = useState<ExtractedData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep("select");
    setProgress(0);
    setImagePreview(null);
    setExtractedData(null);
    setEditableData(null);
    setErrorMessage("");
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetState();
    onOpenChange(newOpen);
  };

  const processImage = async (file: File) => {
    setStep("processing");
    setProgress(10);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setProgress(20);

      const result = await Tesseract.recognize(file, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setProgress(20 + Math.round(m.progress * 60));
          }
        },
      });

      setProgress(85);

      const ocrText = result.data.text;
      const mrzResult = parseMRZ(ocrText);

      setProgress(95);

      if (mrzResult && mrzResult.surname) {
        const data: ExtractedData = {
          givenName: mrzResult.givenNames,
          familyName: mrzResult.surname,
          bornOn: mrzResult.dateOfBirth,
          gender: mrzResult.gender,
          passportNumber: mrzResult.documentNumber,
          passportExpiryDate: mrzResult.expiryDate,
          nationality: mrzResult.nationality,
          passportIssuingCountry: mrzResult.issuingCountry,
          documentType: mrzResult.documentType,
          confidence: mrzResult.confidence,
          warnings: mrzResult.warnings,
        };
        setExtractedData(data);
        setEditableData({ ...data });
        setProgress(100);
        setStep("review");
      } else {
        setErrorMessage(t("scan.no_mrz_found"));
        setStep("error");
      }
    } catch (err) {
      console.error("OCR error:", err);
      setErrorMessage(t("scan.ocr_error"));
      setStep("error");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleConfirm = () => {
    if (editableData) {
      onConfirm(editableData);
      handleOpenChange(false);
    }
  };

  const docTypeLabel = (type: string) => {
    switch (type) {
      case "passport": return t("scan.doc_passport");
      case "id_card": return t("scan.doc_id_card");
      case "travel_doc": return t("scan.doc_travel_doc");
      case "visa": return t("scan.doc_visa");
      default: return t("scan.doc_document");
    }
  };

  const confidenceColor = (conf: number) => {
    if (conf >= 80) return "text-emerald-400";
    if (conf >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const confidenceBg = (conf: number) => {
    if (conf >= 80) return "bg-emerald-500/20 border-emerald-500/30";
    if (conf >= 60) return "bg-amber-500/20 border-amber-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-[hsl(220,18%,10%)]/95 backdrop-blur-xl text-white overflow-y-auto max-h-[90vh]">
        {step === "select" && (
          <>
            <DialogHeader className="text-center items-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-2">
                <ScanLine className="h-8 w-8 text-teal-400" />
              </div>
              <DialogTitle className="text-xl font-display text-white" data-testid={`text-scan-title-${passengerIndex}`}>
                {t("scan.title")}
              </DialogTitle>
              <DialogDescription className="text-white/50 text-sm">
                {t("scan.subtitle")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                <h4 className="text-sm font-bold text-white/80 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-400" />
                  {t("scan.supported_docs")}
                </h4>
                <ul className="text-xs text-white/50 space-y-1 ml-6 list-disc">
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
                  className="h-auto py-4 flex flex-col items-center gap-2 border-white/10 text-white/80"
                  onClick={() => cameraInputRef.current?.click()}
                  data-testid={`button-scan-camera-${passengerIndex}`}
                >
                  <Camera className="h-6 w-6 text-teal-400" />
                  <span className="text-sm font-medium">{t("scan.use_camera")}</span>
                  <span className="text-[10px] text-white/40">{t("scan.camera_tip")}</span>
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
                  className="h-auto py-4 flex flex-col items-center gap-2 border-white/10 text-white/80"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid={`button-scan-upload-${passengerIndex}`}
                >
                  <Upload className="h-6 w-6 text-amber-400" />
                  <span className="text-sm font-medium">{t("scan.upload_photo")}</span>
                  <span className="text-[10px] text-white/40">{t("scan.upload_tip")}</span>
                </Button>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10">
                <Shield className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-white/40 leading-relaxed">
                  {t("scan.privacy_notice")}
                </p>
              </div>
            </div>
          </>
        )}

        {step === "processing" && (
          <>
            <DialogHeader className="text-center items-center">
              <DialogTitle className="text-xl font-display text-white">
                {t("scan.processing")}
              </DialogTitle>
              <DialogDescription className="text-white/50 text-sm">
                {t("scan.processing_desc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {imagePreview && (
                <div className="rounded-xl overflow-hidden border border-white/10 max-h-48 flex items-center justify-center bg-black/20">
                  <img src={imagePreview} alt="Document" className="max-h-48 object-contain" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>{t("scan.reading_document")}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                <span>
                  {progress < 30 && t("scan.step_loading")}
                  {progress >= 30 && progress < 80 && t("scan.step_ocr")}
                  {progress >= 80 && progress < 95 && t("scan.step_parsing")}
                  {progress >= 95 && t("scan.step_done")}
                </span>
              </div>
            </div>
          </>
        )}

        {step === "review" && editableData && (
          <>
            <DialogHeader className="text-center items-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
                <Eye className="h-7 w-7 text-emerald-400" />
              </div>
              <DialogTitle className="text-xl font-display text-white" data-testid={`text-scan-review-title-${passengerIndex}`}>
                {t("scan.review_title")}
              </DialogTitle>
              <DialogDescription className="text-white/50 text-sm">
                {t("scan.review_subtitle")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Badge className={`text-xs ${confidenceBg(editableData.confidence)}`}>
                  {docTypeLabel(editableData.documentType)}
                </Badge>
                <div className="flex items-center gap-1.5">
                  {editableData.confidence >= 80 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  )}
                  <span className={`text-xs font-bold ${confidenceColor(editableData.confidence)}`}>
                    {t("scan.confidence")}: {editableData.confidence}%
                  </span>
                </div>
              </div>

              {editableData.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-300/80">
                    <p className="font-bold mb-1">{t("scan.warnings")}</p>
                    <p>{t("scan.verify_data")}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{t("booking.family_name")}</Label>
                    <Input
                      value={editableData.familyName}
                      onChange={(e) => setEditableData({ ...editableData, familyName: e.target.value })}
                      className="bg-white/5 border-white/15 text-white text-sm"
                      data-testid={`input-scan-family-name-${passengerIndex}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{t("booking.given_name")}</Label>
                    <Input
                      value={editableData.givenName}
                      onChange={(e) => setEditableData({ ...editableData, givenName: e.target.value })}
                      className="bg-white/5 border-white/15 text-white text-sm"
                      data-testid={`input-scan-given-name-${passengerIndex}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{t("booking.date_of_birth")}</Label>
                    <Input
                      type="date"
                      value={editableData.bornOn}
                      onChange={(e) => setEditableData({ ...editableData, bornOn: e.target.value })}
                      className="bg-white/5 border-white/15 text-white text-sm"
                      data-testid={`input-scan-dob-${passengerIndex}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{t("booking.gender")}</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={editableData.gender === "m" ? "default" : "outline"}
                        className={`flex-1 text-xs ${editableData.gender === "m" ? "" : "border-white/10 text-white/60"}`}
                        onClick={() => setEditableData({ ...editableData, gender: "m" })}
                        data-testid={`button-scan-gender-m-${passengerIndex}`}
                      >
                        {t("booking.male")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={editableData.gender === "f" ? "default" : "outline"}
                        className={`flex-1 text-xs ${editableData.gender === "f" ? "" : "border-white/10 text-white/60"}`}
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
                    <Label className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{t("scan.doc_number")}</Label>
                    <Input
                      value={editableData.passportNumber}
                      onChange={(e) => setEditableData({ ...editableData, passportNumber: e.target.value })}
                      className="bg-white/5 border-white/15 text-white text-sm"
                      data-testid={`input-scan-doc-number-${passengerIndex}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{t("booking.passport_expiry")}</Label>
                    <Input
                      type="date"
                      value={editableData.passportExpiryDate}
                      onChange={(e) => setEditableData({ ...editableData, passportExpiryDate: e.target.value })}
                      className="bg-white/5 border-white/15 text-white text-sm"
                      data-testid={`input-scan-expiry-${passengerIndex}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{t("booking.nationality")}</Label>
                    <Input
                      value={editableData.nationality}
                      onChange={(e) => setEditableData({ ...editableData, nationality: e.target.value.toUpperCase() })}
                      className="bg-white/5 border-white/15 text-white text-sm"
                      maxLength={3}
                      placeholder="BRA"
                      data-testid={`input-scan-nationality-${passengerIndex}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{t("booking.issuing_country")}</Label>
                    <Input
                      value={editableData.passportIssuingCountry}
                      onChange={(e) => setEditableData({ ...editableData, passportIssuingCountry: e.target.value.toUpperCase() })}
                      className="bg-white/5 border-white/15 text-white text-sm"
                      maxLength={3}
                      placeholder="BRA"
                      data-testid={`input-scan-issuing-${passengerIndex}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 text-white/60"
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
            </div>
          </>
        )}

        {step === "error" && (
          <>
            <DialogHeader className="text-center items-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <DialogTitle className="text-xl font-display text-white">
                {t("scan.error_title")}
              </DialogTitle>
              <DialogDescription className="text-white/50 text-sm">
                {errorMessage}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {imagePreview && (
                <div className="rounded-xl overflow-hidden border border-white/10 max-h-32 flex items-center justify-center bg-black/20">
                  <img src={imagePreview} alt="Document" className="max-h-32 object-contain opacity-50" />
                </div>
              )}

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
                <p className="text-xs font-bold text-white/70">{t("scan.tips_title")}</p>
                <ul className="text-[11px] text-white/40 space-y-1 ml-4 list-disc">
                  <li>{t("scan.tip_1")}</li>
                  <li>{t("scan.tip_2")}</li>
                  <li>{t("scan.tip_3")}</li>
                  <li>{t("scan.tip_4")}</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 text-white/60"
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
