import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import Events from "@/pages/Events";
import Feedback from "@/pages/Feedback";
import Recommendations from "@/pages/Recommendations";
import Analytics from "@/pages/Analytics";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";
import ErrorTracking from "@/pages/ErrorTracking";
import Integration from "@/pages/Integration";
import Landing from "@/pages/Landing";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import NotFound from "@/pages/not-found";

function ProtectedRoutes() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/events" component={Events} />
        <Route path="/feedback" component={Feedback} />
        <Route path="/recommendations" component={Recommendations} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/errors" component={ErrorTracking} />
        <Route path="/settings" component={Settings} />
        <Route path="/integration" component={Integration} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth routes - available to everyone
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/signin" component={SignIn} />
        <Route path="/signup" component={SignUp} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Protected routes - only for authenticated users
  return <ProtectedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
