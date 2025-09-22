import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  Loader2,
  Calendar,
  MapPin,
  Gift,
  Star,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Heart,
  Info,
  Brain
} from 'lucide-react';

interface TravelMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  quickActions?: Array<{
    label: string;
    action: string;
    icon?: React.ReactNode;
  }>;
}

interface SimpleTravelAssistantProps {
  variant?: 'widget' | 'fullscreen' | 'embedded';
  showRewardsIntegration?: boolean;
  userContext?: {
    currentTier?: string;
    nftCount?: number;
    recentBookings?: any[];
  };
}

const SimpleTravelAssistant: React.FC<SimpleTravelAssistantProps> = ({
  variant = 'widget',
  showRewardsIntegration = true,
  userContext
}) => {
  const [messages, setMessages] = useState<TravelMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Maku, your personal travel assistant. I can help you find amazing destinations, compare booking options, and track your travel rewards. What adventure can I help you plan today? 🌍",
      timestamp: new Date(),
      suggestions: [
        "Find me a beach vacation",
        "Compare flight prices to Tokyo", 
        "Show my NFT rewards",
        "Plan a romantic getaway",
        "Help me use my travel credits"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(variant === 'fullscreen');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: TravelMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response with travel-focused logic
      const response = await generateTravelResponse(input, userContext);
      
      const assistantMessage: TravelMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        quickActions: response.quickActions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: TravelMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble understanding that right now. Can you try asking about hotels, flights, or your travel rewards instead?",
        timestamp: new Date(),
        suggestions: ["Find hotels", "Search flights", "Check my rewards", "Plan a trip"]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleQuickAction = async (action: string) => {
    const actionMessage: TravelMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: action,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, actionMessage]);
    setIsLoading(true);

    try {
      const response = await generateTravelResponse(action, userContext);
      const assistantMessage: TravelMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        quickActions: response.quickActions
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Quick action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const travelQuickActions = [
    { label: "Find Hotels", action: "Help me find hotel deals", icon: <Calendar className="w-3 h-3" /> },
    { label: "Flight Search", action: "Search for flights", icon: <MapPin className="w-3 h-3" /> },
    { label: "My Rewards", action: "Show my NFT collection and rewards", icon: <Gift className="w-3 h-3" /> },
    { label: "Plan Trip", action: "Help me plan a perfect trip", icon: <Sparkles className="w-3 h-3" /> }
  ];

  if (variant === 'widget' && !isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full h-16 w-16 shadow-lg bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600"
          size="icon"
        >
          <Bot className="h-8 w-8 text-white" />
        </Button>
        {userContext?.nftCount && userContext.nftCount > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 bg-green-500 text-white border-none px-2"
          >
            {userContext.nftCount} NFTs
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={`${
      variant === 'widget' 
        ? 'fixed bottom-6 right-6 w-96 h-[500px] z-50 shadow-xl' 
        : variant === 'embedded'
          ? 'w-full h-[400px]'
          : 'w-full h-[600px]'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-green-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Maku Travel Assistant</CardTitle>
              <CardDescription className="text-xs">AI-powered travel help</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showRewardsIntegration && userContext && userContext.nftCount > 0 && (
              <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                ${calculateRewardValue(userContext)} earned
              </div>
            )}
            {variant === 'widget' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Quick Actions Bar */}
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {travelQuickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                disabled={isLoading}
                className="text-xs h-7"
              >
                {action.icon}
                <span className="ml-1">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Conversation Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm leading-relaxed">{message.content}</div>
                  
                  {message.suggestions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs opacity-80">Try asking:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="h-6 text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {message.quickActions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs opacity-80">Quick actions:</p>
                      <div className="space-y-1">
                        {message.quickActions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAction(action.action)}
                            className="w-full justify-start h-7 text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                          >
                            {action.icon}
                            <span className="ml-2">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span className="text-sm text-gray-700">Maku is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about hotels, flights, rewards, or planning..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          <div className="flex items-center justify-center mt-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Info className="w-3 h-3" />
              <span>Powered by AI • Travel-focused assistance</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// AI Response Generation for Travel-Focused Conversations
async function generateTravelResponse(
  input: string, 
  userContext?: any
): Promise<{
  content: string;
  suggestions?: string[];
  quickActions?: Array<{label: string; action: string; icon?: React.ReactNode}>;
}> {
  const inputLower = input.toLowerCase();
  
  // Travel booking queries
  if (inputLower.includes('hotel') || inputLower.includes('stay') || inputLower.includes('accommodation')) {
    return {
      content: "I'd love to help you find the perfect hotel! 🏨 I can search across all our providers (Expedia, Amadeus, RateHawk) to find the best deals. Where are you planning to stay and when?",
      suggestions: [
        "Beach resort in Maldives",
        "City hotel in Tokyo", 
        "Luxury resort in Santorini",
        "Budget hotel in Paris"
      ],
      quickActions: [
        { label: "Search Hotels", action: "Open hotel search", icon: <Calendar className="w-3 h-3" /> },
        { label: "Popular Destinations", action: "Show popular hotel destinations", icon: <MapPin className="w-3 h-3" /> }
      ]
    };
  }
  
  // Flight queries
  if (inputLower.includes('flight') || inputLower.includes('fly') || inputLower.includes('airport')) {
    return {
      content: "I can help you find the best flight deals! ✈️ I'll search across Amadeus, Duffle, and Sabre to compare prices and find options that fit your schedule. Where would you like to fly?",
      suggestions: [
        "Round trip to Europe",
        "One way to New York",
        "Multi-city Asian adventure",
        "Weekend getaway flights"
      ],
      quickActions: [
        { label: "Search Flights", action: "Open flight search", icon: <Calendar className="w-3 h-3" /> },
        { label: "Flight Deals", action: "Show current flight deals", icon: <Star className="w-3 h-3" /> }
      ]
    };
  }
  
  // Rewards and NFT queries
  if (inputLower.includes('reward') || inputLower.includes('nft') || inputLower.includes('tier') || inputLower.includes('points')) {
    const tierInfo = userContext?.currentTier || 'Explorer';
    const nftCount = userContext?.nftCount || 0;
    
    return {
      content: `Great question about your rewards! 🏆 You're currently a ${tierInfo} tier member with ${nftCount} travel NFTs. Each booking earns you platform credits and potential NFT rewards. Your tier gives you enhanced benefits and airdrop multipliers!`,
      suggestions: [
        "How do I earn more NFTs?",
        "What's my next tier?",
        "Show my airdrop progress",
        "Explain provider bonuses"
      ],
      quickActions: [
        { label: "View NFT Collection", action: "Open NFT dashboard", icon: <Gift className="w-3 h-3" /> },
        { label: "Airdrop Progress", action: "Check airdrop status", icon: <Star className="w-3 h-3" /> }
      ]
    };
  }
  
  // Smart Dreams and AI planning
  if (inputLower.includes('plan') || inputLower.includes('dream') || inputLower.includes('destination') || inputLower.includes('ai')) {
    return {
      content: "I'd love to help you plan your perfect trip! 🌟 I can use our Smart Dreams AI to analyze your travel personality and suggest destinations that match your style. Want me to create a personalized journey for you?",
      suggestions: [
        "Analyze my travel style",
        "Suggest romantic destinations",
        "Plan a cultural adventure",
        "Find unique experiences"
      ],
      quickActions: [
        { label: "Smart Dreams", action: "Open Smart Dreams planner", icon: <Sparkles className="w-3 h-3" /> },
        { label: "AI Recommendations", action: "Get AI travel suggestions", icon: <Brain className="w-3 h-3" /> }
      ]
    };
  }
  
  // Default helpful response
  return {
    content: "I'm here to help with all your travel needs! I can assist with booking hotels and flights, explaining your NFT rewards, planning trips with our AI, or answering any travel questions. What would you like to explore?",
    suggestions: [
      "Help me book a hotel",
      "Find flight deals",
      "Explain my rewards",
      "Plan a trip with AI",
      "Show me popular destinations"
    ],
    quickActions: [
      { label: "Start Booking", action: "Begin travel search", icon: <Calendar className="w-3 h-3" /> },
      { label: "Explore Rewards", action: "View rewards system", icon: <Gift className="w-3 h-3" /> }
    ]
  };
}

export default SimpleTravelAssistant;