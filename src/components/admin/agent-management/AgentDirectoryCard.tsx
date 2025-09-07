import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Settings, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import { MascotAvatar, MascotPersonality, getCategoryTheme } from '../MascotAvatar';

interface Agent {
  id: string;
  agent_id: string;
  display_name: string;
  description: string;
  category: string;
  status: string;
  version: string;
  capabilities: string[];
  health_status: string;
  last_health_check: string;
  configuration: any;
  permissions: any;
  performance_settings: any;
}

interface AgentDirectoryCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: (agentId: string) => void;
  onTaskAssign: () => void;
  onEmergencyStop: () => void;
  onConfigure: () => void;
}

export function AgentDirectoryCard({
  agent,
  isSelected,
  onSelect,
  onTaskAssign,
  onEmergencyStop,
  onConfigure
}: AgentDirectoryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const theme = getCategoryTheme(agent.category);

  return (
    <Card className={`relative transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      isSelected ? `ring-2 ring-primary shadow-lg bg-gradient-to-br ${theme.bgGradient}` : 'hover:shadow-primary/10'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(agent.agent_id)}
              className="rounded border-border"
            />
            <MascotAvatar 
              category={agent.category}
              status={agent.status}
              healthStatus={agent.health_status}
              size="md"
            />
            <div>
              <CardTitle className="text-base font-semibold">{agent.display_name}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">{agent.agent_id}</p>
              <MascotPersonality category={agent.category} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
            <Badge variant="outline" className={`text-xs ${theme.accentColor} border-current`}>
              {agent.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {agent.description}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className={getHealthColor(agent.health_status)}>
              {agent.health_status}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>v{agent.version}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {agent.capabilities?.slice(0, 3).map((capability, index) => (
            <Badge key={index} variant="secondary" className={`text-xs px-2 py-0 ${theme.accentColor}`}>
              {capability}
            </Badge>
          ))}
          {agent.capabilities?.length > 3 && (
            <Badge variant="outline" className={`text-xs px-2 py-0 ${theme.accentColor} border-current`}>
              +{agent.capabilities.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onTaskAssign}
            className="flex-1"
          >
            <Play className="h-3 w-3 mr-1" />
            Task
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onConfigure}
          >
            <Settings className="h-3 w-3" />
          </Button>
          {agent.status === 'active' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onEmergencyStop}
            >
              <AlertTriangle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}