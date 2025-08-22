import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get booking health metrics
    const healthMetrics = await getBookingHealthMetrics(supabase);
    
    logger.info('Booking health metrics calculated', healthMetrics);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        metrics: healthMetrics
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Error in booking health monitor:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getBookingHealthMetrics(supabase: any) {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get booking statistics
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, status, booking_type, total_amount, currency, created_at')
    .gte('created_at', last7Days.toISOString());

  if (bookingsError) {
    throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
  }

  // Get payment statistics
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id, status, amount, currency, created_at, failure_reason')
    .gte('created_at', last7Days.toISOString());

  if (paymentsError) {
    throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
  }

  // Calculate metrics
  const last24HourBookings = bookings.filter(b => new Date(b.created_at) >= last24Hours);
  const last24HourPayments = payments.filter(p => new Date(p.created_at) >= last24Hours);
  
  // Booking status breakdown
  const bookingsByStatus = {
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    failed: bookings.filter(b => b.status === 'failed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  // Payment status breakdown  
  const paymentsByStatus = {
    pending: payments.filter(p => p.status === 'pending').length,
    succeeded: payments.filter(p => p.status === 'succeeded').length,
    failed: payments.filter(p => p.status === 'failed').length,
    processing: payments.filter(p => p.status === 'processing').length
  };

  // Success rates
  const totalBookings = bookings.length;
  const totalPayments = payments.length;
  const successfulBookings = bookingsByStatus.confirmed;
  const successfulPayments = paymentsByStatus.succeeded;
  
  const bookingSuccessRate = totalBookings > 0 ? (successfulBookings / totalBookings) * 100 : 0;
  const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

  // Revenue metrics
  const totalRevenue = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const last24HRevenue = last24HourPayments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Problem identification
  const criticalIssues = [];
  
  if (bookingSuccessRate < 20) {
    criticalIssues.push({
      severity: 'CRITICAL',
      type: 'LOW_BOOKING_SUCCESS_RATE',
      message: `Booking success rate is critically low: ${bookingSuccessRate.toFixed(1)}%`,
      recommendation: 'Investigate booking flow and payment processing'
    });
  }

  if (paymentSuccessRate < 50) {
    criticalIssues.push({
      severity: 'CRITICAL', 
      type: 'LOW_PAYMENT_SUCCESS_RATE',
      message: `Payment success rate is low: ${paymentSuccessRate.toFixed(1)}%`,
      recommendation: 'Check Stripe webhook processing and payment intent creation'
    });
  }

  if (bookingsByStatus.pending > bookingsByStatus.confirmed + bookingsByStatus.failed) {
    criticalIssues.push({
      severity: 'WARNING',
      type: 'HIGH_PENDING_BOOKINGS',
      message: `High number of pending bookings: ${bookingsByStatus.pending}`,
      recommendation: 'Check webhook processing and payment confirmation flow'
    });
  }

  // Common failure reasons
  const failureReasons = payments
    .filter(p => p.status === 'failed' && p.failure_reason)
    .reduce((acc, p) => {
      acc[p.failure_reason] = (acc[p.failure_reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return {
    summary: {
      total_bookings_7d: totalBookings,
      total_payments_7d: totalPayments,
      bookings_24h: last24HourBookings.length,
      payments_24h: last24HourPayments.length,
      booking_success_rate: Math.round(bookingSuccessRate * 100) / 100,
      payment_success_rate: Math.round(paymentSuccessRate * 100) / 100,
      total_revenue_7d: totalRevenue,
      revenue_24h: last24HRevenue
    },
    bookings_by_status: bookingsByStatus,
    payments_by_status: paymentsByStatus,
    critical_issues: criticalIssues,
    common_failure_reasons: failureReasons,
    health_score: calculateHealthScore(bookingSuccessRate, paymentSuccessRate, criticalIssues.length)
  };
}

function calculateHealthScore(bookingSuccessRate: number, paymentSuccessRate: number, criticalIssuesCount: number): {
  score: number;
  status: string;
  color: string;
} {
  let score = 100;
  
  // Deduct points for low success rates
  if (bookingSuccessRate < 90) score -= (90 - bookingSuccessRate);
  if (paymentSuccessRate < 90) score -= (90 - paymentSuccessRate);
  
  // Deduct points for critical issues
  score -= criticalIssuesCount * 20;
  
  // Ensure score doesn't go below 0
  score = Math.max(0, score);
  
  let status: string;
  let color: string;
  
  if (score >= 80) {
    status = 'HEALTHY';
    color = 'green';
  } else if (score >= 60) {
    status = 'WARNING';
    color = 'yellow';
  } else {
    status = 'CRITICAL';
    color = 'red';
  }
  
  return { score: Math.round(score), status, color };
}