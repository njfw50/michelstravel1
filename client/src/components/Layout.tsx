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
            "gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-300",
            variant === "navbar"
              ? "text-white/80 hover:bg-white/10 hover:text-white"
              : "border border-white/[0.15] bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
            isLoading && "opacity-50 grayscale",
          )}
          data-testid="button-language-switcher"
        >
          <Globe className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          <span>{isLoading ? "..." : current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "footer" ? "start" : "end"}
        className="min-w-[150px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
      >
        {LANG_OPTIONS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            disabled={isLoading}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "cursor-pointer gap-2 rounded-xl text-slate-700 hover:text-slate-900 focus:text-slate-900",
              language === lang.code && "font-bold text-slate-900",
            )}
            data-testid={`button-switch-lang-${lang.code}`}
          >
            <span className="w-5 text-xs font-bold text-slate-500">{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && <Check className="ml-auto h-3.5 w-3.5 text-blue-500" />}
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
      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
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
      language,
      topic: language === "en" ? "Website contact" : language === "es" ? "Contacto del sitio" : "Contato pelo site",
      details: [language === "en" ? "Page: Footer" : language === "es" ? "Página: Rodapé" : "Página: Rodapé"],
    }),
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
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
    { href: "/blog", label: t("nav.blog") },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7ff] text-slate-900 selection:bg-blue-500/15 selection:text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="container mx-auto px-4 pb-2 pt-4 md:px-6 md:pb-3 md:pt-5">
          <div
            className={cn(
              "flex items-center justify-between gap-4 rounded-[30px] border border-white/10 px-4 py-3 shadow-[0_18px_50px_-24px_rgba(2,6,23,0.8)] backdrop-blur-xl transition-all duration-300 md:px-6 md:py-4",
              scrolled || !isHome ? "bg-[#07132d]/[0.96]" : "bg-[#07132d]/[0.88]",
            )}
          >
            <div className="flex min-w-0 items-center gap-4 md:gap-7">
              <Link href="/" className="group flex min-w-0 items-center gap-4">
                <div className="brand-mark-shell brand-mark-shell--header">
                  <img src={brandMark} alt="Michels Travel" className="transition-transform duration-300 group-hover:scale-[1.03]" />
                </div>
                <div className="hidden min-w-0 lg:block">
                  <span className="block whitespace-nowrap text-sm font-bold uppercase tracking-[0.2em] text-white/90">Michels Travel</span>
                  <span className="block whitespace-nowrap text-[11px] uppercase tracking-[0.22em] text-[#b9d0ff]">Opcao eficiente</span>
                </div>
              </Link>

              <nav className="hidden min-w-0 items-center gap-1 lg:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                      location === link.href
                        ? "bg-white/10 text-white"
                        : "text-[#d9e6ff] hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    {link.label}
                    {location === link.href && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute bottom-1 left-4 right-4 h-[2px] rounded-full bg-[#ff7f50]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                      />
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <LanguageSwitcher variant="navbar" />
              <div className="hidden items-center gap-3 md:flex">
                {user ? (
                  <>
                    <Link href="/messages" data-testid="button-messages-nav">
                      <Button variant="ghost" size="icon" className="relative rounded-full text-white/80 hover:bg-white/10 hover:text-white">
                        <MessageSquare className="h-4 w-4" />
                        <UnreadBadge />
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="gap-2 rounded-full border border-white/10 bg-white/5 px-2 pr-4 text-white/90 hover:bg-white/10"
                          data-testid="button-user-menu"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7f50] text-white">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-semibold">{user.firstName || "User"}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                        <DropdownMenuItem className="cursor-pointer rounded-xl text-slate-700 hover:text-slate-900 focus:text-slate-900" onClick={() => setLocation("/profile")} data-testid="button-profile">
                          <User className="mr-2 h-4 w-4" /> {t("nav.profile") || "My Profile"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-xl text-slate-700 hover:text-slate-900 focus:text-slate-900" onClick={() => setLocation("/my-trips")} data-testid="button-my-trips">
                          <Briefcase className="mr-2 h-4 w-4" /> {t("nav.my_trips") || "My Trips"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-xl text-slate-700 hover:text-slate-900 focus:text-slate-900" onClick={() => setLocation("/messages")} data-testid="button-messages-dropdown">
                          <MessageSquare className="mr-2 h-4 w-4" /> {t("nav.messages") || "Messages"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-xl mt-1 border-t border-slate-100 pt-2 text-red-500 hover:text-red-600 focus:text-red-600" onClick={() => logout()} data-testid="button-logout">
                          <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <Button
                    onClick={() => openLoginDialog()}
                    className="whitespace-nowrap rounded-full bg-[#3d86ff] px-6 text-sm font-bold text-white shadow-[0_12px_30px_-14px_rgba(61,134,255,0.85)] hover:bg-[#2c74ea]"
                    data-testid="button-signin"
                  >
                    {t("nav.signin")}
                  </Button>
                )}
              </div>

              <button
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed inset-x-0 top-[88px] z-40 px-4 lg:hidden"
          >
            <div className="container mx-auto rounded-[28px] border border-white/10 bg-[#07132d]/[0.98] p-4 shadow-[0_25px_60px_-28px_rgba(2,6,23,0.95)] backdrop-blur-xl">
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "block rounded-2xl px-4 py-3 text-base font-semibold transition-colors",
                      location === link.href ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                {user ? (
                  <>
                    <button onClick={() => { setIsMobileMenuOpen(false); setLocation("/messages"); }} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-base font-semibold text-white/75 hover:bg-white/[0.06] hover:text-white" data-testid="button-mobile-messages">
                      <MessageSquare className="h-4 w-4" />
                      {t("nav.messages") || "Messages"}
                    </button>
                    <button onClick={() => { setIsMobileMenuOpen(false); setLocation("/profile"); }} className="block w-full rounded-2xl px-4 py-3 text-left text-base font-semibold text-white/75 hover:bg-white/[0.06] hover:text-white" data-testid="button-mobile-profile">
                      {t("nav.profile") || "My Profile"}
                    </button>
                    <button onClick={() => logout()} className="block w-full rounded-2xl px-4 py-3 text-left text-base font-semibold text-red-300 hover:bg-white/[0.06]">
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <Button onClick={() => { setIsMobileMenuOpen(false); openLoginDialog(); }} className="w-full rounded-2xl bg-[#3d86ff] text-white hover:bg-[#2c74ea]">
                    {t("nav.signin")}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginDialog open={loginDialogOpen} onOpenChange={handleLoginDialogChange} authError={authError} />

      <main className="flex-1 bg-[radial-gradient(circle_at_top,rgba(84,124,255,0.14),transparent_22%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] pt-28 md:pt-32">
        {children}
      </main>

      <footer className="bg-[#07132d] text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-12 md:gap-10 md:py-16">
            <div className="space-y-5 md:col-span-4">
              <div className="flex items-center gap-4">
                <div className="brand-mark-shell brand-mark-shell--footer">
                  <img src={brandMark} alt="Michels Travel" />
                </div>
                <div>
                  <div className="text-lg font-bold uppercase tracking-[0.16em] text-white">Michels Travel</div>
                  <div className="text-xs uppercase tracking-[0.22em] text-[#b1c6ef]">Opcao eficiente</div>
                </div>
              </div>
              <p className="max-w-md text-sm leading-7 text-[#c6d6f4]">{t("footer.slogan")}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { icon: ShieldCheck, label: t("footer.seal_ssl") },
                  { icon: Lock, label: t("footer.seal_stripe") },
                  { icon: Award, label: t("footer.seal_iata") },
                ].map((seal) => (
                  <div key={seal.label} className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[#eef4ff]">
                    <seal.icon className="h-3.5 w-3.5 text-[#7cb0ff]" />
                    {seal.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#b9d0ff]">{t("footer.company")}</h4>
              <ul className="space-y-3 text-sm text-[#dfe8ff]">
                <li><Link href="/about" className="transition-colors hover:text-white">{t("footer.about")}</Link></li>
                <li><Link href="/agencia-de-viagens-ironbound-newark" className="transition-colors hover:text-white">Ironbound Newark</Link></li>
                <li><Link href="/passagens-para-o-brasil-saindo-de-newark" className="transition-colors hover:text-white">Brasil saindo de Newark</Link></li>
                <li><Link href="/blog" className="transition-colors hover:text-white">{t("nav.blog")}</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#b9d0ff]">{t("footer.support")}</h4>
              <ul className="space-y-3 text-sm text-[#dfe8ff]">
                <li><a href="/help" className="transition-colors hover:text-white">{t("footer.help")}</a></li>
                <li><a href="/terms" className="transition-colors hover:text-white">{t("footer.terms")}</a></li>
                <li><a href="/privacy" className="transition-colors hover:text-white">{t("footer.privacy")}</a></li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#b9d0ff]">{t("footer.contact_title")}</h4>
              <p className="mb-5 max-w-sm text-sm leading-7 text-[#c6d6f4]">{t("footer.contact_desc")}</p>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-[#7cb0ff]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#9db4de]">WhatsApp</span>
                    <a href={footerWhatsAppHref} target="_blank" rel="noreferrer" className="text-base font-semibold text-white hover:text-[#7cb0ff]">{AGENCY_WHATSAPP_DISPLAY}</a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-[#7cb0ff]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#9db4de]">{t("footer.email_label")}</span>
                    <a href={`mailto:${AGENCY_EMAIL}`} className="text-base font-semibold text-white hover:text-[#7cb0ff]">{AGENCY_EMAIL}</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-white/10 py-6 md:grid-cols-4 md:gap-6">
            {[
              { icon: Building2, title: t("footer.seal_nj"), subtitle: t("footer.seal_nj_sub") },
              { icon: Award, title: t("footer.seal_iata"), subtitle: t("footer.seal_iata_sub") },
              { icon: Lock, title: t("footer.seal_stripe"), subtitle: t("footer.seal_stripe_sub") },
              { icon: ShieldCheck, title: t("footer.seal_ssl"), subtitle: t("footer.seal_ssl_sub") },
            ].map((seal) => (
              <div key={seal.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-[#7cb0ff]">
                  <seal.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{seal.title}</div>
                  <div className="text-xs text-[#9fb2d0]">{seal.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-center md:flex-row md:text-left">
            <span className="text-xs text-[#97adc9]">&copy; {new Date().getFullYear()} Michels Travel. {t("footer.rights")}</span>
            <div className="flex items-center gap-3 text-sm text-[#d4e2fa]">
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
                <ArrowRight className="h-3.5 w-3.5" /> Atendimento claro e suporte humano
              </span>
              <LanguageSwitcher variant="footer" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
