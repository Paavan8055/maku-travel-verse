export interface UnifiedSearchItem {
  title?: string;
  name?: string;
  vehicle?: {
    description?: string;
  };
  description?: string;
  location?: string;
  source?: string;
  price?: {
    currency?: string;
    amount?: number;
  };
  pricePerNight?: number;
  totalPrice?: number;
  responseTime?: number;
  currency?: string;
}

export interface UnifiedSearchResults {
  resultCounts?: Record<string, number>;
  flights?: UnifiedSearchItem[];
  hotels?: UnifiedSearchItem[];
  activities?: UnifiedSearchItem[];
  cars?: UnifiedSearchItem[];
  transfers?: UnifiedSearchItem[];
}
