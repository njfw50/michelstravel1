import { ArrowRight, Download, Smartphone, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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

export default function AppLaunchPromo({
  mode = "all",
  className,
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

  const copy =
    language === "en"
      ? {
          title: mode === "senior" ? "Senior App Mode" : "Michels Travel App",
          subtitle: mode === "senior" ? "Simple and calm on your phone." : "Get the full experience on your phone.",
          download: "Download Android",
          soon: "Coming Soon",
        }
      : language === "es"
        ? {
            title: mode === "senior" ? "Modo App Senior" : "App Michels Travel",
            subtitle: mode === "senior" ? "Simple y con calma en tu celular." : "La experiencia completa en tu celular.",
            download: "Descargar Android",
            soon: "Próximamente",
          }
        : {
            title: mode === "senior" ? "Modo App Senior" : "App Michels Travel",
            subtitle: mode === "senior" ? "Simples e com calma no seu celular." : "A experiência completa no seu celular.",
            download: "Baixar App Android",
            soon: "Em breve",
          };

  return (
    <section className={cn("py-12", className)}>
      <div className="container mx-auto px-4 flex justify-center">
        <Card className="w-full max-w-xl overflow-hidden rounded-[32px] border border-blue-100 bg-white/80 backdrop-blur-sm p-2 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)] transition-all hover:shadow-[0_30px_60px_-20px_rgba(37,99,235,0.2)] group">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transform -rotate-3 group-hover:rotate-0 transition-transform">
                  <Smartphone className="h-8 w-8" />
                </div>
                <div className="absolute -top-2 -right-2 h-7 w-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                   <Sparkles className="h-4 w-4 text-amber-900" />
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-display font-extrabold text-slate-950 uppercase tracking-tight">{copy.title}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{copy.subtitle}</p>
              </div>

              <div className="w-full sm:w-auto">
                {releaseReady ? (
                  <Link href={installPagePath}>
                    <Button className="w-full sm:w-auto rounded-full bg-blue-600 px-8 py-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95">
                      <Download className="mr-2 h-4 w-4" />
                      {copy.download}
                    </Button>
                  </Link>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500 border-slate-200 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest">
                    {copy.soon}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
