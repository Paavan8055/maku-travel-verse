import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Flag, Users, Percent, RefreshCw, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeatureFlag {
  id: string;
  flag_name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  target_users: any;
  conditions: any;
  created_at: string;
}

export const FeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      toast({
        title: "Failed to load feature flags",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagId: string, enabled: boolean) => {
    setUpdating(prev => ({ ...prev, [flagId]: true }));
    
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('id', flagId);

      if (error) throw error;

      setFlags(prev => prev.map(flag => 
        flag.id === flagId ? { ...flag, enabled } : flag
      ));

      toast({
        title: "Feature flag updated",
        description: `Flag ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      toast({
        title: "Failed to update feature flag",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setUpdating(prev => ({ ...prev, [flagId]: false }));
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feature Flags</h1>
          <p className="text-muted-foreground">Manage feature rollouts and A/B testing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchFlags} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Flag
          </Button>
        </div>
      </div>

      {flags.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feature flags configured</h3>
              <p className="text-muted-foreground mb-4">
                Create your first feature flag to start managing feature rollouts
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Feature Flag
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {flags.map(flag => (
            <Card key={flag.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Flag className="w-5 h-5" />
                      {flag.flag_name}
                    </CardTitle>
                    <CardDescription>{flag.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={flag.enabled ? "default" : "secondary"}>
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`flag-${flag.id}`}
                        checked={flag.enabled}
                        onCheckedChange={(enabled) => toggleFlag(flag.id, enabled)}
                        disabled={updating[flag.id]}
                      />
                      <Label htmlFor={`flag-${flag.id}`}>
                        {updating[flag.id] ? "Updating..." : "Active"}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Rollout: {flag.rollout_percentage}%
                    </span>
                  </div>
                  
                  {flag.target_users && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Targeted users: {Array.isArray(flag.target_users) ? flag.target_users.length : 'Custom'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Created: {new Date(flag.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {flag.conditions && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      <strong>Conditions:</strong> {JSON.stringify(flag.conditions)}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};