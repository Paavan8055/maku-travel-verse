
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from './features/auth/components/AdminGuard';
import { AuthProvider } from './features/auth/context/AuthContext';
import Auth from '@/pages/Auth';
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
              {/* Auth Route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Dashboard Route - redirects to admin */}
              <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
              
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
                  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="text-center max-w-md p-8 bg-card rounded-lg shadow-lg border">
                      <h1 className="text-3xl font-bold mb-4 text-foreground">Welcome to MAKU Admin</h1>
                      <p className="text-muted-foreground mb-6">
                        Professional travel platform administration panel
                      </p>
                      <div className="space-y-4">
                        <a 
                          href="/auth" 
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                        >
                          Access Admin Panel
                        </a>
                        <p className="text-xs text-muted-foreground">
                          Administrator credentials required
                        </p>
                      </div>
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
