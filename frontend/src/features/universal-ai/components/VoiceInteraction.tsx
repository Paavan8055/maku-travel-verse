import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInteractionProps {
  onTranscription?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  className?: string;
  isEnabled?: boolean;
}

export const VoiceInteraction: React.FC<VoiceInteractionProps> = ({
  onTranscription,
  onSpeechStart,
  onSpeechEnd,
  className,
  isEnabled = true
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize audio context for visual feedback
  useEffect(() => {
    if (!isEnabled) return;

    const initializeAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    };

    initializeAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isEnabled]);

  const startListening = useCallback(async () => {
    if (!isEnabled) return;

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for visual feedback
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        source.connect(analyserRef.current);
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        const updateAudioLevel = () => {
          if (analyserRef.current && isListening) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average);
            requestAnimationFrame(updateAudioLevel);
          }
        };
        updateAudioLevel();
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      onSpeechStart?.();

    } catch (error) {
      console.error('Error starting audio recording:', error);
      setError('Microphone access denied or not available');
    }
  }, [isEnabled, isListening, onSpeechStart]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setAudioLevel(0);
      onSpeechEnd?.();
    }
  }, [isListening, onSpeechEnd]);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));

      // Send to Supabase edge function for transcription
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      const transcribedText = data.text;
      setTranscript(transcribedText);
      onTranscription?.(transcribedText);

    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Failed to process speech. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscription]);

  const speakText = useCallback((text: string, options?: { rate?: number; pitch?: number; volume?: number }) => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1;
    utterance.volume = options?.volume || 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setError('Failed to generate speech');
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isEnabled) {
    return (
      <Card className={cn("p-4 opacity-50", className)}>
        <div className="text-center text-sm text-muted-foreground">
          Voice interaction disabled
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Voice Interaction
        </h4>
        
        <div className="flex items-center gap-2">
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSpeaking && (
            <Button variant="ghost" size="sm" onClick={stopSpeaking}>
              <VolumeX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Button
          variant={isListening ? "destructive" : "default"}
          size="lg"
          onClick={toggleListening}
          disabled={isProcessing}
          className={cn(
            "relative rounded-full h-16 w-16 transition-all",
            isListening && "animate-pulse"
          )}
        >
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          
          {/* Audio level visualization */}
          {isListening && (
            <div 
              className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"
              style={{
                transform: `scale(${1 + audioLevel / 200})`,
                opacity: audioLevel / 100
              }}
            />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={isListening ? "default" : "secondary"}>
            {isListening ? "Listening..." : isProcessing ? "Processing..." : "Ready"}
          </Badge>
          
          {audioLevel > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 h-2 bg-primary rounded-full transition-opacity",
                    audioLevel > (i * 40) ? "opacity-100" : "opacity-30"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {transcript && (
          <div className="p-2 bg-muted rounded text-sm">
            <strong>Transcript:</strong> {transcript}
          </div>
        )}

        {error && (
          <div className="p-2 bg-destructive/10 text-destructive rounded text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Click the microphone to start voice interaction
      </div>
    </Card>
  );
};

export default VoiceInteraction;