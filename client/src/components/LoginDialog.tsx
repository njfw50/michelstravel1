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
  Sparkles,
  Github
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

  const handleEmailStepChange = (nextStep: LoginStep) => {
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
      <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 shadow-[0_45px_100px_-20px_rgba(0,0,0,0.4)]"
        >
          {/* Top Decorative Gradient */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-coral-500 to-indigo-600" />
          
          <div className="relative z-10">
            {step === "login" && (
              <div className="space-y-10">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-20 w-20 rounded-[28px] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 shadow-xl">
                    <Sparkles className="h-10 w-10 text-blue-400 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">
                    {t("login.title")}
                  </h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest max-w-xs mx-auto">
                    {t("login.description")}
                  </p>
                </div>

                {(authErrorMessage || formError) && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-red-400 flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="leading-relaxed">{formError || authErrorMessage}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 w-full gap-4 border-white/10 bg-white/5 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:bg-white/10 hover:border-blue-500/50 rounded-2xl group"
                    onClick={handleGitHubLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SiGithub className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    )}
                    {t("login.continue_github")}
                  </Button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/5" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-slate-950 px-4 text-[9px] font-black uppercase tracking-[0.5em] text-slate-700">{t("login.or")}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="h-16 w-full gap-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl shadow-blue-600/20 transition-all hover:-translate-y-1"
                    onClick={() => handleEmailStepChange("email-signin")}
                  >
                    <Mail className="h-5 w-5" />
                    {t("login.continue_email")}
                  </Button>
                </div>

                <div className="pt-8 flex flex-col items-center gap-6">
                   <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-[0.15em] leading-relaxed max-w-xs">
                    {t("login.terms_notice")}
                  </p>
                  <button
                    type="button"
                    className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-700 hover:text-blue-400 transition-colors"
                    onClick={() => {
                      setFormError(null);
                      setStep("admin-password");
                    }}
                  >
                    {t("login.admin_access")}
                  </button>
                </div>
              </div>
            )}

            {isEmailStep && (
              <div className="space-y-10">
                <div className="text-center space-y-4">
                   <div className="mx-auto h-20 w-20 rounded-[28px] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 shadow-xl">
                    <UserRound className="h-10 w-10 text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                    {isRegisterStep ? "Create Profile" : "Identify Yourself"}
                  </h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                    {isRegisterStep ? "Join the Elite Travel Hub" : "Welcome back to Midnight"}
                  </p>
                </div>

                <div className="p-1.5 rounded-[22px] bg-white/5 border border-white/5 grid grid-cols-2 gap-1.5 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => handleEmailStepChange("email-signin")}
                    className={cn(
                      "rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                      !isRegisterStep ? "bg-blue-600 text-white shadow-xl" : "text-slate-500 hover:text-white"
                    )}
                  >
                    {t("login.sign_in")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmailStepChange("email-register")}
                    className={cn(
                      "rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                      isRegisterStep ? "bg-blue-600 text-white shadow-xl" : "text-slate-500 hover:text-white"
                    )}
                  >
                    {t("login.create_account")}
                  </button>
                </div>

                {(authErrorMessage || formError) && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-red-400 flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{formError || authErrorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleEmailAuthSubmit} className="space-y-6">
                  {isRegisterStep && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 pl-1">{t("login.first_name")}</Label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:border-blue-500/50 font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 pl-1">{t("login.last_name")}</Label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:border-blue-500/50 font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 pl-1">{t("login.email_label")}</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@midnight.com"
                      className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:border-blue-500/50 font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 pl-1">{t("login.password_label")}</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:border-blue-500/50 font-bold"
                      required
                    />
                  </div>

                  <div className="pt-6 space-y-4">
                    <Button
                      type="submit"
                      disabled={isLoading || !email.trim() || !password}
                      className="h-16 w-full gap-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl transition-all"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                      {isRegisterStep ? "Register Profile" : "Grant Access"}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="h-14 w-full text-slate-500 font-black uppercase tracking-widest text-[10px] gap-3 rounded-2xl hover:text-white"
                      onClick={() => handleEmailStepChange("login")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {t("login.back")}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {step === "admin-password" && (
              <div className="space-y-10">
                <div className="text-center space-y-4">
                   <div className="mx-auto h-20 w-20 rounded-[28px] bg-coral-500/10 border border-coral-500/20 flex items-center justify-center mb-4 shadow-xl">
                    <ShieldCheck className="h-10 w-10 text-coral-500" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                    Admin Terminal
                  </h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                    Authorized Personnel Only
                  </p>
                </div>

                <form onSubmit={handleAdminPasswordSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 pl-1">Master Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-700" />
                      <Input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Admin Token"
                        className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:border-coral-500/50 font-bold"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="pt-6 space-y-4">
                    <Button
                      type="submit"
                      disabled={isLoading || !adminPassword}
                      className="h-16 w-full gap-4 bg-coral-600 hover:bg-coral-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl transition-all"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                      Verify Credentials
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-14 w-full text-slate-500 font-black uppercase tracking-widest text-[10px] gap-3 rounded-2xl hover:text-white"
                      onClick={() => handleEmailStepChange("login")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Return Home
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
