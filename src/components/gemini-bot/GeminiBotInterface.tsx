import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { geminiBot, GeminiResponse } from '@/lib/gemini';
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles,
  MessageCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
}

interface GeminiBotInterfaceProps {
  onResponse?: (response: GeminiResponse) => void;
  context?: any;
  placeholder?: string;
  height?: string;
}

export const GeminiBotInterface: React.FC<GeminiBotInterfaceProps> = ({
  onResponse,
  context,
  placeholder = "Ask me anything about travel...",
  height = "400px"
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await geminiBot.processQuery(userMessage.content, context);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.message,
        timestamp: new Date(),
        confidence: response.confidence,
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, botMessage]);
      onResponse?.(response);

      if (!response.success) {
        toast.error('Bot Error', {
          description: 'There was an issue processing your request.'
        });
      }
    } catch (error) {
      console.error('Bot communication error:', error);
      toast.error('Connection Error', {
        description: 'Unable to connect to the AI assistant.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Gemini Travel Assistant
          <Badge variant="outline" className="ml-auto">
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="border rounded-lg p-4" style={{ height }}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>Hello! I'm your Gemini-powered travel assistant.</p>
                <p className="text-sm">Ask me about flights, hotels, destinations, or travel tips!</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground ml-4'
                      : 'bg-muted mr-4'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      <Clock className="h-3 w-3" />
                      {message.timestamp.toLocaleTimeString()}
                      {message.confidence && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <CheckCircle className="h-3 w-3" />
                          {Math.round(message.confidence * 100)}% confident
                        </>
                      )}
                    </div>
                  </div>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 mr-4">
                      <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={`flex-shrink-0 ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.type === 'user' ? 'U' : <Bot className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3 mr-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageCircle className="h-3 w-3" />
          Powered by Google Gemini AI
        </div>
      </CardContent>
    </Card>
  );
};