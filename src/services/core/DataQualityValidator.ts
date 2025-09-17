import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

export interface ValidationRule {
  name: string;
  type: 'required' | 'format' | 'range' | 'custom';
  field: string;
  condition?: any;
  validator?: (value: any, context?: any) => boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 quality score
  violations: {
    rule: string;
    severity: 'error' | 'warning' | 'info';
    field: string;
    message: string;
    value?: any;
  }[];
  metadata: {
    totalFields: number;
    validFields: number;
    missingFields: number;
    provider?: string;
    responseTime?: number;
  };
}

export interface QualityMetrics {
  providerId: string;
  searchType: string;
  avgQualityScore: number;
  totalValidations: number;
  errorRate: number;
  commonIssues: { issue: string; frequency: number }[];
  trendDirection: 'improving' | 'declining' | 'stable';
}

export class DataQualityValidator {
  private validationRules = new Map<string, ValidationRule[]>();
  private qualityHistory = new Map<string, Array<{ timestamp: number; score: number; violations: number }>>();
  private commonIssuesTracker = new Map<string, Map<string, number>>();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Flight data validation rules
    this.validationRules.set('flight', [
      {
        name: 'required_flight_fields',
        type: 'required',
        field: 'flights',
        severity: 'error',
        message: 'Flight results must contain flights array'
      },
      {
        name: 'flight_price_validity',
        type: 'range',
        field: 'flights[].price',
        condition: { min: 0, max: 50000 },
        severity: 'error',
        message: 'Flight price must be between $0 and $50,000'
      },
      {
        name: 'departure_date_format',
        type: 'format',
        field: 'flights[].departure.date',
        condition: /^\d{4}-\d{2}-\d{2}$/,
        severity: 'error',
        message: 'Departure date must be in YYYY-MM-DD format'
      },
      {
        name: 'airline_code_format',
        type: 'format',
        field: 'flights[].airline.code',
        condition: /^[A-Z]{2}$/,
        severity: 'warning',
        message: 'Airline code should be 2-letter IATA code'
      },
      {
        name: 'duration_reasonableness',
        type: 'custom',
        field: 'flights[].duration',
        validator: (duration: string) => {
          const minutes = this.parseDurationToMinutes(duration);
          return minutes >= 30 && minutes <= 1440; // 30 minutes to 24 hours
        },
        severity: 'warning',
        message: 'Flight duration seems unreasonable'
      }
    ]);

    // Hotel data validation rules
    this.validationRules.set('hotel', [
      {
        name: 'required_hotel_fields',
        type: 'required',
        field: 'hotels',
        severity: 'error',
        message: 'Hotel results must contain hotels array'
      },
      {
        name: 'hotel_price_validity',
        type: 'range',
        field: 'hotels[].pricePerNight',
        condition: { min: 0, max: 10000 },
        severity: 'error',
        message: 'Hotel price per night must be between $0 and $10,000'
      },
      {
        name: 'star_rating_range',
        type: 'range',
        field: 'hotels[].starRating',
        condition: { min: 0, max: 5 },
        severity: 'error',
        message: 'Hotel star rating must be between 0 and 5'
      },
      {
        name: 'guest_rating_range',
        type: 'range',
        field: 'hotels[].rating',
        condition: { min: 0, max: 10 },
        severity: 'warning',
        message: 'Guest rating should be between 0 and 10'
      },
      {
        name: 'amenities_list_validity',
        type: 'custom',
        field: 'hotels[].amenities',
        validator: (amenities: any) => Array.isArray(amenities) && amenities.length > 0,
        severity: 'info',
        message: 'Hotel should have at least one amenity listed'
      }
    ]);

