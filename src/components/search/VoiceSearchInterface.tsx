import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  intent: {
    type: 'hotel' | 'flight' | 'activity' | 'car';
    destination?: string;
    dates?: {
      checkIn?: string;
      checkOut?: string;
    };
    guests?: number;
    rooms?: number;
  };
}

interface VoiceSearchInterfaceProps {
  onResult: (result: VoiceSearchResult) => void;
  onError?: (error: string) => void;
}

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export const VoiceSearchInterface: React.FC<VoiceSearchInterfaceProps> = ({
  onResult,
  onError
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          processTranscript(finalTranscript, event.results[0][0].confidence);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        
        let errorMessage = 'Voice recognition failed';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please enable microphone permissions.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
        }
        
        onError?.(errorMessage);
        toast({
          variant: "destructive",
          title: "Voice Search Error",
          description: errorMessage,
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const processTranscript = async (text: string, confidence: number) => {
    setIsProcessing(true);
    
    try {
      // Simulate NLP processing to extract intent
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = parseVoiceCommand(text, confidence);
      onResult(result);
      
      toast({
        title: "Voice command understood",
        description: `Searching for ${result.intent.type}s...`,
      });
    } catch (error) {
      onError?.('Failed to process voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseVoiceCommand = (text: string, confidence: number): VoiceSearchResult => {
    const lowerText = text.toLowerCase();
    
    // Simple NLP parsing (in production, use proper NLP service)
    let type: VoiceSearchResult['intent']['type'] = 'hotel';
    let destination = '';
    let guests = 2;
    let dates = {};
    
    // Determine intent type
    if (lowerText.includes('flight') || lowerText.includes('fly')) {
      type = 'flight';
    } else if (lowerText.includes('activity') || lowerText.includes('tour') || lowerText.includes('experience')) {
      type = 'activity';
    } else if (lowerText.includes('car') || lowerText.includes('rental')) {
      type = 'car';
    }
    
    // Extract destination
    const locationPatterns = [
      /(?:to|in|at)\s+([a-zA-Z\s]+?)(?:\s+for|\s+on|\s*$)/i,
      /(?:visit|go to|travel to)\s+([a-zA-Z\s]+?)(?:\s+for|\s+on|\s*$)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        destination = match[1].trim();
        break;
      }
    }
    
    // Extract guest count
    const guestMatch = text.match(/(\d+)\s+(?:people|person|guest|adult)/i);
    if (guestMatch) {
      guests = parseInt(guestMatch[1]);
    }
    
    // Extract dates (basic patterns)
    const datePatterns = [
      /next\s+week/i,
      /next\s+month/i,
      /tomorrow/i,
      /this\s+weekend/i
    ];
    
    for (const pattern of datePatterns) {
      if (pattern.test(text)) {
        // In production, convert these to actual dates
        dates = { checkIn: 'soon', checkOut: 'soon' };
        break;
      }
    }
    
    return {
      transcript: text,
      confidence,
      intent: {
        type,
        destination: destination || undefined,
        dates: Object.keys(dates).length > 0 ? dates as any : undefined,
        guests: guests !== 2 ? guests : undefined
      }
    };
  };

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Voice search is not supported in this browser.",
      });
      return;
    }
    
    try {
      recognitionRef.current.start();
      
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
        }
      }, 10000);
    } catch (error) {
      console.error('Failed to start recognition:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start voice recognition.",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-4 text-center">
          <MicOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Voice search not supported in this browser
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="travel-card">
      <CardContent className="p-6 text-center">
        <div className="mb-4">
          <Button
            size="lg"
            variant={isListening ? "destructive" : "default"}
            className={`rounded-full w-16 h-16 ${
              isListening 
                ? 'animate-pulse bg-red-500 hover:bg-red-600' 
                : 'bg-primary hover:bg-primary/90'
            }`}
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isListening ? (
              <Mic className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Voice Search</h3>
          <p className="text-sm text-muted-foreground">
            {isListening 
              ? 'Listening... Speak now'
              : isProcessing
              ? 'Processing your request...'
              : 'Click to start voice search'
            }
          </p>
          
          {isListening && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <div className="w-1 h-4 bg-primary animate-pulse rounded"></div>
              <div className="w-1 h-6 bg-primary animate-pulse rounded animation-delay-150"></div>
              <div className="w-1 h-3 bg-primary animate-pulse rounded animation-delay-300"></div>
              <div className="w-1 h-5 bg-primary animate-pulse rounded animation-delay-450"></div>
            </div>
          )}
        </div>
        
        {transcript && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                <Volume2 className="h-3 w-3 mr-1" />
                Transcript
              </Badge>
            </div>
            <p className="text-sm italic">"{transcript}"</p>
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Try saying: "Find hotels in Paris for 2 people next week"</p>
        </div>
      </CardContent>
    </Card>
  );
};