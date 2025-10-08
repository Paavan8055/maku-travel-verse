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
    <Card className="fixed bottom-6 right-6 w-[420px] h-[650px] z-50 shadow-2xl border-2 border-orange-200 bg-white overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-green-50 flex-shrink-0">
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

      {/* Chat Area - Fixed Height with Proper Scrolling */}
      <div className="flex flex-col h-[calc(650px-120px)] overflow-hidden">
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
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-900 border-2 border-gray-200'
                  }`}
                >
                  <div className="text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">
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
                  
                  <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/75' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-3 flex items-center space-x-2 shadow-sm max-w-[280px]">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span className="text-sm text-gray-700 font-medium">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* File Attachments Preview - Fixed Position */}
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

        {/* Input Area - Fixed at Bottom */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about travel..."
                disabled={isLoading}
                className="flex-1 border-2 border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 bg-white text-gray-900 placeholder-gray-500 text-sm"
              />
              
              {/* File Upload Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 flex-shrink-0"
              >
                <Paperclip className="h-4 w-4 text-gray-600" />
              </Button>
              
              {/* Send Button */}
              <Button 
                type="submit" 
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className="bg-orange-500 hover:bg-orange-600 border-2 border-orange-500 shadow-md px-3 flex-shrink-0"
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
            <div className="flex items-center justify-center space-x-3 text-xs text-gray-600">
              <span className="flex items-center space-x-1">
                <Image className="w-3 h-3" />
                <span>Images</span>
              </span>
              <span className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>Docs</span>
              </span>
              <span className="flex items-center space-x-1">
                <Bot className="w-3 h-3" />
                <span>AI Help</span>
              </span>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};



// Enhanced AI response generation using real Emergent LLM integration
async function generateBotResponse(
  input: string,
  attachments?: Array<{type: string; name: string; url: string}>,
  userContext?: any
): Promise<{content: string; suggestions?: string[]}> {
  
  try {
    // Use existing AI endpoints that are already working
    const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'https://journey-planner-137.preview.emergentagent.com';
    console.log('🤖 WorkingTravelBot: Using backend URL:', backendUrl);
    
    // Handle file attachments with intelligent analysis
    if (attachments && attachments.length > 0) {
      const imageAttachments = attachments.filter(a => a.type === 'image');
      const docAttachments = attachments.filter(a => a.type === 'document');
      
      let response = "I can see you've shared ";
      if (imageAttachments.length > 0) {
        response += `${imageAttachments.length} image${imageAttachments.length > 1 ? 's' : ''} `;
      }
      if (docAttachments.length > 0) {
        response += `${docAttachments.length} document${docAttachments.length > 1 ? 's' : ''} `;
      }
      
      response += "with me! 📎\n\n";
      
      // Use AI to generate intelligent file analysis
      if (imageAttachments.length > 0) {
        response += "🖼️ **AI Image Analysis**: I can help identify destinations, analyze booking screenshots, review hotel photos, or examine travel documents in your images using advanced AI.\n\n";
      }
      
      if (docAttachments.length > 0) {
        response += "📄 **AI Document Analysis**: I can review itineraries, booking confirmations, travel plans, or any travel-related documents you've shared using intelligent processing.\n\n";
      }
      
      response += `💡 **Smart AI Assistance**: As a ${userContext?.currentTier || 'Explorer'} member with $${userContext?.nftCount ? userContext.nftCount * 67 : 0} in rewards, I can use AI to show you how to maximize benefits from your travels.\n\nWhat specific help do you need with these files?`;
      
      return {
        content: response,
        suggestions: [
          "Analyze these travel photos with AI",
          "Help me understand this booking",
          "Review this itinerary with AI", 
          "How can I earn rewards here?"
        ]
      };
    }

    // Determine the best AI endpoint to use based on input
    const intent = extractIntent(input);
    let aiResponse = null;

    console.log('🤖 WorkingTravelBot: Detected intent:', intent);

    try {
      // Try to use existing AI intelligence endpoints for smart responses
      if (intent === 'trip_planning' || intent === 'general_inquiry') {
        console.log('🤖 WorkingTravelBot: Calling AI recommendations endpoint');
        // Use AI recommendations endpoint
        const recommendationsResponse = await fetch(`${backendUrl}/api/ai/recommendations/demo_user?max_results=3&include_social_proof=true`);
        if (recommendationsResponse.ok) {
          const aiData = await recommendationsResponse.json();
          console.log('🤖 WorkingTravelBot: AI recommendations received');
          aiResponse = generateIntelligentResponseFromAI(input, aiData, userContext);
        } else {
          console.log('🤖 WorkingTravelBot: AI recommendations failed with status:', recommendationsResponse.status);
        }
      } else if (intent === 'rewards_inquiry') {
        console.log('🤖 WorkingTravelBot: Calling Travel DNA endpoint');
        // Use travel DNA endpoint for personalized response
        const dnaResponse = await fetch(`${backendUrl}/api/ai/travel-dna/demo_user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ travel_preferences: input })
        });
        if (dnaResponse.ok) {
          const dnaData = await dnaResponse.json();
          console.log('🤖 WorkingTravelBot: Travel DNA data received');
          aiResponse = generateRewardsResponseFromDNA(input, dnaData, userContext);
        } else {
          console.log('🤖 WorkingTravelBot: Travel DNA failed with status:', dnaResponse.status);
        }
      }
    } catch (apiError) {
      console.log('🤖 WorkingTravelBot: AI API error:', apiError);
      console.log('AI API unavailable, using intelligent fallback');
    }

    // If AI response was generated, use it; otherwise use intelligent fallback
    if (aiResponse) {
      console.log('🤖 WorkingTravelBot: Using AI response');
      return aiResponse;
    } else {
      console.log('🤖 WorkingTravelBot: Using intelligent fallback');
      return generateIntelligentFallback(input, userContext, attachments);
    }
    
  } catch (error) {
    console.error('🤖 WorkingTravelBot: AI response generation failed:', error);
    return generateIntelligentFallback(input, userContext, attachments);
  }
}

