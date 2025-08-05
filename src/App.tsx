import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import Index from "./pages/Index";
import Hotels from "./pages/Hotels";
import SearchPage from "./pages/Search";
import BookingSelectPage from "./pages/BookingSelect";
import BookingExtrasPage from "./pages/BookingExtras";
import CheckoutPage from "./pages/Checkout";
import { Dashboard } from "./pages/Dashboard";
import { BookingDetails } from "./pages/BookingDetails";
import PartnerPortal from "./pages/PartnerPortal";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/booking/select" element={<BookingSelectPage />} />
            <Route path="/booking/extras" element={<BookingExtrasPage />} />
            <Route path="/booking/checkout" element={<CheckoutPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/bookings/:id" element={<BookingDetails />} />
            <Route path="/partner-portal" element={<PartnerPortal />} />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
