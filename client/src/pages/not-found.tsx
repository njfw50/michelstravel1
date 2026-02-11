import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl rounded-2xl">
        <CardContent className="pt-10 pb-10 px-6 flex flex-col items-center text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-red-500/15 flex items-center justify-center border border-red-500/20">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-display text-white">404</h1>
            <p className="text-white/60">{t("errors.page_not_found")}</p>
          </div>
          <Link href="/" className="w-full">
            <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold border-0" data-testid="button-go-home">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("nav.flights")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
