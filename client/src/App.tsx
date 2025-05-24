import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { NewConnectionForm } from "@/components/connections/new-connection-form";
import Dashboard from "@/pages/dashboard";
import Connections from "@/pages/connections";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const [showNewConnectionModal, setShowNewConnectionModal] = useState(false);

  const handleNewConnection = () => {
    setShowNewConnectionModal(true);
  };

  const handleNewConnectionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNewConnection={handleNewConnection} />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/connections" component={Connections} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <NewConnectionForm
        open={showNewConnectionModal}
        onOpenChange={setShowNewConnectionModal}
        onSuccess={handleNewConnectionSuccess}
      />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="rediswatch-theme">
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
