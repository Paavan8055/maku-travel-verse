import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { SearchProviderIndicator } from "./ProviderStatus";

interface SearchExecuteButtonProps {
  searchType: 'flight' | 'hotel' | 'activity' | 'flights' | 'hotels' | 'activities';
  isReady: boolean;
  isLoading: boolean;
  onExecute: () => void;
  disabled?: boolean;
  className?: string;
}

export const SearchExecuteButton = ({
  searchType,
  isReady,
  isLoading,
  onExecute,
  disabled = false,
  className = ""
}: SearchExecuteButtonProps) => {
  const getButtonText = () => {
    const typeMapping = {
      flight: 'flights',
      hotel: 'hotels', 
      activity: 'activities',
      flights: 'flights',
      hotels: 'hotels',
      activities: 'activities'
    };
    
    const displayType = typeMapping[searchType as keyof typeof typeMapping] || searchType;
    
    if (isLoading) return `Searching ${displayType}...`;
    if (!isReady) return `Prepare ${displayType} search`;
    return `Search ${displayType}`;
  };

  const getIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    return <Search className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={onExecute}
        disabled={!isReady || isLoading || disabled}
        className={`w-full h-12 text-base font-medium ${className}`}
        size="lg"
      >
        {getIcon()}
        {getButtonText()}
      </Button>
      
      {isReady && !isLoading && (
        <div className="flex justify-center">
          <SearchProviderIndicator />
        </div>
      )}
    </div>
  );
};