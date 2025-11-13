import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Feedback from "./pages/Feedback";
import Plans from "./pages/Plans";
import Coaches from "./pages/Coaches";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Email from "./pages/Email";
import SMS from "./pages/SMS";
import NotFound from "./pages/NotFound";
import { UserRole } from "@/types";

const queryClient = new QueryClient();

const App = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>("coach");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout currentRole={currentRole} onRoleChange={setCurrentRole}>
            <Routes>
              <Route path="/" element={<Index currentRole={currentRole} />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:clientId" element={<ClientDetail />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/coaches" element={<Coaches />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/email" element={<Email />} />
              <Route path="/sms" element={<SMS />} />
              <Route path="/pipelines" element={<div className="text-center py-12"><h2 className="text-2xl font-semibold">Data Pipelines coming soon</h2></div>} />
              <Route path="/settings" element={<Settings currentRole={currentRole} />} />
              <Route path="/audit" element={<div className="text-center py-12"><h2 className="text-2xl font-semibold">Audit Logs coming soon</h2></div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
