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
const Auth = createLazyRoute(() => import("./pages/Auth"));
const FlightsPage = createLazyRoute(() => import("./pages/flights"));
const ActivitiesPage = createLazyRoute(() => import("./pages/activities"));
const HotelSearchPage = createLazyRoute(() => import("./pages/search/hotels"));
const FlightSearchPage = createLazyRoute(() => import("./pages/search/flights"));
const ActivitySearchPage = createLazyRoute(() => import("./pages/search/activities"));
const UnifiedSearchPage = createLazyRoute(() => import("./pages/search/index"));
const HotelBookingReviewPage = createLazyRoute(() => import("./pages/hotel-booking-review"));
const FlightBookingReviewPage = createLazyRoute(() => import("./pages/flight-booking-review"));
const FlightManagementPage = createLazyRoute(() => import("./pages/flight-management"));
const ActivityBookingReviewPage = createLazyRoute(() => import("./pages/activity-booking-review"));
const HotelCheckoutPage = createLazyRoute(() => import("./pages/HotelCheckout"));
const FlightCheckoutPage = createLazyRoute(() => import("./pages/FlightCheckout"));
const ActivityCheckoutPage = createLazyRoute(() => import("./pages/ActivityCheckout"));
const BookingConfirmationPage = createLazyRoute(() => import("./pages/BookingConfirmation"));
const BookingDetailsPage = createLazyRoute(() => import("./pages/BookingDetails"));
const BookingSuccessPage = createLazyRoute(() => import("./pages/BookingSuccess"));
const BookingFailurePage = createLazyRoute(() => import("./pages/BookingFailure"));
const PaymentSuccessPage = createLazyRoute(() => import("./pages/PaymentSuccess"));
const DashboardPage = createLazyRoute(() => import("./pages/Dashboard"));
const SettingsPage = createLazyRoute(() => import("./pages/settings"));
const ProfilePage = createLazyRoute(() => import("./pages/profile"));
const BookingsPage = createLazyRoute(() => import("./pages/bookings"));
const MyTripsPage = createLazyRoute(() => import("./pages/MyTrips"));
const TravelFundPage = createLazyRoute(() => import("./pages/travel-fund"));
const JoinFundPage = createLazyRoute(() => import("./pages/join-fund"));
const TravelPreferencesPage = createLazyRoute(() => import("./pages/travel-preferences"));
const InviteFriendsPage = createLazyRoute(() => import("./pages/invite-friends"));
const AdminDashboard = createLazyRoute(() => import("./pages/AdminDashboard"));
const AdminAuth = createLazyRoute(() => import("./pages/AdminAuth"));
const DeploymentTestPage = createLazyRoute(() => import("./pages/admin/deployment-test"));
const AdminLayout = createLazyRoute(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminOverviewPage = createLazyRoute(() => import("./pages/admin/dashboard/overview"));
const AdminRealtimePage = createLazyRoute(() => import("./pages/admin/dashboard/realtime"));
const AdminAlertsPage = createLazyRoute(() => import("./pages/admin/dashboard/alerts"));
const AdminHealthPage = createLazyRoute(() => import("./pages/admin/monitoring/health"));
const AdminProvidersPage = createLazyRoute(() => import("./pages/admin/monitoring/providers"));
const AdminQuotasPage = createLazyRoute(() => import("./pages/admin/monitoring/quotas"));
const AdminLogsPage = createLazyRoute(() => import("./pages/admin/monitoring/logs"));
const AdminCorrelationPage = createLazyRoute(() => import("./pages/admin/monitoring/correlation"));
const AdminBookingsPage = createLazyRoute(() => import("./pages/admin/operations/bookings"));
const AdminUsersPage = createLazyRoute(() => import("./pages/admin/operations/users"));
const AdminTestingPage = createLazyRoute(() => import("./pages/admin/operations/testing"));
const AdminAgentsPage = createLazyRoute(() => import("./pages/admin/operations/agents"));
const AdminDiagnosticsPage = createLazyRoute(() => import("./pages/admin/diagnostics"));
const AdminSecurityPage = createLazyRoute(() => import("./pages/admin/security/access"));
const AdminAuditPage = createLazyRoute(() => import("./pages/admin/security/audit"));
const AdminSearchAnalyticsPage = createLazyRoute(() => import("./pages/admin/analytics/search"));
const AdminCompliancePage = createLazyRoute(() => import("./pages/admin/compliance/index"));
const AgentMetricsPage = createLazyRoute(() => import("./pages/admin/AgentMetrics"));
const AdminFeatureFlagsPage = createLazyRoute(() => import("./components/admin/FeatureFlags").then(m => ({ default: m.FeatureFlags })));
const AdminEnvironmentPage = createLazyRoute(() => import("./components/admin/EnvironmentConfiguration").then(m => ({ default: m.EnvironmentConfiguration })));
const AdminProvidersSettingsPage = createLazyRoute(() => import("./pages/admin/settings/providers"));
const SecureAdminPanelPage = createLazyRoute(() => import("./components/admin/SecureAdminPanel").then(m => ({ default: m.SecureAdminPanel })));

const SitemapRoute = createLazyRoute(() => import("./components/SitemapRoute"));

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
                                        <Route path="/auth" element={<Auth />} />
                                        <Route path="/travel-fund" element={<TravelFundPage />} />
                                        <Route path="/join-fund" element={<JoinFundPage />} />
                                        <Route path="/booking-success" element={<BookingSuccessPage />} />
                                         <Route path="/flights" element={<FlightsPage />} />
                                         <Route path="/activities" element={<ActivitiesPage />} />
                                        <Route path="/hotels" element={<HotelSearchPage />} />
                                       <Route path="/search" element={<UnifiedSearchPage />} />
                                       <Route path="/search/hotels" element={<HotelSearchPage />} />
                                       <Route path="/search/flights" element={<FlightSearchPage />} />
                                       <Route path="/search/activities" element={<ActivitySearchPage />} />
                                       <Route path="/hotel-booking-review" element={<HotelBookingReviewPage />} />
                                        <Route path="/flight-booking-review" element={<FlightBookingReviewPage />} />
                                        <Route path="/flight-management" element={<FlightManagementPage />} />
                                       <Route path="/activity-booking-review" element={<ActivityBookingReviewPage />} />
                                       <Route path="/hotel-checkout" element={<HotelCheckoutPage />} />
                                       <Route path="/flight-checkout" element={<FlightCheckoutPage />} />
                                       <Route path="/activity-checkout" element={<ActivityCheckoutPage />} />
                                         <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
                                         <Route path="/booking-failure" element={<BookingFailurePage />} />
                                         <Route path="/payment-success" element={<PaymentSuccessPage />} />
                                        <Route path="/booking/:id" element={<BookingDetailsPage />} />
                                         <Route path="/dashboard" element={<DashboardPage />} />
                                         <Route path="/settings" element={<SettingsPage />} />
                                         <Route path="/profile" element={<ProfilePage />} />
                                         <Route path="/bookings" element={<BookingsPage />} />
                                         <Route path="/my-trips" element={<MyTripsPage />} />
                                         <Route path="/travel-preferences" element={<TravelPreferencesPage />} />
                                        <Route path="/invite-friends" element={<InviteFriendsPage />} />
                                        <Route path="/sitemap.xml" element={<SitemapRoute />} />
                                        <Route path="/admin" element={<AdminAuth />} />
                                       <Route path="/admin/*" element={
                                         <AdminGuard>
                                           <AdminLayout />
                                         </AdminGuard>
                                       }>
                                         {/* Dashboard Routes */}
                                         <Route index element={<AdminOverviewPage />} />
                                         <Route path="dashboard" element={<AdminOverviewPage />} />
                                         <Route path="dashboard/realtime" element={<AdminRealtimePage />} />
                                         <Route path="dashboard/alerts" element={<AdminAlertsPage />} />
                                         
                         {/* Monitoring Routes */}
                         <Route path="monitoring/health" element={<AdminHealthPage />} />
                         <Route path="monitoring/providers" element={<AdminProvidersPage />} />
                          <Route path="monitoring/quotas" element={<AdminQuotasPage />} />
                          <Route path="monitoring/logs" element={<AdminLogsPage />} />
                          <Route path="monitoring/correlation" element={<AdminCorrelationPage />} />
                                         
                                           {/* Operations Routes */}
                                           <Route path="operations/bookings" element={<AdminBookingsPage />} />
                                           <Route path="operations/users" element={<AdminUsersPage />} />
                                           <Route path="operations/testing" element={<AdminTestingPage />} />
                                           <Route path="operations/agents" element={<AdminAgentsPage />} />
                                          <Route path="diagnostics" element={<AdminDiagnosticsPage />} />
                                         
                          {/* Security Routes */}
                          <Route path="security/access" element={<AdminSecurityPage />} />
                          <Route path="security/audit" element={<AdminAuditPage />} />
                          <Route path="compliance" element={<AdminCompliancePage />} />
                          
                           {/* Analytics Routes */}
                           <Route path="analytics/search" element={<AdminSearchAnalyticsPage />} />
                           <Route path="metrics" element={<AgentMetricsPage />} />
                           
                            {/* Settings Routes */}
                           <Route path="settings/features" element={<AdminFeatureFlagsPage />} />
                           <Route path="settings/environment" element={<AdminEnvironmentPage />} />
                           <Route path="settings/providers" element={<AdminProvidersSettingsPage />} />
                          
                          
                          <Route path="emergency" element={<SecureAdminPanelPage />} />
                                         
                                         {/* Legacy Routes for backward compatibility */}
                                         <Route path="deployment-test" element={<DeploymentTestPage />} />
                                       </Route>
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