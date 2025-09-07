-- Create reservation_orchestrations table for the reservations manager
CREATE TABLE public.reservation_orchestrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  reservation_type TEXT NOT NULL DEFAULT 'multi_service',
  customer_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  orchestration_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  results JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reservation_orchestrations ENABLE ROW LEVEL SECURITY;

-- Create policies for reservation orchestrations
CREATE POLICY "Users can view their own reservations orchestrations"
ON public.reservation_orchestrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservation orchestrations"
ON public.reservation_orchestrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservation orchestrations"
ON public.reservation_orchestrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all reservation orchestrations"
ON public.reservation_orchestrations 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reservation_orchestrations_updated_at
BEFORE UPDATE ON public.reservation_orchestrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_reservation_orchestrations_user_id ON public.reservation_orchestrations(user_id);
CREATE INDEX idx_reservation_orchestrations_status ON public.reservation_orchestrations(status);
CREATE INDEX idx_reservation_orchestrations_created_at ON public.reservation_orchestrations(created_at DESC);