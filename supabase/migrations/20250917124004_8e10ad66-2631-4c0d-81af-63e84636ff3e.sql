-- Create Viator booking questions table
CREATE TABLE public.viator_booking_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text', -- text, select, date, number, boolean
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB DEFAULT NULL, -- For select type questions
  validation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_code, question_id)
);

-- Create Viator availability table
CREATE TABLE public.viator_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL,
  availability_date DATE NOT NULL,
  available_times JSONB NOT NULL DEFAULT '[]',
  pricing JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available', -- available, limited, sold_out
  max_travelers INTEGER DEFAULT NULL,
  remaining_spaces INTEGER DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_code, availability_date)
);

-- Create Viator bookings table
CREATE TABLE public.viator_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL, -- Reference to main bookings table
  viator_booking_reference TEXT UNIQUE, -- Viator's booking reference
  product_code TEXT NOT NULL,
  booking_status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, failed
  booking_data JSONB NOT NULL DEFAULT '{}',
  customer_answers JSONB NOT NULL DEFAULT '{}', -- Answers to booking questions
  voucher_info JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Create Viator product options table for detailed product information
CREATE TABLE public.viator_product_options (
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
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_code, option_code)
);

-- Enable RLS on all tables
ALTER TABLE public.viator_booking_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viator_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viator_product_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for viator_booking_questions
CREATE POLICY "Service role can manage booking questions" ON public.viator_booking_questions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view booking questions" ON public.viator_booking_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for viator_availability
CREATE POLICY "Service role can manage availability" ON public.viator_availability
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view availability" ON public.viator_availability
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for viator_bookings
CREATE POLICY "Service role can manage viator bookings" ON public.viator_bookings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own viator bookings" ON public.viator_bookings
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for viator_product_options
CREATE POLICY "Service role can manage product options" ON public.viator_product_options
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view product options" ON public.viator_product_options
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_viator_booking_questions_updated_at
  BEFORE UPDATE ON public.viator_booking_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_viator_bookings_updated_at
  BEFORE UPDATE ON public.viator_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_viator_product_options_updated_at
  BEFORE UPDATE ON public.viator_product_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_viator_booking_questions_product_code ON public.viator_booking_questions(product_code);
CREATE INDEX idx_viator_availability_product_code_date ON public.viator_availability(product_code, availability_date);
CREATE INDEX idx_viator_availability_expires_at ON public.viator_availability(expires_at);
CREATE INDEX idx_viator_bookings_booking_id ON public.viator_bookings(booking_id);
CREATE INDEX idx_viator_bookings_viator_reference ON public.viator_bookings(viator_booking_reference);
CREATE INDEX idx_viator_product_options_product_code ON public.viator_product_options(product_code);