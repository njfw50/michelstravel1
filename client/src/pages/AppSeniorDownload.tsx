import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, MessageCircle, ScanLine, ShieldCheck, Smartphone } from "lucide-react";
import { Link } from "wouter";

import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_APP_RELEASE_MANIFEST,
  fetchAppReleaseManifest,
  formatReleaseDate,
  getSeniorAndroidPrimaryUrl,
  hasSeniorAndroidRelease,
} from "@/lib/app-release";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";

function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export default function AppSeniorDownload() {
  const { language } = useI18n();
  const locale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const androidDevice = isAndroidDevice();

  const { data } = useQuery({
    queryKey: ["/app-release.json"],
    queryFn: fetchAppReleaseManifest,
    staleTime: 30000,
  });

  const manifest = data ?? DEFAULT_APP_RELEASE_MANIFEST;
  const releaseReady = hasSeniorAndroidRelease(manifest);
  const primaryUrl = getSeniorAndroidPrimaryUrl(manifest);
  const android = manifest.senior.android;
  const releasedAt = formatReleaseDate(android.releasedAt, locale);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "Android app",
        title: "Install Michels Travel Senior on your Android phone.",
        subtitle:
          "Open the calmer journey directly from your phone, stay signed in, and scan your documents without starting over in the browser.",
        download: android.playStoreUrl ? "Open in Google Play" : "Download Android app",
        whatsApp: "Talk on WhatsApp",
        useSite: "Use Senior Support on the site",
        noteReady: androidDevice
          ? "After the download finishes, Android may ask you to allow installs from this browser the first time."
          : "Open this page on your Android phone to download and install the app directly.",
        notePending: android.installNotes[language],
        version: "Version",
        packageLabel: "Package",
        minAndroid: "Android",
        released: "Released",
        featureSignedIn: "Stay signed in on your own device",
        featureScanner: "Scan documents on the phone and send them to your booking",
        featureSupport: "Continue the calmer senior journey with less pressure",
      };
    }

    if (language === "es") {
      return {
        badge: "App Android",
        title: "Instale Michels Travel Senior en su telefono Android.",
        subtitle:
          "Abra el camino tranquilo directamente en su celular, siga conectado y escanee documentos sin volver a empezar en el navegador.",
        download: android.playStoreUrl ? "Abrir en Google Play" : "Descargar app Android",
        whatsApp: "Hablar por WhatsApp",
        useSite: "Usar Atencion Senior en el sitio",
        noteReady: androidDevice
          ? "Cuando termine la descarga, Android puede pedir permiso para instalar apps desde este navegador la primera vez."
          : "Abra esta pagina en su telefono Android para descargar e instalar la app directamente.",
        notePending: android.installNotes[language],
        version: "Version",
        packageLabel: "Paquete",
        minAndroid: "Android",
        released: "Publicado",
        featureSignedIn: "Seguir conectado en su propio dispositivo",
        featureScanner: "Escanear documentos en el celular y enviarlos a la reserva",
        featureSupport: "Continuar el camino senior con menos presion",
      };
    }

    return {
      badge: "App Android",
      title: "Instale o Michels Travel Senior no seu celular Android.",
      subtitle:
        "Abra o caminho mais calmo direto do telefone, fique logado e escaneie documentos sem recomecar a viagem no navegador.",
      download: android.playStoreUrl ? "Abrir no Google Play" : "Baixar app Android",
      whatsApp: "Falar no WhatsApp",
      useSite: "Usar Atendimento Senior no site",
      noteReady: androidDevice
        ? "Quando o download terminar, o Android pode pedir permissao para instalar apps deste navegador na primeira vez."
        : "Abra esta pagina no seu celular Android para baixar e instalar o app diretamente.",
      notePending: android.installNotes[language],
      version: "Versao",
      packageLabel: "Pacote",
      minAndroid: "Android",
      released: "Publicado",
      featureSignedIn: "Ficar logado no proprio aparelho",
      featureScanner: "Escanear documentos no celular e mandar para a reserva",
      featureSupport: "Continuar o caminho senior com menos pressao",
    };
  }, [android.installNotes, android.playStoreUrl, androidDevice, language]);

  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language,
      topic:
        language === "en"
          ? "Android app support"
          : language === "es"
            ? "Ayuda app Android"
            : "Ajuda app Android",
      details: [
        manifest.senior.appName,
        releaseReady
          ? `Versao: ${android.version || "disponivel"}`
          : "Quero saber quando o app Android estiver pronto.",
      ],
    }),
  );

  return (
    <>
      <SEO
        title="Baixar App Android Michels Travel Senior"
        description="Pagina oficial da Michels Travel para instalar o app Android senior, continuar a viagem com mais calma e escanear documentos direto do celular."
        path="/apps/michels-travel-senior"
      />

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(241,245,249,0.98)_46%,rgba(226,232,240,0.95)_100%)] p-6 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.34)] sm:p-8 md:p-10">
            <Badge className="rounded-full border border-amber-200 bg-white text-amber-700 shadow-sm">
              <Smartphone className="mr-2 h-3.5 w-3.5" />
              {copy.badge}
            </Badge>

            <div className="mt-4 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <h1 className="text-3xl font-display font-extrabold leading-tight text-slate-950 sm:text-4xl md:text-5xl">
                  {copy.title}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                  {copy.subtitle}
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {releaseReady ? (
                    <Button asChild className="rounded-full bg-blue-600 px-6 py-6 text-base font-bold text-white hover:bg-blue-700">
                      <a href={primaryUrl} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        {copy.download}
                      </a>
                    </Button>
                  ) : (
                    <Button asChild className="rounded-full bg-blue-600 px-6 py-6 text-base font-bold text-white hover:bg-blue-700">
                      <a href={whatsAppHref} target="_blank" rel="noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {copy.whatsApp}
                      </a>
                    </Button>
                  )}

                  <Link href="/senior">
                    <Button variant="outline" className="rounded-full border-slate-300 bg-white/90 px-6 py-6 text-base font-bold text-slate-800">
                      {copy.useSite}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  {releaseReady ? copy.noteReady : copy.notePending}
                </p>
              </div>

              <Card className="rounded-[24px] border border-slate-200 bg-white/90 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.45)]">
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{copy.version}</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{android.version || "Em preparo"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{copy.packageLabel}</p>
                      <p className="mt-1 break-all text-base font-semibold text-slate-900">{android.packageName}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{copy.minAndroid}</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{android.minAndroid}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{copy.released}</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{releasedAt || "Aguardando primeira publicacao"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { icon: ShieldCheck, label: copy.featureSignedIn },
                { icon: ScanLine, label: copy.featureScanner },
                { icon: MessageCircle, label: copy.featureSupport },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} className="rounded-[22px] border border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="p-5">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700">{item.label}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
