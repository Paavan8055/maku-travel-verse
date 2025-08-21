import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // This is a helper endpoint that provides setup instructions for Sentry
  const setupGuide = {
    title: "Sentry Setup Guide for Maku.travel",
    steps: [
      {
        step: 1,
        title: "Create Sentry Account",
        description: "Sign up at https://sentry.io and create a new project for 'React' platform"
      },
      {
        step: 2,
        title: "Get DSN",
        description: "Copy your project's DSN from the Sentry dashboard"
      },
      {
        step: 3,
        title: "Add Sentry Secret",
        description: "Use the Supabase secrets manager to add SENTRY_DSN with your DSN value"
      },
      {
        step: 4,
        title: "Install Sentry Package",
        description: "Add @sentry/react to your project dependencies"
      },
      {
        step: 5,
        title: "Initialize Sentry",
        description: "Call initializeSentry() in your app's main entry point with the DSN from secrets"
      }
    ],
    codeExample: `
// In your main App.tsx or index.tsx
import { initializeSentry } from '@/lib/sentryConfig';

// Get Sentry DSN from environment or Supabase secrets
const sentryDsn = process.env.REACT_APP_SENTRY_DSN || await getSentryDsnFromSupabase();

if (sentryDsn) {
  initializeSentry({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    debug: false
  });
}
    `,
    envVariables: {
      SENTRY_DSN: "Your Sentry project DSN (get from sentry.io dashboard)",
      SENTRY_ENVIRONMENT: "production | staging | development",
      SENTRY_RELEASE: "1.0.0 (your app version)"
    },
    benefits: [
      "Real-time error tracking and alerting",
      "Performance monitoring for critical user journeys",
      "Detailed error context with correlation IDs",
      "Integration with existing error boundaries",
      "Automatic release tracking and deployment monitoring"
    ],
    nextSteps: [
      "Set up error alerting rules in Sentry dashboard",
      "Configure release tracking for deployments",
      "Set up performance budgets for key transactions",
      "Create custom dashboards for travel-specific metrics",
      "Enable session replay for critical error investigation"
    ]
  };

  return new Response(
    JSON.stringify(setupGuide, null, 2),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
});