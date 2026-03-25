import { useState, useEffect, useCallback } from "react";
import { DocumentScanner } from "@/components/DocumentScanner";
import { BookingForm } from "@/components/BookingForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { MergedDocumentScanResult } from "@/lib/documentScan";
import { useLocale } from "@/contexts/LocaleContext";
import {
  generateSessionId,
  buildScannerUrl,
  listenForScanResult,
  cleanupOldSessions,
} from "@/lib/scannerBridge";
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
  QrCode,
  Smartphone,
  Loader2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

type AppStep = "landing" | "scanning" | "qrcode" | "booking";

export default function Home() {
  const { t, locale } = useLocale();
  const [appStep, setAppStep] = useState<AppStep>("landing");
  const [scanData, setScanData] = useState<MergedDocumentScanResult | null>(null);
  const [qrSessionId, setQrSessionId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [waitingForMobile, setWaitingForMobile] = useState(false);

  // Cleanup old sessions on mount
  useEffect(() => {
    cleanupOldSessions();
  }, []);

  const handleScanConfirm = useCallback((data: MergedDocumentScanResult) => {
    setScanData(data);
    setAppStep("booking");
    setWaitingForMobile(false);
  }, []);

  const handleStartScan = () => {
    setAppStep("scanning");
  };

  const handleStartQrScan = () => {
    const sessionId = generateSessionId();
    setQrSessionId(sessionId);

    // Build scanner URL — uses current origin for same-device, or deployed URL
    const scannerBaseUrl = window.location.origin + "/scan";
    const url = buildScannerUrl(scannerBaseUrl, {
      sessionId,
      lang: locale,
      callback: window.location.origin + "/?session=" + sessionId,
      origin: window.location.origin,
    });
    setQrUrl(url);
    setAppStep("qrcode");
    setWaitingForMobile(true);
  };

  // Listen for scan results when in QR mode
  useEffect(() => {
    if (!waitingForMobile || !qrSessionId) return;
    const cleanup = listenForScanResult(qrSessionId, handleScanConfirm);
    return cleanup;
  }, [waitingForMobile, qrSessionId, handleScanConfirm]);

  const handleSkipScan = () => {
    setScanData(null);
    setAppStep("booking");
  };

  const handleBackToLanding = () => {
    setAppStep("landing");
    setScanData(null);
    setWaitingForMobile(false);
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
                {t.appName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Badge variant="secondary" className="text-xs hidden sm:flex">
                <Shield className="h-3 w-3 mr-1" />
                {t.securePrivate}
              </Badge>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />
          <div className="container py-12 sm:py-24 relative">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="section-eyebrow mx-auto w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                {t.heroEyebrow}
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight mt-4" style={{ fontFamily: "var(--font-display)" }}>
                {t.heroTitle1}{" "}
                <span className="text-primary">{t.heroTitle2}</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-5 leading-relaxed">
                {t.heroDesc}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <button
                  onClick={handleStartScan}
                  className="btn-guide-primary text-lg px-8 py-4 animate-pulse-glow w-full sm:w-auto"
                >
                  <ScanLine className="h-5 w-5" />
                  {t.scanDocument}
                </button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base border-border w-full sm:w-auto"
                  onClick={handleStartQrScan}
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  <Smartphone className="h-4 w-4 mr-1" />
                  Scanner Mobile
                </Button>
              </div>

              <Button
                variant="ghost"
                className="mt-3 text-muted-foreground"
                onClick={handleSkipScan}
              >
                <FileText className="h-4 w-4 mr-2" />
                {t.fillManually}
              </Button>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 sm:py-20">
          <div className="container">
            <div className="text-center mb-10 sm:mb-12">
              <div className="section-eyebrow mx-auto w-fit">{t.howItWorks}</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-display)" }}>
                {t.simpleAs123}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-4xl mx-auto">
              {[
                { step: "1", icon: ScanLine, title: t.step1Title, desc: t.step1Desc },
                { step: "2", icon: Zap, title: t.step2Title, desc: t.step2Desc },
                { step: "3", icon: CheckCircle2, title: t.step3Title, desc: t.step3Desc },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="step-card"
                >
                  <div className="text-xs font-bold text-primary mb-3 tracking-widest">
                    {item.step}
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
        <section className="py-12 sm:py-20 bg-white">
          <div className="container">
            <div className="text-center mb-10 sm:mb-12">
              <div className="section-eyebrow mx-auto w-fit">{t.featuresEyebrow}</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-display)" }}>
                {t.featuresTitle}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg mx-auto">{t.featuresDesc}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
              {[
                { icon: Globe, title: t.feat1Title, desc: t.feat1Desc },
                { icon: Shield, title: t.feat2Title, desc: t.feat2Desc },
                { icon: Users, title: t.feat3Title, desc: t.feat3Desc },
                { icon: Zap, title: t.feat4Title, desc: t.feat4Desc },
                { icon: FileText, title: t.feat5Title, desc: t.feat5Desc },
                { icon: CheckCircle2, title: t.feat6Title, desc: t.feat6Desc },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 * i }}
                  className="guide-card p-5 sm:p-6"
                >
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
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
        <section className="py-12 sm:py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden relative" style={{
              background: "linear-gradient(135deg, oklch(0.205 0.015 247) 0%, oklch(0.38 0.15 262) 100%)",
            }}>
              <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse at 70% 50%, oklch(0.546 0.215 262 / 0.2) 0%, transparent 70%)",
              }} />
              <div className="relative p-8 sm:p-12 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {t.ctaTitle}
                </h2>
                <p className="text-white/80 mt-3 text-base sm:text-lg max-w-md mx-auto">
                  {t.ctaDesc}
                </p>
                <button
                  onClick={handleStartScan}
                  className="mt-6 inline-flex items-center gap-2 bg-white text-foreground font-bold text-base rounded-full px-8 py-4 hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <ScanLine className="h-5 w-5" />
                  {t.ctaButton}
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
                {t.appName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t.footerNote}</p>
          </div>
        </footer>
      </div>
    );
  }

  // ─── QR CODE MODE ────────────────────────────────────────
  if (appStep === "qrcode") {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 glass border-b border-white/20">
          <div className="container flex items-center justify-between h-16">
            <button
              onClick={handleBackToLanding}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              {t.back}
            </button>
            <LanguageSwitcher />
          </div>
        </header>
        <main className="container py-8 sm:py-12 max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Scanner Mobile
            </h2>
            <p className="text-muted-foreground mt-2 text-base max-w-md mx-auto">
              {t.scannerSessionDesc}
            </p>

            {/* QR Code */}
            <div className="mt-8 guide-card p-6 sm:p-8 max-w-sm mx-auto">
              <div className="bg-white rounded-2xl p-4 border border-border">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}&format=svg`}
                  alt="QR Code"
                  className="w-full max-w-[220px] mx-auto"
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-xs font-mono">
                  ID: {qrSessionId}
                </Badge>
              </div>

              {/* Copy link */}
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full border-border"
                onClick={() => {
                  navigator.clipboard.writeText(qrUrl);
                  import("sonner").then(({ toast }) => {
                    toast.success("Link copiado!");
                  });
                }}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {locale === "pt" ? "Copiar Link" : locale === "es" ? "Copiar Enlace" : "Copy Link"}
              </Button>
            </div>

            {/* Waiting indicator */}
            <div className="mt-8 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">{t.waitingReturn}</span>
            </div>

            {/* Cancel */}
            <Button
              variant="ghost"
              className="mt-4 text-muted-foreground"
              onClick={handleBackToLanding}
            >
              <X className="h-4 w-4 mr-2" />
              {t.cancel}
            </Button>
          </motion.div>
        </main>
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
              {t.back}
            </button>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Badge variant="secondary" className="text-xs hidden sm:flex">
                <Shield className="h-3 w-3 mr-1" />
                {t.localProcessing}
              </Badge>
            </div>
          </div>
        </header>
        <main className="container py-6 sm:py-12 max-w-2xl mx-auto">
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
              {t.backToStart}
            </button>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {scanData && (
                <Badge className="text-xs bg-green-50 text-green-700 border-green-200 hidden sm:flex">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t.scannerApplied}
                </Badge>
              )}
            </div>
          </div>
        </header>
        <main className="container py-6 sm:py-12 max-w-3xl mx-auto">
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
