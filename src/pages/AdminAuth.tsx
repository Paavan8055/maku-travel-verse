import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AdminAuth = () => {
  const { user, loading } = useAuth();
  const [isAdminLogin, setIsAdminLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const location = useLocation();

  // Get the intended destination after login
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data: isAdmin, error } = await supabase.rpc('get_admin_status');
        if (error) {
          console.error('Admin status check failed:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!isAdmin);
        }
      } else {
        setIsAdmin(null);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if already authenticated and is admin
  if (user && isAdmin) {
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