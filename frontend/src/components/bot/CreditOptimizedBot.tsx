import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Send, 
  Loader2,
  Paperclip,
  Image,
  FileText,
  X,
  ChevronDown,
  Zap,
  DollarSign
} from 'lucide-react';

interface OptimizedChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'ai' | 'smart_pattern' | 'cache';
  creditsUsed?: number;
  suggestions?: string[];
}

interface CreditOptimizedBotProps {
  userContext?: {
    currentTier?: string;
    nftCount?: number;
    recentBookings?: any[];
  };
}

const CreditOptimizedBot: React.FC<CreditOptimizedBotProps> = ({ userContext }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<OptimizedChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your credit-efficient travel assistant. I use smart patterns for quick answers and AI only for complex planning. How can I help you save money while traveling smart? 💰",
      timestamp: new Date(),
      source: 'smart_pattern',
      creditsUsed: 0,
      suggestions: ["Find cheap hotels", "Flight deals", "Use my rewards", "Plan efficient trip"]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCreditsUsed, setDailyCreditsUsed] = useState(0);
  const [creditLimit] = useState(50); // Daily credit limit
  
  // Response cache to avoid repeated AI calls
  const [responseCache] = useState(() => new Map([
    // Pre-populate common travel queries
    ['hello', {
      content: "Hello! I'm Maku, your travel assistant. I help find deals, use rewards, and plan trips efficiently. What can I help you with?",
      suggestions: ["Find hotels", "Search flights", "Check rewards", "Plan trip"],
      source: 'cache',
      creditsUsed: 0
    }],
    ['help', {
      content: "I can help you with:\n• Finding hotel and flight deals\n• Using your travel rewards\n• Planning cost-effective trips\n• Maximizing member benefits\n\nWhat specific help do you need?",
      suggestions: ["Hotel deals", "Flight search", "Use rewards", "Plan budget trip"],
      source: 'cache', 
      creditsUsed: 0
    }],
    ['hotel', {
      content: `I'll help you find great hotel deals! 🏨 With your ${userContext?.currentTier || 'Explorer'} status, you get enhanced rates across:\n• Expedia (15% bonus)\n• Amadeus (10% bonus)\n• RateHawk (10% bonus)\n\nWhere would you like to stay?`,
      suggestions: ["Popular cities", "Luxury options", "Budget hotels", "Use my credits"],
      source: 'smart_pattern',
      creditsUsed: 0
    }],
    ['flight', {
      content: `Let's find you flights! ✈️ I'll search across Amadeus, Duffle, and Sabre for the best deals. As a ${userContext?.currentTier || 'Explorer'} member, you get priority access and can use your rewards for additional savings. Where are you flying?`,
      suggestions: ["Popular routes", "Weekend trips", "International", "Apply rewards"],
      source: 'smart_pattern',
      creditsUsed: 0
    }]
  ]));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const shouldUseAI = (input: string): boolean => {
    // Only use AI for complex queries to save credits
    const complexIndicators = [
      'plan a trip to', 'recommend', 'optimize', 'analyze',
      'multiple destinations', 'best strategy', 'complex itinerary',
      'detailed analysis', 'compare multiple', 'ai recommendation'
    ];
    
    const inputLower = input.toLowerCase();
    const isComplex = complexIndicators.some(indicator => inputLower.includes(indicator));
    const isLongQuery = input.length > 40;
    
    return isComplex && isLongQuery && dailyCreditsUsed < creditLimit;
  };

  const generateResponse = async (input: string): Promise<OptimizedChatMessage> => {
    const inputKey = input.toLowerCase().substring(0, 20).trim();
    
    // Check cache first
    const cached = responseCache.get(inputKey);
    if (cached) {
      console.log('💰 CACHE HIT: Saved credits using cached response');
      return {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cached.content,
        timestamp: new Date(),
        source: 'cache',
        creditsUsed: 0,
        suggestions: cached.suggestions
      };
    }

    // Use AI only for complex queries
    if (shouldUseAI(input)) {
      console.log('🤖 USING AI: Complex query detected');
      try {
        const aiResponse = await callOptimizedAI(input);
        
        setDailyCreditsUsed(prev => prev + 0.02); // Estimate credit cost
        
        // Cache AI response
        responseCache.set(inputKey, {
          content: aiResponse.content,
          suggestions: aiResponse.suggestions,
          source: 'ai',
          creditsUsed: 0.02
        });
        
        return {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse.content,
          timestamp: new Date(),
          source: 'ai',
          creditsUsed: 0.02,
          suggestions: aiResponse.suggestions
        };
      } catch (error) {
        console.log('🔄 AI FAILED: Using smart pattern fallback');
        return generateSmartPatternResponse(input);
      }
    } else {
      console.log('💡 SMART PATTERN: Using efficient pattern matching');
      return generateSmartPatternResponse(input);
    }
  };

  const generateSmartPatternResponse = (input: string): OptimizedChatMessage => {
    const inputLower = input.toLowerCase();
    const rewardValue = userContext?.nftCount ? userContext.nftCount * 67 : 0;
    const tier = userContext?.currentTier || 'Explorer';
    
    let content = "";
    let suggestions: string[] = [];
    
    // Smart pattern matching for common queries
    if (inputLower.includes('hotel') || inputLower.includes('accommodation') || inputLower.includes('stay')) {
      content = `I'll help you find great hotel deals! 🏨 As a ${tier} member${rewardValue > 0 ? ` with $${rewardValue} in rewards` : ''}, you get:\n\n• **Expedia**: 15% bonus rewards\n• **Amadeus**: 10% bonus + premium hotels\n• **RateHawk**: 10% bonus + instant booking\n\nWhere would you like to stay?`;
      suggestions = ["Tokyo hotels", "Paris luxury", "Budget options", rewardValue > 0 ? "Use my $" + rewardValue : "Earn rewards"];
    }
    else if (inputLower.includes('flight') || inputLower.includes('fly') || inputLower.includes('airline')) {
      content = `Let's find you flights! ✈️ I'll search across our flight partners:\n\n• **Amadeus**: Global network with best routes\n• **Duffle**: Real-time prices and modern booking\n• **Sabre**: Comprehensive options\n\n${rewardValue > 0 ? `You can use your $${rewardValue} in rewards for extra savings!` : 'Every booking earns you rewards!'} Where are you flying?`;
      suggestions = ["Europe flights", "Asia routes", "Weekend trips", "Best deals"];
    }
    else if (inputLower.includes('reward') || inputLower.includes('nft') || inputLower.includes('credit') || inputLower.includes('benefit')) {
      if (rewardValue > 0) {
        content = `You have $${rewardValue} in travel rewards! 🏆 Here's how to maximize them:\n\n💳 **Apply as Credits**: Use toward any booking\n🎯 **Member Discounts**: Stack with ${tier} tier benefits\n🏆 **Earn More**: Get 10-15% bonus on future bookings\n\nReady to use these rewards?`;
        suggestions = ["Use for hotel booking", "Apply to flights", "Show member deals", "Earn more rewards"];
      } else {
        content = `Start earning travel rewards! 🌟 Here's how:\n\n📍 **Every Booking**: Earn 10-25% in credits\n🏆 **Tier Benefits**: Advance for better rewards\n🎁 **Provider Bonuses**: Extra % with each partner\n\nReady to start earning?`;
        suggestions = ["How much can I earn?", "Best providers", "First booking", "Tier benefits"];
      }
    }
    else if (inputLower.includes('plan') || inputLower.includes('trip') || inputLower.includes('vacation') || inputLower.includes('travel')) {
      content = `I'd love to help you plan a smart trip! 🌟 I can:\n\n🎯 **Find Deals**: Best rates across 6 providers\n💰 **Maximize Rewards**: Earn while you travel\n📍 **Smart Routing**: Efficient itineraries\n🏆 **Use Benefits**: Apply your ${tier} member perks\n\nWhat type of adventure are you planning?`;
      suggestions = ["Romantic getaway", "Cultural trip", "Adventure vacation", "Budget travel"];
    }
    else {
      content = `I'm your efficient travel assistant! 🎯 I help with:\n\n🏨 Hotel bookings with best rewards\n✈️ Flight searches across multiple airlines\n🎁 Using your travel rewards (${rewardValue > 0 ? `$${rewardValue} available` : 'start earning!'})\n📋 Smart trip planning\n\nWhat can I help you with today?`;
      suggestions = ["Find hotels", "Search flights", "Check rewards", "Plan trip"];
    }
    
    return {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      source: 'smart_pattern',
      creditsUsed: 0,
      suggestions
    };
  };

  const callOptimizedAI = async (input: string) => {
    // Simplified AI call for complex queries only
    const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'https://api.maku.travel';
    
    try {
      // Use shorter, more efficient AI calls
      const response = await fetch(`${backendUrl}/api/ai/recommendations/demo_user?max_results=1`);
      
      if (response.ok) {
        const data = await response.json();
        const rec = data.recommendations?.[0];
        
        if (rec) {
          return {
            content: `Based on AI analysis, I recommend ${rec.destination_name || 'this destination'} (${rec.recommendation_score || 90}% match). ${rec.ai_insights?.[0]?.insight_text?.substring(0, 200) || 'Perfect for your travel style'}...`,
            suggestions: [`Hotels in ${rec.destination_name}`, "More AI recommendations", "Plan this trip", "Check costs"]
          };
        }
      }
    } catch (error) {
      console.log('AI call failed, using smart fallback');
    }
    
    // Fallback without credits
    return {
      content: "I'd recommend exploring popular destinations based on your preferences. Would you like me to show you some options?",
      suggestions: ["Show popular destinations", "Budget options", "Luxury travel", "Weekend trips"]
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: OptimizedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      source: 'user',
      creditsUsed: 0
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateResponse(input);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Response generation failed:', error);
      const errorMessage: OptimizedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble with that request. Try asking about hotels, flights, or your travel rewards!",
        timestamp: new Date(),
        source: 'smart_pattern',
        creditsUsed: 0,
        suggestions: ["Find hotels", "Search flights", "Check rewards"]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Calculate reward value
  const rewardValue = userContext?.nftCount ? userContext.nftCount * 67 : 0;

  // Collapsed widget
  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full h-16 w-16 shadow-xl bg-white border-2 border-green-500 hover:shadow-2xl hover:scale-105 transition-all duration-300"
          size="icon"
        >
          <Bot className="h-8 w-8 text-green-600" />
        </Button>
        
        {/* Credit usage indicator */}
        <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
          {dailyCreditsUsed.toFixed(1)} credits
        </div>
        
        {/* Reward value */}
        {rewardValue > 0 && (
          <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            ${rewardValue}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[420px] h-[650px] z-50 shadow-2xl border-2 border-green-200 bg-white overflow-hidden">
      {/* Header with Credit Tracking */}
      <CardHeader className="pb-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Maku Assistant</CardTitle>
              <CardDescription className="text-sm text-gray-700">
                Credit-efficient AI travel help
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
              <DollarSign className="w-3 h-3 mr-1" />
              {dailyCreditsUsed.toFixed(1)} credits used
            </Badge>
            
            {rewardValue > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                ${rewardValue} rewards
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Credit Usage Warning */}
        {dailyCreditsUsed > creditLimit * 0.8 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <Zap className="w-3 h-3 inline mr-1" />
            High credit usage - using smart patterns to save costs
          </div>
        )}
      </CardHeader>

      {/* Chat Area with Source Indicators */}
      <div className="flex flex-col h-[calc(650px-140px)] overflow-hidden">
        <ScrollArea className="flex-1 px-4 py-2 overflow-y-auto">
          <div className="space-y-3 pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[280px] rounded-lg p-3 shadow-sm break-words ${
                    message.role === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-900 border-2 border-gray-200'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  
                  {/* Show response source and credit usage */}
                  {message.role === 'assistant' && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        {message.source === 'ai' && <Zap className="w-3 h-3 text-blue-500" />}
                        {message.source === 'smart_pattern' && <Bot className="w-3 h-3 text-green-500" />}
                        {message.source === 'cache' && <DollarSign className="w-3 h-3 text-gray-500" />}
                        <span className="text-gray-600">
                          {message.source === 'ai' ? 'AI' : message.source === 'cache' ? 'Cached' : 'Smart'}
                        </span>
                      </div>
                      {message.creditsUsed !== undefined && (
                        <span className="text-gray-500">
                          {message.creditsUsed > 0 ? `${message.creditsUsed.toFixed(3)} credits` : 'Free'}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold opacity-90">Quick options:</p>
                      <div className="grid grid-cols-1 gap-1">
                        {message.suggestions.slice(0, 3).map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`h-6 text-xs text-left justify-start p-1 px-2 ${
                              message.role === 'user'
                                ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span className="truncate">{suggestion}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs mt-2 text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-3 flex items-center space-x-2 shadow-sm max-w-[280px]">
                  <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                  <span className="text-sm text-gray-700">
                    {shouldUseAI(input) ? 'Using AI...' : 'Processing...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area with Credit Warning */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={dailyCreditsUsed > creditLimit * 0.8 ? "Simple questions save credits..." : "Ask about travel..."}
                disabled={isLoading}
                className="flex-1 border-2 border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 bg-white text-gray-900 text-sm"
              />
              
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-green-500 hover:bg-green-600 border-2 border-green-500 shadow-md px-3 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Credit usage indicator */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Credits: {dailyCreditsUsed.toFixed(1)}/{creditLimit}</span>
              <span className="flex items-center space-x-1">
                <Bot className="w-3 h-3" />
                <span>Smart + AI help</span>
              </span>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};

// Optimized AI call with minimal tokens
async function callOptimizedAI(input: string) {
  // This would call the backend with optimized prompts
  // For now, return smart response to save credits
  return {
    content: "I'm using smart patterns to save credits while still helping you effectively! What specific travel assistance do you need?",
    suggestions: ["Hotel search", "Flight deals", "Use rewards", "Plan trip"]
  };
}

export default CreditOptimizedBot;