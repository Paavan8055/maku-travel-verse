
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from './features/auth/components/AdminGuard';
import { AuthProvider } from './features/auth/context/AuthContext';
import AdminDashboard from '@/components/admin/AdminDashboard';
import FeatureFlagsPage from '@/pages/admin/FeatureFlagsPage';
import EnvironmentConfigPage from '@/pages/admin/EnvironmentConfigPage';
import PerformanceMonitoringPage from '@/pages/admin/PerformanceMonitoringPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
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
                <Route path="monitoring/performance" element={<PerformanceMonitoringPage />} />
              </Route>
              
              {/* Default route */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold mb-4">Welcome to MAKU Admin</h1>
                      <p className="text-muted-foreground mb-4">
                        Access the admin panel at <code>/admin</code>
                      </p>
                    </div>
                  </div>
                } 
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
