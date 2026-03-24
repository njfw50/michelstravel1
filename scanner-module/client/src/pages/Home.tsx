import { useState } from "react";
import { DocumentScanner } from "@/components/DocumentScanner";
import { BookingForm } from "@/components/BookingForm";
import type { MergedDocumentScanResult } from "@/lib/documentScan";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ScanLine,
  Plane,
  Shield,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
  FileText,
  Users,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

type AppStep = "landing" | "scanning" | "booking";

export default function Home() {
  const [appStep, setAppStep] = useState<AppStep>("landing");
  const [scanData, setScanData] = useState<MergedDocumentScanResult | null>(null);

  const handleScanConfirm = (data: MergedDocumentScanResult) => {
    setScanData(data);
    setAppStep("booking");
  };

  const handleStartScan = () => {
    setAppStep("scanning");
  };

  const handleSkipScan = () => {
    setScanData(null);
    setAppStep("booking");
  };

  const handleBackToLanding = () => {
    setAppStep("landing");
    setScanData(null);
  };

  // ─── LANDING ─────────────────────────────────────────────
  if (appStep === "landing") {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-white/20">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Michels Travel
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Seguro e Privado
            </Badge>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />
          <div className="container py-16 sm:py-24 relative">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="section-eyebrow mx-auto w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Scanner Inteligente
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight mt-4" style={{ fontFamily: "var(--font-display)" }}>
                Escaneie seu documento,{" "}
                <span className="text-primary">preencha tudo automaticamente</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-5 leading-relaxed">
                Tire uma foto do seu passaporte, identidade ou carteira de motorista.
                Nosso scanner lê os dados e preenche o formulário de reserva para você.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <button
                  onClick={handleStartScan}
                  className="btn-guide-primary text-lg px-8 py-4 animate-pulse-glow"
                >
                  <ScanLine className="h-5 w-5" />
                  Escanear Documento
                </button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base border-border"
                  onClick={handleSkipScan}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Preencher Manualmente
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="container">
            <div className="text-center mb-12">
              <div className="section-eyebrow mx-auto w-fit">
                Como Funciona
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-display)" }}>
                Simples como 1, 2, 3
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  step: "1",
                  icon: ScanLine,
                  title: "Escaneie",
                  desc: "Tire uma foto ou envie uma imagem do seu documento de identidade",
                },
                {
                  step: "2",
                  icon: Zap,
                  title: "Leitura Automática",
                  desc: "Nosso scanner inteligente lê e extrai todos os dados do documento",
                },
                {
                  step: "3",
                  icon: CheckCircle2,
                  title: "Confirme e Pronto",
                  desc: "Revise os dados, corrija se necessário, e o formulário é preenchido",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="step-card"
                >
                  <div className="text-xs font-bold text-primary mb-3 tracking-widest">
                    PASSO {item.step}
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="container">
            <div className="text-center mb-12">
              <div className="section-eyebrow mx-auto w-fit">
                Recursos
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-display)" }}>
                Feito para todos
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                Interface intuitiva pensada para todas as idades e níveis de experiência com tecnologia.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {[
                {
                  icon: Globe,
                  title: "Documentos de Qualquer País",
                  desc: "Passaportes, identidades e carteiras de motorista de todo o mundo. Suporte a MRZ internacional.",
                },
                {
                  icon: Shield,
                  title: "Processamento Local",
                  desc: "Seus dados são processados no seu dispositivo. Nenhuma imagem é enviada para servidores externos.",
                },
                {
                  icon: Users,
                  title: "Acessível para Todos",
                  desc: "Textos grandes, botões amplos, instruções claras. Pensado para idosos e todas as idades.",
                },
                {
                  icon: Zap,
                  title: "Rápido e Preciso",
                  desc: "Leitura em segundos com múltiplas tentativas automáticas para máxima precisão.",
                },
                {
                  icon: FileText,
                  title: "Revisão Editável",
                  desc: "Todos os campos podem ser corrigidos antes de confirmar. Você tem controle total.",
                },
                {
                  icon: CheckCircle2,
                  title: "Preenchimento Automático",
                  desc: "Os dados confirmados são inseridos automaticamente no formulário de reserva.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 * i }}
                  className="guide-card p-6"
                >
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5.5 w-5.5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden relative" style={{
              background: "linear-gradient(135deg, oklch(0.205 0.015 247) 0%, oklch(0.38 0.15 262) 100%)",
            }}>
              <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse at 70% 50%, oklch(0.546 0.215 262 / 0.2) 0%, transparent 70%)",
              }} />
              <div className="relative p-8 sm:p-12 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Pronto para começar?
                </h2>
                <p className="text-white/80 mt-3 text-base sm:text-lg max-w-md mx-auto">
                  Escaneie seu documento agora e preencha sua reserva em segundos.
                </p>
                <button
                  onClick={handleStartScan}
                  className="mt-6 inline-flex items-center gap-2 bg-white text-foreground font-bold text-base rounded-full px-8 py-4 hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <ScanLine className="h-5 w-5" />
                  Escanear Agora
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="container text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <Plane className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Michels Travel
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Scanner de Documentos — Processamento 100% local e seguro
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // ─── SCANNING ────────────────────────────────────────────
  if (appStep === "scanning") {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 glass border-b border-white/20">
          <div className="container flex items-center justify-between h-16">
            <button
              onClick={handleBackToLanding}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Voltar
            </button>
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Processamento Local
            </Badge>
          </div>
        </header>
        <main className="container py-8 sm:py-12 max-w-2xl mx-auto">
          <DocumentScanner
            onConfirm={handleScanConfirm}
            onCancel={handleBackToLanding}
          />
        </main>
      </div>
    );
  }

  // ─── BOOKING FORM ────────────────────────────────────────
  if (appStep === "booking") {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 glass border-b border-white/20">
          <div className="container flex items-center justify-between h-16">
            <button
              onClick={handleBackToLanding}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Voltar ao Início
            </button>
            {scanData && (
              <Badge className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Dados do scanner aplicados
              </Badge>
            )}
          </div>
        </header>
        <main className="container py-8 sm:py-12 max-w-3xl mx-auto">
          <BookingForm
            scanData={scanData}
            onRescan={() => setAppStep("scanning")}
          />
        </main>
      </div>
    );
  }

  return null;
}
