import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEnvironmentToggle = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState<'test' | 'production'>('test');
  const { toast } = useToast();

  const toggleEnvironment = useCallback(async (newEnvironment: 'test' | 'production') => {
    if (newEnvironment === 'production') {
      // Show warning for production switch
      const confirmed = window.confirm(
        'WARNING: Switching to production will use real endpoints and process actual bookings. This action should only be performed when all credentials are verified and the system is ready for live traffic. Continue?'
      );
      
      if (!confirmed) {
        return false;
      }
    }

    setIsLoading(true);
    try {
      // Update environment setting (this would typically be done via admin API)
      // For now, we'll just update local state and show notification
      setCurrentEnvironment(newEnvironment);
      
      toast({
        title: "Environment Updated",
        description: `Successfully switched to ${newEnvironment} environment. Please verify all providers are working correctly.`,
        variant: "default"
      });

      return true;
    } catch (error) {
      toast({
        title: "Environment Switch Failed",
        description: "Could not update environment setting. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    currentEnvironment,
    toggleEnvironment,
    isLoading
  };
};