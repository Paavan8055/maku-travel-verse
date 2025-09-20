import React, { useState, useEffect } from 'react';
import { MakuLogo, MakuButton, MakuCard } from '@/components/branding/MakuBrandSystem';
import { 
  User, 
  Shield, 
  Briefcase, 
  BarChart3, 
  Settings, 
  Heart, 
  MapPin, 
  Plane, 
  Hotel, 
  Activity,
  Calendar,
  Users,
  Database,
  Zap,
  Brain,
  Globe,
  CreditCard,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  Target,
  Award,
  Star
} from 'lucide-react';

/**
 * CTO Strategic Implementation: Role-Based Dashboard System
 * Comprehensive user experience differentiation for End Users, Partners, and Administrators
 */

export type UserRole = 'end_user' | 'partner' | 'administrator';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  permissions: string[];
  organization?: string;
  tier?: 'basic' | 'premium' | 'enterprise';
}

export interface DashboardConfig {
  role: UserRole;
  features: DashboardFeature[];
  navigation: NavigationItem[];
  widgets: WidgetConfig[];
  branding: BrandingConfig;
}

export interface DashboardFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  permission: string;
  priority: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  subItems?: NavigationItem[];
  badge?: string;
  permission: string;
}

export interface WidgetConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  size: 'sm' | 'md' | 'lg' | 'xl';
  permissions: string[];
  refreshInterval?: number;
}

export interface BrandingConfig {
  primaryColor: string;
  accentColor: string;
  logoVariant: 'full' | 'icon' | 'mascot';
  theme: 'light' | 'dark';
}

// End User Dashboard Configuration
const END_USER_CONFIG: DashboardConfig = {
  role: 'end_user',
  features: [
    {
      id: 'smart_dreams',
      name: 'Smart Dreams',
      description: 'AI-powered travel planning with personalized recommendations',
      icon: <Brain className="h-6 w-6" />,
      path: '/smart-dreams',
      permission: 'user:smart_dreams',
      priority: 1
    },
    {
      id: 'bookings',
      name: 'My Bookings',
      description: 'View and manage your travel bookings',
      icon: <Calendar className="h-6 w-6" />,
      path: '/bookings',
      permission: 'user:bookings',
      priority: 2
    },
    {
      id: 'wishlist',
      name: 'Dream Destinations',
      description: 'Save and organize your favorite destinations',
      icon: <Heart className="h-6 w-6" />,
      path: '/wishlist',
      permission: 'user:wishlist',
      priority: 3
    },
    {
      id: 'achievements',
      name: 'Travel Achievements',
      description: 'Track your travel milestones and badges',
      icon: <Award className="h-6 w-6" />,
      path: '/achievements',
      permission: 'user:achievements',
      priority: 4
    }
  ],
  navigation: [
    {
      id: 'discover',
      label: 'Discover',
      icon: <Search className="h-5 w-5" />,
      path: '/discover',
      permission: 'user:discover',
      subItems: [
        { id: 'hotels', label: 'Hotels', icon: <Hotel className="h-4 w-4" />, path: '/search/hotels', permission: 'user:search' },
        { id: 'flights', label: 'Flights', icon: <Plane className="h-4 w-4" />, path: '/search/flights', permission: 'user:search' },
        { id: 'activities', label: 'Activities', icon: <Activity className="h-4 w-4" />, path: '/search/activities', permission: 'user:search' }
      ]
    },
    {
      id: 'my_trips',
      label: 'My Trips',
      icon: <MapPin className="h-5 w-5" />,
      path: '/trips',
      permission: 'user:trips'
    },
    {
      id: 'smart_dreams',
      label: 'Smart Dreams',
      icon: <Brain className="h-5 w-5" />,
      path: '/smart-dreams',
      permission: 'user:smart_dreams',
      badge: 'AI'
    }
  ],
  widgets: [
    {
      id: 'travel_stats',
      title: 'Travel Statistics',
      component: () => <div>Travel Stats Widget</div>,
      size: 'md',
      permissions: ['user:stats']
    },
    {
      id: 'upcoming_trips',
      title: 'Upcoming Adventures',
      component: () => <div>Upcoming Trips Widget</div>,
      size: 'lg',
      permissions: ['user:trips']
    }
  ],
  branding: {
    primaryColor: '#f97316',
    accentColor: '#22c55e',
    logoVariant: 'full',
    theme: 'light'
  }
};

// Partner Dashboard Configuration
const PARTNER_CONFIG: DashboardConfig = {
  role: 'partner',
  features: [
    {
      id: 'analytics',
      name: 'Business Analytics',
      description: 'Comprehensive analytics and performance insights',
      icon: <BarChart3 className="h-6 w-6" />,
      path: '/partner/analytics',
      permission: 'partner:analytics',
      priority: 1
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Manage your travel inventory and pricing',
      icon: <Database className="h-6 w-6" />,
      path: '/partner/inventory',
      permission: 'partner:inventory',
      priority: 2
    },
    {
      id: 'bookings',
      name: 'Booking Management',
      description: 'Monitor and manage customer bookings',
      icon: <Calendar className="h-6 w-6" />,
      path: '/partner/bookings',
      permission: 'partner:bookings',
      priority: 3
    },
    {
      id: 'api_integration',
      name: 'API Integration',
      description: 'Manage API connections and data synchronization',
      icon: <Zap className="h-6 w-6" />,
      path: '/partner/api',
      permission: 'partner:api',
      priority: 4
    }
  ],
  navigation: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/partner/dashboard',
      permission: 'partner:dashboard'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Database className="h-5 w-5" />,
      path: '/partner/inventory',
      permission: 'partner:inventory',
      subItems: [
        { id: 'hotels', label: 'Hotels', icon: <Hotel className="h-4 w-4" />, path: '/partner/inventory/hotels', permission: 'partner:hotels' },
        { id: 'activities', label: 'Activities', icon: <Activity className="h-4 w-4" />, path: '/partner/inventory/activities', permission: 'partner:activities' }
      ]
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <TrendingUp className="h-5 w-5" />,
      path: '/partner/performance',
      permission: 'partner:performance',
      badge: 'New'
    }
  ],
  widgets: [
    {
      id: 'revenue_chart',
      title: 'Revenue Analytics',
      component: () => <div>Revenue Chart Widget</div>,
      size: 'xl',
      permissions: ['partner:revenue']
    },
    {
      id: 'booking_trends',
      title: 'Booking Trends',
      component: () => <div>Booking Trends Widget</div>,
      size: 'lg',
      permissions: ['partner:analytics']
    }
  ],
  branding: {
    primaryColor: '#3b82f6',
    accentColor: '#f97316',
    logoVariant: 'full',
    theme: 'light'
  }
};

