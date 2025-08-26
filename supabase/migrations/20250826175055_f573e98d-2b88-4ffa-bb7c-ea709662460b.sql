-- Add PNR and flight booking management tables
CREATE TABLE IF NOT EXISTS public.pnr_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  pnr_locator TEXT NOT NULL UNIQUE,
  sabre_record_locator TEXT,
  booking_id UUID REFERENCES public.bookings(id),
  passenger_data JSONB NOT NULL DEFAULT '{}',
  flight_segments JSONB NOT NULL DEFAULT '[]',
  booking_status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Add seat assignments table
CREATE TABLE IF NOT EXISTS public.seat_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pnr_id UUID REFERENCES public.pnr_records(id) ON DELETE CASCADE,
  passenger_id TEXT NOT NULL,
  flight_segment_id TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  seat_type TEXT, -- 'window', 'aisle', 'middle'
  cabin_class TEXT, -- 'economy', 'premium', 'business', 'first'
  fee_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add air extras/ancillary services table
CREATE TABLE IF NOT EXISTS public.air_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pnr_id UUID REFERENCES public.pnr_records(id) ON DELETE CASCADE,
  passenger_id TEXT NOT NULL,
  extra_type TEXT NOT NULL, -- 'baggage', 'meal', 'upgrade', 'insurance'
  extra_code TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  flight_segment_id TEXT,
  status TEXT DEFAULT 'booked',
  sabre_confirmation_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Add flight change requests table
CREATE TABLE IF NOT EXISTS public.flight_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pnr_id UUID REFERENCES public.pnr_records(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  original_flight_data JSONB NOT NULL,
  requested_flight_data JSONB NOT NULL,
  change_type TEXT NOT NULL, -- 'date', 'time', 'route', 'passenger'
  change_fee NUMERIC DEFAULT 0,
  fare_difference NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
  sabre_change_reference TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Add travel alerts table
CREATE TABLE IF NOT EXISTS public.travel_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pnr_id UUID REFERENCES public.pnr_records(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  alert_type TEXT NOT NULL, -- 'schedule_change', 'gate_change', 'delay', 'cancellation'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  flight_segment_id TEXT,
  original_data JSONB,
  updated_data JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on all tables
ALTER TABLE public.pnr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.air_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for PNR records
CREATE POLICY "Users can view their own PNR records" 
ON public.pnr_records FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PNR records" 
ON public.pnr_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PNR records" 
ON public.pnr_records FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all PNR records" 
ON public.pnr_records FOR ALL 
USING (auth.role() = 'service_role');

-- Create RLS policies for seat assignments
CREATE POLICY "Users can view seat assignments for their PNRs" 
ON public.seat_assignments FOR SELECT 
USING (pnr_id IN (SELECT id FROM public.pnr_records WHERE user_id = auth.uid()));

CREATE POLICY "Users can create seat assignments for their PNRs" 
ON public.seat_assignments FOR INSERT 
WITH CHECK (pnr_id IN (SELECT id FROM public.pnr_records WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage all seat assignments" 
ON public.seat_assignments FOR ALL 
USING (auth.role() = 'service_role');

-- Create RLS policies for air extras
CREATE POLICY "Users can view air extras for their PNRs" 
ON public.air_extras FOR SELECT 
USING (pnr_id IN (SELECT id FROM public.pnr_records WHERE user_id = auth.uid()));

CREATE POLICY "Users can create air extras for their PNRs" 
ON public.air_extras FOR INSERT 
WITH CHECK (pnr_id IN (SELECT id FROM public.pnr_records WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage all air extras" 
ON public.air_extras FOR ALL 
USING (auth.role() = 'service_role');

-- Create RLS policies for flight change requests
CREATE POLICY "Users can view their own change requests" 
ON public.flight_change_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own change requests" 
ON public.flight_change_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all change requests" 
ON public.flight_change_requests FOR ALL 
USING (auth.role() = 'service_role');

-- Create RLS policies for travel alerts
CREATE POLICY "Users can view their own travel alerts" 
ON public.travel_alerts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel alerts" 
ON public.travel_alerts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all travel alerts" 
ON public.travel_alerts FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_pnr_records_user_id ON public.pnr_records(user_id);
CREATE INDEX idx_pnr_records_locator ON public.pnr_records(pnr_locator);
CREATE INDEX idx_seat_assignments_pnr_id ON public.seat_assignments(pnr_id);
CREATE INDEX idx_air_extras_pnr_id ON public.air_extras(pnr_id);
CREATE INDEX idx_flight_change_requests_user_id ON public.flight_change_requests(user_id);
CREATE INDEX idx_travel_alerts_user_id ON public.travel_alerts(user_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_pnr_records_updated_at
  BEFORE UPDATE ON public.pnr_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seat_assignments_updated_at
  BEFORE UPDATE ON public.seat_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_air_extras_updated_at
  BEFORE UPDATE ON public.air_extras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flight_change_requests_updated_at
  BEFORE UPDATE ON public.flight_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();