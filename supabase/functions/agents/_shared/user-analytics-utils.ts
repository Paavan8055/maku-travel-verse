import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

export interface UserBehaviorPattern {
  bookingFrequency: number;
  averageBookingValue: number;
  preferredDestinations: string[];
  seasonalPatterns: any;
  paymentPreferences: string[];
  deviceUsage: any;
  timePatterns: any;
}

export interface UserSegment {
  segment: 'VIP' | 'Frequent' | 'Occasional' | 'New' | 'At-Risk';
  score: number;
  characteristics: string[];
  recommendations: string[];
}

export class UserAnalyticsUtils {
  constructor(private supabase: SupabaseClient) {}

  async getUserBehaviorProfile(userId: string): Promise<UserBehaviorPattern | null> {
    try {
      // Get user's booking history
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!bookings || bookings.length === 0) {
        return null;
      }

      // Calculate booking frequency (bookings per month)
      const firstBooking = new Date(bookings[bookings.length - 1].created_at);
      const monthsSinceFirst = Math.max(1, (Date.now() - firstBooking.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const bookingFrequency = bookings.length / monthsSinceFirst;

      // Calculate average booking value
      const totalValue = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      const averageBookingValue = totalValue / bookings.length;

      // Extract preferred destinations
      const destinations = bookings
        .map(b => b.booking_data?.destination?.city || b.booking_data?.destination?.country)
        .filter(Boolean);
      const destinationCounts = destinations.reduce((acc, dest) => {
        acc[dest] = (acc[dest] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const preferredDestinations = Object.entries(destinationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([dest]) => dest);

      // Analyze seasonal patterns
      const monthlyBookings = bookings.reduce((acc, booking) => {
        const month = new Date(booking.created_at).getMonth();
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Extract payment preferences
      const paymentMethods = bookings
        .map(b => b.booking_data?.paymentMethod)
        .filter(Boolean);
      const paymentCounts = paymentMethods.reduce((acc, method) => {
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const preferredPayments = Object.entries(paymentCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([method]) => method);

      // Analyze time patterns
      const timePatterns = {
        preferredBookingHours: this.analyzeBookingTimes(bookings),
        daysOfWeek: this.analyzeBookingDays(bookings),
        advanceBookingDays: this.analyzeAdvanceBooking(bookings)
      };

      return {
        bookingFrequency,
        averageBookingValue,
        preferredDestinations,
        seasonalPatterns: monthlyBookings,
        paymentPreferences: preferredPayments,
        deviceUsage: {}, // Could be enhanced with device tracking
        timePatterns
      };

    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return null;
    }
  }

  async segmentUser(userId: string): Promise<UserSegment> {
    const behaviorProfile = await this.getUserBehaviorProfile(userId);
    
    if (!behaviorProfile) {
      return {
        segment: 'New',
        score: 0,
        characteristics: ['No booking history'],
        recommendations: ['Welcome new user', 'Offer onboarding experience']
      };
    }

    let score = 0;
    const characteristics: string[] = [];
    const recommendations: string[] = [];

    // Scoring based on frequency
    if (behaviorProfile.bookingFrequency > 2) {
      score += 40;
      characteristics.push('Highly active user');
    } else if (behaviorProfile.bookingFrequency > 1) {
      score += 25;
      characteristics.push('Regular user');
    } else if (behaviorProfile.bookingFrequency > 0.5) {
      score += 15;
      characteristics.push('Occasional user');
    } else {
      score += 5;
      characteristics.push('Infrequent user');
    }

    // Scoring based on booking value
    if (behaviorProfile.averageBookingValue > 5000) {
      score += 30;
      characteristics.push('High-value customer');
      recommendations.push('Offer premium services');
    } else if (behaviorProfile.averageBookingValue > 2000) {
      score += 20;
      characteristics.push('Mid-tier customer');
      recommendations.push('Upsell premium options');
    } else {
      score += 10;
      characteristics.push('Budget-conscious customer');
      recommendations.push('Highlight value deals');
    }

    // Loyalty indicators
    if (behaviorProfile.preferredDestinations.length > 0) {
      score += 15;
      characteristics.push('Shows destination loyalty');
      recommendations.push('Recommend similar destinations');
    }

    // Determine segment
    let segment: UserSegment['segment'];
    if (score >= 80) {
      segment = 'VIP';
      recommendations.push('Assign dedicated support', 'Offer exclusive deals');
    } else if (score >= 60) {
      segment = 'Frequent';
      recommendations.push('Loyalty program benefits', 'Priority customer service');
    } else if (score >= 40) {
      segment = 'Occasional';
      recommendations.push('Re-engagement campaigns', 'Personalized offers');
    } else if (score >= 20) {
      segment = 'New';
      recommendations.push('Onboarding support', 'First-time user incentives');
    } else {
      segment = 'At-Risk';
      recommendations.push('Win-back campaign', 'Special retention offers');
    }

    return {
      segment,
      score,
      characteristics,
      recommendations: [...new Set(recommendations)]
    };
  }

  async getAggregatedUserMetrics(userIds: string[]): Promise<any> {
    try {
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select('user_id, total_amount, created_at, booking_type')
        .in('user_id', userIds)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      const metrics = {
        totalUsers: userIds.length,
        totalBookings: bookings?.length || 0,
        totalRevenue: bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
        averageBookingValue: 0,
        bookingsByType: {} as Record<string, number>,
        activeUsers: new Set(bookings?.map(b => b.user_id)).size || 0
      };

      if (metrics.totalBookings > 0) {
        metrics.averageBookingValue = metrics.totalRevenue / metrics.totalBookings;
      }

      // Count bookings by type
      bookings?.forEach(booking => {
        const type = booking.booking_type || 'unknown';
        metrics.bookingsByType[type] = (metrics.bookingsByType[type] || 0) + 1;
      });

      return metrics;
    } catch (error) {
      console.error('Error getting aggregated metrics:', error);
      return null;
    }
  }

  private analyzeBookingTimes(bookings: any[]): number[] {
    const hourCounts = new Array(24).fill(0);
    
    bookings.forEach(booking => {
      const hour = new Date(booking.created_at).getHours();
      hourCounts[hour]++;
    });

    // Return the most popular hours
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
  }

  private analyzeBookingDays(bookings: any[]): number[] {
    const dayCounts = new Array(7).fill(0);
    
    bookings.forEach(booking => {
      const day = new Date(booking.created_at).getDay();
      dayCounts[day]++;
    });

    return dayCounts
      .map((count, day) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.day);
  }

  private analyzeAdvanceBooking(bookings: any[]): number {
    const advanceDays = bookings
      .filter(b => b.booking_data?.checkInDate || b.booking_data?.departureDate)
      .map(b => {
        const travelDate = new Date(b.booking_data.checkInDate || b.booking_data.departureDate);
        const bookingDate = new Date(b.created_at);
        return Math.max(0, (travelDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));
      });

    return advanceDays.length > 0 
      ? Math.round(advanceDays.reduce((sum, days) => sum + days, 0) / advanceDays.length)
      : 0;
  }
}