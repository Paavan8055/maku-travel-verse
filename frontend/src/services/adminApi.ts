import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

export interface SystemHealth {
  system_status: string;
  services: Record<string, string>;
  performance: {
    avg_response_time_ms: number;
    requests_per_minute: number;
    error_rate: number;
    uptime_percentage: number;
  };
  active_connections: number;
}

export interface AnalyticsOverview {
  total_users: number;
  total_bookings: number;
  total_revenue_usd: number;
  conversion_rate: number;
  nps_score: number;
  user_retention_rate: number;
  avg_booking_value: number;
}

export interface RealtimeMetrics {
  active_users_now: number;
  searches_last_hour: number;
  bookings_last_hour: number;
  conversion_rate_last_hour: number;
  avg_response_time_ms: number;
  system_health: string;
  top_searches_now: any[];
  recent_bookings: any[];
}

class AdminApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BACKEND_URL;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/realtime/system/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw error;
    }
  }

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/analytics/overview`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  }

  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/analytics/realtime`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch realtime metrics:', error);
      throw error;
    }
  }

  async getProviderAnalytics(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/admin/providers/analytics/overview`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch provider analytics:', error);
      throw error;
    }
  }

  async getProviderHealth(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/admin/providers/health/summary`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch provider health:', error);
      throw error;
    }
  }

  async getBookingFunnel(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/analytics/booking-funnel`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch booking funnel:', error);
      throw error;
    }
  }

  async getUserSegments(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/analytics/users/segments`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user segments:', error);
      throw error;
    }
  }
}

export const adminApi = new AdminApiService();
