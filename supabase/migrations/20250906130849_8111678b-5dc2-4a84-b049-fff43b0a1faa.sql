-- Phase 1: Create tables for real agent functionality

-- Bookings table (already exists, but ensure it has proper structure)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  booking_reference TEXT NOT NULL DEFAULT public.generate_booking_reference(),
  booking_type TEXT NOT NULL,
  booking_data JSONB NOT NULL DEFAULT '{}',
  total_amount NUMERIC,
  currency TEXT DEFAULT 'AUD',
  status TEXT NOT NULL DEFAULT 'pending',
  provider_booking_id TEXT,
  provider_confirmation_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Price monitors table for tracking price changes
CREATE TABLE IF NOT EXISTS public.price_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_reference TEXT,
  monitor_type TEXT NOT NULL, -- 'flight', 'hotel', 'activity', 'car_rental'
  search_criteria JSONB NOT NULL,
  original_price NUMERIC NOT NULL,
  threshold_percentage NUMERIC DEFAULT 10, -- Alert if price drops by this %
  current_price NUMERIC,
  status TEXT DEFAULT 'active', -- 'active', 'triggered', 'expired'
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Price adjustments table for tracking rebooking actions
CREATE TABLE IF NOT EXISTS public.price_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_booking_id UUID REFERENCES public.bookings(id),
  new_booking_id UUID REFERENCES public.bookings(id),
  adjustment_type TEXT NOT NULL, -- 'flight', 'hotel', 'activity'
  original_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  savings_amount NUMERIC GENERATED ALWAYS AS (original_price - new_price) STORED,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  processed_by TEXT DEFAULT 'auto_agent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Car rentals table
CREATE TABLE IF NOT EXISTS public.car_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  rental_company TEXT NOT NULL,
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  dropoff_date TIMESTAMP WITH TIME ZONE NOT NULL,
  vehicle_details JSONB NOT NULL, -- car type, model, features
  driver_license JSONB, -- license details, validation status
  insurance_options JSONB,
  total_cost NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'reserved',
  confirmation_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent task queue for real task assignment
CREATE TABLE IF NOT EXISTS public.agent_task_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  priority INTEGER DEFAULT 1, -- 1=high, 2=normal, 3=low
  customer_id UUID,
  task_data JSONB NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'queued', -- 'queued', 'assigned', 'in_progress', 'completed', 'failed'
  result JSONB,
  error_message TEXT,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agent performance metrics
CREATE TABLE IF NOT EXISTS public.agent_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  average_response_time_minutes NUMERIC DEFAULT 0,
  customer_satisfaction_score NUMERIC, -- 1-5 rating
  revenue_generated NUMERIC DEFAULT 0,
  cost_per_task NUMERIC DEFAULT 0,
  success_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN (tasks_completed + tasks_failed) > 0 
    THEN (tasks_completed::numeric / (tasks_completed + tasks_failed) * 100)
    ELSE 0 END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, metric_date)
);

-- Enable RLS on all tables
ALTER TABLE public.price_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own price monitors" ON public.price_monitors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own price adjustments" ON public.price_adjustments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage price adjustments" ON public.price_adjustments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage their own car rentals" ON public.car_rentals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage agent task queue" ON public.agent_task_queue
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage agent task queue" ON public.agent_task_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view agent performance" ON public.agent_performance
  FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Service role can manage agent performance" ON public.agent_performance
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_price_monitors_user_id ON public.price_monitors(user_id);
CREATE INDEX IF NOT EXISTS idx_price_monitors_status ON public.price_monitors(status);
CREATE INDEX IF NOT EXISTS idx_agent_task_queue_agent_id ON public.agent_task_queue(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_task_queue_status ON public.agent_task_queue(status);
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_date ON public.agent_performance(agent_id, metric_date);

-- Triggers for updated_at
CREATE TRIGGER update_price_monitors_updated_at
  BEFORE UPDATE ON public.price_monitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_adjustments_updated_at
  BEFORE UPDATE ON public.price_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_rentals_updated_at
  BEFORE UPDATE ON public.car_rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_task_queue_updated_at
  BEFORE UPDATE ON public.agent_task_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_performance_updated_at
  BEFORE UPDATE ON public.agent_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();