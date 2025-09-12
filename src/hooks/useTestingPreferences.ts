import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface TestingPreferences {
  auto_run_enabled: boolean;
  test_interval_minutes: number;
  notification_preferences: {
    email_enabled: boolean;
    push_enabled: boolean;
    critical_only: boolean;
  };
  preferred_test_suites: string[];
  failure_threshold: number;
}

const DEFAULT_PREFERENCES: TestingPreferences = {
  auto_run_enabled: false,
  test_interval_minutes: 30,
  notification_preferences: {
    email_enabled: true,
    push_enabled: false,
    critical_only: true,
  },
  preferred_test_suites: ['bot-integration', 'dashboard-performance'],
  failure_threshold: 3,
};

export const useTestingPreferences = () => {
  const [preferences, setPreferences] = useState<TestingPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('communication_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.preferences && typeof data.preferences === 'object' && (data.preferences as any).testing) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...(data.preferences as any).testing });
      }
    } catch (error) {
      console.error('Error loading testing preferences:', error);
      toast({
        title: "Error loading preferences",
        description: "Using default settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<TestingPreferences>) => {
    if (!user) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      // Get existing preferences
      const { data: existing } = await supabase
        .from('communication_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      const currentPrefs = (existing?.preferences && typeof existing.preferences === 'object') 
        ? existing.preferences as Record<string, any> 
        : {};
      
      const { error } = await supabase
        .from('communication_preferences')
        .upsert({
          user_id: user.id,
          preferences: {
            ...currentPrefs,
            testing: updatedPreferences,
          },
        });

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Testing preferences updated successfully",
      });
    } catch (error) {
      console.error('Error saving testing preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user]);

  return {
    preferences,
    loading,
    savePreferences,
    reload: loadPreferences,
  };
};