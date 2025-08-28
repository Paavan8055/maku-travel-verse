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