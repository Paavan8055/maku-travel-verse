import React, { useState, useEffect } from 'react';
import { X, Plane, Hotel, Calendar, Settings, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import BookingCard from './BookingCard';
import { useAgenticTasks } from '../hooks/useAgenticTasks';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface AgenticPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userVertical: 'Family' | 'Solo' | 'Pet' | 'Spiritual';
}

const AgenticPanel: React.FC<AgenticPanelProps> = ({ 
  isOpen, 
  onClose, 
  userVertical 
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('plan');
  const { tasks, progress, createTask, cancelTask } = useAgenticTasks();
  const isGuest = !user;

  const getPrimaryAgentId = () => {
    const agentMap = {
      'Family': 'family-travel-planner',
      'Solo': 'solo-travel-planner', 
      'Pet': 'pet-travel-specialist',
      'Spiritual': 'spiritual-travel-planner'
    };
    return agentMap[userVertical];
  };

  const handlePlanTrip = async () => {
    if (isGuest) {
      await createTask('get_destination_info', {
        agentId: 'destination-guide',
        vertical: userVertical,
        type: 'basic_info'
      });
    } else {
      await createTask('plan_complete_trip', {
        agentId: getPrimaryAgentId(),
        vertical: userVertical,
        preferences: 'comprehensive_planning'
      });
    }
  };

  const handleMonitorTrips = async () => {
    await createTask('monitor_prices', {
      agentId: 'price-monitor',
      userId: user?.id || 'guest_user'
    });
  };

  const handleAdjustBooking = async (bookingId: string) => {
    await createTask('optimize_booking', {
      agentId: 'booking-assistant',
      bookingId,
      optimization: 'cost_and_convenience'
    });
  };

  const handleWeatherCheck = async () => {
    await createTask('check_weather', {
      agentId: 'weather-tracker',
      type: 'destination_weather',
      days: 7
    });
  };

  const handleCurrencyConvert = async () => {
    await createTask('convert_currency', {
      agentId: 'currency-converter',
      from: 'USD',
      to: 'AUD',
      amount: 1000
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
      <div className="w-[400px] h-[600px] bg-background border border-border rounded-lg shadow-floating flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">
                {isGuest ? 'Travel Assistant (Guest Mode)' : getPrimaryAgentId().split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </h2>
              {isGuest && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Guest
                </Badge>
              )}
              {!isGuest && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {isGuest && (
            <p className="text-sm text-muted-foreground mt-2">
              You're using our basic AI agents. Sign up for access to premium agents and advanced features!
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {progress > 0 && progress < 100 && (
          <div className="p-4 border-b border-border">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Task in progress... {progress}%
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {isGuest ? (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium mb-2">Travel Helper</h3>
                    <p className="text-sm text-muted-foreground">
                      Get quick travel information and planning help
                    </p>
                  </div>

                  <Button
                    onClick={handlePlanTrip}
                    className="w-full h-12 text-left justify-start"
                    variant="outline"
                  >
                    <Plane className="h-4 w-4 mr-3" />
                    Plan My Trip
                  </Button>

                  <Button
                    onClick={handleWeatherCheck}
                    className="w-full h-12 text-left justify-start"
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    Check Weather
                  </Button>

                  <div className="mt-8 p-4 bg-primary/10 rounded-lg text-center">
                    <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Want More?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Get full trip planning and booking help
                    </p>
                    <Button onClick={() => window.location.href = '/auth'} size="sm">
                      Sign Up Free
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium mb-2">Your Travel Assistant</h3>
                    <p className="text-sm text-muted-foreground">
                      Let me help you plan and manage your trips
                    </p>
                  </div>

                  <Button
                    onClick={handlePlanTrip}
                    className="w-full h-16 text-left justify-start"
                    variant="outline"
                  >
                    <div className="flex flex-col items-start w-full">
                      <div className="flex items-center mb-1">
                        <Plane className="h-4 w-4 mr-2" />
                        <span className="font-medium">Plan Complete Trip</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Hotels, flights, and activities all in one
                      </span>
                    </div>
                  </Button>

                  <Button
                    onClick={handleMonitorTrips}
                    className="w-full h-16 text-left justify-start"
                    variant="outline"
                  >
                    <div className="flex flex-col items-start w-full">
                      <div className="flex items-center mb-1">
                        <Settings className="h-4 w-4 mr-2" />
                        <span className="font-medium">Find Best Deals</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Monitor prices and get alerts
                      </span>
                    </div>
                  </Button>

                  <Button
                    onClick={handleWeatherCheck}
                    className="w-full h-16 text-left justify-start"
                    variant="outline"
                  >
                    <div className="flex flex-col items-start w-full">
                      <div className="flex items-center mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium">Check Weather</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        7-day forecast for your destinations
                      </span>
                    </div>
                  </Button>

                  {tasks.length > 0 && (
                    <div className="mt-8 space-y-3">
                      <h4 className="font-medium text-sm">Active Tasks</h4>
                      {tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{task.intent}</span>
                            <Badge variant="secondary" className="text-xs">
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default AgenticPanel;