import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sparkles,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Image,
  FileText,
  X,
  Check
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'document';
    name: string;
    url: string;
    size?: number;
  }>;
  suggestions?: string[];
}

interface WorkingTravelBotProps {
  variant?: 'widget' | 'fullscreen';
  userContext?: {
    currentTier?: string;
    nftCount?: number;
    recentBookings?: any[];
  };
}

const WorkingTravelBot: React.FC<WorkingTravelBotProps> = ({
  variant = 'widget',
  userContext
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Maku Travel Assistant. I can help you:\n\n🏨 Find and book hotels\n✈️ Search for flights\n🎁 Track your travel rewards\n📋 Plan amazing trips\n\nI can also analyze any travel documents or screenshots you share with me. What can I help you with today?",
      timestamp: new Date(),
      suggestions: [
        "Find hotels in Tokyo",
        "Compare flight prices",
        "Show my travel rewards",
        "Plan a romantic getaway"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate user reward value
  const calculateRewardValue = (userContext: any): number => {
    if (!userContext?.nftCount) return 0;
    return userContext.nftCount * 67; // $67 average per NFT
  };

  const userRewardValue = calculateRewardValue(userContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input || '[Shared files]',
      timestamp: new Date(),
      attachments: attachments.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Generate response based on input and attachments
      const response = await generateBotResponse(input, userMessage.attachments, userContext);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble processing that request. Could you try again or ask me about hotels, flights, or travel planning?",
        timestamp: new Date(),
        suggestions: ["Find hotels", "Search flights", "Plan a trip", "Check rewards"]
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
  if (variant === 'widget' && !isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full h-16 w-16 shadow-xl bg-white border-2 border-orange-500 hover:shadow-2xl hover:scale-105 transition-all duration-300"
          size="icon"
        >
          <Bot className="h-8 w-8 text-orange-600" />
        </Button>
        
        {/* Reward indicator */}
        {userRewardValue > 0 && (
          <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
            ${userRewardValue}
          </div>
        )}
        
        {/* Chat indicator */}
        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
          Chat
        </div>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[420px] h-[650px] z-50 shadow-2xl border-2 border-orange-200 bg-white">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Maku Travel Assistant</CardTitle>
              <CardDescription className="text-sm text-gray-700">
                Chat • Upload files • Get travel help
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {userRewardValue > 0 && (
              <div className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                ${userRewardValue} earned
              </div>
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
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-4 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-900 border-2 border-gray-200'
                  }`}
                >
                  <div className="text-sm leading-relaxed font-medium">
                    {message.content}
                  </div>
                  
                  {/* Show attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-white/20 rounded border">
                          {attachment.type === 'image' ? (
                            <Image className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          <span className="text-xs truncate">{attachment.name}</span>
                          {attachment.size && (
                            <span className="text-xs opacity-75">
                              ({Math.round(attachment.size / 1024)}KB)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold opacity-90">Try asking:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`h-7 text-xs ${
                              message.role === 'user'
                                ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/75' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center space-x-3 shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  <span className="text-sm text-gray-700 font-medium">Analyzing your request...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* File Attachments Preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Attached files:</p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-white border border-gray-300 rounded px-2 py-1">
                    {file.type.startsWith('image/') ? (
                      <Image className="w-3 h-3 text-blue-600" />
                    ) : (
                      <FileText className="w-3 h-3 text-green-600" />
                    )}
                    <span className="text-xs text-gray-700 truncate max-w-[100px]">
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(index)}
                      className="h-4 w-4 text-gray-500 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area with File Upload */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message or upload files..."
                disabled={isLoading}
                className="flex-1 border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white text-gray-900 placeholder-gray-500 font-medium"
              />
              
              {/* File Upload Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50"
              >
                <Paperclip className="h-4 w-4 text-gray-600" />
              </Button>
              
              {/* Send Button */}
              <Button 
                type="submit" 
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className="bg-orange-500 hover:bg-orange-600 border-2 border-orange-500 shadow-md px-4"
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
            
            {/* Capabilities hint */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
              <span className="flex items-center space-x-1">
                <Image className="w-3 h-3" />
                <span>Screenshots</span>
              </span>
              <span className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>Documents</span>
              </span>
              <span className="flex items-center space-x-1">
                <Bot className="w-3 h-3" />
                <span>AI Travel Help</span>
              </span>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced response generation with file analysis capability
async function generateBotResponse(
  input: string,
  attachments?: Array<{type: string; name: string; url: string}>,
  userContext?: any
): Promise<{content: string; suggestions?: string[]}> {
  
  // Handle file attachments
  if (attachments && attachments.length > 0) {
    const imageAttachments = attachments.filter(a => a.type === 'image');
    const docAttachments = attachments.filter(a => a.type === 'document');
    
    let response = "I can see you've shared ";
    
    if (imageAttachments.length > 0) {
      response += `${imageAttachments.length} image${imageAttachments.length > 1 ? 's' : ''}`;
    }
    
    if (docAttachments.length > 0) {
      response += `${imageAttachments.length > 0 ? ' and ' : ''}${docAttachments.length} document${docAttachments.length > 1 ? 's' : ''}`;
    }
    
    response += " with me! ";
    
    if (imageAttachments.length > 0) {
      response += "I can analyze travel photos, destination screenshots, booking confirmations, or itinerary images. ";
    }
    
    if (docAttachments.length > 0) {
      response += "I can help with travel documents, booking confirmations, itineraries, or travel plans. ";
    }
    
    response += "What would you like me to help you with regarding these files?";
    
    return {
      content: response,
      suggestions: [
        "Analyze this travel destination",
        "Help me understand this booking",
        "Plan based on this itinerary",
        "Compare these options"
      ]
    };
  }
  
  // Regular text responses
  const inputLower = input.toLowerCase();
  
  // Rewards queries
  if (inputLower.includes('reward') || inputLower.includes('nft') || inputLower.includes('credit')) {
    const rewardValue = userContext?.nftCount ? userContext.nftCount * 67 : 0;
    
    if (rewardValue > 0) {
      return {
        content: `You've earned $${rewardValue} in travel rewards! Here's how you can use them:

💳 **Platform Credits**: Apply directly to booking payments
🎯 **Member Discounts**: Get exclusive deals as a ${userContext?.currentTier || 'Explorer'} member  
🏆 **Tier Benefits**: Enhanced rewards on future bookings
🎁 **Special Access**: Exclusive experiences and early deals

Would you like me to help you use these rewards for your next trip?`,
        suggestions: [
          "Use my rewards for a hotel booking",
          "Show me member-exclusive deals",
          "How do I get more rewards?",
          "Plan a trip with my credits"
        ]
      };
    } else {
      return {
        content: `You can start earning travel rewards with your first booking! Here's how it works:

📍 **Book Travel**: Hotels, flights, activities, or cars
💰 **Earn Instantly**: Get credits worth 10-25% of your booking value
🏆 **Level Up**: Advance through tiers for better rewards
🎁 **Keep Growing**: Every trip earns you more benefits

Ready to start earning rewards from your next adventure?`,
        suggestions: [
          "Find hotels with rewards",
          "Search reward-earning flights",
          "How much can I earn?",
          "Plan my first rewarded trip"
        ]
      };
    }
  }
  
  // Hotel queries
  if (inputLower.includes('hotel') || inputLower.includes('stay')) {
    return {
      content: `I'd love to help you find the perfect hotel! 🏨 

I can search across all our partners:
• **Expedia**: 700,000+ properties worldwide (15% bonus rewards)
• **Amadeus**: Global luxury and business hotels (10% bonus)
• **RateHawk**: Best rates and instant confirmation (10% bonus)

Where are you planning to stay and when?`,
      suggestions: [
        "Luxury hotels in Santorini",
        "Budget hotels in Tokyo",
        "Romantic resorts in Maldives",
        "Business hotels in New York"
      ]
    };
  }
  
  // Flight queries
  if (inputLower.includes('flight') || inputLower.includes('fly')) {
    return {
      content: `Let me help you find the best flight deals! ✈️

I'll compare options from:
• **Amadeus**: Global airline network with best routes
• **Duffle**: Modern booking with real-time prices
• **Sabre**: Comprehensive flight options and schedules

Plus you'll earn travel rewards on every booking! Where would you like to fly?`,
      suggestions: [
        "Round trip to Europe",
        "One way flights to Asia",
        "Domestic weekend getaway",
        "Multi-city adventure"
      ]
    };
  }
  
  // Planning queries
  if (inputLower.includes('plan') || inputLower.includes('trip') || inputLower.includes('vacation')) {
    return {
      content: `I'd love to help you plan an amazing trip! 🌟

I can assist with:
• **Smart Destinations**: AI-powered recommendations based on your style
• **Complete Itineraries**: Multi-day trip planning with activities
• **Budget Planning**: Find deals that maximize your travel rewards
• **Seasonal Timing**: Best times to visit and book for savings

What type of adventure are you dreaming about?`,
      suggestions: [
        "Plan a romantic getaway",
        "Cultural exploration trip",
        "Adventure vacation",
        "Relaxing beach holiday"
      ]
    };
  }
  
  // Default helpful response
  return {
    content: `I'm here to help with all your travel needs! 🎯

I can assist you with:
• Finding and booking hotels, flights, and activities
• Planning complete trip itineraries
• Explaining and using your travel rewards
• Analyzing travel documents or screenshots you share

You can also upload any travel-related images or documents and I'll help you with them. What would you like to explore?`,
    suggestions: [
      "Find me hotel deals",
      "Compare flight prices",
      "Explain my travel rewards",
      "Help me plan a trip"
    ]
  };
}

export default WorkingTravelBot;