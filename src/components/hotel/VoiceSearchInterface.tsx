import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logger from "@/utils/logger";

interface VoiceSearchInterfaceProps {
  onVoiceResult: (text: string) => void;
  onDestinationChange?: (destination: string) => void;
  className?: string;
}

export const VoiceSearchInterface: React.FC<VoiceSearchInterfaceProps> = ({
  onVoiceResult,
  onDestinationChange,
  className = ""
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [transcription, setTranscription] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 10000);

    } catch (error) {
      logger.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice search.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Call Supabase function for speech-to-text
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) {
          throw error;
        }

        if (data?.text) {
          setTranscription(data.text);
          onVoiceResult(data.text);
          
          // Parse for destination if needed
          if (onDestinationChange) {
            const destinations = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Darwin', 'Hobart', 'Cairns'];
            const foundDestination = destinations.find(dest => 
              data.text.toLowerCase().includes(dest.toLowerCase())
            );
            if (foundDestination) {
              onDestinationChange(foundDestination);
            }
          }

          // Provide audio feedback if enabled
          if (audioEnabled) {
            await speakResponse(`Found hotels for: ${data.text}`);
          }

          toast({
            title: "Voice Search Complete",
            description: `Searching for: ${data.text}`,
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      logger.error('Error processing audio:', error);
      toast({
        title: "Voice Processing Failed",
        description: "Could not process your voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voice: 'alloy'
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mp3' });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
        
        audio.onended = () => URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      logger.error('Error with text-to-speech:', error);
    }
  };

  return (
    <Card className={`travel-card ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Voice Search</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={isListening ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-16 h-16 rounded-full ${
              isListening ? 'bg-destructive hover:bg-destructive/90' : 'btn-primary'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          {isListening && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Listening...</span>
            </div>
          )}

          {isProcessing && (
            <Badge variant="secondary">Processing audio...</Badge>
          )}

          {transcription && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Last search:</p>
              <p className="text-sm font-medium">{transcription}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center max-w-48">
            Say something like "Hotels in Sydney for this weekend" or "Find luxury hotels in Melbourne"
          </div>
        </div>
      </CardContent>
    </Card>
  );
};