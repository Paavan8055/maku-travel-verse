import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  steps?: string[];
}

export const BookingProgressIndicator = ({ 
  currentStep, 
  totalSteps = 3,
  steps = ["Search", "Room Selection", "Checkout", "Payment"]
}: BookingProgressIndicatorProps) => {
  const effectiveTotalSteps = totalSteps || steps.length;
  const progressPercentage = (currentStep / effectiveTotalSteps) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {effectiveTotalSteps}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center space-x-4">
        {steps.slice(0, effectiveTotalSteps).map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          
          return (
            <div key={step} className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle 
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary fill-primary" : "text-muted-foreground"
                    )} 
                  />
                )}
                <span 
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < effectiveTotalSteps - 1 && (
                <div className="w-8 h-0.5 bg-border ml-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};