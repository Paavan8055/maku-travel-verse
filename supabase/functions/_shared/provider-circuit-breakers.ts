// Independent Circuit Breaker System for Each Provider
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import logger from "./logger.ts";

export interface CircuitBreakerConfig {
  providerId: string;
  failureThreshold: number;
  recoveryTimeout: number; // milliseconds
  halfOpenMaxCalls: number;
  healthCheckInterval: number; // milliseconds
}

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

export interface CircuitBreakerMetrics {
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  state: CircuitBreakerState;
  nextAttemptTime: number;
}

export class ProviderCircuitBreaker {
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private supabase: any;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.metrics = {
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      state: CircuitBreakerState.CLOSED,
      nextAttemptTime: 0
    };
    
    // Initialize Supabase client for persistence
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    this.loadStateFromDatabase();
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker is ${this.metrics.state} for provider ${this.config.providerId}`);
    }

    try {
      const result = await operation();
      await this.onSuccess();
      return result;
    } catch (error) {
      await this.onFailure(error);
      throw error;
    }
  }

  private canExecute(): boolean {
    const now = Date.now();

    switch (this.metrics.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        if (now >= this.metrics.nextAttemptTime) {
          this.setState(CircuitBreakerState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        // In half-open state, allow limited number of calls
        return this.metrics.successCount < this.config.halfOpenMaxCalls;

      default:
        return false;
    }
  }

  private async onSuccess(): Promise<void> {
    this.metrics.successCount++;
    this.metrics.lastSuccessTime = Date.now();

    if (this.metrics.state === CircuitBreakerState.HALF_OPEN) {
      if (this.metrics.successCount >= this.config.halfOpenMaxCalls) {
        // Enough successful calls in half-open state, close the circuit
        this.metrics.failureCount = 0;
        this.setState(CircuitBreakerState.CLOSED);
        logger.info(`[CIRCUIT-BREAKER] ${this.config.providerId} circuit closed after successful recovery`);
      }
    } else if (this.metrics.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in closed state
      this.metrics.failureCount = 0;
    }

    await this.persistState();
  }

  private async onFailure(error: any): Promise<void> {
    this.metrics.failureCount++;
    this.metrics.lastFailureTime = Date.now();

    logger.warn(`[CIRCUIT-BREAKER] ${this.config.providerId} failure recorded`, {
      failureCount: this.metrics.failureCount,
      threshold: this.config.failureThreshold,
      error: error.message
    });

    if (this.metrics.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit immediately
      this.openCircuit();
    } else if (this.metrics.failureCount >= this.config.failureThreshold) {
      // Threshold reached, open the circuit
      this.openCircuit();
    }

    await this.persistState();
  }

  private openCircuit(): void {
    this.setState(CircuitBreakerState.OPEN);
    this.metrics.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    this.metrics.successCount = 0;
    
    logger.error(`[CIRCUIT-BREAKER] ${this.config.providerId} circuit opened`, {
      failureCount: this.metrics.failureCount,
      nextAttemptTime: new Date(this.metrics.nextAttemptTime).toISOString()
    });
  }

  private setState(newState: CircuitBreakerState): void {
    const oldState = this.metrics.state;
    this.metrics.state = newState;
    
    if (oldState !== newState) {
      logger.info(`[CIRCUIT-BREAKER] ${this.config.providerId} state changed from ${oldState} to ${newState}`);
    }
  }

  private async loadStateFromDatabase(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('provider_configs')
        .select('circuit_breaker, circuit_breaker_state')
        .eq('id', this.config.providerId)
        .single();

      if (error) {
        logger.warn(`[CIRCUIT-BREAKER] Could not load state for ${this.config.providerId}:`, error);
        return;
      }

      if (data?.circuit_breaker) {
        this.metrics.failureCount = data.circuit_breaker.failure_count || 0;
        this.metrics.lastFailureTime = data.circuit_breaker.last_failure ? 
          new Date(data.circuit_breaker.last_failure).getTime() : 0;
        this.metrics.state = data.circuit_breaker_state || CircuitBreakerState.CLOSED;
        
        // Check if we should transition from OPEN to HALF_OPEN
        if (this.metrics.state === CircuitBreakerState.OPEN) {
          const timeSinceFailure = Date.now() - this.metrics.lastFailureTime;
          if (timeSinceFailure >= this.config.recoveryTimeout) {
            this.setState(CircuitBreakerState.HALF_OPEN);
          } else {
            this.metrics.nextAttemptTime = this.metrics.lastFailureTime + this.config.recoveryTimeout;
          }
        }
      }

      logger.debug(`[CIRCUIT-BREAKER] ${this.config.providerId} state loaded:`, {
        state: this.metrics.state,
        failureCount: this.metrics.failureCount
      });
    } catch (error) {
      logger.error(`[CIRCUIT-BREAKER] Error loading state for ${this.config.providerId}:`, error);
    }
  }

  private async persistState(): Promise<void> {
    try {
      const circuitBreakerData = {
        failure_count: this.metrics.failureCount,
        success_count: this.metrics.successCount,
        last_failure: this.metrics.lastFailureTime ? new Date(this.metrics.lastFailureTime).toISOString() : null,
        last_success: this.metrics.lastSuccessTime ? new Date(this.metrics.lastSuccessTime).toISOString() : null,
        state: this.metrics.state
      };

      const { error } = await this.supabase
        .from('provider_configs')
        .update({
          circuit_breaker: circuitBreakerData,
          circuit_breaker_state: this.metrics.state,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.config.providerId);

      if (error) {
        logger.error(`[CIRCUIT-BREAKER] Error persisting state for ${this.config.providerId}:`, error);
      }
    } catch (error) {
      logger.error(`[CIRCUIT-BREAKER] Error persisting state for ${this.config.providerId}:`, error);
    }
  }

  // Public methods for monitoring
  getState(): CircuitBreakerState {
    return this.metrics.state;
  }

  getMetrics(): Readonly<CircuitBreakerMetrics> {
    return { ...this.metrics };
  }

  async forceOpen(): Promise<void> {
    this.openCircuit();
    await this.persistState();
  }

  async forceClose(): Promise<void> {
    this.metrics.failureCount = 0;
    this.metrics.successCount = 0;
    this.setState(CircuitBreakerState.CLOSED);
    await this.persistState();
  }

  async reset(): Promise<void> {
    this.metrics = {
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      state: CircuitBreakerState.CLOSED,
      nextAttemptTime: 0
    };
    await this.persistState();
    logger.info(`[CIRCUIT-BREAKER] ${this.config.providerId} circuit breaker reset`);
  }
}

// Circuit Breaker Factory and Manager
export class CircuitBreakerManager {
  private static breakers: Map<string, ProviderCircuitBreaker> = new Map();
  
  private static defaultConfigs: Record<string, CircuitBreakerConfig> = {
    'sabre-flight': {
      providerId: 'sabre-flight',
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      halfOpenMaxCalls: 3,
      healthCheckInterval: 30000 // 30 seconds
    },
    'sabre-hotel': {
      providerId: 'sabre-hotel',
      failureThreshold: 5,
      recoveryTimeout: 60000,
      halfOpenMaxCalls: 3,
      healthCheckInterval: 30000
    },
    'amadeus-flight': {
      providerId: 'amadeus-flight',
      failureThreshold: 3, // Lower threshold due to rate limiting
      recoveryTimeout: 120000, // 2 minutes
      halfOpenMaxCalls: 2,
      healthCheckInterval: 30000
    },
    'amadeus-hotel': {
      providerId: 'amadeus-hotel',
      failureThreshold: 3,
      recoveryTimeout: 120000,
      halfOpenMaxCalls: 2,
      healthCheckInterval: 30000
    },
    'hotelbeds-hotel': {
      providerId: 'hotelbeds-hotel',
      failureThreshold: 5,
      recoveryTimeout: 90000, // 1.5 minutes
      halfOpenMaxCalls: 3,
      healthCheckInterval: 30000
    },
    'hotelbeds-activity': {
      providerId: 'hotelbeds-activity',
      failureThreshold: 5,
      recoveryTimeout: 90000,
      halfOpenMaxCalls: 3,
      healthCheckInterval: 30000
    }
  };

  static getCircuitBreaker(providerId: string, customConfig?: Partial<CircuitBreakerConfig>): ProviderCircuitBreaker {
    if (!this.breakers.has(providerId)) {
      const defaultConfig = this.defaultConfigs[providerId];
      if (!defaultConfig) {
        throw new Error(`No circuit breaker configuration found for provider: ${providerId}`);
      }
      
      const config = customConfig ? { ...defaultConfig, ...customConfig } : defaultConfig;
      this.breakers.set(providerId, new ProviderCircuitBreaker(config));
    }
    
    return this.breakers.get(providerId)!;
  }

  static async resetAllBreakers(): Promise<void> {
    const resetPromises = Array.from(this.breakers.values()).map(breaker => breaker.reset());
    await Promise.all(resetPromises);
    logger.info('[CIRCUIT-BREAKER-MANAGER] All circuit breakers reset');
  }

  static getAllStates(): Record<string, { state: CircuitBreakerState; metrics: CircuitBreakerMetrics }> {
    const states: Record<string, { state: CircuitBreakerState; metrics: CircuitBreakerMetrics }> = {};
    
    this.breakers.forEach((breaker, providerId) => {
      states[providerId] = {
        state: breaker.getState(),
        metrics: breaker.getMetrics()
      };
    });
    
    return states;
  }

  static async getHealthReport(): Promise<{
    healthy: string[];
    degraded: string[];
    failed: string[];
    summary: {
      total: number;
      healthy: number;
      degraded: number;
      failed: number;
    };
  }> {
    const healthy: string[] = [];
    const degraded: string[] = [];
    const failed: string[] = [];
    
    this.breakers.forEach((breaker, providerId) => {
      const state = breaker.getState();
      switch (state) {
        case CircuitBreakerState.CLOSED:
          healthy.push(providerId);
          break;
        case CircuitBreakerState.HALF_OPEN:
          degraded.push(providerId);
          break;
        case CircuitBreakerState.OPEN:
          failed.push(providerId);
          break;
      }
    });
    
    return {
      healthy,
      degraded,
      failed,
      summary: {
        total: this.breakers.size,
        healthy: healthy.length,
        degraded: degraded.length,
        failed: failed.length
      }
    };
  }
}