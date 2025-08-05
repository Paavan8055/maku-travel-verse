import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  text: string;
  from: 'user' | 'bot';
  timestamp?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, from, timestamp }) => {
  const isBot = from === 'bot';
  const timeAgo = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : '';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-slideIn`}>
      <div className="max-w-[80%]">
        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-soft ${
            isBot
              ? 'bg-muted text-muted-foreground rounded-bl-sm'
              : 'bg-primary text-primary-foreground rounded-br-sm'
          }`}
        >
          {/* Bot Avatar */}
          {isBot && (
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs mt-0.5">
                🐕
              </div>
              <div className="flex-1">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
              </div>
            </div>
          )}
          
          {/* User Message */}
          {!isBot && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <p className={`text-xs text-muted-foreground mt-1 ${isBot ? 'text-left ml-8' : 'text-right'}`}>
            {timeAgo}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;