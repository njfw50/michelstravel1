import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ScanLine, 
  Smartphone, 
  Sun, 
  Focus, 
  Sparkles,
  RotateCcw,
  Eye,
  Check,
  X,
  Shield,
  FileText
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { parseMRZ, type MRZResult } from "@/lib/mrz";
import { preprocessForMRZ, createPreviewUrl, blobToDataUrl } from "@/lib/imagePreprocess";
import { 
  mergeDocumentScanCandidates, 
  mapScannedDocumentTypeToBooking, 
  type BookingDocumentType, 
  type DocumentAiCandidate, 
  type MergedDocumentScanResult 
} from "@/lib/documentScan";
import { sendScanResult } from "@/lib/scannerBridge";
import Tesseract from "tesseract.js";
import { motion, AnimatePresence } from "framer-motion";

type Step = "idle" | "processing" | "review" | "done" | "error";
type TesseractWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>;

export default function ScannerPage() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<MergedDocumentScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef(0);

  // Extract session ID from URL
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session") || params.get("sessionId");
  const mode = params.get("mode") || "scan";

  const setProgressValue = (value: number) => {
    progressRef.current = value;
    setProgress(value);
  };

  const processImage = async (file: File) => {
    setStep("processing");
    setProgressValue(5);
    setProgressLabel(t("scan.step_preparing") || "Preparando imagem...");

    const preview = await createPreviewUrl(file);
    setImagePreview(preview);

    let mrzWorker: TesseractWorker | null = null;
    let generalWorker: TesseractWorker | null = null;

    try {
      const {
        enhanced,
        mrzCropped,
        mrzWide,
        analysisPreview,
        analysisMrzPreview,
      } = await preprocessForMRZ(file);

      setProgressValue(15);
      setProgressLabel(t("scan.step_enhancing") || "Melhorando nitidez...");

      mrzWorker = await Tesseract.createWorker("ocrb", Tesseract.OEM.LSTM_ONLY, {
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
      });
      
      generalWorker = await Tesseract.createWorker("eng", Tesseract.OEM.LSTM_ONLY, {
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
      });

      setProgressValue(30);
      setProgressLabel(t("scan.attempt_mrz_zone") || "Buscando zona MRZ...");

      // Tesseract MRZ Pass
      await mrzWorker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
        preserve_interword_spaces: "1",
      });

      const mrzResultText = (await mrzWorker.recognize(mrzCropped)).data.text || "";
      const parsedMrz = parseMRZ(mrzResultText);

      setProgressValue(60);
      setProgressLabel(t("scan.attempt_original") || "Buscando dados gerais...");

      // General OCR Pass
      await generalWorker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: "1",
      });
      const generalOcrText = (await generalWorker.recognize(enhanced)).data.text || "";

      setProgressValue(80);
      setProgressLabel(t("scan.step_finalizing") || "Analiando com IA...");

      // AI Analysis
      const [documentImageDataUrl, mrzImageDataUrl] = await Promise.all([
        blobToDataUrl(analysisPreview),
        blobToDataUrl(analysisMrzPreview),
      ]);

      const aiResponse = await fetch("/api/document-scanner/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentImageDataUrl,
          mrzImageDataUrl,
          rawOcrText: generalOcrText + "\n" + mrzResultText,
          mrzResult: parsedMrz,
        }),
      });

      const aiData = await aiResponse.json();

      const merged = mergeDocumentScanCandidates({
        mrz: parsedMrz,
        ai: aiData?.candidate || null,
      });

      setEditableData(merged);
      setProgressValue(100);
      setStep("review");
    } catch (error) {
      console.error("[SCANNER] Processing error:", error);
      setErrorMessage(t("scan.ocr_error") || "Erro ao processar documento.");
      setStep("error");
    } finally {
      mrzWorker?.terminate();
      generalWorker?.terminate();
    }
  };

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleConfirm = async () => {
    if (!editableData || !sessionId) return;
    
    setStep("processing");
    setProgressLabel(t("scan.sending_result") || "Enviando resultado...");
    
    await sendScanResult(sessionId, editableData);
    
    setStep("done");
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-black text-white uppercase italic">Sessão Inválida</h1>
          <p className="text-slate-400">Escaneie o QR Code no seu computador para começar.</p>
          <Button onClick={() => setLocation("/")} className="bg-blue-600 hover:bg-blue-500 rounded-2xl h-14 w-full font-black uppercase tracking-widest">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.3)_0%,rgba(2,6,23,0)_70%)] pointer-events-none" />

      <main className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {step === "idle" && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col p-6 pt-12"
            >
              <div className="text-center space-y-4 mb-12">
                <div className="mx-auto h-24 w-24 rounded-[32px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/10">
                  <ScanLine className="h-12 w-12 text-blue-400" />
                </div>
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                  Michel's <span className="text-blue-500">Scanner</span>
                </h1>
                <p className="text-slate-400 font-medium">{t("scan.subtitle") || "Digitalize seus documentos com segurança."}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <input 
                    ref={cameraInputRef}
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handleCapture} 
                  />
                  <Button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-28 bg-blue-600 hover:bg-blue-500 rounded-[32px] flex flex-col gap-2 group shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <Camera className="h-8 w-8 text-white" />
                    <span className="font-black uppercase tracking-widest text-lg">{t("scan.open_camera") || "Abrir Câmera"}</span>
                  </Button>

                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleCapture} 
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="ghost" 
                    className="h-24 bg-white/5 border border-white/10 rounded-[32px] flex flex-col gap-2 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="font-black uppercase tracking-widest text-sm text-slate-300">{t("scan.upload_photo") || "Fazer Upload"}</span>
                  </Button>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-[32px] p-6 space-y-4">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("scan.photo_tips_title") || "DICAS PARA UMA BOA CAPTURA"}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4">
                      <Sun className="h-5 w-5 text-slate-500" />
                      <p className="text-xs text-slate-400 font-medium">{t("scan.photo_tip_light") || "Certifique-se de que o ambiente esteja bem iluminado."}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Focus className="h-5 w-5 text-slate-500" />
                      <p className="text-xs text-slate-400 font-medium">{t("scan.photo_tip_focus") || "Mantenha o documento focado e sem reflexos."}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-[24px] bg-slate-900/50 border border-white/5">
                  <Shield className="h-5 w-5 text-slate-500 shrink-0" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                    {t("scan.privacy_notice") || "PROCESSAMOS SEUS DADOS SOB SIGILO E NÃO ARMAZENAMOS IMAGENS ORIGINAIS APÓS A EXTRAÇÃO."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col p-6 items-center justify-center text-center space-y-8"
            >
              <div className="relative w-full aspect-[4/3] max-w-xs mx-auto overflow-hidden rounded-[40px] border border-blue-500/30 bg-slate-900 shadow-2xl">
                {imagePreview && <img src={imagePreview} className="w-full h-full object-cover opacity-40 grayscale" />}
                <div className="absolute inset-x-0 h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] animate-scan-line" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-slate-950/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
                      <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-2" />
                      <span className="text-xs font-black uppercase tracking-widest text-white">{progress}%</span>
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">{progressLabel}</h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">
                  {t("scan.multi_attempt_notice") || "Isso pode levar alguns segundos..."}
                </p>
              </div>
            </motion.div>
          )}

          {step === "review" && editableData && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col p-6"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                   <h2 className="text-xl font-black italic uppercase tracking-tighter">{t("scan.review_title") || "Revisar Dados"}</h2>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t("scan.review_subtitle") || "Confirme se as informações estão corretas."}</p>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto pb-24 custom-scrollbar">
                <div className="grid grid-cols-1 gap-4 p-6 rounded-[32px] bg-white/5 border border-white/5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("booking.family_name") || "Sobrenome"}</label>
                    <input 
                      value={editableData.familyName} 
                      onChange={e => setEditableData({...editableData, familyName: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 h-12 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("booking.given_name") || "Nome Próprio"}</label>
                    <input 
                      value={editableData.givenName} 
                      onChange={e => setEditableData({...editableData, givenName: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 h-12 text-sm font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("booking.date_of_birth") || "Nascimento"}</label>
                      <input 
                        type="date"
                        value={editableData.bornOn} 
                        onChange={e => setEditableData({...editableData, bornOn: e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 h-12 text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("booking.gender") || "Gênero"}</label>
                      <div className="flex gap-2 h-12">
                        <Button 
                          onClick={() => setEditableData({...editableData, gender: 'm'})}
                          className={`flex-1 rounded-xl h-full border ${editableData.gender === 'm' ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-white/10 text-slate-500'}`}
                        >M</Button>
                        <Button 
                          onClick={() => setEditableData({...editableData, gender: 'f'})}
                          className={`flex-1 rounded-xl h-full border ${editableData.gender === 'f' ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-white/10 text-slate-500'}`}
                        >F</Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("scan.doc_number") || "Número do Documento"}</label>
                    <input 
                      value={editableData.passportNumber} 
                      onChange={e => setEditableData({...editableData, passportNumber: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 h-12 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t("booking.passport_expiry") || "Validade"}</label>
                    <input 
                      type="date"
                      value={editableData.passportExpiryDate} 
                      onChange={e => setEditableData({...editableData, passportExpiryDate: e.target.value})}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 h-12 text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 flex gap-4">
                 <Button 
                   variant="ghost" 
                   onClick={() => setStep("idle")}
                   className="flex-1 h-14 rounded-2xl bg-white/5 font-black uppercase tracking-widest"
                 >
                   {t("scan.try_again") || "Refazer"}
                 </Button>
                 <Button 
                   onClick={handleConfirm}
                   className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest shadow-lg shadow-blue-600/20"
                 >
                   {t("scan.confirm_data") || "Confirmar"}
                 </Button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div 
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col p-8 items-center justify-center text-center space-y-6"
            >
              <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Check className="h-12 w-12 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Sucesso!</h2>
                <p className="text-slate-400 font-medium">Os dados foram enviados para o seu computador.</p>
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] pt-4">VOCÊ JÁ PODE FECHAR ESTA JANELA</p>
              <Button 
                onClick={() => setLocation("/")}
                variant="ghost" 
                className="mt-8 text-blue-400 font-bold uppercase tracking-widest text-xs"
              >
                Voltar à Página Inicial
              </Button>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col p-8 items-center justify-center text-center space-y-6"
            >
              <div className="h-20 w-20 rounded-[28px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-red-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">{t("scan.error_title") || "Erro na Digitalização"}</h2>
                <p className="text-red-400/70 text-sm font-medium">{errorMessage}</p>
              </div>
              <Button 
                onClick={() => setStep("idle")}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest"
              >
                {t("scan.try_again") || "Tentar Novamente"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { transform: translateY(0); }
          100% { transform: translateY(240px); }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 0;
        }
      `}} />
    </div>
  );
}
