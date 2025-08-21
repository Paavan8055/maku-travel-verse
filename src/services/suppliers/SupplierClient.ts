import { apiFetch, ApiError } from '@/utils/apiClient';
import { z } from 'zod';
import logger from '@/utils/logger';

// Base supplier interfaces
export interface BaseSupplierConfig {
  name: string;
  baseUrl: string;
  isTestEnvironment: boolean;
  timeout: number;
  maxRetries: number;
}

export interface SupplierCredentials {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  token?: string;
}

export interface SupplierResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId?: string;
  supplier: string;
  cached?: boolean;
}

// Schema validation for common supplier responses
export const SupplierErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
  details: z.any().optional()
});

export const SupplierMetaSchema = z.object({
  count: z.number().optional(),
  links: z.any().optional(),
  warnings: z.array(z.any()).optional()
});

/**
 * Base Supplier Client with standardized functionality
 */
export abstract class BaseSupplierClient {
  protected config: BaseSupplierConfig;
  protected credentials: SupplierCredentials;
  protected accessToken?: string;
  protected tokenExpiry?: Date;

  constructor(config: BaseSupplierConfig, credentials: SupplierCredentials) {
    this.config = config;
    this.credentials = credentials;
  }

  /**
   * Get valid access token (implement authentication flow)
   */
  protected abstract getAccessToken(correlationId?: string): Promise<string>;

  /**
   * Make authenticated request to supplier API
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      schema?: z.ZodSchema<T>;
      correlationId?: string;
    } = {}
  ): Promise<SupplierResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      schema,
      correlationId = crypto.randomUUID()
    } = options;

    try {
      // Get access token
      const token = await this.getAccessToken(correlationId);

      // Prepare request
      const url = `${this.config.baseUrl}${endpoint}`;
      const requestOptions = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        maxRetries: this.config.maxRetries,
        correlationId
      };

      logger.info(`${this.config.name} API request:`, {
        method,
        url,
        correlationId,
        supplier: this.config.name
      });

      // Make request with retry logic
      const data = await apiFetch<T>(url, requestOptions, schema);

      logger.info(`${this.config.name} API response:`, {
        success: true,
        correlationId,
        supplier: this.config.name
      });

      return {
        success: true,
        data,
        correlationId,
        supplier: this.config.name
      };

    } catch (error) {
      logger.error(`${this.config.name} API error:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
        supplier: this.config.name,
        endpoint
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'API request failed',
        correlationId,
        supplier: this.config.name
      };
    }
  }

  /**
   * Check if we need to refresh the access token
   */
  protected needsTokenRefresh(): boolean {
    if (!this.accessToken || !this.tokenExpiry) {
      return true;
    }
    
    // Refresh 5 minutes before expiry
    const bufferTime = 5 * 60 * 1000;
    return Date.now() > (this.tokenExpiry.getTime() - bufferTime);
  }

  /**
   * Get supplier configuration
   */
  public getConfig(): BaseSupplierConfig {
    return { ...this.config };
  }

  /**
   * Test supplier connectivity
   */
  public abstract testConnection(correlationId?: string): Promise<SupplierResponse<any>>;
}

/**
 * Multi-supplier aggregation utilities
 */
export class SupplierAggregator {
  private suppliers: BaseSupplierClient[] = [];

  addSupplier(supplier: BaseSupplierClient): void {
    this.suppliers.push(supplier);
  }

  removeSupplier(supplierName: string): void {
    this.suppliers = this.suppliers.filter(s => s.getConfig().name !== supplierName);
  }

  getSuppliers(): BaseSupplierClient[] {
    return [...this.suppliers];
  }

  /**
   * Execute request across multiple suppliers with failover
   */
  async executeWithFailover<T>(
    requestFn: (supplier: BaseSupplierClient, correlationId: string) => Promise<SupplierResponse<T>>,
    correlationId: string = crypto.randomUUID()
  ): Promise<SupplierResponse<T>> {
    const errors: string[] = [];

    for (const supplier of this.suppliers) {
      try {
        logger.info(`Trying supplier: ${supplier.getConfig().name}`, { correlationId });
        
        const result = await requestFn(supplier, correlationId);
        
        if (result.success) {
          logger.info(`Success with supplier: ${supplier.getConfig().name}`, { correlationId });
          return result;
        }
        
        errors.push(`${supplier.getConfig().name}: ${result.error}`);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${supplier.getConfig().name}: ${errorMsg}`);
        logger.error(`Supplier ${supplier.getConfig().name} failed:`, { error: errorMsg, correlationId });
      }
    }

    return {
      success: false,
      error: `All suppliers failed: ${errors.join('; ')}`,
      correlationId,
      supplier: 'aggregator'
    };
  }

  /**
   * Execute request across multiple suppliers and aggregate results
   */
  async executeAndAggregate<T>(
    requestFn: (supplier: BaseSupplierClient, correlationId: string) => Promise<SupplierResponse<T[]>>,
    correlationId: string = crypto.randomUUID()
  ): Promise<SupplierResponse<T[]>> {
    const results: T[] = [];
    const errors: string[] = [];
    let hasAnySuccess = false;

    await Promise.allSettled(
      this.suppliers.map(async (supplier) => {
        try {
          const result = await requestFn(supplier, correlationId);
          
          if (result.success && result.data) {
            results.push(...result.data);
            hasAnySuccess = true;
            logger.info(`Success with supplier: ${supplier.getConfig().name}`, { correlationId });
          } else {
            errors.push(`${supplier.getConfig().name}: ${result.error}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${supplier.getConfig().name}: ${errorMsg}`);
        }
      })
    );

    if (!hasAnySuccess && errors.length > 0) {
      return {
        success: false,
        error: `All suppliers failed: ${errors.join('; ')}`,
        correlationId,
        supplier: 'aggregator'
      };
    }

    return {
      success: true,
      data: results,
      correlationId,
      supplier: 'aggregator'
    };
  }
}