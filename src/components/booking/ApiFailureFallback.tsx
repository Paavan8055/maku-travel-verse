import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Wifi, RefreshCw } from "lucide-react"

interface ApiFailureFallbackProps {
  error: string
  onRetry?: () => void
  showOfflineMessage?: boolean
}

export const ApiFailureFallback = ({ 
  error, 
  onRetry, 
  showOfflineMessage = false 
}: ApiFailureFallbackProps) => {
  return (
    <Card className="border-destructive/50">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-full bg-destructive/10">
            {showOfflineMessage ? (
              <Wifi className="h-8 w-8 text-destructive" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Service Temporarily Unavailable</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {showOfflineMessage 
                ? "Please check your internet connection and try again."
                : "We're experiencing technical difficulties with our booking services. Our team is working to resolve this quickly."
              }
            </p>
          </div>

          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>What you can do:</p>
              <ul className="text-left space-y-1">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}