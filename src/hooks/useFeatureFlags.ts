import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  flag_name: string;
  enabled: boolean;
  rollout_percentage: number;
  target_users: any;
  conditions: any;
  description?: string;
}

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [loading, setLoading] = useState(false);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');

      if (error) throw error;

      const flagsMap = data.reduce((acc, flag) => {
        acc[flag.flag_name] = flag;
        return acc;
      }, {} as Record<string, FeatureFlag>);

      setFlags(flagsMap);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const isEnabled = useCallback((flagName: string, userId?: string): boolean => {
    const flag = flags[flagName];
    if (!flag || !flag.enabled) return false;

    // Check rollout percentage
    if (flag.rollout_percentage < 100) {
      if (!userId) return false;
      
      // Simple hash-based rollout (deterministic)
      const hash = Array.from(userId).reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      const percentage = Math.abs(hash) % 100;
      
      if (percentage >= flag.rollout_percentage) return false;
    }

    // Check target users
    if (Array.isArray(flag.target_users) && flag.target_users.length > 0 && userId) {
      if (!flag.target_users.includes(userId)) return false;
    }

    return true;
  }, [flags]);

  const getValue = useCallback((flagName: string, defaultValue: any = false): any => {
    const flag = flags[flagName];
    if (!flag) return defaultValue;
    
    return flag.conditions?.value !== undefined ? flag.conditions.value : flag.enabled;
  }, [flags]);

  return {
    flags,
    loading,
    loadFlags,
    isEnabled,
    getValue
  };
};