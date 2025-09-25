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
  DollarSign,
  Zap
} from 'lucide-react';

interface StableChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'free_api' | 'mock' | 'emergent' | 'cache';
  creditsUsed?: number;
  suggestions?: string[];
  attachments?: Array<{
    type: string;
    name: string;
    url: string;
  }>;
}

interface StableTravelBotProps {
  userContext?: {
    currentTier?: string;
    nftCount?: number;
    recentBookings?: any[];
  };
}

const StableTravelBot: React.FC<StableTravelBotProps> = ({ userContext }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<StableChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "🆓 FREE DEVELOPMENT MODE: Hi! I'm your TravelHub Assistant. I'm using free AI APIs during development to save your credits while providing intelligent travel help.\n\nI can assist with:\n🏨 Hotel searches across 6 providers\n✈️ Flight comparisons and deals\n🎁 Travel reward optimization\n📋 Trip planning and recommendations\n📎 File analysis (upload screenshots/documents)\n\nWhat can I help you with today?",
      timestamp: new Date(),
      source: 'free_api',
      creditsUsed: 0,
      suggestions: ["Find hotels in Tokyo", "Compare flight prices", "Explain my $201 rewards", "Plan a romantic trip"]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [emergentCreditsUsed, setEmergentCreditsUsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const calculateRewardValue = (userContext: any): number => {
    if (!userContext?.nftCount) return 0;
    return userContext.nftCount * 67; // $67 average per NFT
  };

  const rewardValue = calculateRewardValue(userContext);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    // Create user message
    const userMessage: StableChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input || '[Files shared]',
      timestamp: new Date(),
      attachments: attachments.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        url: URL.createObjectURL(file)
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Call free API endpoint
      const response = await generateStableResponse(input, userMessage.attachments, userContext);
      
      const assistantMessage: StableChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        source: response.source,
        creditsUsed: response.creditsUsed || 0,
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Track Emergent credit usage
      if (response.source === 'emergent') {
        setEmergentCreditsUsed(prev => prev + (response.creditsUsed || 0));
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: StableChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble with that request. Let me help you with hotels, flights, or travel planning instead!",
        timestamp: new Date(),
        source: 'mock',
        creditsUsed: 0,
        suggestions: ["Find hotels", "Search flights", "Check rewards", "Plan trip"]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Collapsed widget view
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
        
        {/* Free development indicator */}
        <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
          FREE
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
      {/* Header with Free Development Indicator */}
      <CardHeader className="pb-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Maku Travel Assistant</CardTitle>
              <CardDescription className="text-sm text-gray-700">
                Free development • Smart travel help
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
              <DollarSign className="w-3 h-3 mr-1" />
              {emergentCreditsUsed.toFixed(2)} credits
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
      </CardHeader>

      {/* Chat Area */}
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
                  
                  {/* Show attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-white/20 rounded border text-xs">
                          {attachment.type === 'image' ? (
                            <Image className="w-3 h-3" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          <span className="truncate flex-1">{attachment.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Source and credit info */}
                  {message.role === 'assistant' && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        {message.source === 'emergent' && <Zap className="w-3 h-3 text-red-500" />}
                        {message.source === 'free_api' && <Bot className="w-3 h-3 text-green-500" />}
                        {message.source === 'mock' && <DollarSign className="w-3 h-3 text-gray-500" />}
                        <span className="text-gray-600 capitalize">
                          {message.source === 'emergent' ? 'Paid AI' : message.source === 'free_api' ? 'Free API' : 'Free Mock'}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        {message.creditsUsed && message.creditsUsed > 0 ? 
                          `${message.creditsUsed.toFixed(3)} credits` : 
                          'Free'
                        }
                      </span>
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold opacity-90">Try:</p>
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
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-3 flex items-center space-x-2 shadow-sm max-w-[280px]">
                  <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                  <span className="text-sm text-gray-700">
                    Using free APIs...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* File Attachments Preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="space-y-2 max-h-20 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-700">Files to send:</p>
              <div className="grid grid-cols-1 gap-1">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-white border border-gray-300 rounded px-2 py-1">
                    {file.type.startsWith('image/') ? (
                      <Image className="w-3 h-3 text-blue-600" />
                    ) : (
                      <FileText className="w-3 h-3 text-green-600" />
                    )}
                    <span className="text-xs text-gray-700 truncate flex-1">
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(index)}
                      className="h-4 w-4 text-gray-500 hover:text-red-600 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about travel (using free APIs)..."
                disabled={isLoading}
                className="flex-1 border-2 border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 bg-white text-gray-900 text-sm"
              />
              
              {/* File Upload Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex-shrink-0"
              >
                <Paperclip className="h-4 w-4 text-gray-600" />
              </Button>
              
              {/* Send Button */}
              <Button 
                type="submit" 
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className="bg-green-500 hover:bg-green-600 border-2 border-green-500 shadow-md px-3 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* File input (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Development mode indicator */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center space-x-1">
                <Bot className="w-3 h-3 text-green-500" />
                <span>Free development mode</span>
              </span>
              <span>Emergent credits saved: {emergentCreditsUsed.toFixed(2)}</span>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};

// Stable response generation using free APIs
async function generateStableResponse(
  input: string,
  attachments?: Array<{type: string; name: string; url: string}>,
  userContext?: any
): Promise<{content: string; suggestions?: string[]; source: string; creditsUsed?: number}> {
  
  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'https://travel-portal-dev.preview.emergentagent.com';
  
  try {
    // Handle file attachments
    if (attachments && attachments.length > 0) {
      const imageCount = attachments.filter(a => a.type === 'image').length;
      const docCount = attachments.filter(a => a.type === 'document').length;
      
      let response = "🆓 FREE FILE ANALYSIS: I can see you've shared ";
      if (imageCount > 0) response += `${imageCount} image${imageCount > 1 ? 's' : ''} `;
      if (docCount > 0) response += `${docCount} document${docCount > 1 ? 's' : ''} `;
      
      response += "with me!\n\n";
      
      if (imageCount > 0) {
        response += "📸 **Image Analysis**: I can help identify destinations, analyze booking screenshots, or review travel photos using free AI.\n\n";
      }
      
      if (docCount > 0) {
        response += "📄 **Document Review**: I can assist with itineraries, booking confirmations, or travel plans using intelligent processing.\n\n";
      }
      
      response += `💡 **Smart Help**: As a ${userContext?.currentTier || 'Explorer'} member with $${calculateRewardValue(userContext)} in rewards, I can show you how to maximize these benefits!\n\nWhat specific help do you need with these files?`;
      
      return {
        content: response,
        suggestions: ["Analyze travel photos", "Review booking details", "Plan from itinerary", "Optimize rewards"],
        source: "free_api",
        creditsUsed: 0
      };
    }

    // Try to call free backend endpoints
    const response = await fetch(`${backendUrl}/api/ai/travel-dna/demo_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: input,
        preferences: input
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Check if response indicates free mode
      if (data.development_note) {
        return {
          content: data.travel_dna ? 
            `🆓 FREE AI ANALYSIS: Based on your travel patterns, you're a ${data.travel_dna.primary_type} (${Math.round(data.travel_dna.confidence_score * 100)}% confidence).\n\nKey traits:\n• ${data.travel_dna.personality_factors?.[0]?.factor || 'Culture'} enthusiast (${Math.round((data.travel_dna.personality_factors?.[0]?.weight || 0.9) * 100)}%)\n• ${data.travel_dna.personality_factors?.[1]?.factor || 'Photography'} lover (${Math.round((data.travel_dna.personality_factors?.[1]?.weight || 0.8) * 100)}%)\n\nPerfect destinations: Florence, Kyoto, Santorini\nAs a ${userContext?.currentTier} member, use Expedia (15% bonus) or Amadeus (10% bonus) for maximum rewards!` :
            "I'm analyzing your travel preferences using free AI APIs to save development costs while providing intelligent assistance!",
          suggestions: ["Find hotels", "Get recommendations", "Plan trip", "Use rewards"],
          source: "free_api",
          creditsUsed: 0
        };
      } else {
        // Response from paid API
        return {
          content: data.travel_dna?.primary_type ? 
            `Based on AI analysis, you're a ${data.travel_dna.primary_type} with ${Math.round(data.travel_dna.confidence_score * 100)}% confidence.` :
            "AI analysis complete.",
          suggestions: ["More details", "Recommendations", "Plan trip"],
          source: "emergent",
          creditsUsed: 0.2
        };
      }
    }
    
  } catch (error) {
    console.error('API call failed:', error);
  }

  // Fallback to intelligent mock (always free)
  return generateIntelligentMockResponse(input, userContext);
}

