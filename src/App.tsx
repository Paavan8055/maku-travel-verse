
import './App.css';
import React, { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from './features/auth/components/AdminGuard';
import { AuthProvider } from './features/auth/context/AuthContext';
import { AgenticBotProvider } from '@/features/agenticBot/context/AgenticBotContext';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AdminDashboard from '@/components/admin/AdminDashboard';
import FeatureFlagsPage from '@/pages/admin/FeatureFlagsPage';
import EnvironmentConfigPage from '@/pages/admin/EnvironmentConfigPage';
import AdminProvidersPage from '@/pages/admin/monitoring/providers';
import AdminProvidersSettingsPage from '@/pages/admin/settings/providers';
import HotelSearchPage from '@/pages/search/hotels';
import FlightSearchPage from '@/pages/search/flights';
import ActivitySearchPage from '@/pages/search/activities';
import CarSearchPage from '@/pages/search/cars';
import { BookingConfirmation } from '@/components/checkout/BookingConfirmation';
import GiftCards from '@/pages/GiftCards';
import Roadmap from '@/pages/Roadmap';
import Partners from '@/pages/Partners';
import Loyalty from '@/pages/Loyalty';
import Reviews from '@/pages/Reviews';
import About from '@/pages/About';
import Careers from '@/pages/Careers';
import Press from '@/pages/Press';
import PartnerPortal from '@/pages/PartnerPortal';
import Deals from '@/pages/Deals';

// Lazy load admin pages
const AdminRealtimeMetrics = React.lazy(() => import('@/pages/admin/dashboard/realtime'));
const AdminCriticalAlerts = React.lazy(() => import('@/pages/admin/dashboard/alerts'));
const AdminSystemHealth = React.lazy(() => import('@/pages/admin/monitoring/health'));
const AdminQuotaManagement = React.lazy(() => import('@/pages/admin/monitoring/quotas'));
const AdminPerformanceLogs = React.lazy(() => import('@/pages/admin/monitoring/logs'));
const AdminCorrelationTracking = React.lazy(() => import('@/pages/admin/monitoring/correlation'));
const AdminBookingManagement = React.lazy(() => import('@/pages/admin/operations/bookings'));
const AdminUserManagement = React.lazy(() => import('@/pages/admin/operations/users'));
const AdminTestSuite = React.lazy(() => import('@/pages/admin/operations/testing'));
const AdminSystemDiagnostics = React.lazy(() => import('@/pages/admin/diagnostics'));
const AdminSearchAnalytics = React.lazy(() => import('@/pages/admin/operations/search'));
const AdminAccessControl = React.lazy(() => import('@/pages/admin/security/access'));
const AdminAuditLogs = React.lazy(() => import('@/pages/admin/security/audit'));
const AdminComplianceStatus = React.lazy(() => import('@/pages/admin/security/compliance'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AgenticBotProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Main Website Route */}
                <Route path="/" element={<Index />} />
              
                {/* Auth Route */}
                <Route path="/auth" element={<Auth />} />
              
                {/* Search Routes */}
                <Route path="/search/hotels" element={<HotelSearchPage />} />
                <Route path="/search/flights" element={<FlightSearchPage />} />
                <Route path="/search/activities" element={<ActivitySearchPage />} />
                <Route path="/search/cars" element={<CarSearchPage />} />
              
                {/* Booking Routes */}
                <Route path="/booking/confirmation" element={<BookingConfirmation />} />
              
                {/* Customer Routes */}
                <Route path="/gift-cards" element={<GiftCards />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/loyalty" element={<Loyalty />} />
                <Route path="/reviews" element={<Reviews />} />
                
                {/* Additional Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/press" element={<Press />} />
                <Route path="/partner-portal" element={<PartnerPortal />} />
                <Route path="/deals" element={<Deals />} />

                {/* Admin Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <AdminGuard>
                      <AdminLayout />
                    </AdminGuard>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  
                  {/* Dashboard Routes */}
                  <Route path="dashboard/realtime" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminRealtimeMetrics />
                    </Suspense>
                  } />
                  <Route path="dashboard/alerts" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminCriticalAlerts />
                    </Suspense>
                  } />
                  
                  {/* Monitoring Routes */}
                  <Route path="monitoring/health" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminSystemHealth />
                    </Suspense>
                  } />
                  <Route path="monitoring/providers" element={<AdminProvidersPage />} />
                  <Route path="monitoring/quotas" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminQuotaManagement />
                    </Suspense>
                  } />
                  <Route path="monitoring/logs" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminPerformanceLogs />
                    </Suspense>
                  } />
                  <Route path="monitoring/correlation" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminCorrelationTracking />
                    </Suspense>
                  } />
                  
                  {/* Operations Routes */}
                  <Route path="operations/bookings" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminBookingManagement />
                    </Suspense>
                  } />
                  <Route path="operations/users" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminUserManagement />
                    </Suspense>
                  } />
                  <Route path="operations/testing" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminTestSuite />
                    </Suspense>
                  } />
                  <Route path="operations/search" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminSearchAnalytics />
                    </Suspense>
                  } />
                  <Route path="diagnostics" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminSystemDiagnostics />
                    </Suspense>
                  } />
                  
                  {/* Security Routes */}
                  <Route path="security/access" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminAccessControl />
                    </Suspense>
                  } />
                  <Route path="security/audit" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminAuditLogs />
                    </Suspense>
                  } />
                  <Route path="security/compliance" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminComplianceStatus />
                    </Suspense>
                  } />
                  
                  {/* Settings Routes */}
                  <Route path="settings/features" element={<FeatureFlagsPage />} />
                  <Route path="settings/environment" element={<EnvironmentConfigPage />} />
                  <Route path="settings/providers" element={<AdminProvidersSettingsPage />} />
                </Route>
              
                {/* Fallback Route - redirect to main website */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AgenticBotProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
