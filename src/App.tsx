import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { AdminGuard, DebugGuard } from "@/components/auth/RoleGuard";
import { CurrencyProvider } from "@/features/currency/CurrencyProvider";
import { SearchProvider } from "@/features/search/context/SearchContext";
import { HealthMonitorProvider } from "@/providers/HealthMonitorProvider";
import { PaymentProvider } from "@/features/payment/PaymentProvider";
import { AgenticBotProvider } from "@/features/agenticBot/context/AgenticBotContext";
import { MakuBotProvider } from "@/features/makuBot/context/MakuBotContext";
import { ABTestProvider } from "@/components/testing/ABTestingFramework";
import { ProductionProvider } from "@/contexts/ProductionContext";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { createLazyRoute } from "@/components/performance/CodeSplitting";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import "./App.css";

// Lazy load pages for better performance
const Index = createLazyRoute(() => import("./pages/Index"));
const FlightsPage = createLazyRoute(() => import("./pages/flights"));
const ActivitiesPage = createLazyRoute(() => import("./pages/activities"));
const HotelSearchPage = createLazyRoute(() => import("./pages/search/hotels"));
const FlightSearchPage = createLazyRoute(() => import("./pages/search/flights"));
const ActivitySearchPage = createLazyRoute(() => import("./pages/search/activities"));
const UnifiedSearchPage = createLazyRoute(() => import("./pages/search/index"));
const HotelBookingReviewPage = createLazyRoute(() => import("./pages/hotel-booking-review"));
const FlightBookingReviewPage = createLazyRoute(() => import("./pages/flight-booking-review"));
const ActivityBookingReviewPage = createLazyRoute(() => import("./pages/activity-booking-review"));
const HotelCheckoutPage = createLazyRoute(() => import("./pages/HotelCheckout"));
const FlightCheckoutPage = createLazyRoute(() => import("./pages/FlightCheckout"));
const ActivityCheckoutPage = createLazyRoute(() => import("./pages/ActivityCheckout"));
const BookingConfirmationPage = createLazyRoute(() => import("./pages/BookingConfirmation"));
const BookingDetailsPage = createLazyRoute(() => import("./pages/BookingDetails"));
const DashboardPage = createLazyRoute(() => import("./pages/Dashboard"));
const SettingsPage = createLazyRoute(() => import("./pages/settings"));
const ProfilePage = createLazyRoute(() => import("./pages/profile"));
const BookingsPage = createLazyRoute(() => import("./pages/bookings"));
const TravelFundPage = createLazyRoute(() => import("./pages/travel-fund"));
const TravelPreferencesPage = createLazyRoute(() => import("./pages/travel-preferences"));
const InviteFriendsPage = createLazyRoute(() => import("./pages/invite-friends"));
const AdminDashboard = createLazyRoute(() => import("./pages/AdminDashboard"));
const AdminAuth = createLazyRoute(() => import("./pages/AdminAuth"));
const DeploymentTestPage = createLazyRoute(() => import("./pages/admin/deployment-test"));
const DebugPage = createLazyRoute(() => import("./pages/debug"));
const HotelSelectionPage = createLazyRoute(() => import("./pages/booking/hotel-selection"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes  
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <GlobalErrorBoundary>
    <HelmetProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <PerformanceMonitor>
            <HealthMonitorProvider>
              <AuthProvider>
                <ProductionProvider>
                  <CurrencyProvider>
                    <SearchProvider>
                      <PaymentProvider>
                        <ABTestProvider>
                          <AgenticBotProvider defaultVertical="Solo">
                            <MakuBotProvider defaultVertical="Solo">
                              <TooltipProvider>
                                <div className="min-h-screen bg-background text-foreground">
                                  <Helmet>
                                    <meta name="theme-color" content="#ffffff" />
                                    <meta name="apple-mobile-web-app-capable" content="yes" />
                                    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                                    <meta name="format-detection" content="telephone=no" />
                                  </Helmet>
                                  
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
                                      <Route path="/hotel-checkout" element={<HotelCheckoutPage />} />
                                      <Route path="/flight-checkout" element={<FlightCheckoutPage />} />
                                      <Route path="/activity-checkout" element={<ActivityCheckoutPage />} />
                                      <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
                                      <Route path="/booking/:id" element={<BookingDetailsPage />} />
                                      <Route path="/dashboard" element={<DashboardPage />} />
                                      <Route path="/settings" element={<SettingsPage />} />
                                      <Route path="/profile" element={<ProfilePage />} />
                                      <Route path="/bookings" element={<BookingsPage />} />
                                      <Route path="/travel-fund" element={<TravelFundPage />} />
                                      <Route path="/travel-preferences" element={<TravelPreferencesPage />} />
                                      <Route path="/invite-friends" element={<InviteFriendsPage />} />
                                      <Route path="/admin" element={<AdminAuth />} />
                                      <Route path="/admin/dashboard" element={
                                        <AdminGuard>
                                          <AdminDashboard />
                                        </AdminGuard>
                                      } />
                                      <Route path="/admin/deployment-test" element={
                                        <AdminGuard>
                                          <DeploymentTestPage />
                                        </AdminGuard>
                                      } />
                                      <Route path="/debug" element={
                                        <DebugGuard>
                                          <DebugPage />
                                        </DebugGuard>
                                      } />
                                      <Route path="/booking/hotel-selection" element={<HotelSelectionPage />} />
                                    </Routes>
                                  </BrowserRouter>
                                </div>
                              </TooltipProvider>
                            </MakuBotProvider>
                          </AgenticBotProvider>
                        </ABTestProvider>
                      </PaymentProvider>
                    </SearchProvider>
                  </CurrencyProvider>
                </ProductionProvider>
              </AuthProvider>
            </HealthMonitorProvider>
          </PerformanceMonitor>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  </GlobalErrorBoundary>
);

export default App;