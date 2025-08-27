
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Settings, Users, Percent } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function FeatureFlagsPage() {
  const { flags, loading, loadFlags } = useFeatureFlags();
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const updateFlag = async (flagName: string, updates: Partial<any>) => {
    setUpdating(flagName);
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update(updates)
        .eq('flag_name', flagName);

      if (error) throw error;

      toast({
        title: "Flag Updated",
        description: `${flagName} has been updated successfully`,
      });

      await loadFlags();
    } catch (error) {
      console.error('Failed to update flag:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update feature flag",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Feature Flags</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Flags</h2>
          <p className="text-muted-foreground">
            Control feature rollouts and experimental functionality
          </p>
        </div>
        <Button onClick={loadFlags} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {Object.entries(flags).map(([flagName, flag]) => (
          <Card key={flagName}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{flag.flag_name}</CardTitle>
                  {flag.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {flag.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(enabled) => updateFlag(flagName, { enabled })}
                    disabled={updating === flagName}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rollout Percentage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Rollout Percentage
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {flag.rollout_percentage}%
                  </span>
                </div>
                <Slider
                  value={[flag.rollout_percentage]}
                  onValueChange={([value]) => 
                    updateFlag(flagName, { rollout_percentage: value })
                  }
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={updating === flagName}
                />
              </div>

              {/* Target Users */}
              {Array.isArray(flag.target_users) && flag.target_users.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Target Users
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {flag.target_users.map((userId: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {userId.slice(0, 8)}...
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditions */}
              {flag.conditions && Object.keys(flag.conditions).length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Conditions
                  </label>
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(flag.conditions, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(flags).length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No feature flags found</p>
            <Button 
              onClick={loadFlags} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
