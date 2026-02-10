import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Plane, Menu, X, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const NavLinks = () => (
    <>
      <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}>
        Flights
      </Link>
      <Link href="/blog" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/blog") ? "text-primary" : "text-muted-foreground"}`}>
        Travel Guide
      </Link>
      {isAuthenticated && (
        <Link href="/bookings" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/bookings") ? "text-primary" : "text-muted-foreground"}`}>
          My Bookings
        </Link>
      )}
      {/* Basic Admin check - in real app check role */}
      {isAuthenticated && (
        <Link href="/admin" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/admin") ? "text-primary" : "text-muted-foreground"}`}>
          Admin
        </Link>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Plane className="h-6 w-6 text-primary transform -rotate-45" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700">
              SkyScanner
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLinks />
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                      <AvatarFallback className="bg-primary/5 text-primary">
                        {user?.firstName?.charAt(0) || <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.firstName && <p className="font-medium">{user.firstName} {user.lastName}</p>}
                      {user?.email && <p className="w-[200px] truncate text-xs text-muted-foreground">{user.email}</p>}
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => logout()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-lg shadow-primary/25">
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-8">
                <NavLinks />
                {!isAuthenticated ? (
                  <Button asChild className="w-full bg-primary text-white">
                    <a href="/api/login">Sign In</a>
                  </Button>
                ) : (
                  <Button onClick={() => logout()} variant="outline" className="w-full">
                    Log out
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 w-full">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-200 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Plane className="h-6 w-6 text-primary transform -rotate-45" />
                <span className="text-xl font-bold text-white">SkyScanner</span>
              </div>
              <p className="text-sm text-slate-400">
                Finding you the best flights for your next adventure. Transparent pricing, no hidden fees.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Explore</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/" className="hover:text-primary transition-colors">Flights</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Travel Guide</Link></li>
                <li><Link href="/popular" className="hover:text-primary transition-colors">Popular Destinations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Newsletter</h3>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary"
                />
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} SkyScanner Clone. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
