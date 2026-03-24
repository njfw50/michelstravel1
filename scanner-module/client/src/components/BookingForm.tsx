import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ScanLine,
  User,
  FileText,
  Plane,
  Calendar,
  Mail,
  Phone,
  Globe,
  Shield,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import type { MergedDocumentScanResult } from "@/lib/documentScan";
import { toast } from "sonner";

interface BookingFormProps {
  scanData: MergedDocumentScanResult | null;
  onRescan: () => void;
}

interface PassengerData {
  title: string;
  givenName: string;
  familyName: string;
  bornOn: string;
  gender: string;
  email: string;
  phoneNumber: string;
  documentType: string;
  documentNumber: string;
  documentExpiryDate: string;
  documentIssuingCountry: string;
  nationality: string;
}

const EMPTY_PASSENGER: PassengerData = {
  title: "mr",
  givenName: "",
  familyName: "",
  bornOn: "",
  gender: "",
  email: "",
  phoneNumber: "",
  documentType: "passport",
  documentNumber: "",
  documentExpiryDate: "",
  documentIssuingCountry: "",
  nationality: "",
};

function mapDocType(raw: string): string {
  switch (raw) {
    case "passport": return "passport";
    case "national_id": return "national_id";
    case "drivers_license": return "drivers_license";
    case "travel_document": return "travel_document";
    default: return "passport";
  }
}

