-- Create Viator booking questions table (if not exists)
CREATE TABLE IF NOT EXISTS public.viator_booking_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text',
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB DEFAULT NULL,
  validation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'viator_booking_questions_product_code_question_id_key') THEN
    ALTER TABLE public.viator_booking_questions ADD CONSTRAINT viator_booking_questions_product_code_question_id_key UNIQUE(product_code, question_id);
  END IF;
END $$;

-- Create Viator bookings table (if not exists)
CREATE TABLE IF NOT EXISTS public.viator_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  viator_booking_reference TEXT UNIQUE,
  product_code TEXT NOT NULL,
  booking_status TEXT NOT NULL DEFAULT 'pending',
  booking_data JSONB NOT NULL DEFAULT '{}',
  customer_answers JSONB NOT NULL DEFAULT '{}',
  voucher_info JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'viator_bookings_booking_id_fkey') THEN
    ALTER TABLE public.viator_bookings ADD CONSTRAINT viator_bookings_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create Viator product options table (if not exists)
CREATE TABLE IF NOT EXISTS public.viator_product_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL,
  option_code TEXT NOT NULL,
  option_title TEXT NOT NULL,
  description TEXT,
  pricing JSONB NOT NULL DEFAULT '{}',
  age_restrictions JSONB DEFAULT '{}',
  duration TEXT,
  max_travelers INTEGER,
  meeting_point JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'viator_product_options_product_code_option_code_key') THEN
    ALTER TABLE public.viator_product_options ADD CONSTRAINT viator_product_options_product_code_option_code_key UNIQUE(product_code, option_code);
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.viator_booking_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viator_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viator_product_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Booking questions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'viator_booking_questions' AND policyname = 'Service role can manage booking questions') THEN
    CREATE POLICY "Service role can manage booking questions" ON public.viator_booking_questions FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'viator_booking_questions' AND policyname = 'Authenticated users can view booking questions') THEN
    CREATE POLICY "Authenticated users can view booking questions" ON public.viator_booking_questions FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;

  -- Viator bookings policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'viator_bookings' AND policyname = 'Service role can manage viator bookings') THEN
    CREATE POLICY "Service role can manage viator bookings" ON public.viator_bookings FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'viator_bookings' AND policyname = 'Users can view their own viator bookings') THEN
    CREATE POLICY "Users can view their own viator bookings" ON public.viator_bookings FOR SELECT USING (
      booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
    );
  END IF;

  -- Product options policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'viator_product_options' AND policyname = 'Service role can manage product options') THEN
    CREATE POLICY "Service role can manage product options" ON public.viator_product_options FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'viator_product_options' AND policyname = 'Authenticated users can view product options') THEN
    CREATE POLICY "Authenticated users can view product options" ON public.viator_product_options FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_viator_booking_questions_product_code ON public.viator_booking_questions(product_code);
CREATE INDEX IF NOT EXISTS idx_viator_bookings_booking_id ON public.viator_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_viator_bookings_viator_reference ON public.viator_bookings(viator_booking_reference);
CREATE INDEX IF NOT EXISTS idx_viator_product_options_product_code ON public.viator_product_options(product_code);