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

  // Development bypass - check for development environment
  const isDevelopment = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';
  const urlParams = new URLSearchParams(window.location.search);
  const hasDevBypass = urlParams.get('dev') === 'true';

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Development bypass
      if (isDevelopment && hasDevBypass) {
        logger.info('Development admin bypass enabled');
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
  }, [user, isDevelopment, hasDevBypass]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if already authenticated and is admin OR development bypass
  if ((user && isAdmin) || (isDevelopment && hasDevBypass)) {
    return <Navigate to={from} replace />;
  }

  // Redirect to regular auth if user is authenticated but not admin
  if (user && isAdmin === false) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
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