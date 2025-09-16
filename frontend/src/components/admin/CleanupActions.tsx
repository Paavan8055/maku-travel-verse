import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Play, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CleanupResult {
  success: boolean;
  correlationId?: string;
  results?: {
    travel_fund_expired: number;
    old_bookings_expired: number;
    stripe_synced: number;
    errors: number;
    total_processed: number;
  };
}

export const CleanupActions = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<CleanupResult | null>(null);
  const { toast } = useToast();

  const triggerEnhancedCleanup = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-cleanup', {
        body: {
          correlationId: crypto.randomUUID(),
          cleanupType: 'manual_admin'
        }
      });

      if (error) {
        throw error;
      }

      setLastResult(data);
      
      if (data.success) {
        toast({
          title: "Cleanup Completed",
          description: `Processed ${data.results?.total_processed || 0} bookings successfully`,
        });
      } else {
        toast({
          title: "Cleanup Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup Error",
        description: "Failed to execute cleanup",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const triggerLegacyCleanup = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-stuck-bookings', {
        body: {
          automated: false,
          timeout_minutes: 10
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Legacy Cleanup Completed",
        description: `Processed ${data.summary?.total_processed || 0} bookings`,
      });
    } catch (error) {
      console.error('Legacy cleanup error:', error);
      toast({
        title: "Legacy Cleanup Failed",
        description: "Failed to execute legacy cleanup",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Manual Cleanup Actions
          </CardTitle>
          <CardDescription>
            Manually trigger cleanup operations to resolve stuck bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={triggerEnhancedCleanup}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Enhanced Cleanup
                </>
              )}
            </Button>

            <Button 
              onClick={triggerLegacyCleanup}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Legacy Cleanup
                </>
              )}
            </Button>
          </div>

          {lastResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Last Cleanup Result</h4>
              {lastResult.success ? (
                <div className="space-y-1 text-sm">
                  <p>✅ Travel Fund Expired: {lastResult.results?.travel_fund_expired || 0}</p>
                  <p>✅ Old Bookings Expired: {lastResult.results?.old_bookings_expired || 0}</p>
                  <p>✅ Stripe Synced: {lastResult.results?.stripe_synced || 0}</p>
                  <p>⚠️ Errors: {lastResult.results?.errors || 0}</p>
                  <p className="font-medium">Total Processed: {lastResult.results?.total_processed || 0}</p>
                  {lastResult.correlationId && (
                    <p className="text-muted-foreground">ID: {lastResult.correlationId}</p>
                  )}
                </div>
              ) : (
                <p className="text-destructive">❌ Cleanup failed</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};