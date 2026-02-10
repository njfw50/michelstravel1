import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import Booking from "@/pages/Booking";
import AdminDashboard from "@/pages/AdminDashboard";
import BlogList from "@/pages/BlogList";
import BlogPost from "@/pages/BlogPost";

function Router() {
  return (
    <Switch>
      {/* Admin dashboard has its own layout or just lives inside main layout */}
      <Route path="/admin">
        <Layout>
          <AdminDashboard />
        </Layout>
      </Route>

      <Route path="/" component={() => <Layout><Home /></Layout>} />
      <Route path="/search" component={() => <Layout><SearchResults /></Layout>} />
      <Route path="/book/:id" component={() => <Layout><Booking /></Layout>} />
      
      <Route path="/blog" component={() => <Layout><BlogList /></Layout>} />
      <Route path="/blog/:slug" component={() => <Layout><BlogPost /></Layout>} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
