# Agentic Booking Agent - Maku.travel

The Agentic Booking Agent is an AI-powered autonomous travel assistant that can plan, book, monitor, and adjust travel arrangements with minimal user intervention.

## 🚀 Features

- **Autonomous Trip Planning**: AI plans complete itineraries based on user preferences
- **Smart Price Monitoring**: Continuous monitoring of flight and hotel prices with automatic rebooking
- **Booking Optimization**: Automatic adjustments to existing bookings for better deals
- **Real-time Status Updates**: Live progress tracking with detailed step-by-step feedback
- **Multi-vertical Support**: Specialized assistance for Family, Solo, Pet, and Spiritual travel

## 📁 File Structure

```
src/features/agenticBot/
├── components/
│   ├── AgenticLauncher.tsx    # Floating launcher button with status
│   ├── AgenticPanel.tsx       # Main sliding panel interface
│   └── BookingCard.tsx        # Individual task/booking cards
├── hooks/
│   └── useAgenticTasks.ts     # Task management and state
├── context/
│   └── AgenticBotContext.tsx  # Global agentic bot state
├── lib/
│   └── agenticClient.ts       # API client for agentic operations
└── README.md
```

## 🛠️ Setup Instructions

### 1. Supabase Edge Function Setup

Create a new edge function in your Supabase project:

```bash
# In your Supabase project
supabase functions new agentic-bot
```

Add the following environment variables to Supabase Secrets:
- `OPENAI_API_KEY`: Your OpenAI API key for AI reasoning
- `AMADEUS_API_KEY`: For flight search and booking
- `HOTELBEDS_API_KEY`: For hotel search and booking

### 2. Database Schema

Create the following table in your Supabase database:

```sql
-- Agentic tasks table
CREATE TABLE agentic_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  intent TEXT NOT NULL,
  params JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agentic_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tasks" ON agentic_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON agentic_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON agentic_tasks
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. Edge Function Implementation

Create `supabase/functions/agentic-bot/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { intent, params } = await req.json();
    
    // TODO: Implement OpenAI chain-of-thought reasoning
    // TODO: Integrate with Amadeus/HotelBeds APIs
    // TODO: Store task in database
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Agentic task '${intent}' initiated successfully`,
        actions: [
          {
            type: 'search',
            description: 'Searching for best options',
            estimated_time: 30
          }
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
```

### 4. Integration with Main App

Add to your main app component:

```tsx
import { AgenticBotProvider } from '@/features/agenticBot/context/AgenticBotContext';
import AgenticLauncher from '@/features/agenticBot/components/AgenticLauncher';
import AgenticPanel from '@/features/agenticBot/components/AgenticPanel';

function App() {
  return (
    <AgenticBotProvider defaultVertical="Solo">
      {/* Your existing app content */}
      <AgenticWidget />
    </AgenticBotProvider>
  );
}
```

### 5. Update API URLs

Update the API URLs in `agenticClient.ts` to point to your Supabase edge functions:

```typescript
const AGENTIC_BOT_API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agentic-bot`;
```

## 🧪 Testing

### Unit Tests

```bash
npm test src/features/agenticBot/components/BookingCard.test.tsx
```

### Integration Tests

Mock the Supabase client for testing:

```typescript
// agenticPanel.test.tsx
import { render, screen } from '@testing-library/react';
import AgenticPanel from '../components/AgenticPanel';

// Mock implementation
```

## 🔧 Configuration

### Environment Variables (Supabase Secrets)

```
OPENAI_API_KEY=sk-...
AMADEUS_API_KEY=...
HOTELBEDS_API_KEY=...
```

### Feature Flags

Enable/disable agentic features through your app configuration:

```typescript
const agenticConfig = {
  autoBookingEnabled: true,
  maxConcurrentTasks: 3,
  priceMonitoringInterval: 300000, // 5 minutes
};
```

## 🚀 Deployment

1. Deploy the edge function: `supabase functions deploy agentic-bot`
2. Set environment variables in Supabase dashboard
3. Update your app's API configuration
4. Test with a small user group before full rollout

## 📊 Monitoring

Monitor agentic task performance through:
- Supabase dashboard (database queries)
- OpenAI API usage dashboard
- Custom analytics in your app

## 🔮 Future Enhancements

- [ ] Voice integration with ElevenLabs
- [ ] Multi-language support
- [ ] Advanced learning from user preferences
- [ ] Integration with calendar systems
- [ ] Group booking coordination
- [ ] Predictive rebooking based on travel patterns