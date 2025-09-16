import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";


interface LoyaltyRequest {
  action: 'earn' | 'redeem' | 'check_balance' | 'get_history' | 'get_tiers';
  userId: string;
  amount?: number;
  bookingId?: string;
  transactionType?: 'booking' | 'referral' | 'review' | 'signup_bonus';
  redemptionType?: 'discount' | 'upgrade' | 'free_booking';
}

const POINT_VALUES = {
  booking: 1, // 1 point per $1 spent
  referral: 500, // 500 points for successful referral
  review: 50, // 50 points for writing a review
  signup_bonus: 100 // 100 points for signing up
};

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 2500,
  gold: 7500,
  platinum: 15000
};

const TIER_BENEFITS = {
  bronze: {
    pointsMultiplier: 1,
    upgradePriority: false,
    freeWifi: false,
    prioritySupport: false
  },
  silver: {
    pointsMultiplier: 1.25,
    upgradePriority: true,
    freeWifi: true,
    prioritySupport: false
  },
  gold: {
    pointsMultiplier: 1.5,
    upgradePriority: true,
    freeWifi: true,
    prioritySupport: true,
    loungeAccess: true
  },
  platinum: {
    pointsMultiplier: 2,
    upgradePriority: true,
    freeWifi: true,
    prioritySupport: true,
    loungeAccess: true,
    freeUpgrades: true,
    dedicatedConcierge: true
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const request: LoyaltyRequest = await req.json();
    logger.info('[LOYALTY] Processing request', { action: request.action, userId: request.userId });

    let response;
    switch (request.action) {
      case 'earn':
        response = await earnPoints(supabase, request);
        break;
      case 'redeem':
        response = await redeemPoints(supabase, request);
        break;
      case 'check_balance':
        response = await checkBalance(supabase, request.userId);
        break;
      case 'get_history':
        response = await getHistory(supabase, request.userId);
        break;
      case 'get_tiers':
        response = await getTierInfo(supabase, request.userId);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify({
      success: true,
      ...response
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[LOYALTY] Request failed', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function earnPoints(supabase: any, request: LoyaltyRequest) {
  let pointsToEarn = 0;

  // Calculate points based on transaction type
  switch (request.transactionType) {
    case 'booking':
      pointsToEarn = Math.floor((request.amount || 0) * POINT_VALUES.booking);
      break;
    case 'referral':
      pointsToEarn = POINT_VALUES.referral;
      break;
    case 'review':
      pointsToEarn = POINT_VALUES.review;
      break;
    case 'signup_bonus':
      pointsToEarn = POINT_VALUES.signup_bonus;
      break;
    default:
      pointsToEarn = request.amount || 0;
  }

  // Get current user tier to apply multiplier
  const currentTier = await getCurrentTier(supabase, request.userId);
  const multiplier = TIER_BENEFITS[currentTier as keyof typeof TIER_BENEFITS]?.pointsMultiplier || 1;
  pointsToEarn = Math.floor(pointsToEarn * multiplier);

  // Record the transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('loyalty_transactions')
    .insert({
      user_id: request.userId,
      type: 'earn',
      points: pointsToEarn,
      transaction_type: request.transactionType,
      booking_id: request.bookingId,
      amount_spent: request.amount,
      multiplier_applied: multiplier
    })
    .select()
    .single();

  if (transactionError) {
    throw new Error(`Failed to record transaction: ${transactionError.message}`);
  }

  // Update user's total points
  const { error: updateError } = await supabase
    .from('loyalty_points')
    .upsert({
      user_id: request.userId,
      total_points: pointsToEarn,
      last_updated: new Date().toISOString()
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    });

  if (updateError && !updateError.message.includes('duplicate')) {
    // If it's not a duplicate error, this is a real error
    throw new Error(`Failed to update points balance: ${updateError.message}`);
  }

  // Check for tier progression
  const newBalance = await getCurrentBalance(supabase, request.userId);
  const newTier = calculateTier(newBalance);
  const tierChanged = newTier !== currentTier;

  if (tierChanged) {
    // Update user tier
    await supabase
      .from('loyalty_points')
      .update({ tier: newTier })
      .eq('user_id', request.userId);

    // Send tier upgrade notification
    await supabase
      .from('notifications')
      .insert({
        user_id: request.userId,
        type: 'tier_upgrade',
        title: `Congratulations! You've reached ${newTier.toUpperCase()} tier!`,
        message: `Enjoy your new benefits and enhanced earning potential.`,
        metadata: { previous_tier: currentTier, new_tier: newTier }
      });
  }

  return {
    pointsEarned: pointsToEarn,
    totalBalance: newBalance,
    currentTier: newTier,
    tierChanged,
    multiplierApplied: multiplier,
    transaction: transaction
  };
}

async function redeemPoints(supabase: any, request: LoyaltyRequest) {
  const currentBalance = await getCurrentBalance(supabase, request.userId);
  
  if (currentBalance < (request.amount || 0)) {
    throw new Error('Insufficient points balance');
  }

  // Record the redemption
  const { data: transaction, error: transactionError } = await supabase
    .from('loyalty_transactions')
    .insert({
      user_id: request.userId,
      type: 'redeem',
      points: -(request.amount || 0),
      transaction_type: request.redemptionType,
      booking_id: request.bookingId
    })
    .select()
    .single();

  if (transactionError) {
    throw new Error(`Failed to record redemption: ${transactionError.message}`);
  }

  // Update user's total points
  const newBalance = currentBalance - (request.amount || 0);
  await supabase
    .from('loyalty_points')
    .update({
      total_points: newBalance,
      last_updated: new Date().toISOString()
    })
    .eq('user_id', request.userId);

  return {
    pointsRedeemed: request.amount,
    remainingBalance: newBalance,
    transaction: transaction
  };
}

async function checkBalance(supabase: any, userId: string) {
  const balance = await getCurrentBalance(supabase, userId);
  const tier = await getCurrentTier(supabase, userId);
  const benefits = TIER_BENEFITS[tier as keyof typeof TIER_BENEFITS];
  const nextTier = getNextTier(tier);
  const pointsToNextTier = nextTier ? TIER_THRESHOLDS[nextTier as keyof typeof TIER_THRESHOLDS] - balance : 0;

  return {
    balance,
    tier,
    benefits,
    nextTier,
    pointsToNextTier: Math.max(0, pointsToNextTier)
  };
}

async function getHistory(supabase: any, userId: string) {
  const { data: transactions, error } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch history: ${error.message}`);
  }

  return { transactions };
}

async function getTierInfo(supabase: any, userId: string) {
  const currentBalance = await getCurrentBalance(supabase, userId);
  const currentTier = calculateTier(currentBalance);

  const tierInfo = Object.entries(TIER_THRESHOLDS).map(([tier, threshold]) => ({
    tier,
    threshold,
    benefits: TIER_BENEFITS[tier as keyof typeof TIER_BENEFITS],
    current: tier === currentTier,
    achieved: currentBalance >= threshold
  }));

  return {
    currentTier,
    currentBalance,
    tiers: tierInfo
  };
}

async function getCurrentBalance(supabase: any, userId: string): Promise<number> {
  const { data } = await supabase
    .from('loyalty_points')
    .select('total_points')
    .eq('user_id', userId)
    .single();

  return data?.total_points || 0;
}

async function getCurrentTier(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from('loyalty_points')
    .select('tier')
    .eq('user_id', userId)
    .single();

  if (data?.tier) {
    return data.tier;
  }

  // Calculate tier based on points if not stored
  const balance = await getCurrentBalance(supabase, userId);
  return calculateTier(balance);
}

function calculateTier(points: number): string {
  if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

function getNextTier(currentTier: string): string | null {
  const tiers = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}