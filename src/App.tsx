
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { CurrencyProvider } from "@/features/currency/CurrencyProvider";
import { AgenticBotProvider } from "@/features/agenticBot/context/AgenticBotContext";
import { MakuBotProvider } from "@/features/makuBot/context/MakuBotContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import { Dashboard } from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Search from "./pages/Search";
import SearchHub from "./pages/search/index";
import HotelSearchPage from "./pages/search/hotels";
import FlightSearchPage from "./pages/search/flights";
import ActivitySearchPage from "./pages/search/activities";

import { HotelDetails } from "./pages/HotelDetails";
import BookingSelect from "./pages/BookingSelect";
import BookingBaggage from "./pages/BookingBaggage";
import BookingExtras from "./pages/BookingExtras";
import Checkout from "./pages/Checkout";
import FlightCheckout from "./pages/FlightCheckout";
import FlightBookingReview from "./pages/FlightBookingReview";
import BookingPayment from "./pages/BookingPayment";
import HotelCheckout from "./pages/HotelCheckout";
import ActivityCheckout from "./pages/ActivityCheckout";
import ActivitySelect from "./pages/ActivitySelect";
import BookingPayment from "./pages/BookingPayment";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingCancelled from "./pages/BookingCancelled";
import { BookingDetails } from "./pages/BookingDetails";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import PaymentSetup from "./pages/PaymentSetup";
import Partners from "./pages/Partners";
import PartnerAuth from "./pages/PartnerAuth";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerPortal from "./pages/PartnerPortal";
import Deals from "./pages/Deals";
import GiftCards from "./pages/GiftCards";
import Roadmap from "./pages/Roadmap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <AgenticBotProvider>
            <MakuBotProvider>
              <TooltipProvider>
                <Toaster />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin/auth" element={<AdminAuth />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/search" element={<SearchHub />} />
                    <Route path="/search/hotels" element={<HotelSearchPage />} />
                    <Route path="/search/flights" element={<FlightSearchPage />} />
                    <Route path="/search/activities" element={<ActivitySearchPage />} />
                    
                    <Route path="/hotel/:hotelId" element={<HotelDetails />} />
                    <Route path="/hotel-checkout" element={<HotelCheckout />} />
                    <Route path="/booking/select" element={<BookingSelect />} />
                    <Route path="/booking/baggage" element={<BookingBaggage />} />
                    <Route path="/booking/extras" element={<BookingExtras />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/flight-booking-review" element={<FlightBookingReview />} />
                    <Route path="/flight-checkout" element={<FlightCheckout />} />
                    <Route path="/booking-payment" element={<BookingPayment />} />
                    <Route path="/activity-checkout" element={<ActivityCheckout />} />
                    <Route path="/activity-select" element={<ActivitySelect />} />
                    <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                    <Route path="/booking-cancelled" element={<BookingCancelled />} />
                    <Route path="/booking/:id" element={<BookingDetails />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/cancelled" element={<PaymentCancelled />} />
                    <Route path="/payment-setup" element={<PaymentSetup />} />
                    <Route path="/partners" element={<Partners />} />
                    <Route path="/partner-auth" element={<PartnerAuth />} />
                    <Route path="/partner-dashboard" element={<PartnerDashboard />} />
                    <Route path="/partner-portal" element={<PartnerPortal />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/gift-cards" element={<GiftCards />} />
                    <Route path="/roadmap" element={<Roadmap />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </MakuBotProvider>
          </AgenticBotProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
