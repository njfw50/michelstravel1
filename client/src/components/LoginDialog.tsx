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
import { Loader2, Lock, ShieldCheck, LogIn } from "lucide-react";
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
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const handleReset = () => {
    setStep("login");
    setLoginValue("");
    setPassword("");
    setIsLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginValue.trim().toLowerCase() === "admin") {
      setStep("admin-password");
    } else {
      window.location.href = "/api/login";
    }
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
                <LogIn className="h-7 w-7 text-blue-500" />
              </div>
              <DialogTitle className="text-xl font-display text-gray-900" data-testid="text-login-dialog-title">
                {t("nav.signin")}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-sm">
                {t("login.description")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLoginSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="login-input" className="text-gray-600 text-sm">
                  Login
                </Label>
                <Input
                  id="login-input"
                  data-testid="input-login-username"
                  type="text"
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  placeholder={t("login.placeholder")}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                  autoFocus
                />
              </div>
              <Button
                data-testid="button-login-submit"
                type="submit"
                className="w-full gap-2"
              >
                <LogIn className="h-4 w-4" />
                {t("login.enter")}
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
                variant="outline"
                className="w-full gap-2 border-gray-200 text-gray-600"
                onClick={() => {
                  window.location.href = "/api/login";
                }}
                data-testid="button-login-replit"
              >
                {t("login.continue_replit")}
              </Button>
            </form>
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
                className="w-full text-gray-400 text-sm"
                onClick={() => {
                  setStep("login");
                  setPassword("");
                }}
                data-testid="button-back-to-login"
              >
                {t("login.back")}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
