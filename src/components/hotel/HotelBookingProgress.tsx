import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HotelBookingProgressProps {
  currentStep: number;
  steps?: string[];
}

export const HotelBookingProgress = ({ 
  currentStep = 1, 
  steps = ["1 HOTELS", "2 GUEST DETAILS", "3 REVIEW & PAYMENT"] 
}: HotelBookingProgressProps) => {
  return (
    <div className="w-full bg-card border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center space-x-8">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;
            
            return (
              <div key={step} className="flex items-center space-x-2">
                <div className="flex items-center space-x-3">
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle 
                      className={cn(
                        "h-6 w-6",
                        isActive ? "text-primary fill-primary" : "text-muted-foreground"
                      )} 
                    />
                  )}
                  <span 
                    className={cn(
                      "font-medium",
                      isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                    )}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-16 h-0.5 bg-border ml-3" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};