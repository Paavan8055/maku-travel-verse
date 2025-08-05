import { useState, useEffect, useCallback } from 'react';
import { sendToMakuBot } from '../lib/makuBotClient';

interface Message {
  id: string;
  text: string;
  from: 'user' | 'bot';
  timestamp: string;
}

interface UseMakuBotChatProps {
  userVertical: 'Family' | 'Solo' | 'Pet' | 'Spiritual';
  maxMessages?: number;
}

export const useMakuBotChat = ({ 
  userVertical, 
  maxMessages = 50 
}: UseMakuBotChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: `Hi! I'm Maku, your ${userVertical.toLowerCase()} travel assistant 🐕 How can I help you plan your next adventure?`,
      from: 'bot',
      timestamp: new Date().toISOString()
    };

    // Load from localStorage or start with welcome
    const savedMessages = localStorage.getItem(`makuBot_${userVertical}_messages`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch {
        setMessages([welcomeMessage]);
      }
    } else {
      setMessages([welcomeMessage]);
    }
  }, [userVertical]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(
        `makuBot_${userVertical}_messages`, 
        JSON.stringify(messages.slice(-maxMessages))
      );
    }
  }, [messages, userVertical, maxMessages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: text.trim(),
      from: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      const context = {
        vertical: userVertical,
        recentMessages: messages.slice(-5).map(m => ({
          text: m.text,
          from: m.from
        }))
      };

      const botReply = await sendToMakuBot(text, context);
      
      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        text: botReply,
        from: 'bot',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMsg);
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: "Sorry, I'm having trouble right now. Please try again!",
        from: 'bot',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [userVertical, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(`makuBot_${userVertical}_messages`);
    setError(null);
  }, [userVertical]);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    clearChat
  };
};