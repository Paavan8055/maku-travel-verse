import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { SearchProviderIndicator } from "./ProviderStatus";

interface SearchExecuteButtonProps {
  searchType: 'flight' | 'hotel' | 'activity';
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
    if (isLoading) return `Searching ${searchType}s...`;
    if (!isReady) return `Prepare ${searchType} search`;
    return `Search ${searchType}s`;
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