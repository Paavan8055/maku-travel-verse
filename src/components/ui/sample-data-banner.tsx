import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface SampleDataBannerProps {
  show: boolean;
  type?: 'hotel' | 'flight' | 'activity' | 'general';
}

export const SampleDataBanner = ({ show, type = 'general' }: SampleDataBannerProps) => {
  if (!show) return null;

  const messages = {
    hotel: "Showing sample hotel results because no live data was available for your search.",
    flight: "Showing sample flight results because no live data was available for your search.", 
    activity: "Showing sample activity results because no live data was available for your search.",
    general: "Showing sample results because no live data was available for your query."
  };

  return (
    <Alert className="mb-4 border-warning bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertDescription className="text-warning-foreground">
        {messages[type]}
      </AlertDescription>
    </Alert>
  );
};