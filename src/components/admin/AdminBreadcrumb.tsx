import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbMapping {
  [key: string]: string;
}

const breadcrumbMapping: BreadcrumbMapping = {
  'admin': 'Admin',
  'dashboard': 'Dashboard',
  'monitoring': 'Monitoring',
  'operations': 'Operations',
  'security': 'Security',
  'settings': 'Settings',
  'health': 'System Health',
  'providers': 'Provider Status',
  'correlation': 'Correlation Tracking',
  'quotas': 'Quota Management',
  'logs': 'Performance Logs',
  'bookings': 'Booking Management',
  'users': 'User Management',
  'testing': 'Test Suite',
  'search': 'Search Analytics',
  'access': 'Access Control',
  'audit': 'Audit Logs',
  'compliance': 'Compliance Status',
  'features': 'Feature Flags',
  'environment': 'Environment Config',
  'realtime': 'Real-time Metrics',
  'alerts': 'Critical Alerts',
  'deployment-test': 'Deployment Test',
};

export const AdminBreadcrumb: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Remove the first 'admin' segment since we're already in admin context
  const adminSegments = pathSegments.slice(1);

  if (adminSegments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Admin Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Admin
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {adminSegments.map((segment, index) => {
          const isLast = index === adminSegments.length - 1;
          const path = `/admin/${adminSegments.slice(0, index + 1).join('/')}`;
          const displayName = breadcrumbMapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={path}>{displayName}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};