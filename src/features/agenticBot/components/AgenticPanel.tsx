import React, { useState, useEffect } from 'react';
import { X, Plane, Hotel, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import BookingCard from './BookingCard';
import { useAgenticTasks } from '../hooks/useAgenticTasks';

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
  const [activeTab, setActiveTab] = useState('plan');
  const { tasks, progress, createTask, cancelTask } = useAgenticTasks();

  const handlePlanTrip = async () => {
    // TODO: Open trip planning form
    await createTask('plan_trip', {
      vertical: userVertical,
      preferences: 'budget_friendly' // TODO: Get from form
    });
  };

  const handleMonitorTrips = async () => {
    await createTask('monitor_trips', {
      userId: 'current_user' // TODO: Get from auth context
    });
  };

  const handleAdjustBooking = async (bookingId: string) => {
    await createTask('adjust_booking', {
      bookingId,
      adjustmentType: 'price_optimization'
    });
  };

  return (
    <div
      className={`fixed bottom-0 right-0 z-50 h-[700px] w-96 bg-card border-l border-t border-border rounded-tl-3xl shadow-floating transition-all duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-hero rounded-tl-3xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
            🤖
          </div>
          <div>
            <h3 className="font-semibold text-white">Maku Agent</h3>
            <p className="text-sm text-white/80">Your AI travel assistant</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      {progress > 0 && progress < 100 && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Working on your request...</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3 m-4">
          <TabsTrigger value="plan" className="flex items-center space-x-1">
            <Plane className="h-4 w-4" />
            <span>Plan</span>
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Monitor</span>
          </TabsTrigger>
          <TabsTrigger value="adjust" className="flex items-center space-x-1">
            <Settings className="h-4 w-4" />
            <span>Adjust</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 h-[500px]">
          <TabsContent value="plan" className="m-4 space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Let me plan your {userVertical.toLowerCase()} trip</h4>
              
              <BookingCard
                title="Plan Complete Trip"
                description="I'll search flights, hotels, and activities based on your preferences"
                actionLabel="Start Planning"
                onAction={handlePlanTrip}
                icon={<Plane className="h-5 w-5" />}
              />

              <BookingCard
                title="Find Best Deals"
                description="I'll monitor prices and book when they drop"
                actionLabel="Monitor Prices"
                onAction={() => createTask('monitor_prices', { vertical: userVertical })}
                icon={<Hotel className="h-5 w-5" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="monitor" className="m-4 space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Active Monitoring</h4>
              
              {tasks.filter(task => task.status === 'running').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active monitoring tasks</p>
                </div>
              ) : (
                tasks
                  .filter(task => task.status === 'running')
                  .map(task => (
                    <BookingCard
                      key={task.id}
                      title={task.intent.replace('_', ' ').toUpperCase()}
                      description={`Monitoring since ${new Date(task.created_at).toLocaleDateString()}`}
                      actionLabel="Cancel"
                      onAction={() => cancelTask(task.id)}
                      variant="monitoring"
                    />
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="adjust" className="m-4 space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Booking Adjustments</h4>
              
              <BookingCard
                title="Optimize Existing Bookings"
                description="I'll check for better prices and upgrade opportunities"
                actionLabel="Optimize Now"
                onAction={() => handleAdjustBooking('example_booking')}
                icon={<Settings className="h-5 w-5" />}
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default AgenticPanel;