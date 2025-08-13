/**
 * Maku.Travel Audit Configuration
 * Central configuration for all audit scripts and monitoring
 */

module.exports = {
  // API Health Check Configuration
  apiHealth: {
    timeout: 10000, // 10 seconds
    retries: 3,
    endpoints: {
      amadeus: {
        baseUrl: 'https://test.api.amadeus.com',
        authEndpoint: '/v1/security/oauth2/token'
      },
      hotelbeds: {
        baseUrl: 'https://api.test.hotelbeds.com',
        statusEndpoint: '/hotel-api/1.0/status'
      },
      stripe: {
        baseUrl: 'https://api.stripe.com',
        accountEndpoint: '/v1/account'
      }
    }
  },

  // Security Scan Configuration
  security: {
    scanPaths: ['src/', 'supabase/functions/'],
    excludePaths: ['node_modules/', 'dist/', 'build/'],
    secretPatterns: [
      /api_key\s*[:=]\s*['"][^'"]+['"]/gi,
      /secret\s*[:=]\s*['"][^'"]+['"]/gi,
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /token\s*[:=]\s*['"][^'"]+['"]/gi
    ],
    insecurePatterns: [
      {
        pattern: /innerHTML\s*=\s*[^;]+/gi,
        type: 'XSS_RISK',
        severity: 'MEDIUM'
      },
      {
        pattern: /eval\s*\(/gi,
        type: 'CODE_INJECTION',
        severity: 'CRITICAL'
      }
    ]
  },

  // Flow Testing Configuration
  flowTesting: {
    timeout: 30000, // 30 seconds per test
    browsers: ['chromium', 'firefox', 'webkit'],
    viewports: [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ],
    flows: {
      flights: {
        searchUrl: '/search/flights',
        testCriteria: {
          origin: 'SYD',
          destination: 'SIN',
          departureDate: '2025-08-15',
          passengers: 1
        }
      },
      hotels: {
        searchUrl: '/search/hotels',
        testCriteria: {
          destination: 'Sydney',
          checkIn: '2025-08-15',
          checkOut: '2025-08-17',
          guests: 2
        }
      },
      activities: {
        searchUrl: '/search/activities',
        testCriteria: {
          destination: 'Sydney',
          date: '2025-08-15',
          participants: 2
        }
      }
    }
  },

  // Performance Configuration
  performance: {
    budgets: {
      'first-contentful-paint': 2000,
      'largest-contentful-paint': 4000,
      'cumulative-layout-shift': 0.1,
      'total-blocking-time': 300
    },
    pages: [
      '/',
      '/search/flights',
      '/search/hotels',
      '/search/activities'
    ]
  },

  // Competitor Analysis Configuration
  competitorAnalysis: {
    competitors: [
      {
        name: 'Booking.com',
        url: 'https://www.booking.com',
        features: ['search', 'filters', 'booking', 'mobile']
      },
      {
        name: 'Expedia',
        url: 'https://www.expedia.com',
        features: ['search', 'bundles', 'rewards', 'mobile']
      },
      {
        name: 'Agoda',
        url: 'https://www.agoda.com',
        features: ['search', 'loyalty', 'deals', 'mobile']
      }
    ],
    analysisAreas: [
      'search_interface',
      'filter_options',
      'booking_flow',
      'mobile_experience',
      'pricing_display',
      'user_reviews'
    ]
  },

  // Reporting Configuration
  reporting: {
    outputDir: 'reports',
    formats: ['json', 'markdown', 'pdf'],
    retention: {
      daily: 30,    // Keep daily reports for 30 days
      weekly: 12,   // Keep weekly reports for 12 weeks
      monthly: 12   // Keep monthly reports for 12 months
    },
    notifications: {
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channels: {
          security: '#security-alerts',
          health: '#api-health',
          general: '#maku-audit'
        }
      },
      email: {
        enabled: false,
        recipients: []
      }
    }
  },

  // GitHub Integration Configuration
  github: {
    repository: 'maku-travel/platform',
    issueLabels: {
      security: 'security',
      performance: 'performance',
      bug: 'bug',
      enhancement: 'enhancement'
    },
    autoCreateIssues: true,
    assignees: []
  },

  // Scheduling Configuration
  schedules: {
    security: '0 2 * * *',        // Daily at 2 AM UTC
    apiHealth: '*/30 * * * *',     // Every 30 minutes
    comprehensive: '0 4 * * 1',    // Weekly on Monday at 4 AM UTC
    performance: '0 6 * * *'       // Daily at 6 AM UTC
  }
};