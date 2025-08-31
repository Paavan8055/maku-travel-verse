import { useState, useEffect } from 'react';
import { travelFundClient, TravelFund } from '@/lib/travelFundClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useTravelFunds = () => {
  const [funds, setFunds] = useState<TravelFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFunds = async () => {
    if (!user) {
      setFunds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await travelFundClient.getUserFunds();
      
      if (error) throw error;
      
      setFunds(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching travel funds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch travel funds');
      toast({
        title: "Error",
        description: "Failed to load travel funds. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFund = async (fundData: {
    name: string;
    description?: string;
    target_amount: number;
    currency?: string;
    fund_type: 'personal' | 'group' | 'family';
    deadline?: string;
    destination?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await travelFundClient.createFund(fundData);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Travel fund created successfully!",
        variant: "default"
      });
      
      fetchFunds(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error creating travel fund:', err);
      toast({
        title: "Error",
        description: "Failed to create travel fund. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const addFunds = async (fundId: string, amount: number, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await travelFundClient.addFunds(fundId, amount, description);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `$${amount} added to fund successfully!`,
        variant: "default"
      });
      
      fetchFunds(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error adding funds:', err);
      toast({
        title: "Error",
        description: "Failed to add funds. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const joinFundByCode = async (fundCode: string) => {
    if (!user) return null;

    try {
      const { data, error } = await travelFundClient.joinFundByCode(fundCode);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Successfully joined the travel fund!",
        variant: "default"
      });
      
      fetchFunds(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error joining fund:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to join fund. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [user]);

  return {
    funds,
    loading,
    error,
    createFund,
    addFunds,
    joinFundByCode,
    refetch: fetchFunds
  };
};