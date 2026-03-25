/**
 * ScannerMobile — Página mobile-first que abre quando o site principal aciona o scanner.
 *
 * Fluxo:
 * 1. Site principal gera URL: /scan?mode=scan&session=ABC123&lang=pt&callback=https://site.com/booking
 * 2. Usuário abre no celular (via QR code ou link)
 * 3. Escaneia o documento
 * 4. Confirma os dados
 * 5. Dados são enviados de volta via BroadcastChannel / localStorage / callback URL
 * 6. Tela de sucesso com instrução para fechar
 */

import { useState, useEffect } from "react";
import { DocumentScanner } from "@/components/DocumentScanner";
import { useLocale } from "@/contexts/LocaleContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Shield,
  ScanLine,
  CheckCircle2,
  Plane,
  Smartphone,
  ArrowRight,
  Send,
} from "lucide-react";
import {
  parseSessionFromUrl,
  sendScanResult,
  buildCallbackUrl,
  type ScannerSession,
} from "@/lib/scannerBridge";
import type { MergedDocumentScanResult } from "@/lib/documentScan";
import { motion } from "framer-motion";

type MobileStep = "intro" | "scanning" | "sending" | "sent";

export default function ScannerMobile() {
  const { t, setLocale } = useLocale();
  const [session, setSession] = useState<ScannerSession | null>(null);
  const [mobileStep, setMobileStep] = useState<MobileStep>("intro");
  const [scanResult, setScanResult] = useState<MergedDocumentScanResult | null>(null);

  // Parse session from URL on mount
  useEffect(() => {
    const parsed = parseSessionFromUrl();
    setSession(parsed);
    // Set locale from URL param
    if (parsed.lang === "pt" || parsed.lang === "en" || parsed.lang === "es") {
      setLocale(parsed.lang);
    }
  }, [setLocale]);

  const handleScanConfirm = (data: MergedDocumentScanResult) => {
    setScanResult(data);
    setMobileStep("sending");

    // Small delay for UX
    setTimeout(() => {
      if (session) {
        // Try to send via BroadcastChannel / localStorage
        const sent = sendScanResult(session.sessionId, data);

        // If callback URL is provided (cross-device), redirect
        if (session.callback && !sent) {
          const callbackUrl = buildCallbackUrl(session.callback, session.sessionId, data);
          window.location.href = callbackUrl;
          return;
        }
      }
      setMobileStep("sent");
    }, 800);
  };

  // ─── INTRO (Welcome screen on mobile) ───────────────────
  if (mobileStep === "intro") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Mobile header */}
        <header className="sticky top-0 z-50 glass border-b border-white/20 safe-area-top">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Plane className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {t.appName}
              </span>
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col justify-center px-5 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="mx-auto h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
              <ScanLine className="h-10 w-10 text-primary" />
            </div>

            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {t.scannerSessionTitle}
            </h1>
            <p className="text-muted-foreground mt-3 text-base leading-relaxed max-w-sm mx-auto">
              {t.scannerSessionDesc}
            </p>

            {/* Session info */}
            {session?.sessionId && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-xs font-mono">
                  <Smartphone className="h-3 w-3 mr-1" />
                  {session.sessionId}
                </Badge>
              </div>
            )}

            {/* Start button — large for mobile */}
            <button
              onClick={() => setMobileStep("scanning")}
              className="btn-guide-primary text-lg px-8 py-5 mt-8 w-full max-w-sm mx-auto animate-pulse-glow"
            >
              <ScanLine className="h-6 w-6" />
              {t.scanDocument}
              <ArrowRight className="h-5 w-5" />
            </button>

            {/* Security */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>{t.securityLocal}</span>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // ─── SCANNING ────────────────────────────────────────────
  if (mobileStep === "scanning") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 glass border-b border-white/20 safe-area-top">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => setMobileStep("intro")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              {t.back}
            </button>
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              {t.localProcessing}
            </Badge>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <DocumentScanner
            onConfirm={handleScanConfirm}
            onCancel={() => setMobileStep("intro")}
          />
        </main>
      </div>
    );
  }

  // ─── SENDING ─────────────────────────────────────────────
  if (mobileStep === "sending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="mx-auto h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <Send className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t.sendToSite}...
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {t.waitingReturn}
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── SENT (Success) ──────────────────────────────────────
  if (mobileStep === "sent") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-sm"
        >
          <div className="mx-auto h-20 w-20 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t.dataSent}
          </h2>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            {t.dataSentDesc}
          </p>

          {/* Summary */}
          {scanResult && (
            <div className="guide-card p-4 mt-6 text-left">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">{t.nameLabel}:</span> {scanResult.givenName} {scanResult.familyName}</p>
                <p><span className="font-medium text-foreground">{t.docLabel}:</span> {scanResult.passportNumber}</p>
                <p><span className="font-medium text-foreground">{t.natLabel}:</span> {scanResult.nationality}</p>
              </div>
            </div>
          )}

          <Button
            className="mt-8 h-14 w-full text-base"
            onClick={() => {
              // Try to close the window/tab
              window.close();
              // Fallback: go back to intro
              setTimeout(() => setMobileStep("intro"), 500);
            }}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {t.closeWindow}
          </Button>

          <Button
            variant="outline"
            className="mt-3 h-12 w-full text-sm border-border"
            onClick={() => {
              setScanResult(null);
              setMobileStep("intro");
            }}
          >
            {t.scanDocument}
          </Button>
        </motion.div>
      </div>
    );
  }

  return null;
}
