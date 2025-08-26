import logger from '@/utils/logger';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  monitoringPeriod: number;
  expectedExceptionPredicate?: (error: Error) => boolean;
}

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  failedRequests: number;
  successRate: number;
  averageResponseTime: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: Date;
  private nextAttempt?: Date;
  private metrics: CircuitBreakerMetrics = {
    totalRequests: 0,
    failedRequests: 0,
    successRate: 100,
    averageResponseTime: 0
  };

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;
    
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        logger.info(`Circuit breaker ${this.name} entering half-open state`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    const startTime = Date.now();
    
    try {
      const result = await operation();
      this.onSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(responseTime: number): void {
    this.updateResponseTime(responseTime);
    this.metrics.lastSuccessTime = new Date();
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.reset();
      logger.info(`Circuit breaker ${this.name} reset to CLOSED state`);
    }
  }

  private onFailure(error: Error): void {
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = new Date();
    
    // Check if this is an expected exception
    if (this.config.expectedExceptionPredicate && 
        this.config.expectedExceptionPredicate(error)) {
      return; // Don't count expected exceptions as failures
    }

    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN || 
        this.failureCount >= this.config.failureThreshold) {
      this.trip();
    }

    this.updateMetrics();
  }

  private trip(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.config.timeout);
    
    logger.warn(`Circuit breaker ${this.name} tripped to OPEN state`, {
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold,
      nextAttempt: this.nextAttempt
    });
  }

  private reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.nextAttempt = undefined;
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttempt ? Date.now() >= this.nextAttempt.getTime() : false;
  }

  private updateResponseTime(responseTime: number): void {
    // Exponential moving average
    const alpha = 0.2;
    this.metrics.averageResponseTime = this.metrics.averageResponseTime === 0 ? 
      responseTime : 
      (alpha * responseTime) + ((1 - alpha) * this.metrics.averageResponseTime);
  }

  private updateMetrics(): void {
    this.metrics.successRate = this.metrics.totalRequests > 0 ? 
      ((this.metrics.totalRequests - this.metrics.failedRequests) / this.metrics.totalRequests) * 100 : 
      100;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  isRequestAllowed(): boolean {
    return this.state === CircuitBreakerState.CLOSED || 
           (this.state === CircuitBreakerState.HALF_OPEN);
  }

  getName(): string {
    return this.name;
  }
}

export class CircuitBreakerRegistry {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    timeout: 60000, // 1 minute
    monitoringPeriod: 30000 // 30 seconds
  };

  getCircuitBreaker(
    name: string, 
    config: Partial<CircuitBreakerConfig> = {}
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      const fullConfig = { ...this.defaultConfig, ...config };
      this.circuitBreakers.set(name, new CircuitBreaker(name, fullConfig));
    }
    
    return this.circuitBreakers.get(name)!;
  }

  getAllCircuitBreakers(): CircuitBreaker[] {
    return Array.from(this.circuitBreakers.values());
  }

  getSystemHealth(): {
    totalBreakers: number;
    openBreakers: number;
    halfOpenBreakers: number;
    overallHealth: number;
  } {
    const breakers = this.getAllCircuitBreakers();
    const openCount = breakers.filter(cb => cb.getState() === CircuitBreakerState.OPEN).length;
    const halfOpenCount = breakers.filter(cb => cb.getState() === CircuitBreakerState.HALF_OPEN).length;
    
    const overallHealth = breakers.length > 0 ? 
      ((breakers.length - openCount - halfOpenCount * 0.5) / breakers.length) * 100 : 
      100;

    return {
      totalBreakers: breakers.length,
      openBreakers: openCount,
      halfOpenBreakers: halfOpenCount,
      overallHealth
    };
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();