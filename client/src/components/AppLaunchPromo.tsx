import { ArrowRight, BellRing, Download, MessageCircle, ScanLine, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
import {
  DEFAULT_APP_RELEASE_MANIFEST,
  fetchAppReleaseManifest,
  hasSeniorAndroidRelease,
} from "@/lib/app-release";

type PromoMode = "all" | "senior";

type AppLaunchPromoProps = {
  mode?: PromoMode;
  className?: string;
  source?: string;
};

const PLATFORM_LABELS = ["iPhone", "Android", "Samsung"];

export default function AppLaunchPromo({
  mode = "all",
  className,
  source = "site",
}: AppLaunchPromoProps) {
  const { language } = useI18n();
  const { data } = useQuery({
    queryKey: ["/app-release.json"],
    queryFn: fetchAppReleaseManifest,
    staleTime: 30000,
  });
  const manifest = data ?? DEFAULT_APP_RELEASE_MANIFEST;
  const releaseReady = hasSeniorAndroidRelease(manifest);
  const installPagePath = manifest.senior.installPagePath;
  const releaseVersion = manifest.senior.android.version;

  const copy =
    language === "en"
      ? {
          eyebrow: "Apps coming soon",
          title: "Michels Travel is getting dedicated apps for iPhone, Android, and Samsung.",
          subtitle:
            mode === "senior"
              ? "The senior app will open directly in the calmer journey, keep the traveler signed in, and make document scanning easier from the phone."
              : "The standard app and the senior app are being prepared so customers can open faster, stay signed in, scan documents on the phone, and continue the trip without starting over.",
          standardTitle: "Michels Travel App",
          standardDesc: "Search flights, follow trips, talk to Mia, and keep your travel details ready in one place.",
          seniorTitle: "Michels Senior App",
          seniorDesc: "Open directly in the easier journey, with calmer screens, larger actions, and less pressure for older travelers.",
          featureSignedIn: "Stay signed in on your own device",
          featureScanner: "Scan documents from the phone and send them to your booking",
          featureAlerts: "Get notified when your trip, payment, or support needs attention",
          waitlist: "Ask to be notified",
          downloadNow: "Download Android app",
          siteNow: mode === "senior" ? "Use Senior Support now" : "Use the site now",
          storeNote: "Planned for App Store, Google Play, and Galaxy Store.",
          releaseNote: releaseVersion ? `Android available now: version ${releaseVersion}.` : "Android available now.",
          topic: mode === "senior" ? "Senior app early access" : "Apps early access",
          interest: mode === "senior" ? "I want to be notified about the Michels Senior app." : "I want to be notified about the Michels Travel apps.",
        }
      : language === "es"
        ? {
            eyebrow: "Apps próximamente",
            title: "Michels Travel tendrá apps dedicadas para iPhone, Android y Samsung.",
            subtitle:
              mode === "senior"
                ? "La app senior abrirá directamente en el camino más tranquilo, mantendrá al cliente conectado y hará más simple el escaneo de documentos desde el celular."
                : "Estamos preparando la app estándar y la app senior para que el cliente abra más rápido, siga conectado, escanee documentos desde el celular y continúe el viaje sin empezar de nuevo.",
            standardTitle: "App Michels Travel",
            standardDesc: "Buscar vuelos, seguir viajes, hablar con Mia y guardar sus datos en un solo lugar.",
            seniorTitle: "App Michels Senior",
            seniorDesc: "Abrir directamente en el camino fácil, con pantallas más calmadas, acciones grandes y menos presión para viajeros mayores.",
            featureSignedIn: "Seguir conectado en su propio dispositivo",
            featureScanner: "Escanear documentos desde el celular y enviarlos a la reserva",
            featureAlerts: "Recibir avisos cuando su viaje, pago o ayuda necesiten atención",
            waitlist: "Pedir aviso",
            downloadNow: "Descargar app Android",
            siteNow: mode === "senior" ? "Usar Atención Senior ahora" : "Usar el sitio ahora",
            storeNote: "Previsto para App Store, Google Play y Galaxy Store.",
            releaseNote: releaseVersion ? `Android disponible ahora: version ${releaseVersion}.` : "Android disponible ahora.",
            topic: mode === "senior" ? "Acceso anticipado app senior" : "Acceso anticipado apps",
            interest: mode === "senior" ? "Quiero que me avisen cuando salga la app Michels Senior." : "Quiero que me avisen cuando salgan las apps de Michels Travel.",
          }
        : {
            eyebrow: "Apps em breve",
            title: "A Michels Travel vai ganhar apps dedicados para iPhone, Android e Samsung.",
            subtitle:
              mode === "senior"
                ? "O app senior vai abrir direto no caminho mais calmo, manter o cliente conectado e deixar o escaneamento de documentos mais simples no celular."
                : "Estamos preparando o app comum e o app senior para o cliente abrir mais rapido, ficar logado, escanear documentos no celular e continuar a viagem sem comecar de novo.",
            standardTitle: "App Michels Travel",
            standardDesc: "Buscar voos, acompanhar viagens, falar com a Mia e deixar seus dados de viagem prontos em um lugar so.",
            seniorTitle: "App Michels Senior",
            seniorDesc: "Abrir direto no caminho facil, com telas mais calmas, acoes maiores e menos pressao para o publico idoso.",
            featureSignedIn: "Ficar logado no proprio aparelho",
            featureScanner: "Escanear documentos no celular e mandar para a reserva",
            featureAlerts: "Receber aviso quando a viagem, o pagamento ou a ajuda precisarem de atencao",
            waitlist: "Quero ser avisado",
            downloadNow: "Baixar app Android",
            siteNow: mode === "senior" ? "Usar Atendimento Senior agora" : "Usar o site agora",
            storeNote: "Previsto para App Store, Google Play e Galaxy Store.",
            releaseNote: releaseVersion ? `Android disponivel agora: versao ${releaseVersion}.` : "Android disponivel agora.",
            topic: mode === "senior" ? "Lista do app senior" : "Lista dos apps",
            interest: mode === "senior" ? "Quero ser avisado quando o app Michels Senior estiver pronto." : "Quero ser avisado quando os apps da Michels Travel estiverem prontos.",
          };

  const waitlistHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language,
      topic: copy.topic,
      details: [
        copy.interest,
        `Origem: ${source}`,
        mode === "senior" ? "Foco: senior" : "Foco: apps standard e senior",
      ],
    }),
  );

  const cards =
    mode === "senior"
      ? [
          {
            title: copy.seniorTitle,
            description: copy.seniorDesc,
            tone: "from-amber-100/90 via-orange-50 to-white",
            border: "border-amber-200/80",
            iconBg: "bg-amber-500",
            icon: ShieldCheck,
          },
        ]
      : [
          {
            title: copy.standardTitle,
            description: copy.standardDesc,
            tone: "from-sky-100/90 via-blue-50 to-white",
            border: "border-blue-200/80",
            iconBg: "bg-blue-600",
            icon: Smartphone,
          },
          {
            title: copy.seniorTitle,
            description: copy.seniorDesc,
            tone: "from-amber-100/90 via-orange-50 to-white",
            border: "border-amber-200/80",
            iconBg: "bg-amber-500",
            icon: ShieldCheck,
          },
        ];

  return (
    <section className={cn("py-10 md:py-14", className)}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(241,245,249,0.98)_46%,rgba(226,232,240,0.95)_100%)] p-5 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.34)] sm:p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="rounded-full border border-blue-200 bg-white text-blue-700 shadow-sm">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                {copy.eyebrow}
              </Badge>
              <h2 className="mt-4 text-[2rem] sm:text-3xl md:text-4xl font-display font-extrabold leading-tight text-slate-950">
                {copy.title}
              </h2>
              <p className="mt-3 text-sm sm:text-base md:text-lg leading-relaxed text-slate-600">
                {copy.subtitle}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {PLATFORM_LABELS.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              {releaseReady ? (
                <Link href={installPagePath}>
                  <Button className="w-full sm:w-auto rounded-full bg-blue-600 px-6 py-6 text-base font-bold text-white hover:bg-blue-700">
                    <Download className="mr-2 h-4 w-4" />
                    {copy.downloadNow}
                  </Button>
                </Link>
              ) : (
                <Button asChild className="w-full sm:w-auto rounded-full bg-blue-600 px-6 py-6 text-base font-bold text-white hover:bg-blue-700">
                  <a href={waitlistHref} target="_blank" rel="noreferrer">
                    <BellRing className="mr-2 h-4 w-4" />
                    {copy.waitlist}
                  </a>
                </Button>
              )}
              {mode === "senior" ? (
                <Link href="/senior">
                  <Button variant="outline" className="w-full sm:w-auto rounded-full px-6 py-6 text-base font-bold border-slate-300 bg-white/90 text-slate-800">
                    {copy.siteNow}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto rounded-full px-6 py-6 text-base font-bold border-slate-300 bg-white/90 text-slate-800">
                    {copy.siteNow}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className={cn("mt-7 grid gap-4", mode === "senior" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className={cn(
                    "overflow-hidden rounded-[24px] border bg-gradient-to-br p-0 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.45)]",
                    card.border,
                    card.tone,
                  )}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg", card.iconBg)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-extrabold text-slate-950">{card.title}</h3>
                        <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-600">{card.description}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { icon: ShieldCheck, label: copy.featureSignedIn },
                        { icon: ScanLine, label: copy.featureScanner },
                        { icon: MessageCircle, label: copy.featureAlerts },
                      ].map((feature) => {
                        const FeatureIcon = feature.icon;
                        return (
                          <div key={`${card.title}-${feature.label}`} className="rounded-2xl border border-white/90 bg-white/90 px-4 py-4 shadow-sm">
                            <FeatureIcon className="h-4 w-4 text-blue-600" />
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">{feature.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="mt-5 text-xs sm:text-sm font-medium text-slate-500">
            {releaseReady ? copy.releaseNote : copy.storeNote}
          </p>
        </div>
      </div>
    </section>
  );
}
