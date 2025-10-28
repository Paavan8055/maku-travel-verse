import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

export interface PartnerStats {
  occupancy_rate: number;
  adr: number;
  revpar: number;
  bookings_this_month: number;
  revenue_this_month: number;
  avg_lead_time: number;
  bid_win_rate: number;
  active_dreams: number;
  your_active_bids: number;
  won_this_month: number;
}

export interface DreamOpportunity {
  dream_id: string;
  user_id: string;
  destination: string;
  budget_min: number;
  budget_max: number;
  date_start: string;
  date_end: string;
  flexible_dates: boolean;
  travelers: number;
  preferences: string[];
  urgency: string;
  savings_progress: number;
  active_bids: number;
  your_bid_rank?: number;
}

export interface Campaign {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  discount: number;
  min_allocation: number;
  max_allocation: number;
  current_allocation: number;
  status: string;
  revenue: number;
}

class PartnerApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${BACKEND_URL}/api/partners`;
  }

  async getStats(): Promise<PartnerStats> {
    try {
      const response = await axios.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch partner stats:', error);
      // Return fallback data
      return {
        occupancy_rate: 72.5,
        adr: 245,
        revpar: 177.6,
        bookings_this_month: 47,
        revenue_this_month: 45230,
        avg_lead_time: 23,
        bid_win_rate: 67,
        active_dreams: 47,
        your_active_bids: 12,
        won_this_month: 23
      };
    }
  }

  async getOpportunities(): Promise<DreamOpportunity[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/opportunities`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
      return [];
    }
  }

  async getCampaigns(): Promise<Campaign[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/campaigns`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      return [];
    }
  }

  async createCampaign(campaignData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/campaigns`, campaignData);
      return response.data;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }

  async getOccupancyAlerts(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/occupancy/alerts`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch occupancy alerts:', error);
      return [];
    }
  }

  async getSettlements(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/settlements`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      return [];
    }
  }

  async submitBid(dreamId: string, bidData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/bids/${dreamId}`, bidData);
      return response.data;
    } catch (error) {
      console.error('Failed to submit bid:', error);
      throw error;
    }
  }
}

export const partnerApi = new PartnerApiService();
