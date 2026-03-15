import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, ShieldCheck, Smartphone, BellRing } from "lucide-react";
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
  getAdminAndroidPrimaryUrl,
  hasAdminAndroidRelease,
} from "@/lib/app-release";

function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export default function AppAdminDownload() {
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
  const releaseReady = hasAdminAndroidRelease(manifest);
  const primaryUrl = getAdminAndroidPrimaryUrl(manifest);
  const android = manifest.admin.android;
  const releasedAt = formatReleaseDate(android.releasedAt, locale);

  useEffect(() => {
    if (!androidDevice || !releaseReady || !primaryUrl || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("autostart") === "0") {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.location.href = primaryUrl;
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [androidDevice, primaryUrl, releaseReady]);

  const copy = useMemo(() => {
    if (language === "en") {
      return {
        badge: "Admin app",
        title: "Install Michels Travel Admin on your Android phone.",
        subtitle:
          "This is the separate operations app for you, not the senior app and not the customer booking app.",
        download: android.playStoreUrl ? "Open in Google Play" : "Install admin app",
        pending: "Admin installer coming soon",
        backDashboard: "Back to dashboard",
        noteReady: androidDevice
          ? "The installer should start on your phone. If Android blocks the first install, allow installs from this browser and open the button again."
          : "Open this page on your Android phone to install the admin app directly.",
        notePending: android.installNotes[language],
        version: "Version",
        packageLabel: "Package",
        minAndroid: "Android",
        released: "Released",
        featureAlerts: "Real alerts and follow-up on your own phone",
        featureCases: "Open the correct case directly from a notification",
        featureOps: "Dedicated app only for your operations",
      };
    }

    if (language === "es") {
      return {
        badge: "App Admin",
        title: "Instale Michels Travel Admin en su telefono Android.",
        subtitle:
          "Esta es la app separada de operacion para usted, no la app senior ni la app del cliente comprador.",
        download: android.playStoreUrl ? "Abrir en Google Play" : "Instalar app admin",
        pending: "Instalador admin en preparacion",
        backDashboard: "Volver al dashboard",
        noteReady: androidDevice
          ? "El instalador debe comenzar en su telefono. Si Android bloquea la primera instalacion, permita instalaciones desde este navegador y abra el boton otra vez."
          : "Abra esta pagina en su telefono Android para instalar la app admin directamente.",
        notePending: android.installNotes[language],
        version: "Version",
        packageLabel: "Paquete",
        minAndroid: "Android",
        released: "Publicado",
        featureAlerts: "Alertas reales y follow-up en su propio celular",
        featureCases: "Abrir el caso correcto directo desde la notificacion",
        featureOps: "App dedicada solo para su operacion",
      };
    }

    return {
      badge: "App Admin",
      title: "Instale o Michels Travel Admin no seu celular Android.",
      subtitle:
        "Este e o app separado da sua operacao, nao o app senior e nao o app de busca e compra do cliente.",
      download: android.playStoreUrl ? "Abrir no Google Play" : "Instalar app admin",
      pending: "Instalador admin em preparo",
      backDashboard: "Voltar ao dashboard",
      noteReady: androidDevice
        ? "O instalador deve comecar no seu celular. Se o Android bloquear a primeira instalacao, permita instalar apps deste navegador e abra o botao novamente."
        : "Abra esta pagina no seu celular Android para instalar o app admin diretamente.",
      notePending: android.installNotes[language],
      version: "Versao",
      packageLabel: "Pacote",
      minAndroid: "Android",
      released: "Publicado",
      featureAlerts: "Alertas reais e follow-up no seu proprio celular",
      featureCases: "Abrir o caso certo direto da notificacao",
      featureOps: "App dedicado so para sua operacao",
    };
  }, [android.installNotes, android.playStoreUrl, androidDevice, language]);

  return (
    <>
      <SEO
        title="Instalar App Michels Travel Admin"
        description="Pagina oficial para instalar o app Michels Travel Admin, separado do senior e do app de compra do cliente."
        path="/apps/michels-travel-admin"
      />

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(241,245,249,0.98)_46%,rgba(226,232,240,0.95)_100%)] p-6 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.34)] sm:p-8 md:p-10">
            <Badge className="rounded-full border border-blue-200 bg-white text-blue-700 shadow-sm">
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
                    <Button disabled className="rounded-full bg-slate-300 px-6 py-6 text-base font-bold text-slate-700 opacity-100">
                      <Download className="mr-2 h-4 w-4" />
                      {copy.pending}
                    </Button>
                  )}

                  <Link href="/admin">
                    <Button variant="outline" className="rounded-full border-slate-300 bg-white/90 px-6 py-6 text-base font-bold text-slate-800">
                      {copy.backDashboard}
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
                { icon: BellRing, label: copy.featureAlerts },
                { icon: ShieldCheck, label: copy.featureCases },
                { icon: Smartphone, label: copy.featureOps },
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
