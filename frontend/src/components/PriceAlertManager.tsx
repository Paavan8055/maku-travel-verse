import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bell, TrendingDown, TrendingUp, Trash2, Plus, MapPin, Calendar, Users } from 'lucide-react';

interface PriceAlert {
  id: string;
  search_criteria: {
    type: 'flight' | 'hotel' | 'activity';
    origin?: string;
    destination: string;
    dates: { start: string; end?: string };
    passengers?: number;
    rooms?: number;
  };
  target_price: number;
  current_price: number;
  threshold_percentage: number;
  is_active: boolean;
  notification_method: 'email' | 'push' | 'both';
  created_at: string;
  last_checked?: string;
  last_triggered?: string;
}

export const PriceAlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [hasShownError, setHasShownError] = useState(false);
  const [newAlert, setNewAlert] = useState<{
    type: 'flight' | 'hotel' | 'activity';
    destination: string;
    origin: string;
    startDate: string;
    endDate: string;
    passengers: number;
    rooms: number;
    targetPrice: number;
    threshold: number;
    notificationMethod: 'email' | 'push' | 'both';
  }>({
    type: 'hotel',
    destination: '',
    origin: '',
    startDate: '',
    endDate: '',
    passengers: 2,
    rooms: 1,
    targetPrice: 0,
    threshold: 10,
    notificationMethod: 'email'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUserAlerts();
  }, []); // Empty dependency array - runs once

  const loadUserAlerts = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Don't show toast if not authenticated - just return silently
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('price-alert-manager', {
        body: { action: 'get_alerts' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.warn('Price alert service not available:', error.message);
        setServiceAvailable(false);
        
        // Show error toast only once
        if (!hasShownError) {
          setHasShownError(true);
          // Don't show error toast for missing edge function
          // toast({
          //   title: "Price Alerts",
          //   description: "Price alert service is currently unavailable",
          //   variant: "default"
          // });
        }
        setAlerts([]); // Use empty array as fallback
      } else {
        setServiceAvailable(true);
        setAlerts(data?.alerts || []);
      }
    } catch (error: any) {
      console.warn('Price alert feature not configured:', error?.message);
      setServiceAvailable(false);
      setAlerts([]); // Use empty array as fallback
      
      // Don't spam user with error toasts
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!serviceAvailable) {
      toast({
        title: "Service Unavailable",
        description: "Price alert service is currently being set up",
        variant: "default"
      });
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const alertData = {
        search_criteria: {
          type: newAlert.type,
          destination: newAlert.destination,
          origin: newAlert.origin || undefined,
          dates: {
            start: newAlert.startDate,
            end: newAlert.endDate || undefined
          },
          passengers: newAlert.passengers,
          rooms: newAlert.rooms
        },
        target_price: newAlert.targetPrice,
        current_price: newAlert.targetPrice, // Initial price
        threshold_percentage: newAlert.threshold,
        notification_method: newAlert.notificationMethod
      };

      const { data, error } = await supabase.functions.invoke('price-alert-manager', {
        body: { action: 'create_alert', ...alertData },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.warn('Failed to create alert:', error.message);
        // Don't show error toast
      } else {
        toast({
          title: "Alert Created",
          description: "Your price alert has been set up successfully",
        });
        setShowCreateForm(false);
        loadUserAlerts();
        resetForm();
      }
    } catch (error: any) {
      console.warn('Alert creation error:', error?.message);
      // Silently fail - service not configured
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke('price-alert-manager', {
        body: { 
          action: 'update_alert', 
          alert_id: alertId, 
          updates: { is_active: isActive } 
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error('Failed to update alert:', error);
        toast({
          title: "Error",
          description: "Failed to update alert status",
          variant: "destructive"
        });
      } else {
        toast({
          title: isActive ? "Alert Activated" : "Alert Paused",
          description: `Price monitoring has been ${isActive ? 'enabled' : 'disabled'}`,
        });
        loadUserAlerts();
      }
    } catch (error) {
      console.error('Alert toggle error:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke('price-alert-manager', {
        body: { action: 'delete_alert', alert_id: alertId },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error('Failed to delete alert:', error);
        toast({
          title: "Error",
          description: "Failed to delete price alert",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Alert Deleted",
          description: "Price alert has been removed",
        });
        loadUserAlerts();
      }
    } catch (error) {
      console.error('Alert deletion error:', error);
    }
  };

  const resetForm = () => {
    setNewAlert({
      type: 'hotel',
      destination: '',
      origin: '',
      startDate: '',
      endDate: '',
      passengers: 2,
      rooms: 1,
      targetPrice: 0,
      threshold: 10,
      notificationMethod: 'email'
    });
  };

  const formatCriteria = (criteria: PriceAlert['search_criteria']) => {
    const parts = [];
    if (criteria.origin) parts.push(`${criteria.origin} →`);
    parts.push(criteria.destination);
    if (criteria.dates.end) {
      parts.push(`${criteria.dates.start} to ${criteria.dates.end}`);
    } else {
      parts.push(criteria.dates.start);
    }
    if (criteria.passengers) parts.push(`${criteria.passengers} passengers`);
    if (criteria.rooms) parts.push(`${criteria.rooms} rooms`);
    return parts.join(' • ');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If service is not available, show coming soon message
  if (!serviceAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              Price alert monitoring is currently being set up. This feature will be available soon!
            </p>
            <Badge variant="secondary">In Development</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Price Alerts ({alerts.length})
            </CardTitle>
            <Button onClick={() => setShowCreateForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Price Alerts</h3>
              <p className="text-muted-foreground mb-4">
                Set up alerts to get notified when prices drop for your searches
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Your First Alert
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {alert.search_criteria.type}
                        </Badge>
                        <Badge variant={alert.is_active ? "default" : "secondary"}>
                          {alert.is_active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCriteria(alert.search_criteria)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <span>Target: ${alert.target_price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span>Current: ${alert.current_price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-yellow-600" />
                      <span>±{alert.threshold_percentage}% threshold</span>
                    </div>
                  </div>

                  {alert.last_checked && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last checked: {new Date(alert.last_checked).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Price Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Travel Type</Label>
                <Select value={newAlert.type} onValueChange={(value: any) => setNewAlert({...newAlert, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Destination</Label>
                <Input
                  placeholder="e.g., Sydney, Melbourne, Paris"
                  value={newAlert.destination}
                  onChange={(e) => setNewAlert({...newAlert, destination: e.target.value})}
                />
              </div>

              {newAlert.type === 'flight' && (
                <div>
                  <Label>Origin</Label>
                  <Input
                    placeholder="e.g., SYD, MEL, NYC"
                    value={newAlert.origin}
                    onChange={(e) => setNewAlert({...newAlert, origin: e.target.value})}
                  />
                </div>
              )}

              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newAlert.startDate}
                  onChange={(e) => setNewAlert({...newAlert, startDate: e.target.value})}
                />
              </div>

              {(newAlert.type === 'hotel' || newAlert.type === 'activity') && (
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newAlert.endDate}
                    onChange={(e) => setNewAlert({...newAlert, endDate: e.target.value})}
                  />
                </div>
              )}

              <div>
                <Label>Target Price ($)</Label>
                <Input
                  type="number"
                  placeholder="200"
                  value={newAlert.targetPrice || ''}
                  onChange={(e) => setNewAlert({...newAlert, targetPrice: Number(e.target.value)})}
                />
              </div>

              <div>
                <Label>Alert Threshold (%)</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert({...newAlert, threshold: Number(e.target.value)})}
                />
              </div>

              <div>
                <Label>Notification Method</Label>
                <Select value={newAlert.notificationMethod} onValueChange={(value: any) => setNewAlert({...newAlert, notificationMethod: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={createAlert} disabled={!newAlert.destination || !newAlert.targetPrice}>
                Create Alert
              </Button>
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};