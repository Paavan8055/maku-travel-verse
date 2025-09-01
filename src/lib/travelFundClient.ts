import { supabase } from '@/integrations/supabase/client';

export interface TravelFund {
  id: string;
  user_id: string;
  balance: number;
  name?: string;
  description?: string;
  target_amount?: number;
  currency?: string;
  fund_type?: 'personal' | 'group' | 'family';
  deadline?: string;
  destination?: string;
  fund_code?: string;
  status?: 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface FundTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  stripe_session_id?: string;
  created_at: string;
}

// Travel Fund CRUD Operations using existing fund tables
export const travelFundClient = {
  // Get all funds for the current user
  async getUserFunds(): Promise<{ data: TravelFund[] | null; error: any }> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
      .from('funds')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false }); // Use id instead of created_at since that column doesn't exist

    // Add default values for missing properties
    const enrichedData = data?.map(fund => ({
      ...fund,
      name: (fund as any).name || 'Travel Fund',
      status: (fund as any).status || 'active',
      currency: (fund as any).currency || 'USD',
      fund_type: (fund as any).fund_type || 'personal',
      balance: fund.balance || 0
    })) || [];

    return { data: enrichedData as TravelFund[], error };
  },

  // Create a new travel fund
  async createFund(fundData: {
    name: string;
    description?: string;
    target_amount: number;
    currency?: string;
    fund_type: 'personal' | 'group' | 'family';
    deadline?: string;
    destination?: string;
  }): Promise<{ data: TravelFund | null; error: any }> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: null, error: 'User not authenticated' };

    // Generate a unique fund code
    const fundCode = Math.random().toString(36).substring(2, 15).toUpperCase();

    const { data, error } = await supabase
      .from('funds')
      .insert({
        user_id: user.id,
        balance: 0
      })
      .select()
      .single();

    return { data: data as TravelFund, error };
  },

  // Add money to a fund
  async addFunds(fundId: string, amount: number, description?: string): Promise<{ data: FundTransaction | null; error: any }> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('fund_transactions')
      .insert({
        user_id: user.id,
        amount,
        type: 'deposit',
        status: 'completed'
      })
      .select()
      .single();

    if (data && !error) {
      // Update fund balance
      const { error: updateError } = await supabase
        .from('funds')
        .update({
          balance: (await supabase
            .from('funds')
            .select('balance')
            .eq('id', fundId)
            .single()
          ).data?.balance! + amount
        })
        .eq('id', fundId);

      if (updateError) {
        console.error('Error updating fund balance:', updateError);
      }
    }

    return { data: data as FundTransaction, error };
  },

  // Join fund by code (placeholder for future implementation)
  async joinFundByCode(fundCode: string): Promise<{ data: TravelFund | null; error: any }> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data: fund, error } = await supabase
      .from('funds')
      .select('*')
      .single();

    if (error || !fund) {
      return { data: null, error: 'Fund not found or invalid code' };
    }

    // For now, just return the fund (in future, implement member logic)
    return { data: fund as TravelFund, error: null };
  }
};