export function BookingForm({ scanData, onRescan }: BookingFormProps) {
  const [passenger, setPassenger] = useState<PassengerData>(EMPTY_PASSENGER);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filledFromScan, setFilledFromScan] = useState(false);

  // Apply scan data when available
  useEffect(() => {
    if (scanData) {
      setPassenger((prev) => ({
        ...prev,
        givenName: scanData.givenName || prev.givenName,
        familyName: scanData.familyName || prev.familyName,
        bornOn: scanData.bornOn || prev.bornOn,
        gender: scanData.gender || prev.gender,
        documentType: mapDocType(scanData.documentType) || prev.documentType,
        documentNumber: scanData.passportNumber || prev.documentNumber,
        documentExpiryDate: scanData.passportExpiryDate || prev.documentExpiryDate,
        documentIssuingCountry: scanData.passportIssuingCountry || prev.documentIssuingCountry,
        nationality: scanData.nationality || prev.nationality,
      }));
      setFilledFromScan(true);
      toast.success("Dados do documento aplicados ao formulário!", {
        description: "Confira e complete os campos restantes.",
        duration: 4000,
      });
    }
  }, [scanData]);

  const updateField = (field: keyof PassengerData, value: string) => {
    setPassenger((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Reserva enviada com sucesso!", {
      description: "Você receberá uma confirmação por e-mail.",
      duration: 5000,
    });
  };

  if (submitted) {
    return (
      <div className="animate-fade-in-up text-center py-12">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Reserva Enviada!
        </h2>
        <p className="text-muted-foreground mt-3 text-base max-w-md mx-auto">
          Seus dados foram enviados com sucesso. Você receberá uma confirmação por e-mail em breve.
        </p>
        <div className="guide-card p-5 mt-8 max-w-sm mx-auto text-left">
          <p className="text-sm font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Resumo do Passageiro
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Nome:</span> {passenger.givenName} {passenger.familyName}</p>
            <p><span className="font-medium text-foreground">Documento:</span> {passenger.documentNumber}</p>
            <p><span className="font-medium text-foreground">Nacionalidade:</span> {passenger.nationality}</p>
          </div>
        </div>
        <Button
          className="mt-8 h-12 px-8 text-base"
          onClick={() => {
            setSubmitted(false);
            setPassenger(EMPTY_PASSENGER);
            setFilledFromScan(false);
            setContactEmail("");
            setContactPhone("");
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Nova Reserva
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="section-eyebrow w-fit">
          <Plane className="h-3.5 w-3.5" />
          Formulário de Reserva
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-display)" }}>
          Dados do Passageiro
        </h2>
        <p className="text-muted-foreground mt-2">
          {filledFromScan
            ? "Os campos foram preenchidos automaticamente pelo scanner. Complete os dados restantes."
            : "Preencha os dados do passageiro para a reserva."
          }
        </p>
      </div>

      {/* Scan status banner */}
      {filledFromScan && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Dados preenchidos pelo scanner ({scanData?.confidence}% confiança)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-100"
            onClick={onRescan}
          >
            <ScanLine className="h-3.5 w-3.5 mr-1.5" />
            Escanear Novamente
          </Button>
        </div>
      )}

      {!filledFromScan && (
        <div className="rounded-xl bg-accent/50 border border-primary/10 p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">
              Quer preencher mais rápido? Use o scanner de documentos.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 text-primary hover:bg-primary/5"
            onClick={onRescan}
          >
            <ScanLine className="h-3.5 w-3.5 mr-1.5" />
            Escanear Documento
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="guide-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Informações Pessoais
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Título
              </label>
              <select
                value={passenger.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="mr">Sr.</option>
                <option value="mrs">Sra.</option>
                <option value="ms">Srta.</option>
                <option value="dr">Dr.</option>
              </select>
            </div>
            {/* Given name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nome *
              </label>
              <input
                required
                value={passenger.givenName}
                onChange={(e) => updateField("givenName", e.target.value)}
                className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                  filledFromScan && passenger.givenName ? "border-green-300 bg-green-50/50" : "border-border bg-white"
                }`}
                placeholder="Nome"
              />
            </div>
            {/* Family name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sobrenome *
              </label>
              <input
                required
                value={passenger.familyName}
                onChange={(e) => updateField("familyName", e.target.value)}
                className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                  filledFromScan && passenger.familyName ? "border-green-300 bg-green-50/50" : "border-border bg-white"
                }`}
                placeholder="Sobrenome"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Birth date */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Data de Nascimento *
              </label>
              <input
                required
                type="date"
                value={passenger.bornOn}
                onChange={(e) => updateField("bornOn", e.target.value)}
                className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                  filledFromScan && passenger.bornOn ? "border-green-300 bg-green-50/50" : "border-border bg-white"
                }`}
              />
            </div>
            {/* Gender */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sexo *
              </label>
              <select
                required
                value={passenger.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                  filledFromScan && passenger.gender ? "border-green-300 bg-green-50/50" : "border-border bg-white"
                }`}
              >
                <option value="">Selecione</option>
                <option value="m">Masculino</option>
                <option value="f">Feminino</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Information */}
        <div className="guide-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Documento de Identidade
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Document type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tipo de Documento
              </label>
              <select
                value={passenger.documentType}
                onChange={(e) => updateField("documentType", e.target.value)}
                className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                  filledFromScan && passenger.documentType !== "passport" ? "border-green-300 bg-green-50/50" : "border-border bg-white"
                }`}
              >
                <option value="passport">Passaporte</option>
                <option value="national_id">Carteira de Identidade</option>
                <option value="drivers_license">Carteira de Motorista</option>
                <option value="travel_document">Documento de Viagem</option>
                <option value="other">Outro</option>
              </select>
            </div>
            {/* Document number */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Número do Documento *
              </label>
              <input
                required
                value={passenger.documentNumber}
                onChange={(e) => updateField("documentNumber", e.target.value.toUpperCase())}
                className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                  filledFromScan && passenger.documentNumber ? "border-green-300 bg-green-50/50" : "border-border bg-white"
                }`}
                placeholder="AB1234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Expiry */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Validade
              </label>
              <input
                type="date"
                value={passenger.documentExpiryDate}
                onChange={(e) => updateField("documentExpiryDate", e.target.value)}
                className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                  filledFromScan && passenger.documentExpiryDate ? "border-green-300 bg-green-50/50" : "border-border bg-white"
                }`}
              />
            </div>
            {/* Nationality */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nacionalidade
              </label>
              <input
                value={passenger.nationality}
                onChange={(e) => updateField("nationality", e.target.value.toUpperCase())}
                maxLength={3}
                className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                  filledFromScan && passenger.nationality ? "border-green-300 bg-green-50/50" : "border-border bg-white"
                }`}
                placeholder="BRA"
              />
            </div>
            {/* Issuing country */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                País Emissor
              </label>
              <input
                value={passenger.documentIssuingCountry}
                onChange={(e) => updateField("documentIssuingCountry", e.target.value.toUpperCase())}
                maxLength={3}
                className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
                  filledFromScan && passenger.documentIssuingCountry ? "border-green-300 bg-green-50/50" : "border-border bg-white"
                }`}
                placeholder="BRA"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="guide-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Contato
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                E-mail *
              </label>
              <input
                required
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Telefone *
              </label>
              <input
                required
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Seus dados são protegidos com criptografia de ponta a ponta</span>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            className="flex-1 h-14 text-lg font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Enviar Reserva
          </Button>
        </div>
      </form>
    </div>
  );
}
