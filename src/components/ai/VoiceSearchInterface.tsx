import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceSearchResult {
  query: string;
  intent: 'flight' | 'hotel' | 'activity' | 'car' | 'general';
  parameters: Record<string, any>;
  confidence: number;
}

interface VoiceSearchInterfaceProps {
  onResult: (result: VoiceSearchResult) => void;
  className?: string;
}

export const VoiceSearchInterface: React.FC<VoiceSearchInterfaceProps> = ({
  onResult,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Voice Search Unavailable',
        description: 'Your browser does not support voice recognition.',
        variant: 'destructive'
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        processVoiceInput(transcript);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      toast({
        title: 'Voice Recognition Error',
        description: 'Please try again or check your microphone permissions.',
        variant: 'destructive'
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const processVoiceInput = async (input: string) => {
    setIsProcessing(true);
    
    try {
      // AI-powered intent recognition and parameter extraction
      const result = await analyzeVoiceInput(input);
      onResult(result);
      
      // Provide voice feedback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `I found ${result.intent} options. Let me show you the results.`
        );
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      toast({
        title: 'Processing Error',
        description: 'Could not understand your request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const analyzeVoiceInput = async (input: string): Promise<VoiceSearchResult> => {
    const lowercaseInput = input.toLowerCase();
    
    // Intent detection
    let intent: VoiceSearchResult['intent'] = 'general';
    let confidence = 0.5;
    const parameters: Record<string, any> = {};

    // Flight intent patterns
    if (/\b(flight|fly|plane|air|airline)\b/.test(lowercaseInput)) {
      intent = 'flight';
      confidence = 0.8;
      
      // Extract destinations
      const fromMatch = lowercaseInput.match(/from\s+([a-zA-Z\s]+?)(?:\s+to|\s+$)/);
      const toMatch = lowercaseInput.match(/to\s+([a-zA-Z\s]+?)(?:\s+on|\s+$)/);
      
      if (fromMatch) parameters.origin = fromMatch[1].trim();
      if (toMatch) parameters.destination = toMatch[1].trim();
      
      // Extract dates
      const dateMatch = lowercaseInput.match(/\b(today|tomorrow|next week|this weekend|\d{1,2}[\/\-]\d{1,2})\b/);
      if (dateMatch) parameters.departureDate = dateMatch[1];
    }
    
    // Hotel intent patterns
    else if (/\b(hotel|stay|room|accommodation|lodge)\b/.test(lowercaseInput)) {
      intent = 'hotel';
      confidence = 0.8;
      
      const locationMatch = lowercaseInput.match(/in\s+([a-zA-Z\s]+?)(?:\s+for|\s+on|\s+$)/);
      if (locationMatch) parameters.destination = locationMatch[1].trim();
      
      const guestMatch = lowercaseInput.match(/(\d+)\s+(guest|person|people)/);
      if (guestMatch) parameters.guests = parseInt(guestMatch[1]);
    }
    
    // Activity intent patterns
    else if (/\b(activity|tour|experience|thing to do|attraction)\b/.test(lowercaseInput)) {
      intent = 'activity';
      confidence = 0.8;
      
      const locationMatch = lowercaseInput.match(/in\s+([a-zA-Z\s]+?)(?:\s+$)/);
      if (locationMatch) parameters.destination = locationMatch[1].trim();
    }
    
    // Car rental intent patterns
    else if (/\b(car|rental|drive|vehicle)\b/.test(lowercaseInput)) {
      intent = 'car';
      confidence = 0.8;
      
      const locationMatch = lowercaseInput.match(/in\s+([a-zA-Z\s]+?)(?:\s+$)/);
      if (locationMatch) parameters.pickupLocation = locationMatch[1].trim();
    }

    return {
      query: input,
      intent,
      parameters,
      confidence
    };
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            variant={isListening ? "destructive" : "default"}
            size="lg"
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className="h-16 w-16 rounded-full"
          >
            {isListening ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          
          {transcript && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const utterance = new SpeechSynthesisUtterance(transcript);
                speechSynthesis.speak(utterance);
              }}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="text-center">
          {isListening && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Listening... Speak your travel request
            </p>
          )}
          
          {isProcessing && (
            <p className="text-sm text-muted-foreground">
              Processing your request...
            </p>
          )}
          
          {transcript && (
            <div className="mt-2 p-3 bg-muted rounded-lg max-w-md">
              <p className="text-sm font-medium">You said:</p>
              <p className="text-sm text-muted-foreground italic">"{transcript}"</p>
            </div>
          )}
          
          {!isListening && !isProcessing && !transcript && (
            <p className="text-sm text-muted-foreground">
              Click the microphone to start voice search
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};