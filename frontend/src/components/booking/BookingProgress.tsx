import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingProgressProps {
  currentStep: number;
  steps: string[];
  className?: string;
}

export const BookingProgress = ({ currentStep, steps, className }: BookingProgressProps) => {
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2",
                  isComplete && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span className={cn(
                "text-xs text-center max-w-20",
                isCurrent && "text-foreground font-medium",
                !isCurrent && "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
};