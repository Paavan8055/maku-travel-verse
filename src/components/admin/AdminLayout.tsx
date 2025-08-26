import React from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { LayoutDashboard, Activity, Users, BookOpen, Shield, Settings, Eye, BarChart3, Database, FileText, UserCheck, AlertTriangle, Lock, TestTube, Search, Bell, User, Briefcase, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AdminBreadcrumb } from './AdminBreadcrumb';
const adminMenuItems = [{
  category: 'Dashboard',
  icon: LayoutDashboard,
  items: [{
    title: 'Overview',
    url: '/admin/dashboard',
    icon: LayoutDashboard
  }, {
    title: 'Real-time Metrics',
    url: '/admin/dashboard/realtime',
    icon: Activity
  }, {
    title: 'Critical Alerts',
    url: '/admin/dashboard/alerts',
    icon: AlertTriangle
  }]
}, {
  category: 'Monitoring',
  icon: Eye,
  items: [{
    title: 'System Health',
    url: '/admin/monitoring/health',
    icon: Activity
  }, {
    title: 'Provider Status',
    url: '/admin/monitoring/providers',
    icon: Database
  }, {
    title: 'Quota Management',
    url: '/admin/monitoring/quotas',
    icon: Gauge
  }, {
    title: 'Performance Logs',
    url: '/admin/monitoring/logs',
    icon: FileText
  }, {
    title: 'Correlation Tracking',
    url: '/admin/monitoring/correlation',
    icon: BarChart3
  }]
}, {
  category: 'Operations',
  icon: Briefcase,
  items: [{
    title: 'Booking Management',
    url: '/admin/operations/bookings',
    icon: BookOpen
  }, {
    title: 'User Management',
    url: '/admin/operations/users',
    icon: Users
  }, {
    title: 'Test Suite',
    url: '/admin/operations/testing',
    icon: TestTube
  }, {
    title: 'System Diagnostics',
    url: '/admin/diagnostics',
    icon: Activity
  }, {
    title: 'Search Analytics',
    url: '/admin/operations/search',
    icon: Search
  }]
}, {
  category: 'Security',
  icon: Shield,
  items: [{
    title: 'Access Control',
    url: '/admin/security/access',
    icon: Lock
  }, {
    title: 'Audit Logs',
    url: '/admin/security/audit',
    icon: FileText
  }, {
    title: 'Compliance Status',
    url: '/admin/security/compliance',
    icon: UserCheck
  }]
}, {
  category: 'Settings',
  icon: Settings,
  items: [{
    title: 'Provider Configuration',
    url: '/admin/settings/providers',
    icon: Database
  }, {
    title: 'Feature Flags',
    url: '/admin/settings/features',
    icon: Settings
  }, {
    title: 'Environment Config',
    url: '/admin/settings/environment',
    icon: Settings
  }]
}];
export const AdminSidebar: React.FC = () => {
  const {
    state,
    isMobile
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const isActive = (path: string) => currentPath === path;
  const isGroupExpanded = (items: any[]) => items.some(item => isActive(item.url));
  return <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        {adminMenuItems.map(group => <SidebarGroup key={group.category}>
            <SidebarGroupLabel className="flex items-center gap-2">
              <group.icon className="h-4 w-4" />
              {!collapsed && <span>{group.category}</span>}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={({
                  isActive
                }) => `flex items-center gap-3 ${isActive ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'}`}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-yellow-500">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>)}
      </SidebarContent>
    </Sidebar>;
};
export const AdminHeader: React.FC = () => {
  const {
    user
  } = useAuth();
  return <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">MAKU Admin</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search admin features..." className="pl-9 w-64" />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.email || 'Admin User'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Admin Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>;
};
export const AdminLayout: React.FC = () => {
  return <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <div className="px-6 py-3 border-b bg-background">
            <AdminBreadcrumb />
          </div>
          <main className="flex-1 p-6 bg-muted/5">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>;
};