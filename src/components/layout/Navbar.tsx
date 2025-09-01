import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Building, MapPin, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProviderHealthBadge } from '@/components/ui/ProviderHealthBadge';
import { useProviderHealth } from '@/hooks/useProviderHealth';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { providerHealth, isLoading, getOverallHealth } = useProviderHealth();

  const navigationItems = [
    { path: '/flights', label: 'Flights', icon: Plane },
    { path: '/hotels', label: 'Hotels', icon: Building },
    { path: '/activities', label: 'Activities', icon: MapPin },
  ];

  const overallHealth = getOverallHealth();

  const getHealthProviders = (searchType: 'flight' | 'hotel' | 'activity') => {
    const providerMap = {
      flight: ['sabre-flight', 'amadeus-flight'],
      hotel: ['hotelbeds-hotel', 'sabre-hotel'],
      activity: ['hotelbeds-activity', 'sabre-activity', 'amadeus-activity']
    };

    // Add null check to prevent TypeError
    if (!providerHealth) {
      return [];
    }

    return providerHealth.filter(p => 
      p && p.provider && providerMap[searchType].includes(p.provider)
    ).slice(0, 2); // Show top 2 providers
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              MAKU.Travel
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const searchType = item.path.substring(1) as 'flight' | 'hotel' | 'activity';
              const providers = getHealthProviders(searchType);

              return (
                <div key={item.path} className="relative group">
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                  
                  {/* Provider Health Tooltip */}
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-64">
                    <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                      Provider Status
                    </div>
                    <div className="space-y-2">
                      {providers.length > 0 ? (
                        providers.map((provider) => (
                          <ProviderHealthBadge
                            key={provider.provider}
                            provider={provider.provider.split('-')[0].toUpperCase()}
                            status={provider.status}
                            responseTime={provider.responseTime}
                            className="mr-2"
                          />
                        ))
                      ) : (
                        <div className="text-xs text-gray-500">
                          No provider data available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* System Health Badge */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                System Status:
              </span>
              <ProviderHealthBadge
                provider="Overall"
                status={overallHealth}
                className="text-xs"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const searchType = item.path.substring(1) as 'flight' | 'hotel' | 'activity';
                const providers = getHealthProviders(searchType);

                return (
                  <div key={item.path} className="space-y-2">
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                    
                    {/* Mobile Provider Status */}
                    <div className="px-4 pb-2">
                      <div className="flex flex-wrap gap-2">
                        {providers.map((provider) => (
                          <ProviderHealthBadge
                            key={provider.provider}
                            provider={provider.provider.split('-')[0].toUpperCase()}
                            status={provider.status}
                            responseTime={provider.responseTime}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Mobile System Status */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    System Status
                  </span>
                  <ProviderHealthBadge
                    provider="Overall"
                    status={overallHealth}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};