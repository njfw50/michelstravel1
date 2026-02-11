import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { SiGoogle, SiApple, SiGithub } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [step, setStep] = useState<"login" | "admin-password">("login");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const handleReset = () => {
    setStep("login");
    setPassword("");
    setIsLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  const handleSocialLogin = () => {
    window.location.href = "/api/login";
  };

  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
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
      handleOpenChange(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        {step === "login" && (
          <>
            <DialogHeader className="text-center items-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-2">
                <Mail className="h-7 w-7 text-blue-500" />
              </div>
              <DialogTitle className="text-xl font-display text-gray-900" data-testid="text-login-dialog-title">
                {t("login.title")}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-sm">
                {t("login.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-3 border-gray-200 text-gray-700 font-medium"
                onClick={handleSocialLogin}
                data-testid="button-login-google"
              >
                <SiGoogle className="h-4 w-4 text-[#4285F4]" />
                {t("login.continue_google")}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-3 border-gray-200 text-gray-700 font-medium"
                onClick={handleSocialLogin}
                data-testid="button-login-apple"
              >
                <SiApple className="h-4 w-4 text-gray-900" />
                {t("login.continue_apple")}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-3 border-gray-200 text-gray-700 font-medium"
                onClick={handleSocialLogin}
                data-testid="button-login-github"
              >
                <SiGithub className="h-4 w-4 text-gray-900" />
                {t("login.continue_github")}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">{t("login.or")}</span>
                </div>
              </div>

              <Button
                type="button"
                className="w-full gap-3 font-medium"
                onClick={handleSocialLogin}
                data-testid="button-login-email"
              >
                <Mail className="h-4 w-4" />
                {t("login.continue_email")}
              </Button>

              <p className="text-[11px] text-gray-400 text-center leading-relaxed pt-1">
                {t("login.terms_notice")}
              </p>

              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  className="w-full text-xs text-gray-400 hover:text-gray-500 transition-colors py-1"
                  onClick={() => setStep("admin-password")}
                  data-testid="button-admin-access"
                >
                  {t("login.admin_access")}
                </button>
              </div>
            </div>
          </>
        )}

        {step === "admin-password" && (
          <>
            <DialogHeader className="text-center items-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-2">
                <ShieldCheck className="h-7 w-7 text-blue-500" />
              </div>
              <DialogTitle className="text-xl font-display text-gray-900" data-testid="text-admin-password-title">
                {t("admin.login_title")}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-sm">
                {t("admin.login_subtitle")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdminPasswordSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-gray-600 text-sm">
                  {t("admin.password_label")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="admin-password"
                    data-testid="input-admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("admin.password_placeholder")}
                    className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
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
              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-400 text-sm gap-2"
                onClick={() => {
                  setStep("login");
                  setPassword("");
                }}
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("login.back")}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
