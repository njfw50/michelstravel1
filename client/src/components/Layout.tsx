import { Link, useLocation } from "wouter";
import { User, LogOut, Menu, X, Shield, ShieldCheck, Lock, Award, Building2, Plane } from "lucide-react";
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
import logo from "@assets/LOGO_1770751298475.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const navLinks = [
    { href: "/", label: t("nav.flights") },
    { href: "/about", label: t("footer.about") },
    { href: "/blog", label: t("nav.blog") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-body selection:bg-amber-500/30 selection:text-white">
      <header className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-b border-transparent"
      )}>
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <img 
                src={logo} 
                alt="Michels Travel" 
                className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={cn(
                    "relative text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200",
                    location === link.href
                      ? "text-white bg-white/[0.08]"
                      : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {link.label}
                  {location === link.href && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 rounded-full pl-2 pr-4 border border-white/[0.08] text-white/80" data-testid="button-user-menu">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white ring-2 ring-amber-500/20">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-sm">{user.firstName || "User"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-white/[0.08] p-2 bg-card/95 backdrop-blur-xl text-white">
                    {adminCheck?.isAdmin && (
                      <DropdownMenuItem 
                        className="focus:bg-white/5 rounded-lg cursor-pointer text-amber-400 focus:text-amber-300"
                        onClick={() => setLocation("/admin")}
                        data-testid="button-admin-panel"
                      >
                        <Shield className="mr-2 h-4 w-4" /> {t("nav.admin")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10 rounded-lg cursor-pointer"
                      onClick={() => logout()}
                      data-testid="button-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => setLoginDialogOpen(true)}
                  className="rounded-full px-6 font-bold shadow-lg shadow-amber-900/25 transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-sm"
                  data-testid="button-signin"
                >
                  {t("nav.signin")}
                </Button>
              )}
            </div>

            <button 
              className="md:hidden p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
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
            className="md:hidden fixed top-20 inset-x-0 z-40 bg-background/98 backdrop-blur-xl border-b border-white/[0.06] overflow-hidden"
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
                      ? "text-white bg-white/[0.06]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/[0.06]">
                {user ? (
                  <>
                    {adminCheck?.isAdmin && (
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); setLocation("/admin"); }}
                        className="block w-full text-left py-3 text-base font-medium text-amber-400 rounded-lg px-4"
                        data-testid="button-mobile-admin-panel"
                      >
                        {t("nav.admin")}
                      </button>
                    )}
                    <button 
                      onClick={() => logout()}
                      className="block w-full text-left py-3 text-base font-medium text-red-400 rounded-lg px-4"
                    >
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <Button 
                    onClick={() => { setIsMobileMenuOpen(false); setLoginDialogOpen(true); }}
                    className="w-full justify-center bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 rounded-xl"
                  >
                    {t("nav.signin")}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />

      <main className="flex-1 pt-20">
        {children}
      </main>

      <footer className="relative bg-background border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="py-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-4">
                <div className="flex items-center gap-2 mb-5">
                  <img 
                    src={logo} 
                    alt="Michels Travel" 
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <p className="text-sm leading-relaxed text-white/35 max-w-xs">
                  {t("footer.slogan")}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">{t("footer.company")}</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/about" className="text-white/40 hover:text-amber-400 transition-colors duration-200">{t("footer.about")}</Link></li>
                  <li><Link href="/blog" className="text-white/40 hover:text-amber-400 transition-colors duration-200">{t("nav.blog")}</Link></li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">{t("footer.support")}</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-white/40 hover:text-amber-400 transition-colors duration-200">{t("footer.help")}</a></li>
                  <li><a href="#" className="text-white/40 hover:text-amber-400 transition-colors duration-200">{t("footer.terms")}</a></li>
                  <li><a href="#" className="text-white/40 hover:text-amber-400 transition-colors duration-200">{t("footer.privacy")}</a></li>
                </ul>
              </div>

              <div className="md:col-span-4">
                <h4 className="font-bold text-white text-sm mb-5 uppercase tracking-wider">{t("footer.newsletter")}</h4>
                <p className="text-sm text-white/35 mb-4">{t("footer.subscribe")}</p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder={t("footer.email_placeholder")}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 text-white placeholder:text-white/20 transition-all outline-none"
                    data-testid="input-newsletter-email"
                  />
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 rounded-xl px-5 font-bold" data-testid="button-newsletter">{t("footer.go")}</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.04] py-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2.5" data-testid="seal-nj-registered">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xs leading-tight">
                  <span className="block font-semibold text-white/55">{t("footer.seal_nj")}</span>
                  <span className="text-white/25">{t("footer.seal_nj_sub")}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/[0.06] hidden md:block" />
              <div className="flex items-center gap-2.5" data-testid="seal-iata">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Award className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xs leading-tight">
                  <span className="block font-semibold text-white/55">{t("footer.seal_iata")}</span>
                  <span className="text-white/25">{t("footer.seal_iata_sub")}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/[0.06] hidden md:block" />
              <div className="flex items-center gap-2.5" data-testid="seal-stripe">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xs leading-tight">
                  <span className="block font-semibold text-white/55">{t("footer.seal_stripe")}</span>
                  <span className="text-white/25">{t("footer.seal_stripe_sub")}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/[0.06] hidden md:block" />
              <div className="flex items-center gap-2.5" data-testid="seal-ssl">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xs leading-tight">
                  <span className="block font-semibold text-white/55">{t("footer.seal_ssl")}</span>
                  <span className="text-white/25">{t("footer.seal_ssl_sub")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.04] py-6 text-center text-xs text-white/25">
            &copy; {new Date().getFullYear()} Michels Travel. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