    // Activity data validation rules
    this.validationRules.set('activity', [
      {
        name: 'required_activity_fields',
        type: 'required',
        field: 'activities',
        severity: 'error',
        message: 'Activity results must contain activities array'
      },
      {
        name: 'activity_price_validity',
        type: 'range',
        field: 'activities[].price',
        condition: { min: 0, max: 5000 },
        severity: 'error',
        message: 'Activity price must be between $0 and $5,000'
      },
      {
        name: 'duration_format',
        type: 'custom',
        field: 'activities[].duration',
        validator: (duration: any) => {
          if (typeof duration === 'string') {
            return /^\d+(\.\d+)?\s*(hour|hours|hr|hrs|minute|minutes|min|mins|day|days)s?$/i.test(duration);
          }
          return typeof duration === 'number' && duration > 0;
        },
        severity: 'warning',
        message: 'Activity duration format is not standard'
      },
      {
        name: 'location_coordinates',
        type: 'custom',
        field: 'activities[].location',
        validator: (location: any) => {
          return location && 
                 typeof location.latitude === 'number' && 
                 typeof location.longitude === 'number' &&
                 Math.abs(location.latitude) <= 90 &&
                 Math.abs(location.longitude) <= 180;
        },
        severity: 'info',
        message: 'Activity location should include valid coordinates'
      }
    ]);
  }

  async validateResponse(
    data: any,
    searchType: 'flight' | 'hotel' | 'activity',
    providerId?: string,
    responseTime?: number
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const rules = this.validationRules.get(searchType) || [];
    
    if (rules.length === 0) {
      logger.warn(`No validation rules found for search type: ${searchType}`);
      return this.createEmptyValidationResult(data);
    }

    const violations: ValidationResult['violations'] = [];
    let totalFields = 0;
    let validFields = 0;
    let missingFields = 0;

    try {
      for (const rule of rules) {
        const ruleViolations = await this.validateRule(rule, data);
        violations.push(...ruleViolations);
        
        // Count field statistics
        const fieldCount = this.countFields(rule.field, data);
        totalFields += fieldCount.total;
        validFields += fieldCount.valid;
        missingFields += fieldCount.missing;
      }

      // Calculate quality score (0-100)
      const errorViolations = violations.filter(v => v.severity === 'error').length;
      const warningViolations = violations.filter(v => v.severity === 'warning').length;
      
      const score = Math.max(0, 100 - (errorViolations * 20) - (warningViolations * 5));
      
      const result: ValidationResult = {
        isValid: errorViolations === 0,
        score: Math.round(score),
        violations,
        metadata: {
          totalFields,
          validFields,
          missingFields,
          provider: providerId,
          responseTime
        }
      };

      // Store quality metrics
      if (providerId) {
        await this.recordQualityMetrics(providerId, searchType, result);
      }

      logger.info('Data validation completed', {
        searchType,
        providerId,
        score: result.score,
        violationCount: violations.length,
        validationTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error('Data validation failed:', error);
      
      return {
        isValid: false,
        score: 0,
        violations: [{
          rule: 'validation_error',
          severity: 'error',
          field: 'unknown',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        metadata: {
          totalFields: 0,
          validFields: 0,
          missingFields: 0,
          provider: providerId,
          responseTime
        }
      };
    }
  }

  private async validateRule(rule: ValidationRule, data: any): Promise<ValidationResult['violations']> {
    const violations: ValidationResult['violations'] = [];

    try {
      const fieldValues = this.extractFieldValues(rule.field, data);
      
      for (const { path, value, exists } of fieldValues) {
        switch (rule.type) {
          case 'required':
            if (!exists || value === null || value === undefined) {
              violations.push({
                rule: rule.name,
                severity: rule.severity,
                field: path,
                message: rule.message,
                value
              });
            }
            break;

          case 'format':
            if (exists && value !== null && value !== undefined) {
              const regex = rule.condition as RegExp;
              if (!regex.test(String(value))) {
                violations.push({
                  rule: rule.name,
                  severity: rule.severity,
                  field: path,
                  message: rule.message,
                  value
                });
              }
            }
            break;

          case 'range':
            if (exists && value !== null && value !== undefined) {
              const { min, max } = rule.condition;
              const numValue = Number(value);
              if (isNaN(numValue) || numValue < min || numValue > max) {
                violations.push({
                  rule: rule.name,
                  severity: rule.severity,
                  field: path,
                  message: rule.message,
                  value
                });
              }
            }
            break;

          case 'custom':
            if (rule.validator && exists) {
              try {
                if (!rule.validator(value, data)) {
                  violations.push({
                    rule: rule.name,
                    severity: rule.severity,
                    field: path,
                    message: rule.message,
                    value
                  });
                }
              } catch (validatorError) {
                violations.push({
                  rule: rule.name,
                  severity: 'error',
                  field: path,
                  message: `Custom validator failed: ${validatorError}`,
                  value
                });
              }
            }
            break;
        }
      }
    } catch (error) {
      violations.push({
        rule: rule.name,
        severity: 'error',
        field: rule.field,
        message: `Rule validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return violations;
  }

  private extractFieldValues(fieldPath: string, data: any): Array<{ path: string; value: any; exists: boolean }> {
    const results: Array<{ path: string; value: any; exists: boolean }> = [];
    
    // Handle array notation like 'flights[]' or 'hotels[].price'
    if (fieldPath.includes('[]')) {
      const [arrayPath, ...restPath] = fieldPath.split('[]');
      const arrayValue = this.getNestedValue(data, arrayPath);
      
      if (Array.isArray(arrayValue)) {
        arrayValue.forEach((item, index) => {
          const itemPath = restPath.length > 0 ? restPath.join('[]') : '';
          if (itemPath) {
            const itemResults = this.extractFieldValues(itemPath.substring(1), item); // Remove leading '.'
            itemResults.forEach(result => {
              results.push({
                path: `${arrayPath}[${index}]${itemPath}`,
                value: result.value,
                exists: result.exists
              });
            });
          } else {
            results.push({
              path: `${arrayPath}[${index}]`,
              value: item,
              exists: true
            });
          }
        });
      } else {
        results.push({
          path: fieldPath,
          value: undefined,
          exists: false
        });
      }
    } else {
      const value = this.getNestedValue(data, fieldPath);
      results.push({
        path: fieldPath,
        value,
        exists: value !== undefined
      });
    }

    return results;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private countFields(fieldPath: string, data: any): { total: number; valid: number; missing: number } {
    const values = this.extractFieldValues(fieldPath, data);
    const total = values.length;
    const valid = values.filter(v => v.exists && v.value !== null && v.value !== undefined).length;
    const missing = total - valid;
    
    return { total, valid, missing };
  }

  private parseDurationToMinutes(duration: string): number {
    const match = duration.match(/(\d+)h?\s*(\d+)?m?/i);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      return hours * 60 + minutes;
    }
    return 0;
  }

  private createEmptyValidationResult(data: any): ValidationResult {
    return {
      isValid: true,
      score: 50, // Neutral score when no rules exist
      violations: [],
      metadata: {
        totalFields: 0,
        validFields: 0,
        missingFields: 0
      }
    };
  }

  private async recordQualityMetrics(
    providerId: string,
    searchType: string,
    result: ValidationResult
  ): Promise<void> {
    const key = `${providerId}_${searchType}`;
    const history = this.qualityHistory.get(key) || [];
    
    history.push({
      timestamp: Date.now(),
      score: result.score,
      violations: result.violations.length
    });

    // Keep only last 100 records
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.qualityHistory.set(key, history);

    // Track common issues
    const issuesMap = this.commonIssuesTracker.get(key) || new Map();
    result.violations.forEach(violation => {
      const count = issuesMap.get(violation.rule) || 0;
      issuesMap.set(violation.rule, count + 1);
    });
    this.commonIssuesTracker.set(key, issuesMap);

    // Store in database
    try {
      await supabase.from('data_quality_metrics').insert({
        provider_id: providerId,
        data_type: searchType,
        quality_score: result.score,
        accuracy_score: result.score,
        completeness_score: Math.round((result.metadata.validFields / Math.max(result.metadata.totalFields, 1)) * 100),
        freshness_score: 100,
        sample_size: result.metadata.totalFields,
        measurement_date: new Date().toISOString().split('T')[0],
        metadata: { violations: result.violations }
      });
    } catch (error) {
      logger.error('Failed to store quality metrics:', error);
    }
  }

  async getQualityMetrics(providerId: string, searchType: string): Promise<QualityMetrics> {
    const key = `${providerId}_${searchType}`;
    const history = this.qualityHistory.get(key) || [];
    
    if (history.length === 0) {
      return {
        providerId,
        searchType,
        avgQualityScore: 50,
        totalValidations: 0,
        errorRate: 0,
        commonIssues: [],
        trendDirection: 'stable'
      };
    }

    const avgQualityScore = history.reduce((sum, h) => sum + h.score, 0) / history.length;
    const errorRate = history.filter(h => h.violations > 0).length / history.length;
    
    const issuesMap = this.commonIssuesTracker.get(key) || new Map();
    const commonIssues = Array.from(issuesMap.entries())
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    const trendDirection = this.calculateTrend(history);

    return {
      providerId,
      searchType,
      avgQualityScore: Math.round(avgQualityScore),
      totalValidations: history.length,
      errorRate: Math.round(errorRate * 100) / 100,
      commonIssues,
      trendDirection
    };
  }

  private calculateTrend(history: Array<{ timestamp: number; score: number; violations: number }>): 'improving' | 'declining' | 'stable' {
    if (history.length < 10) return 'stable';
    
    const recent = history.slice(-5);
    const previous = history.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
    const previousAvg = previous.reduce((sum, h) => sum + h.score, 0) / previous.length;
    
    const difference = recentAvg - previousAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  addCustomRule(searchType: string, rule: ValidationRule): void {
    const rules = this.validationRules.get(searchType) || [];
    rules.push(rule);
    this.validationRules.set(searchType, rules);
    
    logger.info(`Added custom validation rule for ${searchType}:`, rule.name);
  }

  removeRule(searchType: string, ruleName: string): void {
    const rules = this.validationRules.get(searchType) || [];
    const filteredRules = rules.filter(rule => rule.name !== ruleName);
    this.validationRules.set(searchType, filteredRules);
    
    logger.info(`Removed validation rule ${ruleName} from ${searchType}`);
  }

  getAllRules(): { [searchType: string]: ValidationRule[] } {
    const allRules: { [searchType: string]: ValidationRule[] } = {};
    
    for (const [searchType, rules] of this.validationRules.entries()) {
      allRules[searchType] = [...rules];
    }
    
    return allRules;
  }
}

export const dataQualityValidator = new DataQualityValidator();