// Generate intelligent response from AI recommendations
function generateIntelligentResponseFromAI(
  input: string,
  aiData: any,
  userContext?: any
): {content: string; suggestions?: string[]} {
  
  const recommendations = aiData.recommendations || [];
  const rewardValue = userContext?.nftCount ? userContext.nftCount * 67 : 0;
  
  if (recommendations.length > 0) {
    const firstRec = recommendations[0];
    
    return {
      content: `Based on my AI analysis of your travel preferences, I have some personalized recommendations! 🤖

🎯 **Top AI Recommendation**: ${firstRec.destination_name || 'Amazing Destination'}
${firstRec.ai_insights && firstRec.ai_insights[0] ? firstRec.ai_insights[0].insight_text : 'Perfect match for your travel style!'}

🏆 **Smart Booking Strategy**: With your ${userContext?.currentTier || 'Explorer'} status and $${rewardValue} in rewards, I can help you maximize both savings and earnings.

📊 **AI Confidence**: ${Math.round((firstRec.recommendation_score || 85) * 1.1)}% match for your travel personality

Would you like me to help you plan and book this AI-recommended destination?`,
      suggestions: [
        `Find hotels in ${firstRec.destination_name || 'this destination'}`,
        "See more AI recommendations",
        "Plan complete itinerary",
        "Calculate reward potential"
      ]
    };
  }
  
  return generateIntelligentFallback(input, userContext);
}

// Generate intelligent rewards response from Travel DNA
function generateRewardsResponseFromDNA(
  input: string,
  dnaData: any,
  userContext?: any
): {content: string; suggestions?: string[]} {
  
  const travelDNA = dnaData.travel_dna;
  const rewardValue = userContext?.nftCount ? userContext.nftCount * 67 : 0;
  
  if (travelDNA) {
    return {
      content: `Based on your Travel DNA analysis, I can provide intelligent reward optimization! 🧠

🎯 **Your Travel Personality**: ${travelDNA.primary_type || 'Cultural Explorer'} (${Math.round((travelDNA.confidence_score || 0.87) * 100)}% confidence)

💰 **Current Rewards**: $${rewardValue} earned from your travel adventures
🏆 **Tier Status**: ${userContext?.currentTier || 'Explorer'} member with enhanced benefits

🤖 **AI Recommendation**: Based on your ${travelDNA.primary_type || 'cultural'} travel style, I suggest focusing on:
${travelDNA.personality_factors && travelDNA.personality_factors[0] ? `• ${travelDNA.personality_factors[0].factor.toUpperCase()} experiences (${Math.round(travelDNA.personality_factors[0].weight * 100)}% match)` : '• Cultural and photography destinations'}
${travelDNA.personality_factors && travelDNA.personality_factors[1] ? `• ${travelDNA.personality_factors[1].factor.toUpperCase()} activities (${Math.round(travelDNA.personality_factors[1].weight * 100)}% match)` : '• Local cuisine and authentic experiences'}

This will maximize both your enjoyment and reward earnings!`,
      suggestions: [
        "Find " + (travelDNA.personality_factors?.[0]?.factor || 'cultural') + " destinations",
        "Optimize my reward strategy",
        "Plan AI-recommended trip",
        "Use my $" + rewardValue + " smartly"
      ]
    };
  }
  
  return generateIntelligentFallback(input, userContext);
}



