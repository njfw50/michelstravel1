import { Link, useLocation } from "wouter";
import { User, LogOut, Menu, X, Shield, ShieldCheck, Lock, Award, Building2, Briefcase, MessageSquare, Globe, Check, Mail, Phone } from "lucide-react";
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
import logo from "@assets/LOGO_1770751298475.png";

const LANG_OPTIONS = [
  { code: "pt" as const, label: "Português", flag: "PT" },
  { code: "en" as const, label: "English", flag: "EN" },
  { code: "es" as const, label: "Español", flag: "ES" },
];

function LanguageSwitcher({ variant = "navbar" }: { variant?: "navbar" | "footer" }) {
  const { language, setLanguage } = useI18n();
  const current = LANG_OPTIONS.find(l => l.code === language) || LANG_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === "footer" ? "outline" : "ghost"}
          size="sm"
          className={cn(
            "gap-1.5 text-xs font-medium",
            variant === "footer" && "border-gray-300 text-gray-600"
          )}
          data-testid="button-language-switcher"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "footer" ? "start" : "end"} className="min-w-[140px]">
        {LANG_OPTIONS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn("cursor-pointer gap-2", language === lang.code && "font-bold")}
            data-testid={`button-switch-lang-${lang.code}`}
          >
            <span className="text-xs font-bold text-gray-400 w-5">{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && <Check className="h-3.5 w-3.5 ml-auto text-blue-500" />}
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
    <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1" data-testid="badge-unread">
      {data.count > 9 ? "9+" : data.count}
    </span>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { t, language } = useI18n();
  const isHome = location === "/";
  const easyModeLabel = language === "en" ? "Senior Support" : language === "es" ? "Atencion Senior" : "Atendimento Senior";
  const footerContactLabel = language === "en" ? "WhatsApp" : language === "es" ? "WhatsApp" : "WhatsApp";
  const footerContactCta = language === "en" ? "Open WhatsApp" : language === "es" ? "Abrir WhatsApp" : "Abrir WhatsApp";
  const footerWhatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language,
      topic: language === "en" ? "Website contact" : language === "es" ? "Contacto del sitio" : "Contato pelo site",
      details: [language === "en" ? "Page: Footer" : language === "es" ? "Pagina: Rodape" : "Pagina: Rodape"],
    }),
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
    <div className="min-h-screen flex flex-col bg-background font-body selection:bg-blue-500/20 selection:text-blue-900">
      <header className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        scrolled || !isHome
          ? "bg-white/97 backdrop-blur-xl border-b border-gray-200/70 shadow-[0_2px_20px_-4px_hsl(213_90%_50%/0.08)]"
          : "bg-transparent border-b border-transparent"
      )}>
        <div className="container mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="brand-mark-shell brand-mark-shell--header">
                <img 
                  src={logo} 
                  alt="Michels Travel" 
                  className="transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={cn(
                    "relative text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200",
                    location === link.href
                      ? "text-blue-600 bg-blue-50 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/70"
                  )}
                >
                  {link.label}
                  {location === link.href && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute bottom-1 left-4 right-4 h-[2px] rounded-full bg-blue-500"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="navbar" />
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                <Link href="/messages" data-testid="button-messages-nav">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageSquare className="h-4 w-4" />
                    <UnreadBadge />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 rounded-full pl-2 pr-4 border border-gray-200 text-gray-700" data-testid="button-user-menu">
                      <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white ring-2 ring-blue-200">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-sm">{user.firstName || "User"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-200 p-2">
                    <DropdownMenuItem 
                      className="rounded-lg cursor-pointer"
                      onClick={() => setLocation("/profile")}
                      data-testid="button-profile"
                    >
                      <User className="mr-2 h-4 w-4" /> {t("nav.profile") || "My Profile"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-lg cursor-pointer"
                      onClick={() => setLocation("/my-trips")}
                      data-testid="button-my-trips"
                    >
                      <Briefcase className="mr-2 h-4 w-4" /> {t("nav.my_trips") || "My Trips"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-lg cursor-pointer"
                      onClick={() => setLocation("/messages")}
                      data-testid="button-messages-dropdown"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> {t("nav.messages") || "Messages"}
                    </DropdownMenuItem>
                    {adminCheck?.isAdmin && (
                      <DropdownMenuItem 
                        className="rounded-lg cursor-pointer text-blue-600"
                        onClick={() => setLocation("/admin")}
                        data-testid="button-admin-panel"
                      >
                        <Shield className="mr-2 h-4 w-4" /> {t("nav.admin")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="text-red-500 focus:text-red-600 rounded-lg cursor-pointer"
                      onClick={() => logout()}
                      data-testid="button-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
              ) : (
                <Button 
                  onClick={() => openLoginDialog()}
                  className="rounded-full px-6 font-bold shadow-md shadow-blue-500/25 transition-all duration-200 text-sm bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5 text-white"
                  data-testid="button-signin"
                >
                  {t("nav.signin")}
                </Button>
              )}
            </div>

            <button 
              className="md:hidden p-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-20 inset-x-0 z-40 bg-white/98 backdrop-blur-xl border-b border-gray-200 overflow-hidden shadow-lg"
          >
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "block py-3 text-base font-medium rounded-lg px-4 transition-colors",
                    location === link.href
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); setLocation("/messages"); }}
                      className="block w-full text-left py-3 text-base font-medium text-gray-600 rounded-lg px-4 hover:bg-gray-50 flex items-center gap-2"
                      data-testid="button-mobile-messages"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t("nav.messages") || "Messages"}
                    </button>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); setLocation("/profile"); }}
                      className="block w-full text-left py-3 text-base font-medium text-gray-600 rounded-lg px-4 hover:bg-gray-50"
                      data-testid="button-mobile-profile"
                    >
                      {t("nav.profile") || "My Profile"}
                    </button>
                    {adminCheck?.isAdmin && (
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); setLocation("/admin"); }}
                        className="block w-full text-left py-3 text-base font-medium text-blue-600 rounded-lg px-4"
                        data-testid="button-mobile-admin-panel"
                      >
                        {t("nav.admin")}
                      </button>
                    )}
                    <button 
                      onClick={() => logout()}
                      className="block w-full text-left py-3 text-base font-medium text-red-500 rounded-lg px-4"
                    >
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <Button 
                    onClick={() => { setIsMobileMenuOpen(false); openLoginDialog(); }}
                    className="w-full justify-center bg-blue-500 text-white rounded-xl"
                  >
                    {t("nav.signin")}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginDialog open={loginDialogOpen} onOpenChange={handleLoginDialogChange} authError={authError} />

      <main className="flex-1 pt-20 md:pt-24">
        {children}
      </main>

      <footer className="relative bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="py-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-4">
                <div className="flex items-center gap-2 mb-5">
                  <div className="brand-mark-shell brand-mark-shell--footer">
                    <img 
                      src={logo} 
                      alt="Michels Travel" 
                    />
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
                  {t("footer.slogan")}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <h4 className="font-bold text-gray-900 text-xs mb-5 uppercase tracking-[0.15em]">{t("footer.company")}</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/about" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">{t("footer.about")}</Link></li>
                  <li><Link href="/agencia-de-viagens-ironbound-newark" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">Ironbound Newark</Link></li>
                  <li><Link href="/passagens-para-o-brasil-saindo-de-newark" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">Brasil saindo de Newark</Link></li>
                  <li><Link href="/blog" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">{t("nav.blog")}</Link></li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-bold text-gray-900 text-xs mb-5 uppercase tracking-[0.15em]">{t("footer.support")}</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="/help" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">{t("footer.help")}</a></li>
                  <li><a href="/terms" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">{t("footer.terms")}</a></li>
                  <li><a href="/privacy" className="text-gray-500 hover:text-blue-600 transition-colors duration-200">{t("footer.privacy")}</a></li>
                </ul>
              </div>

              <div className="md:col-span-4">
                <h4 className="font-bold text-gray-900 text-xs mb-5 uppercase tracking-[0.15em]">{t("footer.contact_title")}</h4>
                <p className="text-sm text-gray-500 mb-5 max-w-sm">{t("footer.contact_desc")}</p>
                <div className="space-y-3">
                  <a
                    href={footerWhatsAppHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 hover:border-blue-200 hover:bg-blue-50/40 transition-colors duration-200"
                  >
                    <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-[0.14em] text-gray-400 font-semibold">{footerContactLabel}</span>
                      <span className="font-semibold">{AGENCY_WHATSAPP_DISPLAY}</span>
                    </div>
                  </a>
                  <a
                    href={`mailto:${AGENCY_EMAIL}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 hover:border-blue-200 hover:bg-blue-50/40 transition-colors duration-200"
                  >
                    <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-[0.14em] text-gray-400 font-semibold">{t("footer.email_label")}</span>
                      <span className="font-semibold">{AGENCY_EMAIL}</span>
                    </div>
                  </a>
                </div>
                <div className="pt-5">
                  <a href={footerWhatsAppHref} target="_blank" rel="noreferrer">
                    <Button className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/20" data-testid="button-footer-contact">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {footerContactCta}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 py-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2.5" data-testid="seal-nj-registered">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-xs leading-tight">
                  <span className="block font-semibold text-gray-700">{t("footer.seal_nj")}</span>
                  <span className="text-gray-400">{t("footer.seal_nj_sub")}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden md:block" />
              <div className="flex items-center gap-2.5" data-testid="seal-iata">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Award className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-xs leading-tight">
                  <span className="block font-semibold text-gray-700">{t("footer.seal_iata")}</span>
                  <span className="text-gray-400">{t("footer.seal_iata_sub")}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden md:block" />
              <div className="flex items-center gap-2.5" data-testid="seal-stripe">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-xs leading-tight">
                  <span className="block font-semibold text-gray-700">{t("footer.seal_stripe")}</span>
                  <span className="text-gray-400">{t("footer.seal_stripe_sub")}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden md:block" />
              <div className="flex items-center gap-2.5" data-testid="seal-ssl">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-xs leading-tight">
                  <span className="block font-semibold text-gray-700">{t("footer.seal_ssl")}</span>
                  <span className="text-gray-400">{t("footer.seal_ssl_sub")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 py-6 flex flex-wrap items-center justify-center gap-4">
            <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Michels Travel. {t("footer.rights")}</span>
            <LanguageSwitcher variant="footer" />
          </div>
        </div>
      </footer>
    </div>
  );
}
