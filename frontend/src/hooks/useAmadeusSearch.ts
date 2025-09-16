/**
 * @deprecated This file is deprecated and should not be used in new code.
 * Use the unified search hooks from `src/hooks/useUnifiedSearch.ts` instead,
 * which utilize the provider-rotation system for better reliability and failover.
 * 
 * @todo Remove this file after confirming no active dependencies exist.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logger from "@/utils/logger";

// This file is deprecated - use useUnifiedSearch.ts instead
console.warn(
  'useAmadeusSearch.ts is deprecated. Use unified search hooks that leverage provider-rotation for better reliability.'
);

// Re-export from unified search to maintain compatibility temporarily
export { 
  useFlightSearch,
  useHotelSearch,
  useTransferSearch,
  useActivitySearch
} from './useUnifiedSearch';