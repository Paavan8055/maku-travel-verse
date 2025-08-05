# Maku Bot - AI Travel Assistant

An intelligent travel assistant that provides personalized recommendations based on user's travel vertical (Family, Solo, Pet, Spiritual).

## 🏗️ Architecture

```
src/features/makuBot/
├── components/
│   ├── ChatWidget.tsx      # Main chat interface
│   └── MessageBubble.tsx   # Individual message component
├── context/
│   └── MakuBotContext.tsx  # Global state management
├── hooks/
│   └── useMakuBotChat.ts   # Chat logic hook
├── lib/
│   └── makuBotClient.ts    # API client
└── README.md               # This file
```

## 🚀 Setup

### 1. Supabase Edge Function Setup

Since this project uses Supabase, you'll need to create an edge function for the OpenAI integration:

```bash
# Create the edge function
supabase functions new maku-bot

# Deploy with OpenAI secret
supabase secrets set OPENAI_API_KEY=your_openai_key_here
supabase functions deploy maku-bot
```

### 2. Edge Function Code

Create `supabase/functions/maku-bot/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { message, context } = await req.json()
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are Maku, a friendly travel assistant dog for Maku.travel. 
            You specialize in ${context.vertical} travel. Be helpful, enthusiastic, and include travel recommendations.
            Keep responses concise but informative.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    const data = await openaiResponse.json()
    const reply = data.choices?.[0]?.message?.content || "I'm not sure how to help with that."

    return new Response(
      JSON.stringify({ reply }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### 3. Update API URL

In `lib/makuBotClient.ts`, update the API URL to your Supabase function:

```typescript
const MAKU_BOT_API_URL = 'https://your-project.supabase.co/functions/v1/maku-bot';
```

### 4. Integration

Add the MakuBot to your app:

```tsx
// In your main App.tsx or layout
import ChatWidget from '@/features/makuBot/components/ChatWidget';
import { MakuBotProvider } from '@/features/makuBot/context/MakuBotContext';

function App() {
  return (
    <MakuBotProvider defaultVertical="Solo">
      {/* Your existing app */}
      <ChatWidget />
    </MakuBotProvider>
  );
}
```

## 🎨 Styling

The components use your existing design system:
- Tailwind semantic tokens from `index.css`
- Consistent with your travel theme colors
- Responsive design with mobile-first approach

## 🧪 Testing

Basic test structure for `MessageBubble.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import MessageBubble from '../components/MessageBubble';

describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    render(
      <MessageBubble 
        text="Hello Maku!" 
        from="user" 
        timestamp="2024-01-01T00:00:00Z" 
      />
    );
    
    expect(screen.getByText('Hello Maku!')).toBeInTheDocument();
  });

  it('renders bot message with avatar', () => {
    render(
      <MessageBubble 
        text="Hi there! How can I help?" 
        from="bot" 
      />
    );
    
    expect(screen.getByText('🐕')).toBeInTheDocument();
    expect(screen.getByText('Hi there! How can I help?')).toBeInTheDocument();
  });
});
```

## 🔧 Configuration

### Environment Variables (Supabase Secrets)
- `OPENAI_API_KEY` - Your OpenAI API key

### Features
- Persistent chat history (localStorage)
- Context-aware responses based on user's travel vertical
- Typing indicators and error handling
- Mobile-responsive design
- Keyboard shortcuts (Enter to send, Esc to close)

## 🎯 Usage Examples

```tsx
// Basic usage
<ChatWidget userVertical="Family" />

// With context
const { openChat, setSearchContext } = useMakuBot();

// Trigger chat from search results
const handleAskMaku = () => {
  setSearchContext({
    destination: "Bali",
    dates: "2024-06-15 to 2024-06-22",
    travelers: 2
  });
  openChat();
};
```

## 🚀 Next Steps

1. Set up the Supabase edge function
2. Add your OpenAI API key to Supabase secrets
3. Test the integration
4. Customize the bot's personality and responses
5. Add more context awareness (user preferences, booking history)