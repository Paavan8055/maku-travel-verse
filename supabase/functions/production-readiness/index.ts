import { corsHeaders } from '../_shared/cors.ts';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2.53.0'

interface ReadinessCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

interface ProductionReadinessResponse {
  success: boolean;
  overall_status: 'ready' | 'not_ready' | 'warnings';
  checks: ReadinessCheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    total: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting production readiness checks...');

    const checks: ReadinessCheck[] = [];

    // 1. Check environment variables
    const requiredEnvs = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
      'STRIPE_SECRET_KEY',
      'AMADEUS_CLIENT_ID',
      'AMADEUS_CLIENT_SECRET'
    ];

    const missingEnvs = requiredEnvs.filter(env => !Deno.env.get(env));
    checks.push({
      name: 'Environment Variables',
      status: missingEnvs.length === 0 ? 'pass' : 'fail',
      message: missingEnvs.length === 0 
        ? 'All required environment variables are set'
        : `Missing environment variables: ${missingEnvs.join(', ')}`,
      details: { missing: missingEnvs, total: requiredEnvs.length }
    });

    // 2. Check Sabre production readiness
    const isProduction = Deno.env.get('NODE_ENV') === 'production';
    const sabreTestPCC = Deno.env.get('SABRE_TEST_PCC');
    const sabreProdPCC = Deno.env.get('SABRE_PROD_PCC');
    const sabreEPR = Deno.env.get('SABRE_EPR_ID');
    
    if (isProduction) {
      checks.push({
        name: 'Sabre Production PCC',
        status: sabreProdPCC ? 'pass' : 'fail',
        message: sabreProdPCC ? 'Production PCC configured' : 'SABRE_PROD_PCC not configured',
        details: { configured: !!sabreProdPCC }
      });
      
      checks.push({
        name: 'Sabre EPR ID',
        status: sabreEPR ? 'pass' : 'fail',
        message: sabreEPR ? 'EPR ID configured' : 'SABRE_EPR_ID not configured',
        details: { configured: !!sabreEPR }
      });
    } else {
      checks.push({
        name: 'Sabre Test PCC',
        status: sabreTestPCC ? 'pass' : 'warn',
        message: sabreTestPCC ? 'Test PCC configured' : 'SABRE_TEST_PCC not configured',
        details: { configured: !!sabreTestPCC }
      });
    }

    // 3. Check database connectivity
    try {
      const { data, error } = await supabase.from('bookings').select('count').limit(1);
      checks.push({
        name: 'Database Connectivity',
        status: error ? 'fail' : 'pass',
        message: error ? `Database error: ${error.message}` : 'Database is accessible',
        details: error ? { error: error.message } : null
      });
    } catch (error) {
      checks.push({
        name: 'Database Connectivity',
        status: 'fail',
        message: `Database connection failed: ${error.message}`,
        details: { error: error.message }
      });
    }

    // 3. Check provider configurations
    try {
      const { data: providers, error } = await supabase
        .from('provider_configs')
        .select('*')
        .eq('enabled', true);

      const enabledCount = providers?.length || 0;
      checks.push({
        name: 'Provider Configurations',
        status: enabledCount > 0 ? 'pass' : 'warn',
        message: enabledCount > 0 
          ? `${enabledCount} providers are enabled and configured`
          : 'No providers are enabled',
        details: { enabled_providers: enabledCount }
      });
    } catch (error) {
      checks.push({
        name: 'Provider Configurations',
        status: 'fail',
        message: `Failed to check provider configs: ${error.message}`,
        details: { error: error.message }
      });
    }

    // 4. Check admin user setup
    try {
      const { data: admins, error } = await supabase
        .from('admin_users')
        .select('count')
        .eq('is_active', true);

      const adminCount = admins?.length || 0;
      checks.push({
        name: 'Admin Users',
        status: adminCount > 0 ? 'pass' : 'warn',
        message: adminCount > 0 
          ? `${adminCount} admin users are configured`
          : 'No admin users configured',
        details: { admin_count: adminCount }
      });
    } catch (error) {
      checks.push({
        name: 'Admin Users',
        status: 'fail',
        message: `Failed to check admin users: ${error.message}`,
        details: { error: error.message }
      });
    }

    // Calculate summary
    const summary = {
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warn').length,
      total: checks.length
    };

    const overall_status = summary.failed > 0 ? 'not_ready' : 
                          summary.warnings > 0 ? 'warnings' : 'ready';

    const response: ProductionReadinessResponse = {
      success: true,
      overall_status,
      checks,
      summary
    };

    console.log(`Production readiness check completed: ${overall_status}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Production readiness check failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      overall_status: 'not_ready',
      checks: [{
        name: 'System Check',
        status: 'fail',
        message: `Production readiness check failed: ${error.message}`,
        details: { error: error.message }
      }],
      summary: { passed: 0, failed: 1, warnings: 0, total: 1 }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});