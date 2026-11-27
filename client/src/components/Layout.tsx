/* ────────────────────────────────────────────────────────────────────
   Layout — redesign 2027.
   - Logo oficial 3D 2027 (/logo-3d-2027.png) DIRETO, quadrado, sem
     card, sem borda, sem arredondar (LOGO_LOCK; o .brand-mark-shell
     antigo arredondava o logo — removido do uso). Fallback p/
     /favicon.png se o arquivo novo não estiver no public/.
   - Menu inferior do celular: rótulos 8px → 12px (Parte 2, Fase B
     item 7 — mínimo de legibilidade).
   - Rodapé: completo — contato, WhatsApp, redes (só YouTube com URL
     confirmada; Instagram/Facebook entram quando o dono confirmar
     os perfis), aviso de agência registrada em NJ desde 2023.
     NUNCA endereço residencial.
   - Selos do rodapé viraram lista factual de texto ("Como você
     compra"), não selos de certificação. Sem selo de governo.
   ──────────────────────────────────────────────────────────────────── */
import { Link, useLocation } from "wouter";
import {
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Award,
  Briefcase,
  MessageSquare,
  Globe,
  Check,
  Shield,
  ChevronDown,
  Settings,
  Sparkles,
  MessageCircle,
  Headphones,
  LayoutDashboard,
  Youtube,
  MapPin,
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
  AGENCY_WHATSAPP_NUMBER,
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
            "h-[34px] gap-1.5 rounded-[17px] px-3.5 text-[11px] font-extrabold uppercase tracking-widest transition-all duration-300 md:h-11 md:gap-3 md:rounded-2xl md:px-4 md:text-xs",
            variant === "navbar"
              ? /* Rodada 4: cápsula leve creme no celular (Gemini:
                   creme 72% + blur 12px + borda dourada 40%, texto
                   navy 8.4:1); no desktop volta o botão escuro da
                   pílula, intacto. */
                "border border-[#E8B65D]/40 bg-[#FBF7EF]/70 text-[#0B1B3A] shadow-sm backdrop-blur-md hover:bg-[#FBF7EF]/90 md:border-white/10 md:bg-white/5 md:text-white/80 md:shadow-xl md:backdrop-blur-none md:hover:bg-white/10 md:hover:text-white"
              : "border border-white/10 bg-slate-900/40 text-white/80 shadow-xl hover:bg-blue-600 hover:text-white",
            isLoading && "opacity-50 grayscale",
          )}
          data-testid="button-language-switcher"
        >
          <Globe className={cn("h-4 w-4", variant === "navbar" ? "text-[#0B1B3A] md:text-[#E8B65D]" : "text-[#E8B65D]", isLoading && "animate-spin")} />
          <span className="min-w-[1.5em] text-center">{isLoading ? "..." : current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "footer" ? "start" : "end"}
        sideOffset={12}
        className="min-w-[180px] rounded-[28px] border border-white/10 bg-slate-950/95 p-3 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
      >
        <div className="mb-1 px-4 py-2">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-500">Select Language</span>
        </div>
        {LANG_OPTIONS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            disabled={isLoading}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "cursor-pointer gap-4 rounded-xl px-4 py-3.5 text-[12px] font-extrabold uppercase tracking-widest transition-all",
              language === lang.code
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white",
            )}
            data-testid={`button-switch-lang-${lang.code}`}
          >
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-extrabold",
                language === lang.code ? "bg-white/20 text-white" : "bg-slate-900 text-slate-500",
              )}
            >
              {lang.flag}
            </div>
            <span className="flex-1">{lang.label}</span>
            {language === lang.code && <Check className="h-4 w-4" />}
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
      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-extrabold text-white shadow-lg"
      data-testid="badge-unread"
    >
      {data.count > 9 ? "9+" : data.count}
    </span>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  /* Logo 3D oficial 2027. Se o arquivo não estiver publicado, o
     fallback é o favicon atual — nunca quebrar o header. */
  const brandMark = "/logo-3d-2027.png";
  const brandMarkFallback = "/favicon.png?v=20260402b";
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
    // Rodada 5: aplica o estado inicial (posição restaurada) — sem
    // isso, carregar a página já rolada deixava a banda creme fora
    // até o primeiro evento de scroll.
    handleScroll();
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

  const navLinks = [
    { href: "/", label: t("nav.flights") },
    { href: "/pacotes", label: t("nav.packages") },
    { href: "/senior", label: t("nav.senior") },
    { href: "/my-trips", label: t("nav.my_trips") || "My Trips" },
    { href: "/about", label: t("footer.about") },
    { href: "/blog", label: t("nav.blog") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF7EF] text-[#101E42] selection:bg-[#FA5F52]/20 selection:text-[#101E42]">
      {/* Rodada 4 (26/nov, defeito 1): sem pílula no celular — o topo é
          uma faixa transparente com o logo DIRETO na foto (Diretriz
          2027: sem moldura, clareamento localizado atrás do logo) e o
          seletor de idioma como cápsula leve creme; ao rolar, banda
          creme 91% + linha dourada (classe .mt-header-scrolled, só
          <768px). O desktop mantém a pílula escura com navegação
          intacta. A barra inferior NÃO muda nesta rodada (o re-QA 3 a
          listou por engano; o defeito real é o topo, confirmado pelo
          dono, com autorização expressa dele para a alteração de
          estilo dentro do processo canônico). */}
      <header className={cn("fixed inset-x-0 top-0 z-40 border-b border-transparent transition-all duration-500", scrolled && "mt-header-scrolled")}>
        <div className={cn("container mx-auto px-5 pt-[calc(8px+env(safe-area-inset-top,0px))] transition-all duration-500 md:px-6", scrolled ? "md:pt-4" : "md:pt-10")}>
          <div
            className={cn(
              "flex items-center justify-between gap-2 rounded-none border-0 bg-transparent px-2 py-1.5 shadow-none transition-all duration-500 md:gap-4 md:rounded-[32px] md:border md:border-white/10 md:px-6 md:py-4 md:shadow-2xl md:backdrop-blur-3xl",
              scrolled ? "md:bg-slate-900/90 md:scale-100" : "md:bg-slate-900/80 md:scale-[1.02]",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-8">
              <Link href="/" className="group flex shrink-0 items-center gap-4">
                {/* Halo de clareamento localizado atrás do logo no
                    celular (Diretriz 2027, +0.45 EV, classe
                    .mt-logo-halo) — some no desktop (md:hidden), onde
                    a pílula escura continua. */}
                <span className="relative flex shrink-0 items-center justify-center">
                  <span aria-hidden="true" className="mt-logo-halo md:hidden" />
                  <img
                    src={brandMark}
                    alt="Michels Travel"
                    className="mt-logo relative z-10 h-11 w-11 transition-transform duration-700 group-hover:scale-105 md:h-14 md:w-14 xl:h-20 xl:w-20"
                    onError={(e) => {
                      if (e.currentTarget.src.indexOf("favicon.png") === -1) {
                        e.currentTarget.src = brandMarkFallback;
                      }
                    }}
                  />
                </span>
                <div className="hidden min-w-0 2xl:block">
                  <span className="block whitespace-nowrap text-lg font-extrabold uppercase tracking-[0.25em] text-white">
                    Michels Travel
                  </span>
                  <span className="block whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#E8B65D]">
                    {t("nav.sub_brand") || "Opcao eficiente"}
                  </span>
                </div>
              </Link>

              {/* Rodada 3 (re-QA item 8): o nav só aparece em xl+ (em lg
                  ele estourava o cabeçalho) e com rótulos curtos — "Blog"
                  em vez de "Outras Informações" (18 caracteres) e "Sênior"
                  em vez de "Consultoria Premium" (19). Medido no código:
                  o nav PT somava ~826px e o cabeçalho estourava ~57px
                  em 1920px; agora sobra margem em todos os idiomas. */}
              <nav className="hidden min-w-0 items-center xl:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative whitespace-nowrap rounded-2xl px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.15em] transition-all duration-300",
                      location === link.href
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 border-l-0 pl-0 md:gap-4 md:border-l md:border-white/5 md:pl-4">
              <LanguageSwitcher variant="navbar" />
              <div className="hidden items-center gap-4 md:flex">
                {user ? (
                  <>
                    <Link href="/messages" data-testid="button-messages-nav">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-11 w-11 rounded-2xl border border-white/5 bg-white/5 text-slate-400 shadow-xl transition-all hover:bg-blue-600 hover:text-white"
                      >
                        <MessageSquare className="h-5 w-5" />
                        <UnreadBadge />
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-11 gap-3 rounded-2xl border border-white/10 bg-white/5 px-2 pr-5 text-white shadow-xl transition-all hover:bg-white/10"
                          data-testid="button-user-menu"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-extrabold uppercase tracking-widest">
                            {(user.displayName || "").split(" ")[0] || "User"}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-64 rounded-[32px] border border-white/10 bg-slate-950 p-3 shadow-2xl shadow-black/80 backdrop-blur-3xl"
                      >
                        <DropdownMenuItem
                          className="cursor-pointer gap-3 rounded-xl px-5 py-4 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 hover:bg-white/5 focus:bg-white/5"
                          onClick={() => setLocation("/profile")}
                          data-testid="button-profile"
                        >
                          <User className="h-4 w-4" /> {t("nav.profile") || "My Profile"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer gap-3 rounded-xl px-5 py-4 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 hover:bg-white/5 focus:bg-white/5"
                          onClick={() => setLocation("/my-trips")}
                          data-testid="button-my-trips"
                        >
                          <Briefcase className="h-4 w-4" /> {t("nav.my_trips") || "My Trips"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer gap-3 rounded-xl px-5 py-4 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 hover:bg-white/5 focus:bg-white/5"
                          onClick={() => setLocation("/messages")}
                          data-testid="button-messages-dropdown"
                        >
                          <MessageSquare className="h-4 w-4" /> {t("nav.messages") || "Messages"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="mt-2 cursor-pointer gap-3 rounded-xl border-t border-white/5 px-5 py-4 text-red-500 hover:bg-red-500/10 focus:bg-red-500/10"
                          onClick={() => logout()}
                          data-testid="button-logout"
                        >
                          <LogOut className="h-4 w-4" /> {t("nav.logout")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <Button
                    onClick={() => openLoginDialog()}
                    className="h-10 whitespace-nowrap rounded-xl bg-blue-600 px-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-500 active:scale-95 md:h-11 md:rounded-2xl md:px-8 md:text-xs"
                    data-testid="button-signin"
                  >
                    {t("nav.signin")}
                  </Button>
                )}
              </div>
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
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/95 px-4 backdrop-blur-2xl"
          >
            <div className="w-full max-w-sm space-y-2 rounded-[40px] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/80">
              <div className="mb-6 flex items-center justify-between px-2">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.4em] text-slate-500">Navigation</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 rounded-[24px] px-6 py-4 text-sm font-extrabold uppercase tracking-[0.2em] transition-all",
                    location === link.href ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                  {link.label}
                </Link>
              ))}

              <div className="space-y-3 pt-6">
                {user ? (
                  <Button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    variant="ghost"
                    className="h-14 w-full rounded-[24px] text-xs font-extrabold uppercase tracking-widest text-red-500 hover:bg-red-500/10"
                  >
                    Logout
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openLoginDialog();
                    }}
                    className="h-14 w-full rounded-[24px] bg-blue-600 text-xs font-extrabold uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-600/30"
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

      <main className="relative flex-1 pb-24 pt-20 md:pb-0 md:pt-40">{children}</main>

      {/* pb-28 no celular: o rodapé é o último elemento da página e a
          navegação fixa cobre os ~71px finais (+ safe-area); sem essa
          folga a linha do copyright some atrás do menu (QA rodada 2). */}
      <footer className="relative z-10 border-t border-white/5 bg-[#060D24] pb-28 text-white md:pb-0">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-12 md:gap-12 md:py-20">
            <div className="space-y-6 md:col-span-4">
              <div className="flex items-center gap-4">
                <img
                  src={brandMark}
                  alt="Michels Travel"
                  className="mt-logo h-20 w-20"
                  onError={(e) => {
                    if (e.currentTarget.src.indexOf("favicon.png") === -1) {
                      e.currentTarget.src = brandMarkFallback;
                    }
                  }}
                />
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.35em] text-[#E8B65D]">
                    {t("footer.premium_partner")}
                  </div>
                  <div className="text-xl font-extrabold uppercase tracking-tight text-white">
                    {t("footer.elite_travel")}
                  </div>
                </div>
              </div>
              <p className="max-w-md text-sm font-semibold leading-relaxed text-slate-400">{t("footer.slogan")}</p>
              {/* Agência registrada em NJ desde 2023 — fato verificável,
                  sempre visível no rodapé. */}
              <p className="inline-flex items-center gap-2 rounded-full border border-[#E8B65D]/30 bg-[#E8B65D]/10 px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest text-[#E8B65D]">
                <MapPin className="h-4 w-4" />
                {t("footer.registered")}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="https://www.youtube.com/@MichelsTravelUSA"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-widest text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                >
                  <Youtube className="h-4 w-4 text-[#FA5F52]" />
                  YouTube
                </a>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-widest text-slate-500">
                  {t("footer.follow_more")}
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="mb-6 text-[12px] font-extrabold uppercase tracking-[0.3em] text-white/50">
                {t("footer.company")}
              </h4>
              <ul className="space-y-4 text-[12px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                <li>
                  <Link href="/about" className="transition-colors hover:text-[#E8B65D]">
                    {t("footer.about")}
                  </Link>
                </li>
                <li>
                  <Link href="/pacotes" className="transition-colors hover:text-[#E8B65D]">
                    {t("nav.packages")}
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="transition-colors hover:text-[#E8B65D]">
                    Travel Hub
                  </Link>
                </li>
                <li>
                  <Link href="/seguranca" className="transition-colors hover:text-[#E8B65D]">
                    {t("security.badge")}
                  </Link>
                </li>
                <li>
                  <Link href="/assistance" className="transition-colors hover:text-[#E8B65D]">
                    Corporate
                  </Link>
                </li>
              </ul>
            </div>

            {/* Como você compra — fatos, não selos. */}
            <div className="md:col-span-3">
              <h4 className="mb-6 text-[12px] font-extrabold uppercase tracking-[0.3em] text-white/50">
                {t("footer.how_you_buy")}
              </h4>
              <ul className="space-y-4">
                {[
                  { icon: ShieldCheck, label: t("footer.seal_nj"), sub: t("footer.seal_nj_sub") },
                  { icon: Award, label: t("footer.seal_iata"), sub: t("footer.seal_iata_sub") },
                  { icon: Shield, label: t("footer.seal_stripe"), sub: t("footer.seal_stripe_sub") },
                  { icon: Headphones, label: t("footer.seal_ssl"), sub: t("footer.seal_ssl_sub") },
                ].map((row) => (
                  <li key={row.label} className="flex items-start gap-3">
                    <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#E8B65D]" />
                    <div>
                      <p className="text-[12px] font-extrabold uppercase tracking-widest text-slate-200">{row.label}</p>
                      <p className="text-[12px] font-medium leading-relaxed text-slate-500">{row.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="mb-6 text-[12px] font-extrabold uppercase tracking-[0.3em] text-white/50">
                {t("footer.contact_title")}
              </h4>
              <div className="space-y-5">
                <a
                  href={`https://wa.me/${AGENCY_WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group/item flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 transition-all group-hover/item:bg-emerald-500 group-hover/item:text-white">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-500">
                      {t("footer.whatsapp_support")}
                    </span>
                    <span className="block text-[13px] font-bold text-slate-200">{AGENCY_WHATSAPP_DISPLAY}</span>
                  </div>
                </a>
                <div>
                  <span className="block text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-500">
                    {t("footer.secure_email")}
                  </span>
                  <a
                    href={`mailto:${AGENCY_EMAIL}`}
                    className="block text-[13px] font-extrabold tracking-tight text-white transition-colors hover:text-[#E8B65D] sm:text-sm"
                  >
                    {AGENCY_EMAIL}
                  </a>
                </div>
                <a
                  href={footerWhatsAppHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-cta-coral flex h-14 items-center justify-center gap-3 rounded-2xl px-6 text-[12px] font-extrabold uppercase tracking-widest transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t("footer.contact_cta")}
                </a>
              </div>
              <div className="mt-8">
                <LanguageSwitcher variant="footer" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-6 border-t border-white/5 py-8 md:flex-row">
            <span className="text-center text-[12px] font-extrabold uppercase leading-relaxed tracking-[0.2em] text-slate-500 md:text-left">
              &copy; {new Date().getFullYear()} Michels Travel &bull; {t("footer.elite_travel")}
            </span>
            <span className="rounded-full border border-white/5 px-5 py-2 text-[12px] font-extrabold uppercase tracking-[0.2em] text-slate-400 shadow-xl">
              {t("footer.motto") || "Atendimento claro e suporte humano"}
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation — rótulos 12px (mínimo legível). */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/90 pb-safe pt-1 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl md:hidden">
        <div className="flex items-center justify-around px-2 py-3">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all",
              isHome ? "scale-110 text-blue-500" : "text-slate-500 hover:text-slate-300",
            )}
          >
            <Globe className="h-5 w-5" />
            <span className="text-xs font-extrabold uppercase tracking-widest">{t("nav.mobile_flights")}</span>
          </Link>
          <Link
            href="/my-trips"
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all",
              location === "/my-trips" ? "scale-110 text-blue-500" : "text-slate-500 hover:text-slate-300",
            )}
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-xs font-extrabold uppercase tracking-widest">{t("nav.mobile_trips")}</span>
          </Link>
          <Link
            href="/messages"
            className={cn(
              "relative flex flex-col items-center gap-1.5 transition-all",
              location === "/messages" ? "scale-110 text-blue-500" : "text-slate-500 hover:text-slate-300",
            )}
          >
            <MessageSquare className="h-5 w-5" />
            <UnreadBadge />
            <span className="text-xs font-extrabold uppercase tracking-widest">{t("nav.mobile_messages")}</span>
          </Link>
          <Link
            href="/profile"
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all",
              location === "/profile" ? "scale-110 text-blue-500" : "text-slate-500 hover:text-slate-300",
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-extrabold uppercase tracking-widest">{t("nav.mobile_profile")}</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all",
              isMobileMenuOpen ? "scale-110 text-blue-500" : "text-slate-500 hover:text-slate-300",
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs font-extrabold uppercase tracking-widest">{t("nav.menu")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
