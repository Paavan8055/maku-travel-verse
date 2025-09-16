import { BaseSupplierClient, SupplierResponse } from './SupplierClient';
import logger from '@/utils/logger';

/**
 * Advanced supplier aggregation with intelligent routing and failover
 */
export class SupplierAggregator {
  private suppliers: Map<string, BaseSupplierClient> = new Map();
  private healthScores: Map<string, number> = new Map();
  private lastHealthCheck: Map<string, Date> = new Map();

  constructor() {
    this.initializeHealthScores();
  }

  private initializeHealthScores(): void {
    // Initialize health scores to maximum
    this.healthScores.set('amadeus', 100);
    this.healthScores.set('hotelbeds', 100);
    this.healthScores.set('sabre', 100);
    this.healthScores.set('travelport', 100);
  }

  addSupplier(name: string, supplier: BaseSupplierClient): void {
    this.suppliers.set(name, supplier);
    if (!this.healthScores.has(name)) {
      this.healthScores.set(name, 100);
    }
    logger.info(`Added supplier: ${name}`);
  }

  removeSupplier(name: string): void {
    this.suppliers.delete(name);
    this.healthScores.delete(name);
    this.lastHealthCheck.delete(name);
    logger.info(`Removed supplier: ${name}`);
  }

  getSuppliers(): BaseSupplierClient[] {
    return Array.from(this.suppliers.values());
  }

  getHealthySuppliers(): Array<{ name: string; client: BaseSupplierClient; score: number }> {
    const healthySuppliers = [];
    
    for (const [name, client] of this.suppliers) {
      const score = this.healthScores.get(name) || 0;
      if (score > 30) { // Only include suppliers with decent health
        healthySuppliers.push({ name, client, score });
      }
    }

    // Sort by health score (highest first)
    return healthySuppliers.sort((a, b) => b.score - a.score);
  }

  /**
   * Update health score based on API response
   */
  updateHealthScore(supplierName: string, success: boolean, responseTime: number): void {
    const currentScore = this.healthScores.get(supplierName) || 100;
    
    if (success) {
      // Improve score for successful calls
      const improvement = responseTime < 2000 ? 5 : 2; // Better score for faster responses
      this.healthScores.set(supplierName, Math.min(100, currentScore + improvement));
    } else {
      // Decrease score for failures
      this.healthScores.set(supplierName, Math.max(0, currentScore - 20));
    }

    this.lastHealthCheck.set(supplierName, new Date());
    
    logger.info(`Updated health score for ${supplierName}: ${this.healthScores.get(supplierName)}`);
  }

  /**
   * Execute request with intelligent supplier selection
   */
  async executeWithIntelligentRouting<T>(
    requestFn: (supplier: BaseSupplierClient, supplierName: string, correlationId: string) => Promise<SupplierResponse<T>>,
    correlationId: string = crypto.randomUUID(),
    preferredSuppliers?: string[]
  ): Promise<SupplierResponse<T>> {
    const healthySuppliers = this.getHealthySuppliers();
    
    if (healthySuppliers.length === 0) {
      return {
        success: false,
        error: 'No healthy suppliers available',
        correlationId,
        supplier: 'aggregator'
      };
    }

    // Prioritize preferred suppliers if specified
    const orderedSuppliers = preferredSuppliers 
      ? this.orderSuppliersByPreference(healthySuppliers, preferredSuppliers)
      : healthySuppliers;

    const errors: string[] = [];

    for (const { name, client } of orderedSuppliers) {
      const startTime = Date.now();
      
      try {
        logger.info(`Attempting request with supplier: ${name}`, { correlationId });
        
        const result = await requestFn(client, name, correlationId);
        const responseTime = Date.now() - startTime;
        
        this.updateHealthScore(name, result.success, responseTime);
        
        if (result.success) {
          logger.info(`Success with supplier: ${name} (${responseTime}ms)`, { correlationId });
          return {
            ...result,
            supplier: name,
            responseTime
          };
        }
        
        errors.push(`${name}: ${result.error}`);
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        this.updateHealthScore(name, false, responseTime);
        errors.push(`${name}: ${errorMsg}`);
        
        logger.error(`Supplier ${name} failed:`, { error: errorMsg, correlationId, responseTime });
      }
    }

    return {
      success: false,
      error: `All suppliers failed: ${errors.join('; ')}`,
      correlationId,
      supplier: 'aggregator',
      healthScores: Object.fromEntries(this.healthScores)
    };
  }

