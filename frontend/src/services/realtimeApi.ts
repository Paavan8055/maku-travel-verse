/**
 * Real-Time Features API Client for Maku.Travel
 * Provides live pricing, notifications, and real-time updates
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || '';

// ============================================================================
// Types
// ============================================================================

export interface PriceAlert {
  alert_id: string;
  user_id: string;
  search_criteria: {
    type: 'hotel' | 'flight' | 'activity';
    destination: string;
    dates?: {
      checkin?: string;
      checkout?: string;
      departure?: string;
    };
  };
  target_price: number;
  current_price: number;
  currency: string;
  status: 'active' | 'triggered' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface LivePriceUpdate {
  item_id: string;
  item_type: 'hotel' | 'flight' | 'activity';
  current_price: number;
  previous_price: number;
  price_change: number;
  price_change_percentage: number;
  currency: string;
  timestamp: string;
  availability: boolean;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  type: 'price_drop' | 'price_alert' | 'booking_confirmation' | 'availability' | 'promotion';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface ProviderStatus {
  provider_name: string;
  status: 'operational' | 'degraded' | 'down';
  response_time_ms: number;
  error_rate: number;
  last_check: string;
  endpoints_status: Record<string, 'up' | 'down'>;
}

export interface BookingStatus {
  booking_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'cancelled' | 'completed';
  last_updated: string;
  provider: string;
  estimated_confirmation_time?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new price alert
 */
export async function createPriceAlert(params: {
  user_id: string;
  search_criteria: {
    type: 'hotel' | 'flight' | 'activity';
    destination: string;
    dates?: Record<string, string>;
  };
  target_price: number;
  currency?: string;
}): Promise<PriceAlert> {
  try {
    const response = await axios.post<{
      success: boolean;
      alert: PriceAlert;
    }>(`${API_BASE_URL}/api/realtime/price-alerts`, params);
    
    return response.data.alert;
  } catch (error) {
    console.error('Failed to create price alert:', error);
    throw error;
  }
}

/**
 * Get user's price alerts
 */
export async function getUserPriceAlerts(userId: string, status?: 'active' | 'triggered' | 'expired') {
  try {
    const response = await axios.get<{
      success: boolean;
      alerts: PriceAlert[];
      total_count: number;
    }>(`${API_BASE_URL}/api/realtime/price-alerts/${userId}`, {
      params: { status }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get price alerts:', error);
    throw error;
  }
}

/**
 * Get live price updates for specific items
 */
export async function getLivePrices(itemIds: string[], itemType: 'hotel' | 'flight' | 'activity') {
  try {
    const response = await axios.post<{
      success: boolean;
      updates: LivePriceUpdate[];
      timestamp: string;
    }>(`${API_BASE_URL}/api/realtime/live-prices`, {
      item_ids: itemIds,
      item_type: itemType
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get live prices:', error);
    throw error;
  }
}

/**
 * Monitor availability for specific items
 */
export async function monitorAvailability(params: {
  item_id: string;
  item_type: 'hotel' | 'flight' | 'activity';
  dates: Record<string, string>;
  user_id: string;
}) {
  try {
    const response = await axios.post<{
      success: boolean;
      monitor_id: string;
      status: string;
    }>(`${API_BASE_URL}/api/realtime/availability/monitor`, params);
    
    return response.data;
  } catch (error) {
    console.error('Failed to monitor availability:', error);
    throw error;
  }
}

/**
 * Check current availability
 */
export async function checkAvailability(itemId: string, itemType: 'hotel' | 'flight' | 'activity') {
  try {
    const response = await axios.get<{
      success: boolean;
      available: boolean;
      quantity: number;
      last_updated: string;
    }>(`${API_BASE_URL}/api/realtime/availability/check/${itemId}`, {
      params: { item_type: itemType }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to check availability:', error);
    throw error;
  }
}

/**
 * Get user notifications
 */
export async function getNotifications(userId: string, unreadOnly: boolean = false) {
  try {
    const response = await axios.get<{
      success: boolean;
      notifications: Notification[];
      unread_count: number;
      total_count: number;
    }>(`${API_BASE_URL}/api/realtime/notifications/${userId}`, {
      params: { unread_only: unreadOnly }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  try {
    const response = await axios.put<{
      success: boolean;
    }>(`${API_BASE_URL}/api/realtime/notifications/${notificationId}/read`);
    
    return response.data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

/**
 * Get provider status for all providers
 */
export async function getProviderStatus() {
  try {
    const response = await axios.get<{
      success: boolean;
      providers: ProviderStatus[];
      last_updated: string;
    }>(`${API_BASE_URL}/api/realtime/providers/status`);
    
    return response.data;
  } catch (error) {
    console.error('Failed to get provider status:', error);
    throw error;
  }
}

/**
 * Get booking status and real-time updates
 */
export async function getBookingStatus(bookingId: string): Promise<BookingStatus> {
  try {
    const response = await axios.get<{
      success: boolean;
      booking: BookingStatus;
    }>(`${API_BASE_URL}/api/realtime/booking/${bookingId}/status`);
    
    return response.data.booking;
  } catch (error) {
    console.error('Failed to get booking status:', error);
    throw error;
  }
}

/**
 * Get system health status
 */
export async function getSystemHealth() {
  try {
    const response = await axios.get<{
      success: boolean;
      status: 'healthy' | 'degraded' | 'down';
      services: {
        api: 'up' | 'down';
        database: 'up' | 'down';
        cache: 'up' | 'down';
        providers: 'up' | 'down';
      };
      uptime_seconds: number;
      last_check: string;
    }>(`${API_BASE_URL}/api/realtime/system/health`);
    
    return response.data;
  } catch (error) {
    console.error('Failed to get system health:', error);
    throw error;
  }
}

/**
 * Get price history for an item
 */
export async function getPriceHistory(
  itemId: string,
  itemType: 'hotel' | 'flight' | 'activity',
  days: number = 30
) {
  try {
    const response = await axios.get<{
      success: boolean;
      item_id: string;
      item_type: string;
      price_history: Array<{
        date: string;
        price: number;
        currency: string;
      }>;
      average_price: number;
      lowest_price: number;
      highest_price: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>(`${API_BASE_URL}/api/realtime/prices/history/${itemId}`, {
      params: { item_type: itemType, days }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get price history:', error);
    throw error;
  }
}
