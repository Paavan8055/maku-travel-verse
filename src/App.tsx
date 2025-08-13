
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { MakuBotProvider } from "@/features/makuBot/context/MakuBotContext";
import { AgenticBotProvider } from "@/features/agenticBot/context/AgenticBotContext";
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
import HotelCheckout from "./pages/HotelCheckout";
import FlightCheckout from "./pages/FlightCheckout";
import ActivitySelect from "./pages/ActivitySelect";
import ActivityCheckout from "./pages/ActivityCheckout";
import BookingPaymentPage from "./pages/BookingPayment";
import BookingConfirmationPage from "./pages/BookingConfirmation";
import BookingCancelledPage from "./pages/BookingCancelled";
import { Dashboard } from "./pages/Dashboard";
import { BookingDetails } from "./pages/BookingDetails";
import PartnerPortal from "./pages/PartnerPortal";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { CurrencyProvider } from "@/features/currency/CurrencyProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <MakuBotProvider>
          <AgenticBotProvider>
            <Toaster />
            <Sonner />
            <CurrencyProvider>
              <BrowserRouter 
                future={{ 
                  v7_startTransition: true,
                  v7_relativeSplatPath: true 
                }}
              >
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
                  <Route path="/booking/checkout/hotel" element={<HotelCheckout />} />
                  <Route path="/booking/checkout/flight" element={<FlightCheckout />} />
                  <Route path="/booking/select/activity" element={<ActivitySelect />} />
                  <Route path="/booking/checkout/activity" element={<ActivityCheckout />} />
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
  </QueryClientProvider>
);

export default App;
