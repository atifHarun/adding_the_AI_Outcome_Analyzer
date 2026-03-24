import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import { PlatformStatus } from "@/components/PlatformStatus";
import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import Industry from "./pages/Industry";
import AiSystem from "./pages/AiSystem";
import Marketplace from "./pages/Marketplace";
import Tool from "./pages/Tool";
import DatasetTool from "./pages/DatasetTool";
import Results from "./pages/Results";
import Copilot from "./pages/Copilot";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PlatformStatus />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/industry" component={Industry} />
        <Route path="/ai-system" component={AiSystem} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/tool" component={Tool} />
        <Route path="/dataset-tool" component={DatasetTool} />
        <Route path="/results" component={Results} />
        <Route path="/copilot" component={Copilot} />
        <Route component={NotFound} />
      </Switch>
    </div>
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
