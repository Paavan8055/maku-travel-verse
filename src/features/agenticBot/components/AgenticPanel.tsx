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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
            <TabsTrigger value="plan">
              <Plane className="w-4 h-4 mr-2" />
              {isGuest ? 'Explore' : 'Plan'}
            </TabsTrigger>
            <TabsTrigger value="manage">
              <Calendar className="w-4 h-4 mr-2" />
              {isGuest ? 'Tools' : 'Manage'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="grid gap-4">
                {isGuest ? (
                  <>
                    {/* Guest-accessible basic agents */}
                    <BookingCard
                      title="Weather Tracker"
                      description="Check weather forecasts for your travel destinations"
                      actionLabel="Check Weather"
                      onAction={handleWeatherCheck}
                    />
                    
                    <BookingCard
                      title="Currency Converter"
                      description="Convert currencies and get current exchange rates"
                      actionLabel="Convert Currency"
                      onAction={handleCurrencyConvert}
                    />
                    
                    <BookingCard
                      title="Destination Guide"
                      description="Get basic information about travel destinations"
                      actionLabel="Get Info"
                      onAction={handlePlanTrip}
                    />
                    
                    <BookingCard
                      title="Price Monitor"
                      description="Track basic price information for flights and hotels"
                      actionLabel="Monitor Prices"
                      onAction={handleMonitorTrips}
                    />
                    
                    {/* Premium features preview */}
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">Premium Features</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Unlock full trip planning, booking assistance, and 100+ specialized agents
                      </p>
                      <Button className="w-full" onClick={() => window.location.href = '/auth'}>
                        Sign Up for Premium Access
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Full premium experience */}
                    <BookingCard
                      title="Plan Complete Trip"
                      description="Let our AI agents plan your entire journey from start to finish"
                      actionLabel="Start Planning"
                      onAction={handlePlanTrip}
                    />
                    
                    <BookingCard
                      title="Find Best Deals"
                      description="Monitor prices and get alerts when better deals become available"
                      actionLabel="Find Deals"
                      onAction={handleMonitorTrips}
                    />
                    
                    <BookingCard
                      title="Weather Tracker"
                      description="Advanced weather tracking with personalized alerts"
                      actionLabel="Track Weather"
                      onAction={handleWeatherCheck}
                    />
                    
                    <BookingCard
                      title="Currency Converter"
                      description="Real-time rates with historical trends and alerts"
                      actionLabel="Convert Currency"
                      onAction={handleCurrencyConvert}
                    />
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="manage" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {isGuest ? (
                  <div className="text-center p-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Trip management and booking tools are available for premium users.
                    </p>
                    <Button onClick={() => window.location.href = '/auth'}>
                      Sign Up to Access
                    </Button>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{task.intent}</h4>
                        <Badge variant={
                          task.status === 'completed' ? 'default' :
                          task.status === 'running' ? 'secondary' : 'outline'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Agent: {task.agent_id}
                      </p>
                      {task.status === 'running' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelTask(task.id)}
                        >
                          Cancel Task
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgenticPanel;