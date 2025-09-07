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
    await createTask('plan_complete_trip', {
      agentId: getPrimaryAgentId(),
      vertical: userVertical,
      preferences: 'comprehensive_planning'
    });
  };

  const handleMonitorTrips = async () => {
    await createTask('monitor_prices', {
      agentId: getPrimaryAgentId(),
      userId: 'current_user'
    });
  };

  const handleAdjustBooking = async (bookingId: string) => {
    await createTask('optimize_booking', {
      agentId: getPrimaryAgentId(),
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
            <h3 className="font-semibold text-white">Maku {userVertical} Agent</h3>
            <p className="text-sm text-white/80">Your specialized AI travel assistant</p>
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
        <div className="p-4">
          <h4 className="font-medium text-center">Let me plan your {userVertical.toLowerCase()} trip</h4>
        </div>

        <ScrollArea className="flex-1 h-[500px]">
          <div className="m-4 space-y-4">
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
              actionLabel="Find Deals"
              onAction={handleMonitorTrips}
              icon={<Hotel className="h-5 w-5" />}
            />
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default AgenticPanel;