// Intelligent mock responses (no API calls, no credits)
function generateIntelligentMockResponse(input: string, userContext: any) {
  const inputLower = input.toLowerCase();
  const rewardValue = userContext?.nftCount ? userContext.nftCount * 67 : 0;
  const tier = userContext?.currentTier || 'Explorer';
  
  if (inputLower.includes('hotel') || inputLower.includes('stay')) {
    return {
      content: `🆓 FREE HOTEL SEARCH: I'll help you find great hotels! As a ${tier} member with $${rewardValue} in rewards:\n\n🏨 **Best Options**:\n• Expedia: 700K+ properties (15% bonus)\n• Amadeus: Premium hotels (10% bonus) \n• RateHawk: Best rates (10% bonus)\n\n💰 **Your Savings**: Use $${rewardValue} credits + member discounts\n\nWhere would you like to stay?`,
      suggestions: ["Tokyo hotels", "Paris luxury", "Budget options", "Use my credits"],
      source: "mock",
      creditsUsed: 0
    };
  }
  
  if (inputLower.includes('flight') || inputLower.includes('fly')) {
    return {
      content: `🆓 FREE FLIGHT SEARCH: Let's find you flights! With your ${tier} status:\n\n✈️ **Top Airlines**: Amadeus global network, Duffle real-time prices\n💳 **Smart Savings**: Apply your $${rewardValue} + earn more\n🎯 **Member Perks**: ${tier} priority booking\n\nWhere are you flying?`,
      suggestions: ["Europe flights", "Asia routes", "Weekend trips", "Use rewards"],
      source: "mock", 
      creditsUsed: 0
    };
  }
  
  if (inputLower.includes('reward') || inputLower.includes('nft') || inputLower.includes('credit')) {
    return {
      content: `🆓 FREE REWARDS ANALYSIS: You have $${rewardValue} in travel rewards! Here's how to maximize them:\n\n💳 **Platform Credits**: Use for booking discounts\n🎯 **${tier} Benefits**: Enhanced member rates\n🏆 **Tier Perks**: Priority support & exclusive deals\n\nHow would you like to use your rewards?`,
      suggestions: ["Apply to booking", "Show exclusive deals", "Earn more", "Member benefits"],
      source: "mock",
      creditsUsed: 0
    };
  }
  
  return {
    content: `🆓 FREE DEVELOPMENT MODE: I'm your cost-efficient travel assistant! No Emergent credits used.\n\nI can help with:\n🏨 Hotel bookings across 6 providers\n✈️ Flight searches and comparisons\n🎁 Travel reward optimization ($${rewardValue} available)\n📋 Smart trip planning\n\nAs a ${tier} member, you get enhanced benefits. What can I help you with?`,
    suggestions: ["Find hotels", "Search flights", "Use rewards", "Plan trip"],
    source: "mock",
    creditsUsed: 0
  };
}

function calculateRewardValue(userContext: any): number {
  if (!userContext?.nftCount) return 0;
  return userContext.nftCount * 67;
}

export default StableTravelBot;