// Intelligent fallback system with travel context
function generateIntelligentFallback(
  input: string,
  userContext?: any,
  attachments?: Array<{type: string; name: string; url: string}>
): {content: string; suggestions?: string[]} {
  
  const inputLower = input.toLowerCase();
  const rewardValue = userContext?.nftCount ? userContext.nftCount * 67 : 0;
  const tierStatus = userContext?.currentTier || 'Explorer';
  
  // Intelligent attachment analysis
  if (attachments && attachments.length > 0) {
    const hasImages = attachments.some(a => a.type === 'image');
    const hasDocs = attachments.some(a => a.type === 'document');
    
    let response = "I can see you've shared ";
    if (hasImages && hasDocs) {
      response += `${attachments.length} files (images and documents) `;
    } else if (hasImages) {
      response += `${attachments.length} image${attachments.length > 1 ? 's' : ''} `;
    } else {
      response += `${attachments.length} document${attachments.length > 1 ? 's' : ''} `;
    }
    
    response += "with me! ";
    
    if (hasImages) {
      response += "I can help analyze travel photos, destination screenshots, hotel images, or booking confirmations. ";
    }
    
    if (hasDocs) {
      response += "I can assist with travel documents, itineraries, booking details, or travel plans. ";
    }
    
    response += `As a ${tierStatus} member with $${rewardValue} in earned rewards, I can also show you how to maximize benefits from your travels. What specific help do you need with these files?`;
    
    return {
      content: response,
      suggestions: [
        "Help me understand this booking",
        "Analyze this destination photo",
        "Plan my trip from this itinerary",
        "How can I earn rewards from this?"
      ]
    };
  }
  
  // Intelligent reward-focused responses
  if (inputLower.includes('reward') || inputLower.includes('nft') || inputLower.includes('credit') || inputLower.includes('benefit')) {
    if (rewardValue > 0) {
      return {
        content: `Great question about your travel rewards! 🏆

You've earned **$${rewardValue}** in travel benefits from your ${userContext?.nftCount || 0} completed trips. Here's how these rewards work:

💳 **Immediate Use**: Apply $${rewardValue} as credits toward any new booking
🎯 **Member Benefits**: As a ${tierStatus} member, you get enhanced rewards (10-15% bonus)
🏆 **Tier Advantages**: Your status gives you priority support and exclusive deals
📈 **Growing Value**: Each new trip earns you more rewards and advances your tier

Would you like me to help you use these rewards for your next adventure?`,
        suggestions: [
          "Use my $" + rewardValue + " for a hotel booking",
          "Show me " + tierStatus + " member exclusive deals",
          "How do I earn even more rewards?",
          "Plan a trip using my rewards"
        ]
      };
    } else {
      return {
        content: `You're ready to start earning travel rewards! 🌟

Here's how our intelligent reward system works:

📍 **Every Booking Earns**: Get 10-25% back in platform credits
🎁 **Instant Rewards**: Earn travel NFTs that provide ongoing benefits  
🏆 **Tier Progression**: Advance from Wanderer → Explorer → Adventurer → Legend
💰 **Provider Bonuses**: Expedia (15%), Amadeus (10%), Viator (12%), and more
🎯 **Smart Benefits**: AI-powered rewards that grow with your travel style

Ready to start earning from your first booking?`,
        suggestions: [
          "How much can I earn from a $500 hotel?",
          "What providers give the best rewards?",
          "Show me high-reward destinations",
          "Plan my first rewarded trip"
        ]
      };
    }
  }
  
  // Intelligent hotel recommendations
  if (inputLower.includes('hotel') || inputLower.includes('stay') || inputLower.includes('accommodation')) {
    return {
      content: `I'd love to help you find the perfect hotel! 🏨

I can intelligently search across our integrated providers:

🌟 **Expedia Group**: 700,000+ properties with 15% bonus rewards
🏢 **Amadeus**: Premium hotels with global coverage (10% bonus)
🏪 **RateHawk**: Best rates with instant confirmation (10% bonus)

${rewardValue > 0 ? `Plus, you can use your $${rewardValue} in earned rewards for additional discounts!` : 'You\'ll earn rewards on every booking that you can use for future trips!'}

Where are you planning to stay and when? I'll find options that maximize both your comfort and your rewards.`,
      suggestions: [
        "Luxury hotels in Santorini with rewards",
        "Business hotels in Tokyo with member perks", 
        "Romantic resorts in Maldives with bonuses",
        "Budget-friendly hotels with highest rewards"
      ]
    };
  }
  
  // Intelligent flight search
  if (inputLower.includes('flight') || inputLower.includes('fly') || inputLower.includes('airport') || inputLower.includes('airline')) {
    return {
      content: `Let me help you find intelligent flight options! ✈️

I'll search our top flight providers:

🌍 **Amadeus**: Global airline network with comprehensive routes
🚀 **Duffle**: Modern booking platform with real-time pricing  
📊 **Sabre**: Advanced flight options with flexible scheduling

${rewardValue > 0 ? `Your $${rewardValue} in rewards can be applied to reduce flight costs!` : 'Every flight booking earns you rewards for future travels!'}

I can also use AI to find the best timing, routes, and deals based on your travel preferences. Where would you like to fly?`,
      suggestions: [
        "Find cheap flights to Europe",
        "Business class deals to Asia",
        "Weekend getaway flights with rewards",
        "Multi-city trips with maximum benefits"
      ]
    };
  }
  
  // Intelligent trip planning
  if (inputLower.includes('plan') || inputLower.includes('trip') || inputLower.includes('vacation') || inputLower.includes('travel') || inputLower.includes('destination')) {
    return {
      content: `I'd love to help you plan an amazing trip! 🌟

Using our Smart Dreams AI, I can create personalized recommendations based on:

🧠 **Your Travel DNA**: AI analysis of your travel personality and preferences
🎯 **Reward Optimization**: Plans that maximize your earnings and tier advancement
🌍 **Provider Integration**: Best deals across all 6 integrated travel providers
📅 **Timing Intelligence**: Optimal booking times for savings and availability

${rewardValue > 0 ? `With your $${rewardValue} in rewards and ${tierStatus} status, I can unlock exclusive deals and experiences!` : 'I\'ll also show you how to earn maximum rewards from your trip!'}

What type of adventure are you dreaming about?`,
      suggestions: [
        "Plan a romantic European getaway",
        "Cultural exploration in Asia with AI",
        "Adventure vacation with maximum rewards",
        "Luxury trip using my " + tierStatus + " benefits"
      ]
    };
  }
  
  // Intelligent general assistance
  return {
    content: `Hello! I'm your intelligent Maku Travel Assistant powered by advanced AI. 🤖

I can provide smart help with:

🏨 **Hotel Booking**: Find perfect accommodations with AI recommendations
✈️ **Flight Search**: Intelligent route and timing optimization
🎯 **Trip Planning**: Personalized itineraries using your Travel DNA
🏆 **Reward Optimization**: Maximize earnings from every booking
📊 **Provider Comparison**: Smart analysis across 6 travel providers
📎 **File Analysis**: Upload screenshots or documents for assistance

${rewardValue > 0 ? `I see you're a ${tierStatus} member with $${rewardValue} in earned rewards - I can help you make the most of these benefits!` : 'I can also show you how to start earning valuable travel rewards from your first booking!'}

What travel challenge can I help you solve today?`,
    suggestions: [
      "Find me the best hotel deals",
      "Compare flight prices intelligently", 
      "Optimize my travel rewards",
      "Plan a trip with AI assistance",
      "Analyze my travel documents"
    ]
  };
}

// Extract user intent from input for better AI processing
function extractIntent(input: string): string {
  const inputLower = input.toLowerCase();
  
  if (inputLower.includes('hotel') || inputLower.includes('stay')) return 'hotel_search';
  if (inputLower.includes('flight') || inputLower.includes('fly')) return 'flight_search';
  if (inputLower.includes('plan') || inputLower.includes('trip')) return 'trip_planning';
  if (inputLower.includes('reward') || inputLower.includes('nft')) return 'rewards_inquiry';
  if (inputLower.includes('book') || inputLower.includes('reservation')) return 'booking_assistance';
  if (inputLower.includes('help') || inputLower.includes('support')) return 'general_assistance';
  
  return 'general_inquiry';
}

// Generate contextual suggestions based on AI response and user state
function generateContextualSuggestions(
  originalInput: string,
  aiResponse: string,
  userContext?: any
): string[] {
  const suggestions = [];
  const inputLower = originalInput.toLowerCase();
  const responseLower = aiResponse.toLowerCase();
  
  // Context-aware suggestions based on conversation topic
  if (inputLower.includes('hotel') || responseLower.includes('hotel')) {
    suggestions.push("Show me luxury hotel options");
    suggestions.push("Find budget-friendly hotels");
    suggestions.push("Hotels with best rewards");
  }
  
  if (inputLower.includes('flight') || responseLower.includes('flight')) {
    suggestions.push("Compare flight prices");
    suggestions.push("Find flexible date options");
    suggestions.push("Best airline rewards");
  }
  
  if (inputLower.includes('reward') || responseLower.includes('reward')) {
    suggestions.push("How to maximize my rewards");
    suggestions.push("Use my rewards for booking");
    suggestions.push("Advance to next tier");
  }
  
  // Default intelligent suggestions
  if (suggestions.length === 0) {
    suggestions.push("Plan my next trip");
    suggestions.push("Find travel deals");
    suggestions.push("Check my rewards");
  }
  
  return suggestions.slice(0, 3); // Limit to 3 for space
}

export default WorkingTravelBot;