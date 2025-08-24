import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Settings,
  Save
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  booking_confirmations: boolean;
  status_updates: boolean;
  marketing_emails: boolean;
  price_alerts: boolean;
  check_in_reminders: boolean;
  travel_tips: boolean;
  security_alerts: boolean;
}

interface CommunicationSettings {
  id?: string;
  user_id: string;
  preferences: NotificationPreferences;
  email_frequency: 'immediate' | 'daily' | 'weekly';
  timezone: string;
  language: string;
  updated_at?: string;
}

export const CommunicationPreferences: React.FC = () => {
  const [settings, setSettings] = useState<CommunicationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('communication_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default preferences
        const defaultSettings: CommunicationSettings = {
          user_id: user.id,
          preferences: {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            booking_confirmations: true,
            status_updates: true,
            marketing_emails: false,
            price_alerts: true,
            check_in_reminders: true,
            travel_tips: false,
            security_alerts: true
          },
          email_frequency: 'immediate',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: 'en'
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load communication preferences',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    if (!settings) return;

    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [key]: value
      }
    });
  };

  const updateEmailFrequency = (frequency: 'immediate' | 'daily' | 'weekly') => {
    if (!settings) return;

    setSettings({
      ...settings,
      email_frequency: frequency
    });
  };

  const savePreferences = async () => {
    if (!settings || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('communication_preferences')
        .upsert({
          ...settings,
          user_id: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Preferences Saved',
        description: 'Your communication preferences have been updated successfully.'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreference('push_notifications', true);
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive push notifications for important updates.'
        });
      }
    }
  };

  if (loading || !settings) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Channels */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notification Channels
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.preferences.email_notifications}
                  onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Real-time browser notifications
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!settings.preferences.push_notifications && 'Notification' in window && (
                    <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
                      Enable
                    </Button>
                  )}
                  <Switch
                    id="push-notifications"
                    checked={settings.preferences.push_notifications}
                    onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Text messages for urgent updates
                    </p>
                  </div>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.preferences.sms_notifications}
                  onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              What to Notify About
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  key: 'booking_confirmations' as const,
                  label: 'Booking Confirmations',
                  description: 'When bookings are confirmed'
                },
                {
                  key: 'status_updates' as const,
                  label: 'Status Updates',
                  description: 'Flight delays, hotel changes, etc.'
                },
                {
                  key: 'price_alerts' as const,
                  label: 'Price Alerts',
                  description: 'Price drops for saved items'
                },
                {
                  key: 'check_in_reminders' as const,
                  label: 'Check-in Reminders',
                  description: '24 hours before check-in'
                },
                {
                  key: 'security_alerts' as const,
                  label: 'Security Alerts',
                  description: 'Important account security updates'
                },
                {
                  key: 'marketing_emails' as const,
                  label: 'Marketing Emails',
                  description: 'Deals, promotions, and news'
                },
                {
                  key: 'travel_tips' as const,
                  label: 'Travel Tips',
                  description: 'Destination guides and tips'
                }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label htmlFor={item.key}>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    id={item.key}
                    checked={settings.preferences[item.key]}
                    onCheckedChange={(checked) => updatePreference(item.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Email Frequency */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Email Frequency</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'immediate' as const, label: 'Immediate' },
                { value: 'daily' as const, label: 'Daily Digest' },
                { value: 'weekly' as const, label: 'Weekly Summary' }
              ].map((freq) => (
                <Button
                  key={freq.value}
                  variant={settings.email_frequency === freq.value ? 'default' : 'outline'}
                  onClick={() => updateEmailFrequency(freq.value)}
                  className="w-full"
                >
                  {freq.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={savePreferences} 
              disabled={saving}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};