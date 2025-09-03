import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import Stripe from "https://esm.sh/stripe@14.21.0";


interface BookingIntegrityRequest {
  action: 'create_booking' | 'process_payment' | 'confirm_booking' | 'cancel_booking' | 'reconcile_booking';
  booking_id?: string;
  booking_data?: any;
  payment_intent_id?: string;
  provider_confirmation?: any;
}

interface BookingTransaction {
  booking_id: string;
  stripe_payment_intent_id?: string;
  provider_booking_id?: string;
  status: 'pending' | 'payment_processing' | 'payment_confirmed' | 'booking_confirmed' | 'completed' | 'failed' | 'cancelled';
  total_amount: number;
  currency: string;
  booking_data: any;
  created_at: string;
  updated_at: string;
  failure_reason?: string;
  rollback_required?: boolean;
}

class BookingIntegrityManager {
  private supabase: any;
  private stripe: Stripe;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    this.stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  async createBookingTransaction(bookingData: any): Promise<{ booking_id: string; transaction: BookingTransaction }> {
    const bookingId = crypto.randomUUID();
    const transaction: BookingTransaction = {
      booking_id: bookingId,
      status: 'pending',
      total_amount: bookingData.total_amount,
      currency: bookingData.currency || 'USD',
      booking_data: bookingData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store initial booking record with atomic transaction
    const { error: bookingError } = await this.supabase
      .from('bookings')
      .insert({
        id: bookingId,
        booking_reference: `BK${bookingId.substring(0, 8).toUpperCase()}`,
        user_id: bookingData.user_id,
        booking_type: bookingData.booking_type,
        booking_data: bookingData,
        total_amount: bookingData.total_amount,
        currency: bookingData.currency || 'USD',
        status: 'pending'
      });

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    // Store transaction state for recovery
    await this.storeTransactionState(transaction);

    console.log(`Created booking transaction: ${bookingId}`);
    return { booking_id: bookingId, transaction };
  }

  async processPayment(bookingId: string, paymentData: any): Promise<{ payment_intent: any; updated_transaction: BookingTransaction }> {
    // Get current transaction state
    const transaction = await this.getTransactionState(bookingId);
    if (!transaction) {
      throw new Error(`Booking transaction not found: ${bookingId}`);
    }

    if (transaction.status !== 'pending') {
      throw new Error(`Invalid booking status for payment: ${transaction.status}`);
    }

    try {
      // Create Stripe PaymentIntent with idempotency
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(transaction.total_amount * 100), // Convert to cents
        currency: transaction.currency.toLowerCase(),
        metadata: {
          booking_id: bookingId,
          booking_type: transaction.booking_data.booking_type,
        },
        automatic_payment_methods: { enabled: true },
      }, {
        idempotencyKey: `booking-${bookingId}-payment`,
      });

      // Update transaction state
      transaction.stripe_payment_intent_id = paymentIntent.id;
      transaction.status = 'payment_processing';
      transaction.updated_at = new Date().toISOString();

      await this.updateBookingStatus(bookingId, 'payment_processing', {
        stripe_payment_intent_id: paymentIntent.id
      });
      await this.storeTransactionState(transaction);

      console.log(`Payment initiated for booking: ${bookingId}, PI: ${paymentIntent.id}`);
      return { payment_intent: paymentIntent, updated_transaction: transaction };

    } catch (error) {
      // Mark transaction as failed and prepare for rollback
      transaction.status = 'failed';
      transaction.failure_reason = `Payment creation failed: ${error.message}`;
      transaction.rollback_required = true;
      transaction.updated_at = new Date().toISOString();

      await this.updateBookingStatus(bookingId, 'failed', { failure_reason: transaction.failure_reason });
      await this.storeTransactionState(transaction);

      throw error;
    }
  }

  async confirmPayment(bookingId: string, paymentIntentId: string): Promise<BookingTransaction> {
    const transaction = await this.getTransactionState(bookingId);
    if (!transaction) {
      throw new Error(`Booking transaction not found: ${bookingId}`);
    }

    if (transaction.stripe_payment_intent_id !== paymentIntentId) {
      throw new Error(`Payment intent mismatch for booking: ${bookingId}`);
    }

    try {
      // Verify payment with Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment not completed: ${paymentIntent.status}`);
      }

      // Update transaction state
      transaction.status = 'payment_confirmed';
      transaction.updated_at = new Date().toISOString();

      await this.updateBookingStatus(bookingId, 'payment_confirmed');
      await this.storeTransactionState(transaction);

      console.log(`Payment confirmed for booking: ${bookingId}`);
      return transaction;

    } catch (error) {
      transaction.status = 'failed';
      transaction.failure_reason = `Payment confirmation failed: ${error.message}`;
      transaction.rollback_required = true;
      transaction.updated_at = new Date().toISOString();

      await this.updateBookingStatus(bookingId, 'failed', { failure_reason: transaction.failure_reason });
      await this.storeTransactionState(transaction);

      throw error;
    }
  }

  async confirmWithProvider(bookingId: string, providerConfirmation: any): Promise<BookingTransaction> {
    const transaction = await this.getTransactionState(bookingId);
    if (!transaction) {
      throw new Error(`Booking transaction not found: ${bookingId}`);
    }

    if (transaction.status !== 'payment_confirmed') {
      throw new Error(`Invalid status for provider confirmation: ${transaction.status}`);
    }

    try {
      // Store provider confirmation details
      transaction.provider_booking_id = providerConfirmation.confirmation_id || providerConfirmation.booking_id;
      transaction.status = 'booking_confirmed';
      transaction.updated_at = new Date().toISOString();

      await this.updateBookingStatus(bookingId, 'confirmed', {
        provider_booking_id: transaction.provider_booking_id,
        provider_confirmation: providerConfirmation
      });
      await this.storeTransactionState(transaction);

      console.log(`Booking confirmed with provider: ${bookingId}, Provider ID: ${transaction.provider_booking_id}`);
      return transaction;

    } catch (error) {
      // Critical: Payment was successful but booking failed - requires manual intervention
      transaction.status = 'failed';
      transaction.failure_reason = `Provider booking failed: ${error.message}`;
      transaction.rollback_required = true;
      transaction.updated_at = new Date().toISOString();

      await this.updateBookingStatus(bookingId, 'provider_failed', { 
        failure_reason: transaction.failure_reason,
        requires_refund: true
      });
      await this.storeTransactionState(transaction);

      // Send alert for manual intervention
      await this.sendCriticalAlert(bookingId, 'Provider booking failed after payment success - manual refund required');

      throw error;
    }
  }

  async rollbackTransaction(bookingId: string, reason: string): Promise<void> {
    const transaction = await this.getTransactionState(bookingId);
    if (!transaction) {
      throw new Error(`Booking transaction not found: ${bookingId}`);
    }

    console.log(`Rolling back transaction: ${bookingId}, Reason: ${reason}`);

    // Refund payment if it was processed
    if (transaction.stripe_payment_intent_id && 
        ['payment_confirmed', 'booking_confirmed', 'completed'].includes(transaction.status)) {
      try {
        await this.stripe.refunds.create({
          payment_intent: transaction.stripe_payment_intent_id,
          reason: 'requested_by_customer',
          metadata: {
            booking_id: bookingId,
            rollback_reason: reason,
          }
        }, {
          idempotencyKey: `rollback-${bookingId}-refund`,
        });

        console.log(`Refund initiated for booking: ${bookingId}`);
      } catch (refundError) {
        console.error(`Refund failed for booking: ${bookingId}`, refundError);
        await this.sendCriticalAlert(bookingId, `Rollback refund failed: ${refundError.message}`);
      }
    }

    // Cancel provider booking if it exists
    if (transaction.provider_booking_id) {
      // Note: Actual provider cancellation would be implemented based on each provider's API
      console.log(`Provider booking cancellation required for: ${transaction.provider_booking_id}`);
      await this.sendCriticalAlert(bookingId, `Manual provider cancellation required: ${transaction.provider_booking_id}`);
    }

    // Update final status
    transaction.status = 'cancelled';
    transaction.failure_reason = reason;
    transaction.updated_at = new Date().toISOString();

    await this.updateBookingStatus(bookingId, 'cancelled', { cancellation_reason: reason });
    await this.storeTransactionState(transaction);
  }

  private async storeTransactionState(transaction: BookingTransaction): Promise<void> {
    // Store in a dedicated transactions table for state management and recovery
    await this.supabase
      .from('booking_transactions')
      .upsert({
        booking_id: transaction.booking_id,
        status: transaction.status,
        stripe_payment_intent_id: transaction.stripe_payment_intent_id,
        provider_booking_id: transaction.provider_booking_id,
        total_amount: transaction.total_amount,
        currency: transaction.currency,
        booking_data: transaction.booking_data,
        failure_reason: transaction.failure_reason,
        rollback_required: transaction.rollback_required,
        updated_at: transaction.updated_at,
      }, { onConflict: 'booking_id' });
  }

  private async getTransactionState(bookingId: string): Promise<BookingTransaction | null> {
    const { data, error } = await this.supabase
      .from('booking_transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error || !data) return null;
    return data as BookingTransaction;
  }

  private async updateBookingStatus(bookingId: string, status: string, metadata?: any): Promise<void> {
    await this.supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
        booking_data: metadata ? { metadata } : undefined,
      })
      .eq('id', bookingId);
  }

  private async sendCriticalAlert(bookingId: string, message: string): Promise<void> {
    // Store alert in system for manual review
    await this.supabase
      .from('critical_alerts')
      .insert({
        booking_id: bookingId,
        alert_type: 'booking_integrity_failure',
        message,
        severity: 'critical',
        requires_manual_action: true,
        created_at: new Date().toISOString(),
      });

    console.error(`CRITICAL ALERT - Booking ${bookingId}: ${message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: BookingIntegrityRequest = await req.json();
    const manager = new BookingIntegrityManager();

    let result;

    switch (request.action) {
      case 'create_booking':
        if (!request.booking_data) {
          throw new Error('Booking data required for create_booking action');
        }
        result = await manager.createBookingTransaction(request.booking_data);
        break;

      case 'process_payment':
        if (!request.booking_id || !request.booking_data) {
          throw new Error('Booking ID and payment data required for process_payment action');
        }
        result = await manager.processPayment(request.booking_id, request.booking_data);
        break;

      case 'confirm_booking':
        if (!request.booking_id || !request.provider_confirmation) {
          throw new Error('Booking ID and provider confirmation required for confirm_booking action');
        }
        result = await manager.confirmWithProvider(request.booking_id, request.provider_confirmation);
        break;

      case 'cancel_booking':
        if (!request.booking_id) {
          throw new Error('Booking ID required for cancel_booking action');
        }
        await manager.rollbackTransaction(request.booking_id, 'User cancellation');
        result = { status: 'cancelled' };
        break;

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Booking integrity error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});