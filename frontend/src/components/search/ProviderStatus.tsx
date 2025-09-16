import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface ProviderStatusProps {
  provider: string;
  status: 'healthy' | 'degraded' | 'disabled';
  className?: string;
}

export const ProviderStatus = ({ provider, status, className = "" }: ProviderStatusProps) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          text: `Powered by ${provider}`,
          variant: "default" as const,
          className: "bg-success/10 text-success border-success/20"
        };
      case 'degraded':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: `${provider} (Limited)`,
          variant: "secondary" as const,
          className: "bg-warning/10 text-warning border-warning/20"
        };
      case 'disabled':
        return {
          icon: <XCircle className="w-3 h-3" />,
          text: `${provider} Unavailable`,
          variant: "destructive" as const,
          className: "bg-destructive/10 text-destructive border-destructive/20"
        };
      default:
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          text: `Powered by ${provider}`,
          variant: "default" as const,
          className: "bg-success/10 text-success border-success/20"
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Badge 
      variant={statusDisplay.variant}
      className={`${statusDisplay.className} ${className} flex items-center gap-1 text-xs`}
    >
      {statusDisplay.icon}
      {statusDisplay.text}
    </Badge>
  );
};

export const SearchProviderIndicator = () => {
  return (
    <div className="flex items-center justify-center">
      <ProviderStatus provider="Amadeus" status="healthy" />
    </div>
  );
};