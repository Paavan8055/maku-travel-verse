import React, { useState } from 'react';
import { Plane, Hotel, MapPin, Car, Package, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useUnifiedTravel } from '@/contexts/UnifiedTravelContext';

interface CrossModuleNavigatorProps {
  currentModule: 'flights' | 'hotels' | 'activities' | 'transfers';
  className?: string;
}

interface ModuleInfo {
  id: 'flights' | 'hotels' | 'activities' | 'transfers';
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  estimatedSavings?: number;
  isAvailable: boolean;
}

export const CrossModuleNavigator: React.FC<CrossModuleNavigatorProps> = ({
  currentModule,
  className = ''
}) => {
  const { state, navigateToModule, dispatch, createBundledSearch, isDataComplete } = useUnifiedTravel();
  const [showBundleBuilder, setShowBundleBuilder] = useState(false);

  const modules: ModuleInfo[] = [
    {
      id: 'flights',
      name: 'Flights',
      icon: Plane,
      description: 'Find the best flight deals',
      estimatedSavings: 15,
      isAvailable: true
    },
    {
      id: 'hotels',
      name: 'Hotels',
      icon: Hotel,
      description: 'Comfortable accommodations',
      estimatedSavings: 25,
      isAvailable: isDataComplete()
    },
    {
      id: 'activities',
      name: 'Activities',
      icon: MapPin,
      description: 'Exciting local experiences',
      estimatedSavings: 20,
      isAvailable: isDataComplete()
    },
    {
      id: 'transfers',
      name: 'Transfers',
      icon: Car,
      description: 'Seamless transportation',
      estimatedSavings: 10,
      isAvailable: isDataComplete()
    }
  ];

  const availableModules = modules.filter(module => 
    module.id !== currentModule && module.isAvailable
  );

  const handleModuleNavigation = (moduleId: 'flights' | 'hotels' | 'activities' | 'transfers') => {
    navigateToModule(moduleId, true);
  };

  const handleBundleToggle = (moduleId: string, enabled: boolean) => {
    const bundleKey = `include${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)}` as keyof typeof state.bundlePreferences;
    dispatch({
      type: 'UPDATE_BUNDLE_PREFERENCES',
      payload: { [bundleKey]: enabled }
    });
  };

  const getActiveBundleCount = () => {
    return Object.values(state.bundlePreferences).filter(Boolean).length;
  };

  const calculateTotalSavings = () => {
    return modules
      .filter(module => {
        const bundleKey = `include${module.id.charAt(0).toUpperCase() + module.id.slice(1)}` as keyof typeof state.bundlePreferences;
        return state.bundlePreferences[bundleKey];
      })
      .reduce((total, module) => total + (module.estimatedSavings || 0), 0);
  };

  if (!isDataComplete()) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Complete Your Search</h3>
          <p className="text-sm text-muted-foreground">
            Add destination and dates to explore other travel services
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Explore More Options
            {availableModules.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {availableModules.length} available
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableModules.map((module) => {
              const Icon = module.icon;
              return (
                <Button
                  key={module.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5"
                  onClick={() => handleModuleNavigation(module.id)}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">{module.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {module.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bundle Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundle & Save
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBundleBuilder(!showBundleBuilder)}
            >
              {showBundleBuilder ? 'Hide' : 'Customize'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getActiveBundleCount() > 1 && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">
                  Estimated savings: {calculateTotalSavings()}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Bundle {getActiveBundleCount()} services for maximum savings
              </p>
            </div>
          )}

          {showBundleBuilder ? (
            <div className="space-y-3">
              {modules.map((module) => {
                const Icon = module.icon;
                const bundleKey = `include${module.id.charAt(0).toUpperCase() + module.id.slice(1)}` as keyof typeof state.bundlePreferences;
                const isEnabled = state.bundlePreferences[bundleKey];
                const isCurrentModule = module.id === currentModule;

                return (
                  <div key={module.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="font-medium">{module.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Save up to {module.estimatedSavings}% when bundled
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentModule && (
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      )}
                      <Switch
                        checked={isEnabled || isCurrentModule}
                        disabled={isCurrentModule}
                        onCheckedChange={(checked) => handleBundleToggle(module.id, checked)}
                      />
                    </div>
                  </div>
                );
              })}

              {getActiveBundleCount() > 1 && (
                <Button 
                  onClick={createBundledSearch} 
                  className="w-full mt-4"
                >
                  Create Bundle Search
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Save money by booking multiple services together
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowBundleBuilder(true)}
              >
                Build Your Bundle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions based on current module */}
      {currentModule === 'activities' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Need transportation?</h4>
                <p className="text-sm text-muted-foreground">
                  Book transfers to your activities
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleModuleNavigation('transfers')}
              >
                View Transfers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};