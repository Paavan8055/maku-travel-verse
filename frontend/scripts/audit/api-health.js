#!/usr/bin/env node

/**
 * Maku.Travel API Health Monitor
 * Monitors health of all external APIs and services
 */

const fs = require('fs').promises;
const path = require('path');

class APIHealthMonitor {
  constructor() {
    this.healthChecks = [];
    this.failedChecks = [];
  }

  async checkAmadeusAPI() {
    console.log('✈️  Checking Amadeus API...');
    
    try {
      const startTime = Date.now();
      
      // Test Amadeus access token endpoint
      const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.AMADEUS_API_KEY || 'test',
          client_secret: process.env.AMADEUS_API_SECRET || 'test'
        })
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = tokenResponse.status === 200;

      this.addHealthCheck({
        service: 'Amadeus API',
        endpoint: 'OAuth Token',
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        responseTime,
        statusCode: tokenResponse.status,
        details: isHealthy ? 'Authentication successful' : 'Authentication failed'
      });

      if (!isHealthy) {
        this.failedChecks.push('Amadeus API');
      }

    } catch (error) {
      this.addHealthCheck({
        service: 'Amadeus API',
        endpoint: 'OAuth Token',
        status: 'ERROR',
        responseTime: null,
        error: error.message,
        details: 'Connection failed'
      });
      this.failedChecks.push('Amadeus API');
    }
  }

  async checkHotelBedsAPI() {
    console.log('🏨 Checking HotelBeds API...');
    
    try {
      const startTime = Date.now();
      
      // Test HotelBeds status endpoint
      const response = await fetch('https://api.test.hotelbeds.com/hotel-api/1.0/status', {
        method: 'GET',
        headers: {
          'Api-key': process.env.HOTELBEDS_API_KEY || 'test',
          'X-Signature': 'test'
        }
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 200;

      this.addHealthCheck({
        service: 'HotelBeds API',
        endpoint: 'Status',
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        responseTime,
        statusCode: response.status,
        details: isHealthy ? 'API accessible' : 'API not accessible'
      });

      if (!isHealthy) {
        this.failedChecks.push('HotelBeds API');
      }

    } catch (error) {
      this.addHealthCheck({
        service: 'HotelBeds API',
        endpoint: 'Status',
        status: 'ERROR',
        responseTime: null,
        error: error.message,
        details: 'Connection failed'
      });
      this.failedChecks.push('HotelBeds API');
    }
  }

  async checkSupabaseHealth() {
    console.log('🗄️  Checking Supabase...');
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY || 'test',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'test'}`
        }
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 200;

      this.addHealthCheck({
        service: 'Supabase',
        endpoint: 'REST API',
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        responseTime,
        statusCode: response.status,
        details: isHealthy ? 'Database accessible' : 'Database not accessible'
      });

      if (!isHealthy) {
        this.failedChecks.push('Supabase');
      }

    } catch (error) {
      this.addHealthCheck({
        service: 'Supabase',
        endpoint: 'REST API',
        status: 'ERROR',
        responseTime: null,
        error: error.message,
        details: 'Connection failed'
      });
      this.failedChecks.push('Supabase');
    }
  }

  async checkStripeAPI() {
    console.log('💳 Checking Stripe API...');
    
    try {
      const startTime = Date.now();
      
      // Test Stripe's public API endpoint (doesn't require secret key)
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_'}`
        }
      });

      const responseTime = Date.now() - startTime;
      // Stripe returns 401 for invalid keys, but 200/402 means API is accessible
      const isHealthy = response.status === 200 || response.status === 401 || response.status === 402;

      this.addHealthCheck({
        service: 'Stripe API',
        endpoint: 'Account',
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        responseTime,
        statusCode: response.status,
        details: isHealthy ? 'API accessible' : 'API not accessible'
      });

      if (!isHealthy) {
        this.failedChecks.push('Stripe API');
      }

    } catch (error) {
      this.addHealthCheck({
        service: 'Stripe API',
        endpoint: 'Account',
        status: 'ERROR',
        responseTime: null,
        error: error.message,
        details: 'Connection failed'
      });
      this.failedChecks.push('Stripe API');
    }
  }

  async checkEdgeFunctions() {
    console.log('⚡ Checking Supabase Edge Functions...');
    
    const functions = [
      'hotel-search',
      'flight-search', 
      'unified-search',
      'amadeus-locations-autocomplete'
    ];

    for (const func of functions) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/${func}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'test'}`
          },
          body: JSON.stringify({ test: true })
        });

        const responseTime = Date.now() - startTime;
        // Edge functions should respond (even with errors) if they're deployed
        const isHealthy = response.status !== 404;

        this.addHealthCheck({
          service: 'Edge Functions',
          endpoint: func,
          status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
          responseTime,
          statusCode: response.status,
          details: isHealthy ? 'Function deployed' : 'Function not found'
        });

        if (!isHealthy) {
          this.failedChecks.push(`Edge Function: ${func}`);
        }

      } catch (error) {
        this.addHealthCheck({
          service: 'Edge Functions',
          endpoint: func,
          status: 'ERROR',
          responseTime: null,
          error: error.message,
          details: 'Connection failed'
        });
        this.failedChecks.push(`Edge Function: ${func}`);
      }
    }
  }

  addHealthCheck(check) {
    this.healthChecks.push({
      ...check,
      timestamp: new Date().toISOString(),
      id: `HEALTH-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    });
  }

  async generateReport() {
    const reportDir = path.join(process.cwd(), 'reports', 'health');
    await fs.mkdir(reportDir, { recursive: true });

    const healthyCount = this.healthChecks.filter(check => check.status === 'HEALTHY').length;
    const unhealthyCount = this.healthChecks.filter(check => check.status === 'UNHEALTHY').length;
    const errorCount = this.healthChecks.filter(check => check.status === 'ERROR').length;

    const report = {
      check_date: new Date().toISOString(),
      summary: {
        total_checks: this.healthChecks.length,
        healthy: healthyCount,
        unhealthy: unhealthyCount,
        errors: errorCount,
        overall_status: this.failedChecks.length === 0 ? 'HEALTHY' : 'DEGRADED'
      },
      failed_services: this.failedChecks,
      health_checks: this.healthChecks,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(reportDir, `health-report-${new Date().toISOString().split('T')[0]}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 API Health Report:`);
    console.log(`   Healthy: ${healthyCount}`);
    console.log(`   Unhealthy: ${unhealthyCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Overall Status: ${report.summary.overall_status}`);
    console.log(`   Report saved: ${reportPath}`);

    if (this.failedChecks.length > 0) {
      console.log(`\n❌ Failed Services: ${this.failedChecks.join(', ')}`);
      process.exit(1);
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.failedChecks.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: `Investigate and fix failed services: ${this.failedChecks.join(', ')}`,
        impact: 'Service availability and user experience'
      });
    }

    const slowChecks = this.healthChecks.filter(check => check.responseTime && check.responseTime > 5000);
    if (slowChecks.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Investigate slow API responses',
        impact: 'Performance and user experience',
        details: slowChecks.map(check => `${check.service}: ${check.responseTime}ms`)
      });
    }

    return recommendations;
  }

  async run() {
    console.log('🚀 Starting API Health Check...');
    
    await this.checkAmadeusAPI();
    await this.checkHotelBedsAPI();
    await this.checkSupabaseHealth();
    await this.checkStripeAPI();
    await this.checkEdgeFunctions();
    
    return await this.generateReport();
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new APIHealthMonitor();
  monitor.run().catch(error => {
    console.error('API health check failed:', error);
    process.exit(1);
  });
}

module.exports = APIHealthMonitor;