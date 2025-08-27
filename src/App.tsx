
import './App.css';
import React from 'react';
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
                <Route path="settings/features" element={<FeatureFlagsPage />} />
                <Route path="settings/environment" element={<EnvironmentConfigPage />} />
                <Route path="settings/providers" element={<AdminProvidersSettingsPage />} />
                <Route path="monitoring/providers" element={<AdminProvidersPage />} />
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
