import React, { useState } from 'react';
import SearchSection from "@/components/SearchSection";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedAgenticWidget } from '@/components/agentic/enhanced/EnhancedAgenticWidget';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Sparkles, Zap, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedSearchSectionProps {
  onSearchAssist?: (params: any) => void;
}

export const EnhancedSearchSection: React.FC<EnhancedSearchSectionProps> = ({
  onSearchAssist
}) => {
  const [isAgentAssistEnabled, setIsAgentAssistEnabled] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAgentAssistedSearch = async (searchType: 'flight' | 'hotel' | 'activity', params: any) => {
    try {
      setIsAgentAssistEnabled(true);
      
      toast({
        title: "AI Agent Activated",
        description: `Starting intelligent ${searchType} search with multi-provider coordination`
      });

      // Call the travel coordinator edge function
      const { data, error } = await supabase.functions.invoke('travel-agent-coordinator', {
        body: {
          type: 'search',
          service: searchType,
          params,
          userId: 'current-user'
        }
      });

      if (error) throw error;

      toast({
        title: "Search Coordinated",
        description: `Agent system is coordinating ${searchType} search across ${data.providers || 'multiple'} providers`
      });

      // Trigger search suggestions update
      setSearchSuggestions([
        'Multi-provider price comparison active',
        'Real-time availability checking',
        'Smart recommendation engine enabled'
      ]);

      onSearchAssist?.(data);

    } catch (error) {
      console.error('Agent-assisted search failed:', error);
      toast({
        title: "Search Agent Error",
        description: "Failed to activate agent assistance. Using standard search.",
        variant: "destructive"
      });
    } finally {
      setIsAgentAssistEnabled(false);
    }
  };

  return (
    <div className="relative">
      {/* AI Enhancement Banner */}
      <Card className="mb-4 p-4 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI-Powered Search</h3>
              <p className="text-xs text-muted-foreground">
                Multi-agent coordination for optimal results
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Enhanced
            </Badge>
            {isAgentAssistEnabled && (
              <Badge variant="default" className="text-xs animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </div>

        {searchSuggestions.length > 0 && (
          <div className="mt-3 space-y-1">
            {searchSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-primary" />
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Enhanced Search Component */}
      <div className="relative">
        <SearchSection />
        
        {/* Agent Quick Actions Overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAgentAssistedSearch('flight', {})}
            className="text-xs h-8"
            disabled={isAgentAssistEnabled}
          >
            <Bot className="h-3 w-3 mr-1" />
            Smart Flight
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAgentAssistedSearch('hotel', {})}
            className="text-xs h-8"
            disabled={isAgentAssistEnabled}
          >
            <Bot className="h-3 w-3 mr-1" />
            Smart Hotel
          </Button>
        </div>
      </div>

      {/* Agent Coordination Widget */}
      <EnhancedAgenticWidget 
        dashboardType="user"
        onTaskUpdate={(tasks) => {
          // Handle task updates from the agent system
          console.log('Agent tasks updated:', tasks);
        }}
      />
    </div>
  );
};

export default EnhancedSearchSection;