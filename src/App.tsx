

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { CurrencyProvider } from "@/features/currency/CurrencyProvider";
import { MakuBotProvider } from "@/features/makuBot/context/MakuBotContext";
import { AgenticBotProvider } from "@/features/agenticBot/context/AgenticBotContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import PartnerAuth from "./pages/PartnerAuth";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerPortal from "./pages/PartnerPortal";
import Partners from "./pages/Partners";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import SearchHotels from "./pages/search/hotels";
import SearchFlights from "./pages/search/flights";
import SearchActivities from "./pages/search/activities";
import SearchCars from "./pages/search/cars";
import HotelDetails from "./pages/HotelDetails";
import HotelCheckout from "./pages/HotelCheckout";
import FlightCheckout from "./pages/FlightCheckout";
import ActivityCheckout from "./pages/ActivityCheckout";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingCancelled from "./pages/BookingCancelled";
import BookingDetails from "./pages/BookingDetails";
import BookingSelect from "./pages/BookingSelect";
import BookingExtras from "./pages/BookingExtras";
import BookingBaggage from "./pages/BookingBaggage";
import FlightBookingReview from "./pages/FlightBookingReview";
import ActivitySelect from "./pages/ActivitySelect";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import PaymentSetup from "./pages/PaymentSetup";
import NotFound from "./pages/NotFound";
import Help from "./pages/Help";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import Deals from "./pages/Deals";
import GiftCards from "./pages/GiftCards";
import Roadmap from "./pages/Roadmap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <MakuBotProvider>
              <AgenticBotProvider>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin" element={<AdminAuth />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/partner" element={<PartnerAuth />} />
                    <Route path="/partner/dashboard" element={<PartnerDashboard />} />
                    <Route path="/partner-portal" element={<PartnerPortal />} />
                    <Route path="/partners" element={<Partners />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/search/hotels" element={<SearchHotels />} />
                    <Route path="/search/flights" element={<SearchFlights />} />
                    <Route path="/search/activities" element={<SearchActivities />} />
                    <Route path="/search/cars" element={<SearchCars />} />
                    <Route path="/hotel/:id" element={<HotelDetails />} />
                    <Route path="/hotel-checkout" element={<HotelCheckout />} />
                    <Route path="/flight-checkout" element={<FlightCheckout />} />
                    <Route path="/activity-checkout" element={<ActivityCheckout />} />
                    <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                    <Route path="/booking-cancelled" element={<BookingCancelled />} />
                    <Route path="/booking/:id" element={<BookingDetails />} />
                    <Route path="/booking-select" element={<BookingSelect />} />
                    <Route path="/booking-extras" element={<BookingExtras />} />
                    <Route path="/booking-baggage" element={<BookingBaggage />} />
                    <Route path="/flight-booking-review" element={<FlightBookingReview />} />
                    <Route path="/activity-select" element={<ActivitySelect />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                    <Route path="/payment-setup" element={<PaymentSetup />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/press" element={<Press />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/gift-cards" element={<GiftCards />} />
                    <Route path="/roadmap" element={<Roadmap />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </AgenticBotProvider>
            </MakuBotProvider>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
