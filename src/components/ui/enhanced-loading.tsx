import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Plane, Hotel, Car, MapPin } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  variant?: "default" | "flight" | "hotel" | "car" | "search";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  className,
  text,
  variant = "default"
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const getIcon = () => {
    switch (variant) {
      case "flight":
        return <Plane className={cn(sizeClasses[size], "animate-bounce")} />;
      case "hotel":
        return <Hotel className={cn(sizeClasses[size], "animate-pulse")} />;
      case "car":
        return <Car className={cn(sizeClasses[size], "animate-bounce")} />;
      case "search":
        return <MapPin className={cn(sizeClasses[size], "animate-pulse")} />;
      default:
        return <Loader2 className={cn(sizeClasses[size], "animate-spin")} />;
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      <div className="text-primary">
        {getIcon()}
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
};

interface LoadingStateProps {
  type: "search" | "booking" | "payment" | "processing";
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type,
  title,
  description,
  className
}) => {
  const getLoadingContent = () => {
    switch (type) {
      case "search":
        return {
          title: title || "Searching...",
          description: description || "Finding the best options for you",
          variant: "search" as const
        };
      case "booking":
        return {
          title: title || "Creating booking...",
          description: description || "Preparing your reservation",
          variant: "default" as const
        };
      case "payment":
        return {
          title: title || "Processing payment...",
          description: description || "Securing your booking",
          variant: "default" as const
        };
      case "processing":
        return {
          title: title || "Processing...",
          description: description || "Please wait while we complete your request",
          variant: "default" as const
        };
      default:
        return {
          title: "Loading...",
          description: "Please wait",
          variant: "default" as const
        };
    }
  };

  const content = getLoadingContent();

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6", className)}>
      <LoadingSpinner size="lg" variant={content.variant} />
      <div className="text-center mt-4">
        <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
        <p className="text-muted-foreground">{content.description}</p>
      </div>
    </div>
  );
};

export const InlineLoader: React.FC<{ text?: string; className?: string }> = ({ 
  text = "Loading...", 
  className 
}) => (
  <div className={cn("flex items-center space-x-2", className)}>
    <Loader2 className="h-4 w-4 animate-spin text-primary" />
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);