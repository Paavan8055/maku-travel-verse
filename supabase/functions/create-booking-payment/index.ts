import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com;",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
};

interface BookingPaymentParams {
  bookingType: 'flight' | 'hotel' | 'activity' | 'package';
  bookingData: any;
  amount: number;
  currency?: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  paymentMethod?: 'card' | 'fund' | 'split';
  fundAmount?: number;
}

async function createBookingItems(supabaseClient: any, bookingId: string, bookingType: string, bookingData: any, totalAmount: number) {
  const items = [];
  
  try {
    if (bookingType === 'flight') {
      // Create items for outbound flight
      if (bookingData.flight?.outbound?.id) {
        items.push({
          booking_id: bookingId,
          item_type: 'flight_segment',
          item_details: {
            direction: 'outbound',
            flight_id: bookingData.flight.outbound.id,
            fare_type: bookingData.flight.outbound.fareType,
            trip_type: bookingData.flight.tripType || 'oneway',
            passenger_count: bookingData.passengers?.length || 1
          },
          quantity: bookingData.passengers?.length || 1,
          unit_price: bookingData.flight.isRoundtrip ? totalAmount * 0.6 : totalAmount,
          total_price: (bookingData.flight.isRoundtrip ? totalAmount * 0.6 : totalAmount) * (bookingData.passengers?.length || 1)
        });
      }
      
      // Create items for inbound flight (if exists)
      if (bookingData.flight?.inbound?.id) {
        items.push({
          booking_id: bookingId,
          item_type: 'flight_segment',
          item_details: {
            direction: 'inbound',
            flight_id: bookingData.flight.inbound.id,
            fare_type: bookingData.flight.inbound.fareType,
            trip_type: bookingData.flight.tripType || 'roundtrip',
            passenger_count: bookingData.passengers?.length || 1
          },
          quantity: bookingData.passengers?.length || 1,
          unit_price: totalAmount * 0.4,
          total_price: (totalAmount * 0.4) * (bookingData.passengers?.length || 1)
        });
      }
      
      // Add passenger details
      if (bookingData.passengers) {
        bookingData.passengers.forEach((passenger: any, index: number) => {
          items.push({
            booking_id: bookingId,
            item_type: 'passenger',
            item_details: {
              name: `${passenger.firstName} ${passenger.lastName}`,
              type: passenger.type || 'adult',
              seat: passenger.selectedSeat,
              meal: passenger.mealPreference,
              baggage: passenger.baggage
            },
            quantity: 1,
            unit_price: 0,
            total_price: 0
          });
        });
      }
      
    } else if (bookingType === 'hotel') {
      // Create items for hotel room nights
      const checkIn = new Date(bookingData.hotel?.checkIn || bookingData.checkInDate);
      const checkOut = new Date(bookingData.hotel?.checkOut || bookingData.checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const roomPrice = totalAmount / nights;
      
      for (let i = 0; i < nights; i++) {
        const night = new Date(checkIn);
        night.setDate(night.getDate() + i);
        
        items.push({
          booking_id: bookingId,
          item_type: 'hotel_night',
          item_details: {
            hotel_name: bookingData.hotel?.name || bookingData.hotelName,
            room_type: bookingData.hotel?.roomType || bookingData.roomType,
            date: night.toISOString().split('T')[0],
            night_number: i + 1,
            total_nights: nights,
            guests: bookingData.hotel?.guests || bookingData.guestCount || 1,
            amenities: bookingData.hotel?.amenities || bookingData.amenities || []
          },
          quantity: 1,
          unit_price: roomPrice,
          total_price: roomPrice
        });
      }
      
      // Add room extras if any
      if (bookingData.extras) {
        bookingData.extras.forEach((extra: any) => {
          items.push({
            booking_id: bookingId,
            item_type: 'hotel_extra',
            item_details: {
              name: extra.name,
              description: extra.description,
              type: extra.type
            },
            quantity: extra.quantity || 1,
            unit_price: extra.price || 0,
            total_price: (extra.price || 0) * (extra.quantity || 1)
          });
        });
      }
      
    } else if (bookingType === 'activity') {
      // Create items for activity participants
      const participants = bookingData.activity?.participants || bookingData.participants || 1;
      const basePrice = totalAmount / (typeof participants === 'number' ? participants : participants.length);
      
      if (typeof participants === 'number') {
        // Simple participant count
        items.push({
          booking_id: bookingId,
          item_type: 'activity_participant',
          item_details: {
            activity_name: bookingData.activity?.title || bookingData.activityName,
            participant_count: participants,
            date: bookingData.activity?.date || bookingData.activityDate,
            time: bookingData.activity?.time || bookingData.activityTime,
            duration: bookingData.activity?.duration || bookingData.duration,
            location: bookingData.activity?.location || bookingData.location
          },
          quantity: participants,
          unit_price: basePrice,
          total_price: totalAmount
        });
      } else if (Array.isArray(participants)) {
        // Detailed participant array
        participants.forEach((participant: any, index: number) => {
          items.push({
            booking_id: bookingId,
            item_type: 'activity_participant',
            item_details: {
              activity_name: bookingData.activity?.title || bookingData.activityName,
              participant_name: `${participant.firstName} ${participant.lastName}`,
              participant_type: participant.type || 'adult',
              date: bookingData.activity?.date || bookingData.activityDate,
              time: bookingData.activity?.time || bookingData.activityTime,
              duration: bookingData.activity?.duration || bookingData.duration,
              location: bookingData.activity?.location || bookingData.location,
              special_requirements: participant.specialRequirements
            },
            quantity: 1,
            unit_price: basePrice,
            total_price: basePrice
          });
        });
      }
      
      // Add activity add-ons
      if (bookingData.addOns) {
        bookingData.addOns.forEach((addOn: any) => {
          items.push({
            booking_id: bookingId,
            item_type: 'activity_addon',
            item_details: {
              name: addOn.name,
              description: addOn.description,
              type: addOn.type
            },
            quantity: addOn.quantity || 1,
            unit_price: addOn.price || 0,
            total_price: (addOn.price || 0) * (addOn.quantity || 1)
          });
        });
      }
    }
    
    // Insert all booking items
    if (items.length > 0) {
      const { error } = await supabaseClient
        .from('booking_items')
        .insert(items);
        
      if (error) {
        console.error('Error creating booking items:', error);
        throw error;
      }
      
      console.log(`Created ${items.length} booking items for booking ${bookingId}`);
    }
    
  } catch (error) {
    console.error('Error in createBookingItems:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: BookingPaymentParams = await req.json();
    
    console.log('Creating booking payment:', { 
      type: params.bookingType, 
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod 
    });

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD'];
    const currency = (params.currency || 'USD').toUpperCase();
    
    if (!validCurrencies.includes(currency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    // Validate amount
    if (!params.amount || params.amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user if available
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    // Generate booking reference
    const bookingReference = `MK${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Extract IP address for audit logging
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create booking record
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        user_id: user?.id || null,
        booking_reference: bookingReference,
        booking_type: params.bookingType,
        status: 'pending',
        total_amount: params.amount,
        currency: currency,
        booking_data: {
          ...params.bookingData,
          customerInfo: params.customerInfo,
          paymentMethod: params.paymentMethod,
          sessionStart: new Date().toISOString(),
          analytics: {
            ipAddress: ipAddress,
            userAgent: userAgent,
            pagesVisited: 1
          }
        }
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log('Booking created:', booking.id);

    // Generate guest access token for guest bookings
    let guestAccessToken = null;
    if (!user && params.customerInfo.email) {
      try {
        const { data: tokenData, error: tokenError } = await supabaseClient
          .rpc('generate_guest_booking_token', {
            _booking_id: booking.id,
            _email: params.customerInfo.email
          });
        
        if (!tokenError) {
          guestAccessToken = tokenData;
          console.log('Guest access token generated for booking:', booking.id);
        }
      } catch (tokenError) {
        console.error('Failed to generate guest token:', tokenError);
        // Don't fail the booking if token generation fails
      }
    }

    // Log booking access attempt
    try {
      await supabaseClient.rpc('log_booking_access', {
        _booking_id: booking.id,
        _access_type: user ? 'authenticated_user' : 'guest_token',
        _access_method: 'booking_creation',
        _ip_address: ipAddress,
        _user_agent: userAgent,
        _accessed_data: {
          action: 'create_booking',
          booking_type: params.bookingType,
          amount: params.amount
        },
        _success: true
      });
    } catch (auditError) {
      console.error('Audit logging failed:', auditError);
      // Don't fail the booking if audit logging fails
    }

    // Create detailed booking items
    await createBookingItems(supabaseClient, booking.id, params.bookingType, params.bookingData, params.amount);

    // Handle payment based on method
    let checkoutUrl = null;
    let paymentStatus = 'pending';

    if (params.paymentMethod === 'fund') {
      // Check if user has sufficient funds
      if (!user) {
        throw new Error('User must be logged in to use travel fund');
      }

      const { data: balance } = await supabaseClient
        .from('fund_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!balance || balance.balance < params.amount) {
        throw new Error('Insufficient funds in travel fund');
      }

      // Deduct from fund and mark as paid
      await supabaseClient
        .from('fund_transactions')
        .insert({
          user_id: user.id,
          type: 'booking',
          amount: -params.amount,
          status: 'completed'
        });

      paymentStatus = 'paid';
      
    } else if (params.paymentMethod === 'split') {
      // Split payment: part fund, part card
      if (!user || !params.fundAmount) {
        throw new Error('Invalid split payment configuration');
      }

      const cardAmount = params.amount - params.fundAmount;
      
      // Create Stripe checkout for card portion
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      const session = await stripe.checkout.sessions.create({
        customer_email: params.customerInfo.email,
        line_items: [
          {
            price_data: {
              currency: params.currency || "usd",
              product_data: {
                name: `${params.bookingType.charAt(0).toUpperCase() + params.bookingType.slice(1)} Booking - ${bookingReference}`,
                description: `Travel booking payment (split: $${params.fundAmount} from fund + $${cardAmount} card)`
              },
              unit_amount: Math.round(cardAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/booking/confirmation?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/booking/cancelled?booking_id=${booking.id}`,
        metadata: {
          booking_id: booking.id,
          booking_reference: bookingReference,
          fund_amount: params.fundAmount.toString(),
          payment_method: 'split'
        }
      });

      checkoutUrl = session.url;

    } else {
      // Full card payment
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      // Calculate Stripe amount based on currency
      let stripeAmount;
      if (currency === 'INR') {
        // For INR, Stripe expects amount in paise (1 INR = 100 paise)
        stripeAmount = Math.round(params.amount * 100);
      } else {
        // For other currencies, Stripe expects amount in smallest unit
        stripeAmount = Math.round(params.amount * 100);
      }

      console.log(`Stripe amount calculation: ${params.amount} ${currency} = ${stripeAmount} ${currency === 'INR' ? 'paise' : 'cents'}`);

      const session = await stripe.checkout.sessions.create({
        customer_email: params.customerInfo.email,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `${params.bookingType.charAt(0).toUpperCase() + params.bookingType.slice(1)} Booking - ${bookingReference}`,
                description: `Travel booking payment`
              },
              unit_amount: stripeAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/booking/confirmation?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/booking/cancelled?booking_id=${booking.id}`,
        metadata: {
          booking_id: booking.id,
          booking_reference: bookingReference,
          payment_method: 'card'
        }
      });

      checkoutUrl = session.url;
    }

    // Update booking status if paid via fund
    if (paymentStatus === 'paid') {
      await supabaseClient
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);
    }

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        reference: bookingReference,
        status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
        amount: params.amount,
        currency: currency,
        guestAccessToken: guestAccessToken // For guest bookings
      },
      payment: {
        method: params.paymentMethod,
        status: paymentStatus,
        checkoutUrl: checkoutUrl
      },
      security: {
        isGuestBooking: !user,
        accessTokenGenerated: !!guestAccessToken,
        auditLogged: true
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Booking payment error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});