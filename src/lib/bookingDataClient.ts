import { supabase } from "@/integrations/supabase/client";

// User Preferences API
export async function fetchUserPreferences(userId: string) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data;
}

export async function saveUserPreferences(data: any) {
  const { data: result, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: data.user_id,
      preferred_airlines: data.preferred_airlines || [],
      seat_class: data.seat_class || 'economy',
      room_type: data.room_type || 'standard',
      meal_preferences: data.meal_preferences || [],
      language: data.language || 'en',
      currency: data.currency || 'USD'
    })
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

// Payment Methods API
export async function fetchPaymentMethods(userId: string) {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function savePaymentMethod(data: any) {
  const { data: result, error } = await supabase
    .from('payment_methods')
    .insert({
      user_id: data.user_id,
      type: data.type,
      provider: data.provider,
      last4: data.last4,
      expiry_month: data.expiry_month,
      expiry_year: data.expiry_year,
      is_default: data.is_default || false
    })
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

// Passport Info API
export async function fetchPassportInfo(userId: string) {
  const { data, error } = await supabase
    .from('passport_info')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data;
}

export async function savePassportInfo(data: any) {
  const { data: result, error } = await supabase
    .from('passport_info')
    .upsert({
      user_id: data.user_id,
      country: data.country,
      passport_number: data.passport_number,
      expiry_date: data.expiry_date,
      verified: data.verified || false,
      document_url: data.document_url
    })
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

// Favorites API
export async function fetchUserFavorites(userId: string) {
  const { data, error } = await supabase
    .from('saved_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function toggleFavorite(userId: string, itemType: string, itemId: string, itemData?: any) {
  // Check if already favorited
  const { data: existing } = await supabase
    .from('saved_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle();
  
  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('saved_favorites')
      .delete()
      .eq('id', existing.id);
    
    if (error) throw error;
    return { action: 'removed' };
  } else {
    // Add favorite
    const { data, error } = await supabase
      .from('saved_favorites')
      .insert({
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        item_data: itemData
      })
      .select()
      .single();
    
    if (error) throw error;
    return { action: 'added', data };
  }
}

// Dynamic Offers API
export async function listDynamicOffers(criteria: { route?: string; limit?: number } = {}) {
  let query = supabase
    .from('dynamic_offers')
    .select('*')
    .eq('is_active', true)
    .gt('valid_until', new Date().toISOString())
    .order('discount_pct', { ascending: false });
  
  if (criteria.route) {
    query = query.eq('route', criteria.route);
  }
  
  if (criteria.limit) {
    query = query.limit(criteria.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

// Local Insights API
export async function fetchLocalInsights(locationId: string) {
  const { data, error } = await supabase
    .from('local_insights')
    .select('*')
    .eq('location_id', locationId)
    .order('rating', { ascending: false })
    .order('is_featured', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Visa Documents API
export async function fetchVisaDocuments(userId: string) {
  const { data, error } = await supabase
    .from('visa_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function saveVisaDocument(data: any) {
  const { data: result, error } = await supabase
    .from('visa_documents')
    .insert({
      user_id: data.user_id,
      country: data.country,
      doc_type: data.doc_type,
      status: data.status || 'pending',
      document_url: data.document_url,
      expiry_date: data.expiry_date
    })
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

// Guest Booking Security API
export async function lookupGuestBooking(bookingReference: string, email: string, accessToken?: string) {
  const { data, error } = await supabase.functions.invoke('guest-booking-lookup', {
    body: {
      bookingReference,
      email,
      accessToken
    }
  });

  if (error) throw error;
  return data;
}

export async function generateGuestAccessToken(bookingId: string, email: string) {
  const { data, error } = await supabase.rpc('generate_guest_booking_token', {
    _booking_id: bookingId,
    _email: email
  });

  if (error) throw error;
  return data;
}

// AI Training Data API (Admin only)
export async function triggerAITrainingAnonymization(bookingId?: string, batchSize?: number) {
  const { data, error } = await supabase.functions.invoke('ai-training-anonymizer', {
    body: {
      bookingId,
      batchSize
    }
  });

  if (error) throw error;
  return data;
}

export async function getAITrainingStats() {
  const { data, error } = await supabase
    .from('ai_training_bookings')
    .select('booking_type, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw error;

  // Process stats client-side for better performance
  const last24Hours = data?.filter(item => 
    new Date(item.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length || 0;

  const byType = data?.reduce((acc: any, item: any) => {
    acc[item.booking_type] = (acc[item.booking_type] || 0) + 1;
    return acc;
  }, {}) || {};

  return {
    total: data?.length || 0,
    last24Hours,
    byType
  };
}

// Security Audit API (Admin only)
export async function getBookingAccessAudit(bookingId?: string, limit = 50) {
  let query = supabase
    .from('booking_access_audit')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (bookingId) {
    query = query.eq('booking_id', bookingId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}