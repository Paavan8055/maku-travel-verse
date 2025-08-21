import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

interface SampleDataBannerProps {
  show: boolean;
  type?: 'hotel' | 'flight' | 'activity' | 'general';
  severity?: 'info' | 'warning' | 'success';
  customMessage?: string;
  showDetails?: boolean;
}

export const SampleDataBanner = ({ 
  show, 
  type = 'general', 
  severity = 'warning',
  customMessage,
  showDetails = false 
}: SampleDataBannerProps) => {
  if (!show) return null;

  const messages = {
    hotel: "Showing sample hotel results because no live data was available for your search.",
    flight: "Showing sample flight results because no live data was available for your search.", 
    activity: "Showing sample activity results because no live data was available for your search.",
    general: "Showing sample results because no live data was available for your query."
  };

  const getIcon = () => {
    switch (severity) {
      case 'info': return Info;
      case 'success': return CheckCircle;
      default: return AlertTriangle;
    }
  };

  const getVariant = () => {
    switch (severity) {
      case 'info': return 'default';
      case 'success': return 'default';
      default: return 'destructive';
    }
  };

  const getColorClasses = () => {
    switch (severity) {
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-warning bg-warning/10 text-warning-foreground';
    }
  };

  const Icon = getIcon();

  return (
    <Alert className={`mb-4 ${getColorClasses()}`}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span>{customMessage || messages[type]}</span>
          {showDetails && (
            <div className="mt-2 text-sm space-y-1">
              <p>• Prices and availability shown are for demonstration purposes</p>
              <p>• Real-time data will be used for actual bookings</p>
              <p>• Contact support if you need assistance with live data</p>
            </div>
          )}
        </div>
        <Badge variant="outline" className="ml-4 text-xs">
          Sample Data
        </Badge>
      </AlertDescription>
    </Alert>
  );
};