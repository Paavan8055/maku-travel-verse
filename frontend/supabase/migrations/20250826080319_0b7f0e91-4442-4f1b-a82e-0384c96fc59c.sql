-- Drop existing tables if they exist (reset)
DROP TABLE IF EXISTS public.funds CASCADE;
DROP TABLE IF EXISTS public.itineraries CASCADE;

-- Create funds table
CREATE TABLE public.funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0
);

-- Create itineraries table  
CREATE TABLE public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  data JSONB DEFAULT '{}'
);

-- Enable Row Level Security on both tables
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Create service role access policy for funds table
CREATE POLICY "Allow service role access" ON public.funds
FOR ALL USING (true) WITH CHECK (true);

-- Create service role access policy for itineraries table
CREATE POLICY "Allow service role access" ON public.itineraries  
FOR ALL USING (true) WITH CHECK (true);