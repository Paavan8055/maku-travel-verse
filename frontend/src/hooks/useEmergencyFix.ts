import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

interface EmergencyReport {
  success: boolean;
  message: string;
  report?: {
    timestamp: string;
    configValid: boolean;
    providerHealth: any;
    enabledProviders: string[];
    testResults: Array<{
      searchType: string;
      success: boolean;
      provider?: string;
      error?: string;
    }>;
    summary: {
      totalProviders: number;
      workingProviders: number;
      failedTests: number;
    };
  };
  error?: string;
}

export const useEmergencyFix = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<EmergencyReport | null>(null);
  const { toast } = useToast();

  const runEmergencyFix = async (): Promise<EmergencyReport | null> => {
    setIsRunning(true);
    setReport(null);
    
    try {
      logger.info('🚨 Initiating emergency provider rotation fix...');
      
      toast({
        title: "Emergency Fix Started",
        description: "Attempting to repair provider rotation system...",
        variant: "default"
      });

      const { data, error } = await supabase.functions.invoke('emergency-provider-fix', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as EmergencyReport;
      setReport(result);

      if (result.success) {
        const summary = result.report?.summary;
        toast({
          title: "Emergency Fix Completed ✅",
          description: `${summary?.workingProviders}/${summary?.totalProviders} providers restored`,
          variant: "default"
        });
        
        logger.info('✅ Emergency fix successful:', result.report?.summary);
      } else {
        toast({
          title: "Emergency Fix Failed ❌",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
        
        logger.error('❌ Emergency fix failed:', result.error);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Emergency fix error:', error);
      
      const failureReport: EmergencyReport = {
        success: false,
        message: 'Emergency fix failed',
        error: errorMessage
      };
      
      setReport(failureReport);
      
      toast({
        title: "Emergency Fix Failed ❌",
        description: errorMessage,
        variant: "destructive"
      });

      return failureReport;
    } finally {
      setIsRunning(false);
    }
  };

  const testProviderRotation = async (): Promise<boolean> => {
    try {
      logger.info('Testing provider rotation system...');
      
      const testParams = {
        searchType: 'hotel',
        params: {
          destination: 'SYD',
          checkInDate: '2025-08-26',
          checkOutDate: '2025-08-27',
          adults: 2,
          rooms: 1
        }
      };

      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: testParams
      });

      if (error) {
        logger.error('Provider rotation test failed:', error);
        return false;
      }

      const success = data?.success && data?.provider && data?.data;
      logger.info('Provider rotation test result:', {
        success,
        provider: data?.provider,
        hasData: !!data?.data
      });

      return success;
    } catch (error) {
      logger.error('Provider rotation test error:', error);
      return false;
    }
  };

  return {
    isRunning,
    report,
    runEmergencyFix,
    testProviderRotation
  };
};