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
import { ABTestProvider } from "@/components/testing/ABTestingFramework";
import { ProductionProvider } from "@/contexts/ProductionContext";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { createLazyRoute } from "@/components/performance/CodeSplitting";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { UniversalAIProvider } from "@/features/universal-ai/context/UniversalAIContext";
import "./App.css";

// Lazy load other pages for better performance
const Index = createLazyRoute(() => import("./pages/Index"));
const Acknowledgments = createLazyRoute(() => import("./pages/Acknowledgments"));
const Auth = createLazyRoute(() => import("./pages/Auth"));
const About = createLazyRoute(() => import("./pages/About"));
const NFT = createLazyRoute(() => import("./pages/NFT"));
const Airdrop = createLazyRoute(() => import("./pages/Airdrop"));
const Careers = createLazyRoute(() => import("./pages/Careers"));
const Press = createLazyRoute(() => import("./pages/Press"));
const CryptoPayments = createLazyRoute(() => import("./pages/CryptoPayments"));
const Demo = createLazyRoute(() => import("./pages/Demo"));
const Developers = createLazyRoute(() => import("./pages/Developers"));
const APIDocs = createLazyRoute(() => import("./pages/APIDocs"));
const Integrations = createLazyRoute(() => import("./pages/Integrations"));
const PartnerPortal = createLazyRoute(() => import("./pages/PartnerPortal"));
const Deals = createLazyRoute(() => import("./pages/Deals"));
const Partners = createLazyRoute(() => import("./pages/Partners"));
const EnhancedProviders = createLazyRoute(() => import("./pages/EnhancedProviders"));
const BlockchainPage = createLazyRoute(() => import("./pages/blockchain"));
const CollaborativePlanningPage = createLazyRoute(() => import("./pages/collaborative-planning"));
const GiftCards = createLazyRoute(() => import("./pages/GiftCards"));
const Help = createLazyRoute(() => import("./pages/Help"));
const Roadmap = createLazyRoute(() => import("./pages/Roadmap"));
const FlightsPage = createLazyRoute(() => import("./pages/flights"));
const FlightsEnhancedPage = createLazyRoute(() => import("./pages/flights-enhanced"));
const ActivitiesPage = createLazyRoute(() => import("./pages/activities"));
const ActivitiesEnhancedPage = createLazyRoute(() => import("./pages/activities-enhanced"));
const HotelSearchPage = createLazyRoute(() => import("./pages/search/hotels"));
const HotelsEnhancedPage = createLazyRoute(() => import("./pages/hotels-enhanced"));
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
const AdminSmartDreamsPage = createLazyRoute(() => import("./pages/admin/smart-dreams"));
const DeploymentTestPage = createLazyRoute(() => import("./pages/admin/deployment-test"));
const AdminLayout = createLazyRoute(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminOverviewPage = createLazyRoute(() => import("./pages/admin/dashboard/overview"));
const AdminAlertsPage = createLazyRoute(() => import("./pages/admin/dashboard/alerts"));
const AdminMonitoring = createLazyRoute(() => import("./pages/admin/monitoring"));
const AdminRealTimeMonitoringPage = createLazyRoute(() => import("./pages/admin/monitoring/real-time"));
const AdminProvidersPage = createLazyRoute(() => import("./pages/admin/monitoring/providers"));

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

// Automation Routes
const AutomationHubPage = createLazyRoute(() => import("./pages/admin/automation/hub"));
const WorkflowsPage = createLazyRoute(() => import("./pages/admin/automation/workflows"));
const OrchestrationPage = createLazyRoute(() => import("./pages/admin/automation/orchestration"));
const AgentCoordinationPage = createLazyRoute(() => import("./pages/admin/coordination/agent-orchestration"));

const SitemapRoute = createLazyRoute(() => import("./components/SitemapRoute"));
const EnvironmentManager = createLazyRoute(() => import("./pages/EnvironmentManager"));
const SmartDreamHub = createLazyRoute(() => import("./pages/smart-dream-hub"));
const SmartDreamsComplete = createLazyRoute(() => import("./pages/smart-dreams-complete"));
const AIIntelligenceHub = createLazyRoute(() => import("./pages/ai-intelligence-hub"));
const AIDemoPage = createLazyRoute(() => import("./pages/ai-demo"));

// Off-Season Occupancy Engine Routes (Feature Flagged)
const OffseasonPartnersPage = createLazyRoute(() => import("./pages/OffseasonPartners"));
const OffseasonPartnerDashboardPage = createLazyRoute(() => import("./pages/OffseasonPartnerDashboard"));
const OffseasonAdminDashboardPage = createLazyRoute(() => import("./pages/OffseasonAdminDashboard"));

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
                              <UniversalAIProvider>
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
                                        <Route path="/acknowledgments" element={<Acknowledgments />} />
                                        <Route path="/about" element={<About />} />
                                        <Route path="/nft" element={<NFT />} />
                                        <Route path="/blockchain" element={<BlockchainPage />} />
                                        <Route path="/collaborative-planning" element={<CollaborativePlanningPage />} />
                                        <Route path="/airdrop" element={<Airdrop />} />
                                        <Route path="/careers" element={<Careers />} />
                                        <Route path="/press" element={<Press />} />
                                        <Route path="/crypto-payments" element={<CryptoPayments />} />
                                        <Route path="/demo" element={<Demo />} />
                                        <Route path="/developers" element={<Developers />} />
                                        <Route path="/api-docs" element={<APIDocs />} />
                                        <Route path="/integrations" element={<Integrations />} />
                                        <Route path="/partner-portal" element={<PartnerPortal />} />
                                        <Route path="/deals" element={<Deals />} />
                                        <Route path="/partners" element={<Partners />} />
                                        <Route path="/enhanced-providers" element={<EnhancedProviders />} />
                                        <Route path="/gift-cards" element={<GiftCards />} />
                                        <Route path="/help" element={<Help />} />
                                        <Route path="/roadmap" element={<Roadmap />} />
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
                                        <Route path="/environment-manager" element={<EnvironmentManager />} />
                                        <Route path="/smart-dreams" element={<SmartDreamHub />} />
                                        <Route path="/ai-intelligence" element={<AIIntelligenceHub />} />
                                        <Route path="/ai-demo" element={<AIDemoPage />} />
                                        <Route path="/sitemap.xml" element={<SitemapRoute />} />
                                        
                                        {/* Off-Season Occupancy Engine Routes (Feature Flagged) */}
                                        {import.meta.env.VITE_OFFSEASON_FEATURES === 'true' && (
                                          <>
                                            <Route path="/offseason-partners" element={<OffseasonPartnersPage />} />
                                            <Route path="/dashboard/partners" element={<OffseasonPartnerDashboardPage />} />
                                            <Route path="/admin/offseason" element={<OffseasonAdminDashboardPage />} />
                                          </>
                                        )}
                                        
                                        <Route path="/admin" element={<AdminAuth />} />
                                       <Route path="/admin/*" element={
                                         <AdminGuard>
                                           <AdminLayout />
                                         </AdminGuard>
                                       }>
                                         {/* Dashboard Routes */}
                          <Route index element={<AdminOverviewPage />} />
                          <Route path="dashboard" element={<AdminOverviewPage />} />
                          <Route path="dashboard/alerts" element={<AdminAlertsPage />} />
                          <Route path="smart-dreams" element={<AdminSmartDreamsPage />} />
                          
                          {/* Monitoring Routes */}
                          <Route path="monitoring" element={<AdminMonitoring />} />
                          <Route path="monitoring/real-time" element={<AdminRealTimeMonitoringPage />} />
                          <Route path="monitoring/providers" element={<AdminProvidersPage />} />
                           
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
                           
                           {/* Automation Routes */}
                           <Route path="automation/hub" element={<AutomationHubPage />} />
                            <Route path="automation/workflows" element={<WorkflowsPage />} />
                            <Route path="automation/orchestration" element={<OrchestrationPage />} />
                            <Route path="coordination/agents" element={<AgentCoordinationPage />} />
                           
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
                               </UniversalAIProvider>
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