
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { CurrencyProvider } from "@/features/currency/CurrencyProvider";
import { MakuBotProvider } from "@/features/makuBot/context/MakuBotContext";
import { AgenticBotProvider } from "@/features/agenticBot/context/AgenticBotContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import PartnerAuth from "./pages/PartnerAuth";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerPortal from "./pages/PartnerPortal";
import { Dashboard } from "./pages/Dashboard";
import Search from "./pages/Search";
import Hotels from "./pages/Hotels";
import Deals from "./pages/Deals";
import Roadmap from "./pages/Roadmap";
import CarRental from "./pages/CarRental";
import Partners from "./pages/Partners";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingCancelled from "./pages/BookingCancelled";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import PaymentSetup from "./pages/PaymentSetup";
import { BookingDetails } from "./pages/BookingDetails";
import BookingSelect from "./pages/BookingSelect";
import BookingExtras from "./pages/BookingExtras";
import BookingBaggage from "./pages/BookingBaggage";
import BookingPayment from "./pages/BookingPayment";
import Checkout from "./pages/Checkout";
import HotelCheckout from "./pages/HotelCheckout";
import FlightCheckout from "./pages/FlightCheckout";
import ActivityCheckout from "./pages/ActivityCheckout";
import ActivitySelect from "./pages/ActivitySelect";
import NotFound from "./pages/NotFound";
// Search pages
import SearchIndex from "./pages/search/index";
import SearchHotels from "./pages/search/hotels";
import SearchFlights from "./pages/search/flights";
import SearchActivities from "./pages/search/activities";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <MakuBotProvider>
          <AgenticBotProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin-auth" element={<AdminAuth />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/partner-auth" element={<PartnerAuth />} />
                  <Route path="/partner-dashboard" element={<PartnerDashboard />} />
                  <Route path="/partner-portal" element={<PartnerPortal />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/search/index" element={<SearchIndex />} />
                  <Route path="/search/hotels" element={<SearchHotels />} />
                  <Route path="/search/flights" element={<SearchFlights />} />
                  <Route path="/search/activities" element={<SearchActivities />} />
                  <Route path="/hotels" element={<Hotels />} />
                  <Route path="/deals" element={<Deals />} />
                  <Route path="/roadmap" element={<Roadmap />} />
                  <Route path="/car-rental" element={<CarRental />} />
                  <Route path="/partners" element={<Partners />} />
                  {/* Consistent booking routing structure */}
                  <Route path="/booking/confirmation" element={<BookingConfirmation />} />
                  <Route path="/booking/payment" element={<BookingPayment />} />
                  <Route path="/booking/flight" element={<FlightCheckout />} />
                  <Route path="/booking/hotel" element={<HotelCheckout />} />
                  <Route path="/booking/activity" element={<ActivityCheckout />} />
                  <Route path="/booking/:id" element={<BookingDetails />} />
                  <Route path="/booking/:id/select" element={<BookingSelect />} />
                  <Route path="/booking/:id/extras" element={<BookingExtras />} />
                  <Route path="/booking/:id/baggage" element={<BookingBaggage />} />
                  
                  {/* Legacy routes for backward compatibility */}
                  <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                  <Route path="/booking-cancelled" element={<BookingCancelled />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                  <Route path="/payment-setup" element={<PaymentSetup />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/hotel" element={<HotelCheckout />} />
                  <Route path="/checkout/flight" element={<FlightCheckout />} />
                  <Route path="/checkout/activity" element={<ActivityCheckout />} />
                  <Route path="/activity/:id/select" element={<ActivitySelect />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AgenticBotProvider>
        </MakuBotProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
