import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { AgenticBotProvider } from "@/features/agenticBot/context/AgenticBotContext";
import { MakuBotProvider } from "@/features/makuBot/context/MakuBotContext";
import Index from "./pages/Index";
import Partners from "./pages/Partners";
import PartnerPortal from "./pages/PartnerPortal";
import PartnerDashboard from "./pages/PartnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import PartnerAuth from "./pages/PartnerAuth";
import PaymentSetup from "./pages/PaymentSetup";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AgenticBotProvider>
        <MakuBotProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/partner-portal" element={<PartnerPortal />} />
                <Route path="/partner-dashboard" element={<PartnerDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin-auth" element={<AdminAuth />} />
                <Route path="/partner-auth" element={<PartnerAuth />} />
                <Route path="/payment-setup" element={<PaymentSetup />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancelled" element={<PaymentCancelled />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </MakuBotProvider>
      </AgenticBotProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
