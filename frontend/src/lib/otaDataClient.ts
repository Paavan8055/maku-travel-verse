import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logger from "@/utils/logger";

// Reviews & Ratings API
export const reviewsAPI = {
  async fetchReviews(itemType: string, itemId: string) {
    const { data, error } = await supabase
      .from('detailed_reviews')
      .select('*')
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createReview(review: any) {
    const { data, error } = await supabase
      .from('detailed_reviews')
      .insert(review)
      .select()
      .single();
    
    if (error) throw error;
    toast.success("Review submitted successfully!");
    return data;
  },

  async updateReview(reviewId: string, updates: any) {
    const { data, error } = await supabase
      .from('detailed_reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Enhanced Favorites API
export const favoritesAPI = {
  async fetchFavorites(userId: string) {
    const { data, error } = await supabase
      .from('enhanced_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async addFavorite(favorite: any) {
    const { data, error } = await supabase
      .from('enhanced_favorites')
      .upsert(favorite)
      .select()
      .single();
    
    if (error) throw error;
    toast.success("Added to favorites!");
    return data;
  },

  async removeFavorite(userId: string, itemType: string, itemId: string) {
    const { error } = await supabase
      .from('enhanced_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId);
    
    if (error) throw error;
    toast.success("Removed from favorites");
  },

  async updatePriceAlert(favoriteId: string, threshold: number, isActive: boolean) {
    const { data, error } = await supabase
      .from('enhanced_favorites')
      .update({
        price_alert_threshold: threshold,
        is_price_alert_active: isActive
      })
      .eq('id', favoriteId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Loyalty Points API
export const loyaltyAPI = {
  async fetchPoints(userId: string) {
    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async fetchTransactions(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async awardPoints(userId: string, points: number, reason: string, bookingId?: string) {
    const { data, error } = await supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'earned',
        points,
        reason,
        booking_id: bookingId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update total points - we'll handle this in the UI for now
    
    return data;
  }
};

// Travel Journal API
export const journalAPI = {
  async fetchJournalEntries(userId: string) {
    const { data, error } = await supabase
      .from('travel_journal')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createJournalEntry(entry: any) {
    const { data, error } = await supabase
      .from('travel_journal')
      .insert(entry)
      .select()
      .single();
    
    if (error) throw error;
    toast.success("Journal entry created!");
    return data;
  },

  async updateJournalEntry(entryId: string, updates: any) {
    const { data, error } = await supabase
      .from('travel_journal')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Local Tips API
export const tipsAPI = {
  async fetchLocalTips(locationId: string) {
    const { data, error } = await supabase
      .from('local_tips')
      .select('*')
      .eq('location_id', locationId)
      .order('helpful_votes', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTip(tip: any) {
    const { data, error } = await supabase
      .from('local_tips')
      .insert(tip)
      .select()
      .single();
    
    if (error) throw error;
    toast.success("Local tip shared!");
    return data;
  },

  async voteHelpful(tipId: string) {
    // First get current count, then increment
    const { data: tip } = await supabase
      .from('local_tips')
      .select('helpful_votes')
      .eq('id', tipId)
      .single();
    
    const { data, error } = await supabase
      .from('local_tips')
      .update({ helpful_votes: (tip?.helpful_votes || 0) + 1 })
      .eq('id', tipId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};


// Travel Analytics API
export const analyticsAPI = {
  async fetchTravelAnalytics(userId: string, year?: number) {
    const { data, error } = await supabase
      .from('travel_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year || new Date().getFullYear())
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateTravelStats(userId: string, stats: any) {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('travel_analytics')
      .upsert({
        user_id: userId,
        year,
        ...stats
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Activity Logging for Social Proof
export const activityAPI = {
  async logActivity(activity: {
    activity_type: string;
    item_type?: string;
    item_id?: string;
    item_data?: any;
    location?: string;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: session?.user.id || null,
        session_id: session?.access_token || null,
        ...activity
      });
    
    if (error) logger.warn('Activity logging failed:', error);
  },

  async fetchRecentActivity(itemType?: string, limit = 50) {
    let query = supabase
      .from('user_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};