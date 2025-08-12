
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { MakuBotProvider } from "@/features/makuBot/context/MakuBotContext";
import { AgenticBotProvider } from "@/features/agenticBot/context/AgenticBotContext";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Hotels from "./pages/Hotels";
import SearchHub from "./pages/search/index";
import HotelSearchPage from "./pages/search/hotels";
import FlightSearchPage from "./pages/search/flights";
import ActivitySearchPage from "./pages/search/activities";
import CarRentalPage from "./pages/CarRental";
import DealsPage from "./pages/Deals";
import PartnersPage from "./pages/Partners";
import BookingSelectPage from "./pages/BookingSelect";
import BookingBaggagePage from "./pages/BookingBaggage";
import BookingExtrasPage from "./pages/BookingExtras";
import CheckoutPage from "./pages/Checkout";
import BookingPaymentPage from "./pages/BookingPayment";
import BookingConfirmationPage from "./pages/BookingConfirmation";
import BookingCancelledPage from "./pages/BookingCancelled";
import { Dashboard } from "./pages/Dashboard";
import { BookingDetails } from "./pages/BookingDetails";
import PartnerPortal from "./pages/PartnerPortal";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { CurrencyProvider } from "@/features/currency/CurrencyProvider";
// Error Boundary to prevent app-wide crashes
type ErrorBoundaryProps = { children?: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error("App ErrorBoundary caught an error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground">Please refresh the page.</p>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const queryClient = new QueryClient();

const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <MakuBotProvider>
              <AgenticBotProvider>
                <Toaster />
                <ClientOnly>
                  <Sonner />
                </ClientOnly>
                <CurrencyProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/search" element={<SearchHub />} />
                      <Route path="/search/hotels" element={<HotelSearchPage />} />
                      <Route path="/search/flights" element={<FlightSearchPage />} />
                      <Route path="/search/activities" element={<ActivitySearchPage />} />
                      <Route path="/hotels" element={<Hotels />} />
                      <Route path="/car-rental" element={<CarRentalPage />} />
                      <Route path="/deals" element={<DealsPage />} />
                      <Route path="/partners" element={<PartnersPage />} />
                      <Route path="/booking/select" element={<BookingSelectPage />} />
                      <Route path="/booking/baggage" element={<BookingBaggagePage />} />
                      <Route path="/booking/extras" element={<BookingExtrasPage />} />
                      <Route path="/booking/checkout" element={<CheckoutPage />} />
                      <Route path="/booking/payment" element={<BookingPaymentPage />} />
                      <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
                      <Route path="/booking/cancelled" element={<BookingCancelledPage />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/dashboard/bookings/:id" element={<BookingDetails />} />
                      <Route path="/partner-portal" element={<PartnerPortal />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </CurrencyProvider>
              </AgenticBotProvider>
            </MakuBotProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);
