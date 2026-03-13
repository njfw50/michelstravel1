import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

type LoginStep = "login" | "email-signin" | "email-register" | "admin-password";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authError?: string | null;
}

function getAuthErrorMessage(authError: string | null | undefined, t: (key: string) => string) {
  switch (authError) {
    case "github_email_required":
      return t("login.github_email_required") || "Your GitHub account must have a verified primary email to continue.";
    case "github_not_configured":
      return t("login.github_not_configured") || "GitHub sign-in is not configured yet.";
    case "github_oauth_failed":
      return t("login.github_oauth_failed") || "GitHub sign-in failed. Please try again.";
    default:
      return authError ? t("login.generic_error") || "We could not complete sign-in. Please try again." : null;
  }
}

export function LoginDialog({ open, onOpenChange, authError }: LoginDialogProps) {
  const [step, setStep] = useState<LoginStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const authErrorMessage = useMemo(() => getAuthErrorMessage(authError, t), [authError, t]);
  const isEmailStep = step === "email-signin" || step === "email-register";
  const isRegisterStep = step === "email-register";

  const resetState = () => {
    setStep("login");
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setAdminPassword("");
    setIsLoading(false);
    setFormError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleGitHubLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/auth/github";
  };

  const handleEmailStepChange = (nextStep: Extract<LoginStep, "email-signin" | "email-register">) => {
    setStep(nextStep);
    setFormError(null);
    setIsLoading(false);
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const isRegister = step === "email-register";
      const endpoint = isRegister ? "/api/auth/register" : "/api/login";
      const payload = isRegister
        ? {
            email: email.trim(),
            password,
            firstName: firstName.trim() || undefined,
            lastName: lastName.trim() || undefined,
          }
        : {
            email: email.trim(),
            password,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            (isRegister
              ? t("login.register_failed") || "Could not create your account."
              : t("login.signin_failed") || "Could not sign you in.")
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      handleOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("login.generic_error") || "Something went wrong.";
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("admin.login_failed"));
      }

      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      handleOpenChange(false);
      setLocation("/admin");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("admin.login_error");
      setFormError(message);
      toast({
        title: t("admin.login_error"),
        description: message,
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

            {(authErrorMessage || formError) && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError || authErrorMessage}</span>
              </div>
            )}

            <div className="space-y-3 mt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-3 border-gray-200 text-gray-700 font-medium"
                onClick={handleGitHubLogin}
                disabled={isLoading}
                data-testid="button-login-github"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SiGithub className="h-4 w-4 text-gray-900" />
                )}
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
                onClick={() => handleEmailStepChange("email-signin")}
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
                  onClick={() => {
                    setFormError(null);
                    setStep("admin-password");
                  }}
                  data-testid="button-admin-access"
                >
                  {t("login.admin_access")}
                </button>
              </div>
            </div>
          </>
        )}

        {isEmailStep && (
          <>
            <DialogHeader className="text-center items-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-2">
                <UserRound className="h-7 w-7 text-blue-500" />
              </div>
              <DialogTitle className="text-xl font-display text-gray-900" data-testid="text-email-auth-title">
                {isRegisterStep
                  ? t("login.create_account") || "Create account"
                  : t("login.sign_in") || "Sign in"}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-sm">
                {isRegisterStep
                  ? t("login.create_account_desc") || "Create your account to manage bookings and travel details."
                  : t("login.sign_in_desc") || "Enter your email and password to access your account."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 rounded-xl bg-gray-100 p-1 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleEmailStepChange("email-signin")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  !isRegisterStep ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
                data-testid="button-email-tab-signin"
              >
                {t("login.sign_in") || "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => handleEmailStepChange("email-register")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isRegisterStep ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
                data-testid="button-email-tab-register"
              >
                {t("login.create_account") || "Create account"}
              </button>
            </div>

            {(authErrorMessage || formError) && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError || authErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuthSubmit} className="space-y-4 mt-4">
              {isRegisterStep && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="text-gray-600 text-sm">
                      {t("login.first_name") || "First name"}
                    </Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t("login.first_name_placeholder") || "First name"}
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                      data-testid="input-register-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="text-gray-600 text-sm">
                      {t("login.last_name") || "Last name"}
                    </Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t("login.last_name_placeholder") || "Last name"}
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                      data-testid="input-register-lastname"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email-auth-email" className="text-gray-600 text-sm">
                  {t("login.email_label") || "Email"}
                </Label>
                <Input
                  id="email-auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.email_placeholder") || "you@example.com"}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  required
                  autoFocus
                  data-testid={isRegisterStep ? "input-register-email" : "input-login-email"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-auth-password" className="text-gray-600 text-sm">
                  {t("login.password_label") || "Password"}
                </Label>
                <Input
                  id="email-auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.password_placeholder") || "Enter your password"}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  required
                  data-testid={isRegisterStep ? "input-register-password" : "input-login-password"}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full gap-2"
                data-testid={isRegisterStep ? "button-submit-register" : "button-submit-login"}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isRegisterStep
                  ? t("login.create_account_button") || "Create account"
                  : t("login.sign_in_button") || "Sign in"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-400 text-sm gap-2"
                onClick={() => {
                  setFormError(null);
                  setStep("login");
                }}
                data-testid="button-back-to-login-options"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("login.back")}
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

            {formError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

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
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
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
                disabled={isLoading || !adminPassword}
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
                  setFormError(null);
                  setStep("login");
                  setAdminPassword("");
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
