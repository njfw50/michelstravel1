import { Link, useLocation } from "wouter";
import {
  User,
  LogOut,
  Menu,
  X,
  Shield,
  ShieldCheck,
  Lock,
  Award,
  Building2,
  Briefcase,
  MessageSquare,
  Globe,
  Check,
  Mail,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { LoginDialog } from "@/components/LoginDialog";
import { closeLoginDialog, getLoginDialogEventName, openLoginDialog } from "@/lib/auth-utils";
import {
  AGENCY_EMAIL,
  AGENCY_WHATSAPP_DISPLAY,
  buildWhatsAppHref,
  buildWhatsAppMessage,
} from "@/lib/contact";
import type { ContactLanguage } from "@/lib/contact";

const LANG_OPTIONS = [
  { code: "pt" as const, label: "Português", flag: "PT" },
  { code: "en" as const, label: "English", flag: "EN" },
  { code: "es" as const, label: "Español", flag: "ES" },
];

function LanguageSwitcher({ variant = "navbar" }: { variant?: "navbar" | "footer" }) {
  const { language, setLanguage, isLoading } = useI18n();
  const current = LANG_OPTIONS.find((l) => l.code === language) || LANG_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={cn(
            "gap-2 rounded-2xl px-4 text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-xl",
            variant === "navbar"
              ? "bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              : "border border-white/10 bg-slate-900/40 text-white/80 hover:bg-blue-600 hover:text-white",
            isLoading && "opacity-50 grayscale",
          )}
          data-testid="button-language-switcher"
        >
          <Globe className={cn("h-3.5 w-3.5 text-blue-400", isLoading && "animate-spin")} />
          <span>{isLoading ? "..." : current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "footer" ? "start" : "end"}
        className="min-w-[160px] rounded-[24px] border border-white/10 bg-slate-950 backdrop-blur-3xl p-3 shadow-2xl shadow-black/60"
      >
        {LANG_OPTIONS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            disabled={isLoading}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "cursor-pointer gap-3 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-white/5 focus:bg-white/5",
              language === lang.code && "bg-white/5 text-blue-400 font-black",
            )}
            data-testid={`button-switch-lang-${lang.code}`}
          >
            <span className="w-6 text-[11px] font-black text-slate-600">{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && <Check className="ml-auto h-3.5 w-3.5 text-blue-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UnreadBadge() {
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/messenger/unread"],
    refetchInterval: 15000,
  });

  if (!data?.count) return null;

  return (
    <span
      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-lg"
      data-testid="badge-unread"
    >
      {data.count > 9 ? "9+" : data.count}
    </span>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const brandMark = "/favicon.png?v=20260402b";
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { t, language } = useI18n();
  const isHome = location === "/";
  const easyModeLabel =
    language === "en" ? "Senior Support" : language === "es" ? "Atención Senior" : "Atendimento Senior";
  const footerWhatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: (language || "pt") as ContactLanguage,
      topic: language === "en" ? "Website contact" : language === "es" ? "Contacto del sitio" : "Contato pelo site",
      details: [language === "en" ? "Page: Footer" : language === "es" ? "Página: Rodapé" : "Página: Rodapé"],
    }),
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const nextAuthError = params.get("authError");
      const shouldOpen = params.get("login") === "true" || Boolean(nextAuthError);
      setAuthError(nextAuthError);
      setLoginDialogOpen(shouldOpen);
    };

    const handleOpenLoginDialog = (event: Event) => {
      const detail = (event as CustomEvent<{ authError?: string | null }>).detail;
      setAuthError(detail?.authError || null);
      setLoginDialogOpen(true);
    };

    syncFromUrl();
    window.addEventListener(getLoginDialogEventName(), handleOpenLoginDialog as EventListener);
    window.addEventListener("popstate", syncFromUrl);

    return () => {
      window.removeEventListener(getLoginDialogEventName(), handleOpenLoginDialog as EventListener);
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  const handleLoginDialogChange = (open: boolean) => {
    setLoginDialogOpen(open);
    if (!open) {
      setAuthError(null);
      closeLoginDialog();
    }
  };

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const navLinks = [
    { href: "/", label: t("nav.flights") },
    { href: "/senior", label: easyModeLabel },
    { href: "/my-trips", label: t("nav.my_trips") || "My Trips" },
    { href: "/about", label: t("footer.about") },
    { href: "/blog", label: "Insights" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-600/30 selection:text-white flex flex-col">
      <header className="fixed inset-x-0 top-0 z-[100] transition-all duration-500">
        <div className={cn(
          "container mx-auto px-4 md:px-6 transition-all duration-500",
          scrolled ? "pt-4 md:pt-4" : "pt-8 md:pt-10"
        )}>
          <div
            className={cn(
              "flex items-center justify-between gap-4 rounded-[32px] border border-white/10 px-4 py-3 shadow-2xl backdrop-blur-3xl transition-all duration-500 md:px-6 md:py-4",
              scrolled ? "bg-slate-900/90 scale-100" : "bg-slate-900/60 scale-[1.02]",
            )}
          >
            <div className="flex min-w-0 items-center gap-6 md:gap-10">
              <Link href="/" className="group flex min-w-0 items-center gap-5">
                <div className="brand-mark-shell brand-mark-shell--header shadow-2xl border border-white/20">
                  <img src={brandMark} alt="Michels Travel" className="transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="hidden min-w-0 lg:block">
                  <span className="block whitespace-nowrap text-lg font-black uppercase tracking-[0.25em] text-white">Michels Travel</span>
                  <span className="block whitespace-nowrap text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/80">{t("nav.sub_brand") || "Opcao eficiente"}</span>
                </div>
              </Link>

              <nav className="hidden min-w-0 items-center gap-2 lg:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative whitespace-nowrap rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                      location === link.href
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex min-w-0 items-center gap-3 md:gap-5">
              <LanguageSwitcher variant="navbar" />
              <div className="hidden items-center gap-4 md:flex">
                {user ? (
                  <>
                    <Link href="/messages" data-testid="button-messages-nav">
                      <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                        <MessageSquare className="h-5 w-5" />
                        <UnreadBadge />
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-12 gap-3 rounded-2xl border border-white/10 bg-white/5 px-2 pr-5 text-white shadow-xl hover:bg-white/10 transition-all"
                          data-testid="button-user-menu"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{user.firstName || "User"}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 rounded-[32px] border border-white/10 bg-slate-950 backdrop-blur-3xl p-3 shadow-2xl shadow-black/80">
                        <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl py-4 px-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 focus:bg-white/5" onClick={() => setLocation("/profile")} data-testid="button-profile">
                          <User className="h-4 w-4" /> {t("nav.profile") || "My Profile"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl py-4 px-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 focus:bg-white/5" onClick={() => setLocation("/my-trips")} data-testid="button-my-trips">
                          <Briefcase className="h-4 w-4" /> {t("nav.my_trips") || "My Trips"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl py-4 px-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 focus:bg-white/5" onClick={() => setLocation("/messages")} data-testid="button-messages-dropdown">
                          <MessageSquare className="h-4 w-4" /> {t("nav.messages") || "Messages"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl py-4 px-5 mt-2 border-t border-white/5 text-red-500 hover:bg-red-500/10 focus:bg-red-500/10" onClick={() => logout()} data-testid="button-logout">
                          <LogOut className="h-4 w-4" /> {t("nav.logout")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <Button
                    onClick={() => openLoginDialog()}
                    className="h-12 whitespace-nowrap rounded-2xl bg-blue-600 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all hover:scale-105 active:scale-95"
                    data-testid="button-signin"
                  >
                    {t("nav.signin")}
                  </Button>
                )}
              </div>

              <button
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white shadow-xl lg:hidden"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                data-testid="button-mobile-menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-slate-950/95 backdrop-blur-2xl"
          >
            <div className="w-full max-w-sm rounded-[40px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/80 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-center rounded-[24px] py-5 px-6 text-sm font-black uppercase tracking-[0.3em] transition-all",
                      location === link.href ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="pt-8 space-y-4">
                  {user ? (
                    <Button onClick={() => { setIsMobileMenuOpen(false); logout(); }} variant="ghost" className="w-full h-16 rounded-[24px] text-red-500 hover:bg-red-500/10 font-black uppercase tracking-widest">
                       Logout
                    </Button>
                  ) : (
                    <Button onClick={() => { setIsMobileMenuOpen(false); openLoginDialog(); }} className="w-full h-16 rounded-[24px] bg-blue-600 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/30">
                      {t("nav.signin")}
                    </Button>
                  )}
                  <button onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 hover:text-white transition-all">Close Menu</button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginDialog open={loginDialogOpen} onOpenChange={handleLoginDialogChange} authError={authError} />

      <main className="flex-1 relative z-10 pt-32 md:pt-40">
        {children}
      </main>

      <footer className="bg-slate-950 border-t border-white/5 relative z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 gap-16 py-24 md:grid-cols-12 md:gap-12">
            <div className="space-y-8 md:col-span-5">
              <div className="flex items-center gap-6">
                <div className="brand-mark-shell brand-mark-shell--footer shadow-2xl border border-white/10">
                  <img src={brandMark} alt="Michels Travel" />
                </div>
                <div>
                  <div className="text-xl font-black uppercase tracking-[0.3em] text-white">Michels Travel</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-400/80">Premium Destination Partner</div>
                </div>
              </div>
              <p className="max-w-md text-sm leading-relaxed font-bold text-slate-500 uppercase tracking-tight">{t("footer.slogan")}</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: ShieldCheck, label: t("footer.seal_ssl") },
                  { icon: Lock, label: t("footer.seal_stripe") },
                  { icon: Award, label: t("footer.seal_iata") },
                ].map((seal) => (
                  <div key={seal.label} className="inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 shadow-xl transition-all hover:bg-white/10 hover:text-white">
                    <seal.icon className="h-3.5 w-3.5 text-blue-400" />
                    {seal.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="mb-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/50">{t("footer.company")}</h4>
              <ul className="space-y-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <li><Link href="/about" className="transition-colors hover:text-blue-400">{t("footer.about")}</Link></li>
                <li><Link href="/blog" className="transition-colors hover:text-blue-400">Travel Hub</Link></li>
                <li><Link href="/assistance" className="transition-colors hover:text-blue-400">Corporate</Link></li>
              </ul>
            </div>

            <div className="md:col-span-5">
              <h4 className="mb-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/50">{t("footer.contact_title")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                    <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">WhatsApp Support</span>
                    <a href={footerWhatsAppHref} target="_blank" rel="noreferrer" className="block text-xl font-black text-white hover:text-blue-400 transition-colors tracking-tight">{AGENCY_WHATSAPP_DISPLAY}</a>
                 </div>
                 <div className="space-y-3">
                    <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Secure Email</span>
                    <a href={`mailto:${AGENCY_EMAIL}`} className="block text-xl font-black text-white hover:text-blue-400 transition-colors tracking-tight truncate">{AGENCY_EMAIL}</a>
                 </div>
              </div>
              <div className="mt-10 p-6 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-blue-600 transition-all duration-500">
                 <div className="flex items-center gap-4">
                    <Globe className="h-6 w-6 text-blue-400 group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 group-hover:text-white">Regional Support Active</span>
                 </div>
                 <LanguageSwitcher variant="footer" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-8 border-t border-white/5 py-12 text-center md:flex-row md:text-left">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700">&copy; {new Date().getFullYear()} Michels Travel &bull; Elite Travel Management</span>
            <div className="flex items-center gap-6">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-2 rounded-full border border-white/5 shadow-xl">
                {t("footer.motto") || "Atendimento claro e suporte humano"}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
