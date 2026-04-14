import React, { useMemo, useState, useEffect } from "react";
import { TSA_ACCEPTED_DOCS, type TsaDocumentType } from "@shared/tsaAcceptedDocs";
import { useDocumentScanner } from "@/hooks/use-document-scanner";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Loader2, 
  QrCode, 
  X,
  ScanLine
} from "lucide-react";
import { 
  generateSessionId, 
  buildScannerLink, 
  listenForScanResult 
} from "@/lib/scannerBridge";
import { useI18n } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function MobileScannerButton({ onData }: { onData: (data: any) => void }) {
  const { language, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const startSession = () => {
    const sid = generateSessionId();
    const url = buildScannerLink({
      sessionId: sid,
      lang: language || "pt",
      origin: window.location.origin
    });
    setSessionId(sid);
    setQrUrl(url);
    setOpen(true);
  };

  useEffect(() => {
    if (!open || !sessionId) return;
    return listenForScanResult(sessionId, (data) => {
      onData(data);
      setOpen(false);
    });
  }, [open, sessionId, onData]);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={startSession}
        className="w-full border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 rounded-xl h-12 font-black uppercase tracking-widest gap-2"
      >
        <Smartphone className="h-5 w-5" />
        Scanner Celular
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm bg-slate-900 border-white/10 text-white rounded-[32px]">
          <DialogHeader className="text-center items-center p-6">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
               <ScanLine className="h-8 w-8 text-blue-400" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Scanner Remoto</DialogTitle>
            <p className="text-xs text-slate-400 font-medium">Escaneie o QR Code abaixo com a câmera do seu celular.</p>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-6 space-y-6">
            <div className="bg-white p-4 rounded-3xl border-4 border-white/5">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl || "")}&format=svg`} 
                alt="QR Code" 
                className="w-40 h-40" 
              />
            </div>
            
            <div className="flex items-center gap-3 text-blue-400 animate-pulse font-black uppercase tracking-widest text-[10px]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Aguardando Celular...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type Props = {
  onResult?: (result: any) => void;
};

export function DocumentScannerForm({ onResult }: Props) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [declaredType, setDeclaredType] = useState<TsaDocumentType>("passport");
  const { scan, loading, error } = useDocumentScanner();
  const [warnings, setWarnings] = useState<string[]>([]);
  const [candidate, setCandidate] = useState<any>(null);

  const docTypeOptions = useMemo(
    () => Object.entries(TSA_ACCEPTED_DOCS) as [TsaDocumentType, (typeof TSA_ACCEPTED_DOCS)[TsaDocumentType]][],
    [],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleScan() {
    if (!dataUrl) return;
    const result = await scan({
      documentImageDataUrl: dataUrl,
      declaredDocumentType: declaredType,
    });
    if (result) {
      setWarnings(result.warnings || []);
      setCandidate(result.candidate);
      onResult?.(result);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 p-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Tipo de documento</label>
        <select
          value={declaredType}
          onChange={(e) => setDeclaredType(e.target.value as TsaDocumentType)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        >
          {docTypeOptions.map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Imagem do documento (frente)</label>
        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm" />
        {dataUrl && <span className="text-xs text-gray-500">Imagem carregada ({Math.round((dataUrl.length * 3) / 4 / 1024)} KB)</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button onClick={handleScan} disabled={!dataUrl || loading} className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl h-12 font-black uppercase tracking-widest">
          {loading ? "Lendo documento..." : "Ler documento"}
        </Button>
        
        <MobileScannerButton onData={(data) => {
          setCandidate(data);
          onResult?.(data);
        }} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          <strong>Avisos:</strong> {warnings.join(", ")}
        </div>
      )}

      {candidate && (
        <pre className="rounded-lg bg-gray-900 p-3 text-xs text-gray-100 overflow-x-auto">
          {JSON.stringify(candidate, null, 2)}
        </pre>
      )}
    </div>
  );
}
