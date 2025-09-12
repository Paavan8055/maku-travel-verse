import { v4 as uuidv4 } from 'uuid';

class CorrelationIdManager {
  private static instance: CorrelationIdManager;
  private currentId: string | null = null;

  static getInstance(): CorrelationIdManager {
    if (!CorrelationIdManager.instance) {
      CorrelationIdManager.instance = new CorrelationIdManager();
    }
    return CorrelationIdManager.instance;
  }

  generateId(): string {
    this.currentId = uuidv4();
    return this.currentId;
  }

  getCurrentId(): string {
    return this.currentId || this.generateId();
  }

  setId(id: string): void {
    this.currentId = id;
  }

  clear(): void {
    this.currentId = null;
  }

  // Create headers with correlation ID
  getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'X-Correlation-ID': this.getCurrentId(),
      ...additionalHeaders
    };
  }

  // Auto-log correlation tracking data
  async logCorrelationData(
    requestType: string,
    status: 'in_progress' | 'completed' | 'failed',
    requestData: any,
    responseData?: any,
    serviceName?: string,
    errorMessage?: string,
    durationMs?: number,
    userId?: string
  ) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const correlationData = {
        correlation_id: this.getCurrentId(),
        request_type: requestType,
        status,
        request_data: requestData,
        response_data: responseData,
        service_name: serviceName,
        error_message: errorMessage,
        duration_ms: durationMs,
        user_id: userId,
        created_at: new Date().toISOString(),
        completed_at: status !== 'in_progress' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('correlation_tracking')
        .upsert(correlationData);

      if (error) {
        console.error('Failed to log correlation data:', error);
      }
    } catch (error) {
      console.error('Error logging correlation data:', error);
    }
  }

  // Extract correlation ID from request headers
  extractFromHeaders(headers: Headers | Record<string, string>): string | null {
    if (headers instanceof Headers) {
      return headers.get('X-Correlation-ID');
    }
    return headers['X-Correlation-ID'] || headers['x-correlation-id'] || null;
  }
}

export const correlationId = CorrelationIdManager.getInstance();

// Helper function for easy access
export const withCorrelationId = <T extends Record<string, any>>(
  data: T
): T & { correlationId: string } => ({
  ...data,
  correlationId: correlationId.getCurrentId()
});

// Middleware function for fetch requests
export const withCorrelationHeaders = (
  options: RequestInit = {}
): RequestInit => ({
  ...options,
  headers: {
    ...options.headers,
    ...correlationId.getHeaders()
  }
});