  /**
   * Execute request across multiple suppliers and aggregate results
   */
  async executeAndAggregate<T>(
    requestFn: (supplier: BaseSupplierClient, supplierName: string, correlationId: string) => Promise<SupplierResponse<T[]>>,
    correlationId: string = crypto.randomUUID(),
    maxConcurrent: number = 3
  ): Promise<SupplierResponse<T[]>> {
    const healthySuppliers = this.getHealthySuppliers().slice(0, maxConcurrent);
    
    if (healthySuppliers.length === 0) {
      return {
        success: false,
        error: 'No healthy suppliers available',
        correlationId,
        supplier: 'aggregator'
      };
    }

    const results: T[] = [];
    const errors: string[] = [];
    let hasAnySuccess = false;
    const supplierResults: Record<string, { success: boolean; count: number; responseTime: number }> = {};

    await Promise.allSettled(
      healthySuppliers.map(async ({ name, client }) => {
        const startTime = Date.now();
        
        try {
          const result = await requestFn(client, name, correlationId);
          const responseTime = Date.now() - startTime;
          
          supplierResults[name] = { 
            success: result.success, 
            count: result.data?.length || 0, 
            responseTime 
          };
          
          this.updateHealthScore(name, result.success, responseTime);
          
          if (result.success && result.data) {
            // Add supplier source to each result
            const enhancedData = result.data.map(item => ({
              ...item,
              source: name,
              responseTime
            }));
            
            results.push(...enhancedData);
            hasAnySuccess = true;
            logger.info(`Success with supplier: ${name} (${result.data.length} results, ${responseTime}ms)`, { correlationId });
          } else {
            errors.push(`${name}: ${result.error}`);
          }
        } catch (error) {
          const responseTime = Date.now() - startTime;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          
          supplierResults[name] = { success: false, count: 0, responseTime };
          this.updateHealthScore(name, false, responseTime);
          errors.push(`${name}: ${errorMsg}`);
          
          logger.error(`Supplier ${name} failed:`, { error: errorMsg, correlationId, responseTime });
        }
      })
    );

    if (!hasAnySuccess && errors.length > 0) {
      return {
        success: false,
        error: `All suppliers failed: ${errors.join('; ')}`,
        correlationId,
        supplier: 'aggregator',
        supplierResults
      };
    }

    // Sort results by relevance and price
    const sortedResults = this.sortAggregatedResults(results);

    return {
      success: true,
      data: sortedResults,
      correlationId,
      supplier: 'aggregator',
      supplierResults
    };
  }

  private orderSuppliersByPreference(
    healthySuppliers: Array<{ name: string; client: BaseSupplierClient; score: number }>,
    preferredSuppliers: string[]
  ): Array<{ name: string; client: BaseSupplierClient; score: number }> {
    const preferred = [];
    const others = [];

    for (const supplier of healthySuppliers) {
      if (preferredSuppliers.includes(supplier.name)) {
        preferred.push(supplier);
      } else {
        others.push(supplier);
      }
    }

    // Sort preferred by health score, then add others
    preferred.sort((a, b) => b.score - a.score);
    others.sort((a, b) => b.score - a.score);

    return [...preferred, ...others];
  }

  private sortAggregatedResults<T>(results: T[]): T[] {
    return results.sort((a: any, b: any) => {
      // Prioritize by price (if available)
      const priceA = a.price?.amount || a.pricePerNight || a.totalPrice || 0;
      const priceB = b.price?.amount || b.pricePerNight || b.totalPrice || 0;
      
      if (priceA && priceB) {
        return priceA - priceB;
      }

      // Secondary sort by response time (faster responses first)
      const timeA = a.responseTime || 0;
      const timeB = b.responseTime || 0;
      
      return timeA - timeB;
    });
  }

  /**
   * Get aggregator health status
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'critical';
    suppliers: Record<string, { score: number; lastCheck: Date | null; status: string }>;
    totalSuppliers: number;
    healthySuppliers: number;
  } {
    const supplierStatuses = {};
    let totalHealthy = 0;

    for (const [name, score] of this.healthScores) {
      const status = score > 70 ? 'healthy' : score > 30 ? 'degraded' : 'critical';
      if (score > 30) totalHealthy++;

      supplierStatuses[name] = {
        score,
        lastCheck: this.lastHealthCheck.get(name) || null,
        status
      };
    }

    const healthyRatio = totalHealthy / this.suppliers.size;
    const overall = healthyRatio > 0.7 ? 'healthy' : healthyRatio > 0.3 ? 'degraded' : 'critical';

    return {
      overall,
      suppliers: supplierStatuses,
      totalSuppliers: this.suppliers.size,
      healthySuppliers: totalHealthy
    };
  }
}

// Export singleton instance
export const supplierAggregator = new SupplierAggregator();