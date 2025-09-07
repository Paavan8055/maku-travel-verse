import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Activity,
  MoreHorizontal,
  Eye,
  Edit,
  Power
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Agent {
  id: string;
  agent_id: string;
  display_name: string;
  category: string;
  status: string;
  health_status: string;
  description?: string;
  capabilities?: string[];
  configuration?: any;
  performance_settings?: any;
  last_health_check?: string;
}

interface AgentDirectoryCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: (agentId: string) => void;
  onTaskAssign: () => void;
  onEmergencyStop: () => void;
  onConfigure: () => void;
}

const getStatusIcon = (status: string, healthStatus: string) => {
  if (status === 'active' && healthStatus === 'healthy') {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  } else if (status === 'active' && healthStatus === 'warning') {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  } else if (status === 'error' || healthStatus === 'error') {
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  } else if (status === 'paused') {
    return <Pause className="h-4 w-4 text-gray-500" />;
  } else {
    return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

const getStatusColor = (status: string, healthStatus: string) => {
  if (status === 'active' && healthStatus === 'healthy') {
    return 'bg-green-100 text-green-800 border-green-200';
  } else if (status === 'active' && healthStatus === 'warning') {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else if (status === 'error' || healthStatus === 'error') {
    return 'bg-red-100 text-red-800 border-red-200';
  } else if (status === 'paused') {
    return 'bg-gray-100 text-gray-800 border-gray-200';
  } else {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    'travel_services': <Activity className="h-4 w-4" />,
    'communication': <Zap className="h-4 w-4" />,
    'analytics': <Activity className="h-4 w-4" />,
    'security': <AlertTriangle className="h-4 w-4" />,
    'management': <Settings className="h-4 w-4" />,
    'general': <Activity className="h-4 w-4" />
  };
  return icons[category] || <Activity className="h-4 w-4" />;
};

export const AgentDirectoryCard: React.FC<AgentDirectoryCardProps> = ({
  agent,
  isSelected,
  onSelect,
  onTaskAssign,
  onEmergencyStop,
  onConfigure
}) => {
  const isHealthy = agent.status === 'active' && agent.health_status === 'healthy';
  const performance = Math.floor(Math.random() * 40) + 60; // Mock performance score

  return (
    <Card className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
      isSelected ? 'ring-2 ring-primary border-primary' : ''
    } ${isHealthy ? 'hover:shadow-green-100' : ''} animate-fade-in`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(agent.agent_id)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(agent.category)}
                <CardTitle className="text-sm font-medium truncate">
                  {agent.display_name}
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {agent.description || 'No description available'}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onConfigure}>
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTaskAssign}>
                <Play className="mr-2 h-4 w-4" />
                Assign Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onEmergencyStop}
                className="text-red-600"
              >
                <Power className="mr-2 h-4 w-4" />
                Emergency Stop
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status and Health */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(agent.status, agent.health_status)}
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusColor(agent.status, agent.health_status)}`}
            >
              {agent.status}
            </Badge>
          </div>
          <Badge variant="secondary" className="text-xs">
            {agent.category}
          </Badge>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Performance</span>
            <span className="font-medium">{performance}%</span>
          </div>
          <Progress 
            value={performance} 
            className="h-1.5"
          />
        </div>

        {/* Capabilities */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Capabilities</p>
            <div className="flex flex-wrap gap-1">
              {agent.capabilities.slice(0, 3).map((capability) => (
                <Badge 
                  key={capability} 
                  variant="outline" 
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  {capability}
                </Badge>
              ))}
              {agent.capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.capabilities.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2 border-t">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 h-8 text-xs"
            onClick={onTaskAssign}
          >
            <Play className="mr-1 h-3 w-3" />
            Task
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 h-8 text-xs"
            onClick={onConfigure}
          >
            <Settings className="mr-1 h-3 w-3" />
            Config
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0"
            title="View Details"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>

        {/* Last Health Check */}
        {agent.last_health_check && (
          <div className="text-xs text-muted-foreground">
            Last check: {new Date(agent.last_health_check).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};