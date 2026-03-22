import React, { useMemo, useState } from "react";
import { TSA_ACCEPTED_DOCS, type TsaDocumentType } from "@shared/tsaAcceptedDocs";
import { useDocumentScanner } from "@/hooks/use-document-scanner";
import { Button } from "@/components/ui/button";

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

      <Button onClick={handleScan} disabled={!dataUrl || loading} className="w-full sm:w-auto">
        {loading ? "Lendo documento..." : "Ler documento"}
      </Button>

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
