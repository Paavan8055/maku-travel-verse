
import React from 'react';
import { Bot, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AgenticLauncherProps {
  isOpen: boolean;
  onToggle: () => void;
  status: 'idle' | 'working' | 'success' | 'error';
  activeTaskCount?: number;
}

const statusConfig = {
  idle: { icon: Bot, color: 'bg-primary', label: 'Ready' },
  working: { icon: Clock, color: 'bg-travel-sunset animate-pulse', label: 'Working' },
  success: { icon: CheckCircle, color: 'bg-travel-forest', label: 'Complete' },
  error: { icon: AlertCircle, color: 'bg-destructive', label: 'Error' }
};

const AgenticLauncher: React.FC<AgenticLauncherProps> = ({ 
  isOpen, 
  onToggle, 
  status,
  activeTaskCount = 0 
}) => {
  const { icon: StatusIcon, color, label } = statusConfig[status];

  return (
    <div className="fixed bottom-20 right-6 z-40">
      {/* Status Badge */}
      {activeTaskCount > 0 && (
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -right-2 z-10"
        >
          {activeTaskCount}
        </Badge>
      )}
      
      {/* Main Launcher Button */}
      <Button
        onClick={onToggle}
        className={`h-16 w-16 rounded-full shadow-floating transition-all duration-300 ${
          isOpen ? 'scale-0' : 'scale-100 hover-scale'
        } ${color}`}
        size="icon"
      >
        <StatusIcon className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
};

export default AgenticLauncher;
