import { Link, useLocation } from "wouter";
import { Plane, User, LogOut, Menu, X, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@assets/LOGO_1770751298475.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Flights" },
    { href: "/blog", label: "Travel Guide" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-body">
      <header className="sticky top-0 z-50 w-full bg-[#354388] border-b border-white/10 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3 group">
              <img 
                src={logo} 
                alt="Michels Travel" 
                className="h-16 w-auto object-contain"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={cn(
                    "text-sm font-semibold transition-all hover:text-primary relative py-1 tracking-wide",
                    location === link.href ? "text-white" : "text-slate-300"
                  )}
                >
                  {link.label}
                  {location === link.href && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_var(--primary)]"
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
                    <Button variant="ghost" className="gap-2 rounded-full pl-2 pr-4 h-10 border border-white/10 hover:bg-white/10 text-slate-200 hover:text-white">
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary ring-1 ring-primary/50">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">{user.firstName || "User"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg shadow-black/5 border-slate-100 p-2">
                    <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => window.location.href = '/admin'}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg cursor-pointer"
                      onClick={() => logout()}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  className="rounded-full px-6 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 bg-primary text-white hover:bg-primary/90"
                >
                  Sign In
                </Button>
              )}
            </div>

            <button 
              className="md:hidden p-2 text-slate-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-slate-700 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100">
                {user ? (
                  <>
                    <Link href="/admin" className="block py-2 text-base font-medium text-slate-700">Admin Dashboard</Link>
                    <button 
                      onClick={() => logout()}
                      className="block w-full text-left py-2 text-base font-medium text-red-600"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <Button 
                    onClick={() => window.location.href = '/api/login'}
                    className="w-full justify-center"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img 
                    src={logo} 
                    alt="Michels Travel" 
                    className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Opção Eficiente. Your trusted companion for finding the best flight deals worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Newsletter</h4>
              <p className="text-sm text-slate-400 mb-3">Subscribe for exclusive deals.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="bg-slate-800 border-none rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-primary"
                />
                <Button size="sm">Go</Button>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Michels Travel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
