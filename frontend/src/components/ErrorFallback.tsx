import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  showRetry?: boolean;
  showGoBack?: boolean;
  suggestions?: string[];
}

export const ErrorFallback = ({
  title = "Something went wrong",
  message = "We're experiencing technical difficulties. Please try again.",
  onRetry,
  onGoBack,
  showRetry = true,
  showGoBack = true,
  suggestions = []
}: ErrorFallbackProps) => {
  return (
    <Card className="w-full max-w-lg mx-auto my-8">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-center">
            {message}
          </AlertDescription>
        </Alert>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Suggestions:</h4>
            <ul className="text-sm space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-muted-foreground">
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {showGoBack && onGoBack && (
            <Button 
              variant="outline" 
              onClick={onGoBack}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
          {showRetry && onRetry && (
            <Button 
              onClick={onRetry}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorFallback;