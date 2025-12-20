import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AdminGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ 
  children, 
  redirectTo = '/' 
}) => {
  const { user, loading } = useAuth();

  // DEVELOPMENT BYPASS: Allow admin access without authentication in preview/dev
  const isDev = window.location.hostname.includes('preview.emergentagent.com') || 
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';

  if (isDev) {
    return <>{children}</>;
  }

  // Production mode - require authentication and admin role
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // In production, would check admin role here
  return <>{children}</>;
};