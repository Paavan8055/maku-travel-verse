import { z } from 'zod';

export interface ApiRequestOptions extends RequestInit {
  correlationId?: string;
  maxRetries?: number;
  retryDelay?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public correlationId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Centralized API client with retry logic, correlation IDs, and schema validation
 */
export async function apiFetch<T>(
  url: string,
  options: ApiRequestOptions = {},
  schema?: z.ZodSchema<T>
): Promise<T> {
  const {
    correlationId = crypto.randomUUID(),
    maxRetries = 3,
    retryDelay = 250,
    ...fetchOptions
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          correlationId
        );
      }

      const data = await response.json();

      // Validate response if schema provided
      if (schema) {
        const result = schema.safeParse(data);
        if (!result.success) {
          console.error('API response validation failed:', result.error);
          throw new ApiError(
            'Invalid response format from API',
            undefined,
            correlationId
          );
        }
        return result.data;
      }

      return data;
    } catch (error) {
      console.warn(`API request attempt ${attempt}/${maxRetries} failed:`, {
        url,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error instanceof ApiError 
          ? error 
          : new ApiError(
              error instanceof Error ? error.message : 'API request failed',
              undefined,
              correlationId
            );
      }

      // Exponential backoff with jitter
      const delay = retryDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new ApiError('Unreachable code', undefined, correlationId);
}

// Common response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  correlationId: z.string().optional(),
});

export const AmadeusResponseSchema = z.object({
  data: z.array(z.any()).optional(),
  meta: z.object({
    count: z.number().optional(),
    links: z.any().optional(),
  }).optional(),
  warnings: z.array(z.any()).optional(),
});

export const SabreResponseSchema = z.object({
  PaginationMetaData: z.any().optional(),
  Results: z.array(z.any()).optional(),
  Errors: z.array(z.any()).optional(),
});

/**
 * Helper for making requests to Supabase edge functions with correlation tracking
 */
export async function supabaseFetch<T>(
  functionName: string,
  body?: any,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const supabaseUrl = 'https://iomeddeasarntjhqzndu.supabase.co';
  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  
  return apiFetch(
    url,
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || ''}`,
      },
    },
    schema
  );
}