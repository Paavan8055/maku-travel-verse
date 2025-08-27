
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLocation } from 'react-router-dom';

export const AdminBreadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbMap: Record<string, string> = {
    admin: 'Admin',
    dashboard: 'Dashboard',
    settings: 'Settings',
    features: 'Feature Flags',
    environment: 'Environment Config',
    monitoring: 'Monitoring',
    performance: 'Performance',
    operations: 'Operations',
    users: 'User Management',
    security: 'Security',
    access: 'Access Control'
  };

  const generateBreadcrumbs = () => {
    const breadcrumbs = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      const displayName = breadcrumbMap[segment] || segment;

      if (isLast) {
        breadcrumbs.push(
          <BreadcrumbItem key={segment}>
            <BreadcrumbPage>{displayName}</BreadcrumbPage>
          </BreadcrumbItem>
        );
      } else {
        breadcrumbs.push(
          <BreadcrumbItem key={segment}>
            <BreadcrumbLink href={currentPath}>
              {displayName}
            </BreadcrumbLink>
          </BreadcrumbItem>
        );
        
        if (index < pathSegments.length - 1) {
          breadcrumbs.push(
            <BreadcrumbSeparator key={`separator-${index}`} />
          );
        }
      }
    });

    return breadcrumbs;
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {generateBreadcrumbs()}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
