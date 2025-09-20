/**
 * Role-based Access Control Components for MAKU.Travel
 * 
 * Provides secure route protection and role-based UI rendering.
 * Integrates with Supabase RLS policies for defense-in-depth security.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

export type UserRole = 'admin' | 'partner' | 'user';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

interface RolePermissions {
  canAccessAdmin: boolean;
  canAccessDebug: boolean;
  canAccessPartner: boolean;
  canViewMetrics: boolean;
  canManageUsers: boolean;
  userRole: UserRole | null;
}

/**
 * Hook to check user roles and permissions
 */
export const useUserRole = () => {
  const [permissions, setPermissions] = useState<RolePermissions>({
    canAccessAdmin: false,
    canAccessDebug: false,
    canAccessPartner: false,
    canViewMetrics: false,
    canManageUsers: false,
    userRole: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPermissions({
          canAccessAdmin: false,
          canAccessDebug: false,
          canAccessPartner: false,
          canViewMetrics: false,
          canManageUsers: false,
          userRole: null
        });
        setLoading(false);
        return;
      }

      // Check if user is admin using the secure function
      const { data: isAdmin } = await supabase.rpc('get_admin_status');
      
      // Check if user has partner role
      const { data: hasPartnerRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'partner'
      });

      const userRole: UserRole = isAdmin ? 'admin' : hasPartnerRole ? 'partner' : 'user';

      setPermissions({
        canAccessAdmin: isAdmin,
        canAccessDebug: isAdmin,
        canAccessPartner: hasPartnerRole || isAdmin,
        canViewMetrics: isAdmin,
        canManageUsers: isAdmin,
        userRole
      });

    } catch (error) {
      logger.error('Role check failed:', error);
      setPermissions({
        canAccessAdmin: false,
        canAccessDebug: false,
        canAccessPartner: false,
        canViewMetrics: false,
        canManageUsers: false,
        userRole: null
      });
    } finally {
      setLoading(false);
    }
  };

  return { permissions, loading, refetch: checkUserRole };
};

/**
 * Role Guard Component
 * Protects routes based on user roles with fallback handling
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  fallbackPath = '/',
  showAccessDenied = true
}) => {
  const { permissions, loading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [accessDeniedShown, setAccessDeniedShown] = useState(false);

  // Check for bypass parameter in preview environments
  const urlParams = new URLSearchParams(window.location.search);
  const hasAdminBypass = urlParams.get('bypass') === 'admin';
  const isPreviewEnvironment = window.location.hostname.includes('preview.emergentagent.com');
  const isDevelopmentEnvironment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const allowBypass = hasAdminBypass && (isPreviewEnvironment || isDevelopmentEnvironment) && requiredRole === 'admin';

  useEffect(() => {
    if (loading) return;

    const hasAccess = checkRoleAccess(permissions, requiredRole) || allowBypass;

    if (!hasAccess) {
      // Log access attempt for security monitoring
      logAccessAttempt(location.pathname, requiredRole, false);

      if (showAccessDenied && !accessDeniedShown) {
        toast({
          title: "Access Denied",
          description: `You need ${requiredRole} privileges to access this page.`,
          variant: "destructive"
        });
        setAccessDeniedShown(true);
      }

      // Redirect to fallback path
      navigate(fallbackPath, { replace: true });
    } else {
      // Log successful access (including bypass)
      logAccessAttempt(location.pathname, requiredRole, true);
      if (allowBypass) {
        logger.info(`Admin bypass enabled for ${location.pathname}`);
      }
    }
  }, [loading, permissions, requiredRole, navigate, fallbackPath, showAccessDenied, location.pathname, toast, accessDeniedShown, allowBypass]);

  // If user doesn't have access and no bypass, show loading or deny access
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has required access
  const hasAccess = checkRoleAccess(permissions, requiredRole) || allowBypass;

  if (!hasAccess) {
    return null; // Component will redirect via useEffect
  }

  return <>{children}</>;
};

/**
 * Admin Guard Component (legacy compatibility)
 */
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleGuard requiredRole="admin" fallbackPath="/admin">
      {children}
    </RoleGuard>
  );
};

/**
 * Partner Guard Component
 */
export const PartnerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleGuard requiredRole="partner" fallbackPath="/partner/login">
      {children}
    </RoleGuard>
  );
};

/**
 * Debug Guard Component
 */
export const DebugGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleGuard requiredRole="admin" fallbackPath="/" showAccessDenied={false}>
      {children}
    </RoleGuard>
  );
};

/**
 * Role-based Content Renderer
 */
interface RoleContentProps {
  role: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleContent: React.FC<RoleContentProps> = ({ role, children, fallback = null }) => {
  const { permissions, loading } = useUserRole();

  if (loading) {
    return <div className="animate-pulse bg-muted h-4 w-full rounded"></div>;
  }

  const hasAccess = checkRoleAccess(permissions, role);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Check if user has required role access
 */
function checkRoleAccess(permissions: RolePermissions, requiredRole: UserRole): boolean {
  switch (requiredRole) {
    case 'admin':
      return permissions.canAccessAdmin;
    case 'partner':
      return permissions.canAccessPartner;
    case 'user':
      return true; // All authenticated users are users
    default:
      return false;
  }
}

/**
 * Log access attempts for security monitoring
 */
async function logAccessAttempt(path: string, requiredRole: UserRole, success: boolean) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.rpc('log_admin_access_attempt', {
      _user_id: user?.id || null,
      _action: `access_${path.replace(/\//g, '_')}_${requiredRole}`,
      _success: success
    });
  } catch (error) {
    logger.warn('Failed to log access attempt:', error);
  }
}

export default RoleGuard;