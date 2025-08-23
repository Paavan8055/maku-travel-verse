
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { CurrencyProvider } from "@/features/currency/CurrencyProvider";
import { SearchProvider } from "@/features/search/context/SearchContext";
import { HealthMonitorProvider } from "@/providers/HealthMonitorProvider";
import { PaymentProvider } from "@/features/payment/PaymentProvider";
import { AgenticBotProvider } from "@/features/agenticBot/context/AgenticBotContext";
import { MakuBotProvider } from "@/features/makuBot/context/MakuBotContext";
import { ProductionProvider } from "@/contexts/ProductionContext";
import Index from "./pages/Index";
import FlightsPage from "./pages/flights";
import ActivitiesPage from "./pages/activities";
import HotelSearchPage from "./pages/search/hotels";
import FlightSearchPage from "./pages/search/flights";
import ActivitySearchPage from "./pages/search/activities";
import UnifiedSearchPage from "./pages/search/index";
import HotelBookingReviewPage from "./pages/hotel-booking-review";
import FlightBookingReviewPage from "./pages/flight-booking-review";
import ActivityBookingReviewPage from "./pages/activity-booking-review";
import HotelCheckoutTestPage from "./pages/hotel-checkout-test";
import SettingsPage from "./pages/settings";
import ProfilePage from "./pages/profile";
import BookingsPage from "./pages/bookings";
import TravelFundPage from "./pages/travel-fund";
import TravelPreferencesPage from "./pages/travel-preferences";
import InviteFriendsPage from "./pages/invite-friends";
import "./App.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HealthMonitorProvider>
      <AuthProvider>
        <ProductionProvider>
          <CurrencyProvider>
            <SearchProvider>
              <PaymentProvider>
                <AgenticBotProvider defaultVertical="Solo">
                  <MakuBotProvider defaultVertical="Solo">
                    <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/flights" element={<FlightsPage />} />
                        <Route path="/activities" element={<ActivitiesPage />} />
                        <Route path="/hotels" element={<HotelSearchPage />} />
                        <Route path="/search" element={<UnifiedSearchPage />} />
                        <Route path="/search/hotels" element={<HotelSearchPage />} />
                        <Route path="/search/flights" element={<FlightSearchPage />} />
                        <Route path="/search/activities" element={<ActivitySearchPage />} />
                        <Route path="/hotel-booking-review" element={<HotelBookingReviewPage />} />
                        <Route path="/flight-booking-review" element={<FlightBookingReviewPage />} />
                        <Route path="/activity-booking-review" element={<ActivityBookingReviewPage />} />
                        <Route path="/hotel-checkout-test" element={<HotelCheckoutTestPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/bookings" element={<BookingsPage />} />
                        <Route path="/travel-fund" element={<TravelFundPage />} />
                        <Route path="/travel-preferences" element={<TravelPreferencesPage />} />
                        <Route path="/invite-friends" element={<InviteFriendsPage />} />
                      </Routes>
                    </BrowserRouter>
                    </TooltipProvider>
                  </MakuBotProvider>
                </AgenticBotProvider>
              </PaymentProvider>
            </SearchProvider>
          </CurrencyProvider>
        </ProductionProvider>
      </AuthProvider>
    </HealthMonitorProvider>
  </QueryClientProvider>
);

export default App;
