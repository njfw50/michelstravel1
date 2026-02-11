import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("admin.login_failed"));
      }

      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      setLocation("/admin");
    } catch (error: any) {
      toast({
        title: t("admin.login_error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-white/10 shadow-2xl bg-white/5 backdrop-blur-md">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display text-white" data-testid="text-admin-login-title">
              {t("admin.login_title")}
            </CardTitle>
            <p className="text-white/50 text-sm mt-2">{t("admin.login_subtitle")}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-white/70 text-sm">
                {t("admin.password_label")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="admin-password"
                  data-testid="input-admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("admin.password_placeholder")}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50"
                  required
                  autoFocus
                />
              </div>
            </div>
            <Button
              data-testid="button-admin-login"
              type="submit"
              disabled={isLoading || !password}
              className="w-full gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {t("admin.login_button")}
            </Button>
          </form>
          <p className="text-center text-white/30 text-xs mt-6">
            Michels Travel - {t("admin.login_footer")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
