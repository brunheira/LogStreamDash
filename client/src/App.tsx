import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { NewConnectionForm } from "@/components/connections/new-connection-form";
import Dashboard from "@/pages/dashboard";
import Connections from "@/pages/connections";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/connections" component={Connections} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showNewConnectionModal, setShowNewConnectionModal] = useState(false);

  const handleNewConnection = () => {
    setShowNewConnectionModal(true);
  };

  const handleNewConnectionSuccess = () => {
    // Invalidate connections query to refresh the data
    queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <Header onNewConnection={handleNewConnection} />
          <Router />
        </div>
        <Toaster />
        <NewConnectionForm
          open={showNewConnectionModal}
          onOpenChange={setShowNewConnectionModal}
          onSuccess={handleNewConnectionSuccess}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
