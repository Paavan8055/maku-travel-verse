// Security utilities for edge functions
// Provides input validation, data sanitization, and security checks

import logger from './logger.ts';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'iata' | 'date';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export class SecurityValidator {
  // IATA code patterns
  private static IATA_AIRPORT_PATTERN = /^[A-Z]{3}$/;
  private static IATA_CITY_PATTERN = /^[A-Z]{3}$/;
  private static EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  static validateInput(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip validation for optional empty fields
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type) {
        const typeError = this.validateType(field, value, rule.type);
        if (typeError) {
          errors.push(typeError);
          continue;
        }
      }

      // String-specific validations
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${field} must not exceed ${rule.maxLength} characters`);
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }

      // Number-specific validations
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${field} must not exceed ${rule.max}`);
        }
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (typeof customResult === 'string') {
          errors.push(`${field}: ${customResult}`);
        } else if (!customResult) {
          errors.push(`${field} is invalid`);
        }
      }

      // Sanitize and store valid values
      if (errors.length === 0 || !errors.some(e => e.startsWith(field))) {
        sanitizedData[field] = this.sanitizeValue(value, rule.type);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  private static validateType(field: string, value: any, type: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') return `${field} must be a string`;
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) return `${field} must be a number`;
        break;
      case 'boolean':
        if (typeof value !== 'boolean') return `${field} must be a boolean`;
        break;
      case 'array':
        if (!Array.isArray(value)) return `${field} must be an array`;
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return `${field} must be an object`;
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !this.EMAIL_PATTERN.test(value)) {
          return `${field} must be a valid email address`;
        }
        break;
      case 'iata':
        if (typeof value !== 'string' || !this.IATA_AIRPORT_PATTERN.test(value.toUpperCase())) {
          return `${field} must be a valid 3-letter IATA code`;
        }
        break;
      case 'date':
        if (typeof value !== 'string' || !this.DATE_PATTERN.test(value)) {
          return `${field} must be a valid date in YYYY-MM-DD format`;
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return `${field} must be a valid date`;
        }
        break;
    }
    return null;
  }

  private static sanitizeValue(value: any, type?: string): any {
    if (type === 'string' && typeof value === 'string') {
      // Remove potentially dangerous characters
      return value.replace(/[<>'"&]/g, '').trim();
    }
    if (type === 'iata' && typeof value === 'string') {
      return value.toUpperCase().trim();
    }
    return value;
  }

  // Flight search validation schema
  static getFlightSearchSchema(): ValidationSchema {
    return {
      originLocationCode: {
        required: true,
        type: 'iata'
      },
      destinationLocationCode: {
        required: true,
        type: 'iata'
      },
      departureDate: {
        required: true,
        type: 'date',
        custom: (value: string) => {
          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today || 'Departure date cannot be in the past';
        }
      },
      returnDate: {
        type: 'date',
        custom: (value: string) => {
          if (!value) return true; // Optional field
          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today || 'Return date cannot be in the past';
        }
      },
      adults: {
        required: true,
        type: 'number',
        min: 1,
        max: 9
      },
      children: {
        type: 'number',
        min: 0,
        max: 9
      },
      infants: {
        type: 'number',
        min: 0,
        max: 9
      },
      travelClass: {
        type: 'string',
        enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']
      },
      currencyCode: {
        type: 'string',
        pattern: /^[A-Z]{3}$/,
        enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY']
      }
    };
  }

  // Hotel search validation schema
  static getHotelSearchSchema(): ValidationSchema {
    return {
      cityCode: {
        required: true,
        type: 'iata'
      },
      checkInDate: {
        required: true,
        type: 'date',
        custom: (value: string) => {
          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today || 'Check-in date cannot be in the past';
        }
      },
      checkOutDate: {
        required: true,
        type: 'date',
        custom: (value: string) => {
          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today || 'Check-out date cannot be in the past';
        }
      },
      adults: {
        required: true,
        type: 'number',
        min: 1,
        max: 8
      },
      children: {
        type: 'number',
        min: 0,
        max: 8
      },
      roomQuantity: {
        type: 'number',
        min: 1,
        max: 8
      },
      currency: {
        type: 'string',
        pattern: /^[A-Z]{3}$/,
        enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY']
      }
    };
  }

  // Activity search validation schema
  static getActivitySearchSchema(): ValidationSchema {
    return {
      destination: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      date: {
        required: true,
        type: 'date',
        custom: (value: string) => {
          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today || 'Activity date cannot be in the past';
        }
      },
      participants: {
        required: true,
        type: 'number',
        min: 1,
        max: 20
      },
      radius: {
        type: 'number',
        min: 1,
        max: 100
      }
    };
  }

  // Rate limiting
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(
    identifier: string,
    maxRequests = 100,
    windowMs = 60000 // 1 minute
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    const current = this.rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize
      const resetTime = now + windowMs;
      this.rateLimitStore.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    current.count++;
    this.rateLimitStore.set(key, current);
    return { allowed: true, remaining: maxRequests - current.count, resetTime: current.resetTime };
  }

  // Input sanitization for SQL injection prevention
  static sanitizeForDatabase(input: any): any {
    if (typeof input === 'string') {
      // Remove SQL injection patterns
      return input
        .replace(/[';--]/g, '')
        .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi, '')
        .trim();
    }
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeForDatabase(item));
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeForDatabase(value);
      }
      return sanitized;
    }
    return input;
  }

  // JWT token validation (basic)
  static validateJWT(token: string): { valid: boolean; payload?: any } {
    try {
      if (!token || !token.startsWith('Bearer ')) {
        return { valid: false };
      }

      const jwtToken = token.replace('Bearer ', '');
      const parts = jwtToken.split('.');
      
      if (parts.length !== 3) {
        return { valid: false };
      }

      // Decode payload (basic validation - not verifying signature)
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return { valid: false };
      }

      return { valid: true, payload };
    } catch (error) {
      logger.warn('[SECURITY] JWT validation failed', error);
      return { valid: false };
    }
  }
}

export default SecurityValidator;