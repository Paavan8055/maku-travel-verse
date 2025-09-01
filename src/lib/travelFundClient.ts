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

    console.log('Fetching funds for user:', user.id);

    const { data, error } = await supabase
      .from('funds')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false }); // Use id instead of created_at since that column doesn't exist

    console.log('Raw funds data:', data);
    console.log('Funds query error:', error);

    if (error) {
      console.error('Error fetching funds:', error);
      return { data: [], error };
    }

    // Add default values for missing properties to prevent undefined errors
    const enrichedData = (data || []).map(fund => ({
      ...fund,
      id: fund.id || '',
      user_id: fund.user_id || user.id,
      balance: Number(fund.balance) || 0,
      name: (fund as any).name || 'Travel Fund',
      status: (fund as any).status || 'active',
      currency: (fund as any).currency || 'USD',
      fund_type: (fund as any).fund_type || 'personal',
      target_amount: (fund as any).target_amount || undefined,
      description: (fund as any).description || undefined,
      deadline: (fund as any).deadline || undefined,
      destination: (fund as any).destination || undefined,
      fund_code: (fund as any).fund_code || undefined,
      created_at: (fund as any).created_at || undefined,
      updated_at: (fund as any).updated_at || undefined
    }));

    console.log('Enriched funds data:', enrichedData);

    return { data: enrichedData as TravelFund[], error: null };
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

    console.log('Creating fund with data:', fundData);

    // Generate a unique fund code
    const fundCode = Math.random().toString(36).substring(2, 15).toUpperCase();

    const { data, error } = await supabase
      .from('funds')
      .insert({
        user_id: user.id,
        balance: 0,
        // Note: Add other fields when database schema supports them
        // name: fundData.name,
        // description: fundData.description,
        // target_amount: fundData.target_amount,
        // currency: fundData.currency || 'USD',
        // fund_type: fundData.fund_type,
        // deadline: fundData.deadline,
        // destination: fundData.destination,
        // fund_code: fundCode
      })
      .select()
      .single();

    console.log('Create fund result:', { data, error });

    return { data: data as TravelFund, error };
  },

  // Add money to a fund
  async addFunds(fundId: string, amount: number, description?: string): Promise<{ data: FundTransaction | null; error: any }> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: null, error: 'User not authenticated' };

    console.log('Adding funds:', { fundId, amount, description });

    try {
      // First, get current balance
      const { data: fund, error: fundError } = await supabase
        .from('funds')
        .select('balance')
        .eq('id', fundId)
        .eq('user_id', user.id) // Ensure user owns the fund
        .single();

      if (fundError || !fund) {
        console.error('Fund not found or error:', fundError);
        return { data: null, error: 'Fund not found or access denied' };
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('fund_transactions')
        .insert({
          user_id: user.id,
          amount,
          type: 'deposit',
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        return { data: null, error: transactionError };
      }

      // Update fund balance
      const newBalance = (fund.balance || 0) + amount;
      const { error: updateError } = await supabase
        .from('funds')
        .update({ balance: newBalance })
        .eq('id', fundId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating fund balance:', updateError);
        return { data: null, error: updateError };
      }

      return { data: transaction as FundTransaction, error: null };
    } catch (err) {
      console.error('Unexpected error in addFunds:', err);
      return { data: null, error: err };
    }
  },

  // Join fund by code (placeholder for future implementation)
  async joinFundByCode(fundCode: string): Promise<{ data: TravelFund | null; error: any }> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: null, error: 'User not authenticated' };

    console.log('Joining fund with code:', fundCode);

    // For now, return error since fund_code column doesn't exist yet
    return { 
      data: null, 
      error: 'Join by code feature is not yet implemented. Please create your own fund for now.' 
    };

    /* When fund_code column is added to database schema:
    const { data: fund, error } = await supabase
      .from('funds')
      .select('*')
      .eq('fund_code', fundCode)
      .single();

    if (error || !fund) {
      return { data: null, error: 'Fund not found or invalid code' };
    }

    return { data: fund as TravelFund, error: null };
    */
  }
};