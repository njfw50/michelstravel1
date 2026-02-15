import { Switch, Route, useLocation } from "wouter";
import { Component, type ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CookieConsent } from "@/components/CookieConsent";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck } from "lucide-react";
import { HelmetProvider } from "react-helmet-async";
import NotFound from "@/pages/not-found";
import { Chatbot } from "@/components/Chatbot";

class SafeWrapper extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error("Component error (isolated):", error.message); }
  render() { return this.state.hasError ? null : this.props.children; }
}

import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import Booking from "@/pages/Booking";
import AdminDashboard from "@/pages/AdminDashboard";
import BlogList from "@/pages/BlogList";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";

import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import MyTrips from "@/pages/MyTrips";
import Profile from "@/pages/Profile";
import AdminLiveChat from "@/pages/AdminLiveChat";
import AdminApp from "@/pages/AdminApp";
import LiveSessionClient from "@/pages/LiveSessionClient";

function TestModeBanner() {
  const { t } = useI18n();
  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });
  const { data } = useQuery<{ testMode: boolean; activeTokenIsTest: boolean; hasLiveToken: boolean; hasTestToken: boolean }>({
    queryKey: ['/api/test-mode'],
    refetchInterval: 30000,
    enabled: !!adminCheck?.isAdmin,
  });

  if (!adminCheck?.isAdmin || !data?.testMode) return null;

  return (
    <div
      data-testid="banner-test-mode"
      className="relative z-[100] flex items-center justify-center gap-2 bg-amber-500/90 px-4 py-1.5 text-xs font-bold text-black backdrop-blur-sm"
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>{t("admin.test_mode_banner")}</span>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin">
        <Layout>
          <AdminDashboard />
        </Layout>
      </Route>
      <Route path="/admin/live-chat">
        <Layout>
          <AdminLiveChat />
        </Layout>
      </Route>

      <Route path="/" component={() => <Layout><Home /></Layout>} />
      <Route path="/search" component={() => <Layout><SearchResults /></Layout>} />
      <Route path="/book/:id" component={() => <Layout><Booking /></Layout>} />
      
      <Route path="/about" component={() => <Layout><About /></Layout>} />
      <Route path="/blog" component={() => <Layout><BlogList /></Layout>} />
      <Route path="/blog/:slug" component={() => <Layout><BlogPost /></Layout>} />
      
      <Route path="/my-trips" component={() => <Layout><MyTrips /></Layout>} />
      <Route path="/profile" component={() => <Layout><Profile /></Layout>} />
      
      <Route path="/live/:sessionId" component={LiveSessionClient} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/cancel" component={CheckoutCancel} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Route path="/atendimento" component={AdminApp} />
            <Route path="/atendimento/:rest*" component={AdminApp} />
            <MainApp />
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

function MainApp() {
  const [location] = useLocation();
  if (location.startsWith("/atendimento")) return null;

  return (
    <>
      <Toaster />
      <LanguageSelector />
      <TestModeBanner />
      <Router />
      <SafeWrapper><Chatbot /></SafeWrapper>
      <SafeWrapper><CookieConsent /></SafeWrapper>
    </>
  );
}

export default App;
