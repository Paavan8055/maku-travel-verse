import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTestingPreferences } from '@/hooks/useTestingPreferences';
import { Loader2, Settings } from 'lucide-react';

const TEST_SUITES = [
  { id: 'bot-integration', name: 'Bot Integration Tests' },
  { id: 'dashboard-performance', name: 'Dashboard Performance' },
  { id: 'security-validation', name: 'Security Validation' },
  { id: 'e2e-workflows', name: 'End-to-End Workflows' },
];

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 180, label: '3 hours' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
];

export const TestingPreferencesPanel: React.FC = () => {
  const { preferences, loading, savePreferences } = useTestingPreferences();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Testing Preferences
        </CardTitle>
        <CardDescription>
          Configure automated testing and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-run Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-run">Enable Auto-run Testing</Label>
            <Switch
              id="auto-run"
              checked={preferences.auto_run_enabled}
              onCheckedChange={(checked) => 
                savePreferences({ auto_run_enabled: checked })
              }
            />
          </div>

          {preferences.auto_run_enabled && (
            <div className="space-y-2">
              <Label>Test Interval</Label>
              <Select
                value={preferences.test_interval_minutes.toString()}
                onValueChange={(value) => 
                  savePreferences({ test_interval_minutes: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Test Suite Selection */}
        <div className="space-y-3">
          <Label>Preferred Test Suites</Label>
          <div className="space-y-2">
            {TEST_SUITES.map((suite) => (
              <div key={suite.id} className="flex items-center space-x-2">
                <Checkbox
                  id={suite.id}
                  checked={preferences.preferred_test_suites.includes(suite.id)}
                  onCheckedChange={(checked) => {
                    const updatedSuites = checked
                      ? [...preferences.preferred_test_suites, suite.id]
                      : preferences.preferred_test_suites.filter(id => id !== suite.id);
                    savePreferences({ preferred_test_suites: updatedSuites });
                  }}
                />
                <Label htmlFor={suite.id} className="text-sm">
                  {suite.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-3">
          <Label>Notification Preferences</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email-notifications"
                checked={preferences.notification_preferences.email_enabled}
                onCheckedChange={(checked) =>
                  savePreferences({
                    notification_preferences: {
                      ...preferences.notification_preferences,
                      email_enabled: !!checked,
                    },
                  })
                }
              />
              <Label htmlFor="email-notifications" className="text-sm">
                Email notifications
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="push-notifications"
                checked={preferences.notification_preferences.push_enabled}
                onCheckedChange={(checked) =>
                  savePreferences({
                    notification_preferences: {
                      ...preferences.notification_preferences,
                      push_enabled: !!checked,
                    },
                  })
                }
              />
              <Label htmlFor="push-notifications" className="text-sm">
                Push notifications
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="critical-only"
                checked={preferences.notification_preferences.critical_only}
                onCheckedChange={(checked) =>
                  savePreferences({
                    notification_preferences: {
                      ...preferences.notification_preferences,
                      critical_only: !!checked,
                    },
                  })
                }
              />
              <Label htmlFor="critical-only" className="text-sm">
                Critical failures only
              </Label>
            </div>
          </div>
        </div>

        {/* Failure Threshold */}
        <div className="space-y-2">
          <Label>Failure Threshold</Label>
          <Select
            value={preferences.failure_threshold.toString()}
            onValueChange={(value) => 
              savePreferences({ failure_threshold: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 failure</SelectItem>
              <SelectItem value="2">2 consecutive failures</SelectItem>
              <SelectItem value="3">3 consecutive failures</SelectItem>
              <SelectItem value="5">5 consecutive failures</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};