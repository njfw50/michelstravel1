import { Link, useLocation } from "wouter";
import { User, LogOut, Menu, X, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
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
  const { t } = useI18n();

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const navLinks = [
    { href: "/", label: t("nav.flights") },
    { href: "/blog", label: t("nav.blog") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-body selection:bg-amber-500/30 selection:text-white">
      <header className="sticky top-0 z-50 w-full bg-black/30 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3 group">
              <img 
                src={logo} 
                alt="Michels Travel" 
                className="h-16 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={cn(
                    "text-sm font-semibold transition-all hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] relative py-1 tracking-wide",
                    location === link.href ? "text-white" : "text-white/60"
                  )}
                >
                  {link.label}
                  {location === link.href && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 rounded-full pl-2 pr-4 h-10 border border-white/10 text-white/80 backdrop-blur-sm" data-testid="button-user-menu">
                      <div className="h-7 w-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 ring-1 ring-amber-500/30">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">{user.firstName || "User"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-white/10 p-2 bg-[hsl(220,18%,10%)]/95 backdrop-blur-xl text-white">
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
                  className="rounded-full px-6 font-semibold shadow-lg shadow-amber-900/20 transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
                  data-testid="button-signin"
                >
                  {t("nav.signin")}
                </Button>
              )}
            </div>

            <button 
              className="md:hidden p-2 text-white/70 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
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
            className="md:hidden bg-[hsl(220,18%,10%)]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg px-2"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10">
                {user ? (
                  <>
                    {adminCheck?.isAdmin && (
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); setLocation("/admin"); }}
                        className="block w-full text-left py-2 text-base font-medium text-amber-400 rounded-lg px-2"
                        data-testid="button-mobile-admin-panel"
                      >
                        {t("nav.admin")}
                      </button>
                    )}
                    <button 
                      onClick={() => logout()}
                      className="block w-full text-left py-2 text-base font-medium text-red-400 rounded-lg px-2"
                    >
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <Button 
                    onClick={() => { setIsMobileMenuOpen(false); setLoginDialogOpen(true); }}
                    className="w-full justify-center bg-amber-500 text-white border-0"
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

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-black/40 backdrop-blur-lg text-white/70 py-12 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img 
                    src={logo} 
                    alt="Michels Travel" 
                    className="h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                />
              </div>
              <p className="text-sm leading-relaxed text-white/40">
                {t("footer.slogan")}
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">{t("footer.company")}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-white/50 hover:text-amber-300 transition-colors">{t("footer.about")}</a></li>
                <li><a href="#" className="text-white/50 hover:text-amber-300 transition-colors">{t("footer.careers")}</a></li>
                <li><a href="#" className="text-white/50 hover:text-amber-300 transition-colors">{t("footer.press")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">{t("footer.support")}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-white/50 hover:text-amber-300 transition-colors">{t("footer.help")}</a></li>
                <li><a href="#" className="text-white/50 hover:text-amber-300 transition-colors">{t("footer.terms")}</a></li>
                <li><a href="#" className="text-white/50 hover:text-amber-300 transition-colors">{t("footer.privacy")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">{t("footer.newsletter")}</h4>
              <p className="text-sm text-white/40 mb-3">{t("footer.subscribe")}</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder={t("footer.email_placeholder")}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-amber-500 text-white placeholder:text-white/20"
                  data-testid="input-newsletter-email"
                />
                <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-white border-0" data-testid="button-newsletter">{t("footer.go")}</Button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center text-xs text-white/30">
            &copy; {new Date().getFullYear()} Michels Travel. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
