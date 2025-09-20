import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import logger from "@/utils/logger";

const AdminAuth = () => {
  const { user, loading } = useAuth();
  const [isAdminLogin, setIsAdminLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const location = useLocation();

  // Get the intended destination after login
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Development bypass - more flexible approach
  const urlParams = new URLSearchParams(window.location.search);
  const hasDevBypass = urlParams.get('dev') === 'true' || urlParams.get('bypass') === 'admin';
  const isPreviewEnvironment = window.location.hostname.includes('preview.emergentagent.com');
  
  // Allow bypass in preview environments with specific parameter
  const allowBypass = hasDevBypass && (isPreviewEnvironment || window.location.hostname === 'localhost');

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Development bypass for preview environments
      if (allowBypass) {
        logger.info('Admin bypass enabled for preview environment');
        setIsAdmin(true);
        return;
      }

      if (user) {
        const { data: isAdmin, error } = await supabase.rpc('get_admin_status');
        if (error) {
          logger.error('Admin status check failed:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!isAdmin);
        }
      } else {
        setIsAdmin(null);
      }
    };

    checkAdminStatus();
  }, [user, allowBypass]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if already authenticated and is admin OR bypass enabled
  if ((user && isAdmin) || allowBypass) {
    return <Navigate to={from} replace />;
  }

  // Redirect to regular auth if user is authenticated but not admin
  if (user && isAdmin === false) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {/* Preview environment bypass info */}
        {isPreviewEnvironment && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-sm">
            <p className="text-blue-800">
              <strong>Preview Environment:</strong> Add <code>?bypass=admin</code> to URL for admin access
            </p>
            <p className="text-blue-600 mt-1">
              Example: <code>/admin?bypass=admin</code>
            </p>
          </div>
        )}
        
        {isPreviewEnvironment && allowBypass && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-sm">
            <p className="text-green-800">
              <strong>Admin Bypass Active:</strong> Redirecting to admin dashboard...
            </p>
          </div>
        )}
        
        {isAdminLogin ? (
          <AdminLoginForm onSwitchToRegular={() => setIsAdminLogin(false)} />
        ) : (
          <LoginForm onSwitchToSignUp={() => {}} />
        )}
      </div>
    </div>
  );
};

export default AdminAuth;