// Administrator Dashboard Configuration
const ADMIN_CONFIG: DashboardConfig = {
  role: 'administrator',
  features: [
    {
      id: 'system_monitoring',
      name: 'System Monitoring',
      description: 'Monitor platform health and performance',
      icon: <Activity className="h-6 w-6" />,
      path: '/admin/monitoring',
      permission: 'admin:monitoring',
      priority: 1
    },
    {
      id: 'provider_management',
      name: 'Provider Management',
      description: 'Manage travel providers and integrations',
      icon: <Globe className="h-6 w-6" />,
      path: '/admin/smart-dreams',
      permission: 'admin:providers',
      priority: 2
    },
    {
      id: 'user_management',
      name: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <Users className="h-6 w-6" />,
      path: '/admin/users',
      permission: 'admin:users',
      priority: 3
    },
    {
      id: 'security_audit',
      name: 'Security & Audit',
      description: 'Security monitoring and audit trails',
      icon: <Shield className="h-6 w-6" />,
      path: '/admin/security',
      permission: 'admin:security',
      priority: 4
    }
  ],
  navigation: [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/admin/overview',
      permission: 'admin:overview'
    },
    {
      id: 'smart_dreams_mgmt',
      label: 'Smart Dreams',
      icon: <Brain className="h-5 w-5" />,
      path: '/admin/smart-dreams',
      permission: 'admin:smart_dreams',
      badge: 'Active'
    },
    {
      id: 'system',
      label: 'System',
      icon: <Settings className="h-5 w-5" />,
      path: '/admin/system',
      permission: 'admin:system',
      subItems: [
        { id: 'providers', label: 'Provider Management', icon: <Globe className="h-4 w-4" />, path: '/admin/providers', permission: 'admin:providers' },
        { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" />, path: '/admin/security', permission: 'admin:security' },
        { id: 'audit', label: 'Audit Logs', icon: <Database className="h-4 w-4" />, path: '/admin/audit', permission: 'admin:audit' }
      ]
    }
  ],
  widgets: [
    {
      id: 'system_health',
      title: 'System Health',
      component: () => <div>System Health Widget</div>,
      size: 'lg',
      permissions: ['admin:monitoring']
    },
    {
      id: 'provider_status',
      title: 'Provider Status',
      component: () => <div>Provider Status Widget</div>,
      size: 'md',
      permissions: ['admin:providers']
    }
  ],
  branding: {
    primaryColor: '#dc2626',
    accentColor: '#f97316',
    logoVariant: 'full',
    theme: 'light'
  }
};

// Main Role-Based Dashboard Component
export const MakuRoleBasedDashboard: React.FC<{
  userProfile: UserProfile;
  children?: React.ReactNode;
}> = ({ userProfile, children }) => {
  const [config, setConfig] = useState<DashboardConfig | null>(null);

  useEffect(() => {
    switch (userProfile.role) {
      case 'end_user':
        setConfig(END_USER_CONFIG);
        break;
      case 'partner':
        setConfig(PARTNER_CONFIG);
        break;
      case 'administrator':
        setConfig(ADMIN_CONFIG);
        break;
      default:
        setConfig(END_USER_CONFIG);
    }
  }, [userProfile.role]);

  if (!config) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Role-Based Header */}
      <div className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MakuLogo size="md" variant={config.branding.logoVariant} theme={config.branding.theme} context="header" />
              <div className="hidden md:block">
                <h1 className="text-xl font-semibold text-gray-800">
                  {userProfile.role === 'end_user' ? 'My Travel Hub' : 
                   userProfile.role === 'partner' ? 'Partner Portal' : 
                   'Admin Console'}
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {userProfile.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  userProfile.role === 'administrator' ? 'bg-red-400' :
                  userProfile.role === 'partner' ? 'bg-blue-400' : 'bg-green-400'
                }`}></div>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {userProfile.role.replace('_', ' ')}
                </span>
              </div>
              <Bell className="h-5 w-5 text-gray-400" />
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Based Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {config.features.map((feature) => (
            <MakuCard key={feature.id} variant="elevated" className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center space-x-4">
                <div className={`
                  p-3 rounded-xl transition-all duration-300 group-hover:scale-110
                  ${userProfile.role === 'administrator' ? 'bg-red-100 text-red-600' :
                    userProfile.role === 'partner' ? 'bg-blue-100 text-blue-600' : 
                    'bg-orange-100 text-orange-600'}
                `}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{feature.name}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </MakuCard>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="space-y-6">
          {children}
          
          {/* Role-Specific Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {config.widgets.map((widget) => (
              <MakuCard key={widget.id} variant="default" className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{widget.title}</h3>
                <widget.component />
              </MakuCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakuRoleBasedDashboard;