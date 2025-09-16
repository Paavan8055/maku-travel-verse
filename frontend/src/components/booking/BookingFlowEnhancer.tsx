import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Clock, CreditCard, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'upcoming' | 'current' | 'completed';
  estimatedTime?: string;
}

interface BookingFlowEnhancerProps {
  currentStep: string;
  steps: BookingStep[];
  onStepChange?: (stepId: string) => void;
  showProgress?: boolean;
  showTimeEstimates?: boolean;
  className?: string;
}

export const BookingFlowEnhancer: React.FC<BookingFlowEnhancerProps> = ({
  currentStep,
  steps,
  onStepChange,
  showProgress = true,
  showTimeEstimates = true,
  className
}) => {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime]);

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const enhancedSteps = steps.map((step, index) => ({
    ...step,
    status: (index < currentStepIndex ? 'completed' : 
           index === currentStepIndex ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming'
  }));

  const getStepIcon = (step: BookingStep, index: number) => {
    if (step.status === 'completed') {
      return <Check className="h-4 w-4 text-success" />;
    }
    if (step.status === 'current') {
      return <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />;
    }
    return <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Booking Progress</h3>
              <p className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(timeSpent)}
              </Badge>
              {showTimeEstimates && (
                <p className="text-xs text-muted-foreground">
                  Est. 2-3 min remaining
                </p>
              )}
            </div>
          </div>
          
          {showProgress && (
            <Progress value={progressPercentage} className="h-2" />
          )}
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {enhancedSteps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
                  step.status === 'current' && 'bg-primary/5 border border-primary/20',
                  step.status === 'completed' && 'bg-success/5 border border-success/20',
                  step.status === 'upcoming' && 'bg-muted/30',
                )}
                onClick={() => onStepChange?.(step.id)}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(step, index)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      'font-medium',
                      step.status === 'current' && 'text-primary',
                      step.status === 'completed' && 'text-success',
                      step.status === 'upcoming' && 'text-muted-foreground'
                    )}>
                      {step.title}
                    </h4>
                    {step.status === 'current' && (
                      <Badge variant="default">Current</Badge>
                    )}
                    {step.status === 'completed' && (
                      <Badge variant="outline" className="text-success border-success">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  {showTimeEstimates && step.estimatedTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.estimatedTime}
                    </p>
                  )}
                </div>
                
                {step.status !== 'completed' && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              View Hotel
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Save Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingFlowEnhancer;