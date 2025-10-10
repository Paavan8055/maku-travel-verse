import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { travelFundClient, TravelFund } from '@/lib/travelFundClient';

interface FundIntegrationData {
  smartDreamsIntegration: {
    connectedDreams: any[];
    autoCreatedFunds: any[];
  };
  nftRewards: {
    availableRewards: any[];
    claimedRewards: any[];
    milestones: any[];
  };
  biddingIntegration: {
    lockedFunds: any[];
    activeBids: any[];
    bidHistory: any[];
  };
  checkoutIntegration: {
    recentUsage: any[];
    smartSuggestions: any[];
  };
}

interface EnhancedFundStats {
  totalValue: number;
  totalFunds: number;
  completedGoals: number;
  nftRewardsEarned: number;
  contributionStreak: number;
  socialEngagementScore: number;
  bidSuccessRate: number;
}

export const useEnhancedTravelFunds = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [funds, setFunds] = useState<TravelFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [integrationData, setIntegrationData] = useState<FundIntegrationData | null>(null);
  const [enhancedStats, setEnhancedStats] = useState<EnhancedFundStats | null>(null);

  // Fetch enhanced fund data with all integrations
  const fetchEnhancedFundData = useCallback(async () => {
    if (!user) {
      setFunds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch basic fund data
      const { data: fundData, error: fundError } = await travelFundClient.getUserFunds();
      if (fundError) throw fundError;

      setFunds(fundData || []);

      // Fetch integration data (mock implementation)
      const integrationResponse = await fetch(`/api/travel-funds/integration-data`, {
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });

      if (integrationResponse.ok) {
        const integration = await integrationResponse.json();
        setIntegrationData(integration);
      }

      // Fetch enhanced stats
      const statsResponse = await fetch(`/api/travel-funds/enhanced-stats`, {
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setEnhancedStats(stats);
      }

    } catch (error) {
      console.error('Error fetching enhanced fund data:', error);
      toast({
        title: "Error",
        description: "Failed to load enhanced fund data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Create fund with Smart Dreams integration
  const createFundFromDream = useCallback(async (dreamData: {
    destination: string;
    estimatedCost: number;
    dreamName: string;
    companions: number;
    travelDates?: { start: Date; end: Date; };
  }) => {
    try {
      const fundData = {
        name: `${dreamData.dreamName} 2025`,
        description: `AI-generated savings plan for ${dreamData.destination} adventure`,
        target_amount: dreamData.estimatedCost,
        destination: dreamData.destination,
        fund_type: dreamData.companions > 0 ? 'group' : 'personal' as const,
        deadline: dreamData.travelDates?.start.toISOString().split('T')[0] || 
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        smart_dreams_integration: {
          source: 'smart_dreams',
          dream_data: dreamData,
          created_at: new Date().toISOString()
        }
      };

      const result = await travelFundClient.createFund(fundData);
      
      if (result.data) {
        toast({
          title: "Dream fund created!",
          description: `Your ${dreamData.destination} savings journey begins now`,
        });
        fetchEnhancedFundData(); // Refresh data
        return result.data;
      }
      
      throw new Error(result.error);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create dream fund",
        variant: "destructive"
      });
      return null;
    }
  }, [toast, fetchEnhancedFundData]);

  // Lock funds for bidding
  const lockFundsForBidding = useCallback(async (bidData: {
    fundAllocations: Array<{ fundId: string; amount: number; }>;
    bidAmount: number;
    dealId: string;
    lockDuration: number;
  }) => {
    try {
      const lockPromises = bidData.fundAllocations.map(allocation =>
        fetch(`/api/travel-funds/${allocation.fundId}/bidding/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: allocation.amount,
            bid_id: bidData.dealId,
            lock_duration: bidData.lockDuration
          })
        })
      );

      const results = await Promise.all(lockPromises);
      const allSuccessful = results.every(r => r.ok);

      if (allSuccessful) {
        toast({
          title: "Funds locked for bidding",
          description: `$${bidData.bidAmount} secured for your bid`,
        });
        fetchEnhancedFundData(); // Refresh data
        return true;
      } else {
        throw new Error('Some fund locks failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lock funds for bidding",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, fetchEnhancedFundData]);

  // Process bid win/loss
  const processBidResult = useCallback(async (bidId: string, won: boolean, finalPrice?: number) => {
    try {
      const endpoint = won ? 'process-win' : 'release-locks';
      const response = await fetch(`/api/travel-funds/bidding/${bidId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_price: finalPrice })
      });

      if (response.ok) {
        toast({
          title: won ? "Bid won!" : "Bid unsuccessful",
          description: won 
            ? `Congratulations! Your bid of $${finalPrice} won the deal`
            : "Your funds have been released back to your account",
          variant: won ? "default" : "destructive"
        });
        fetchEnhancedFundData(); // Refresh data
      }
    } catch (error) {
      console.error('Error processing bid result:', error);
    }
  }, [toast, fetchEnhancedFundData]);

  // Mint milestone NFT
  const mintMilestoneNFT = useCallback(async (fundId: string, milestoneType: string) => {
    try {
      const response = await fetch(`/api/travel-funds/${fundId}/nft/mint-milestone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone_type: milestoneType })
      });

      if (response.ok) {
        const nftData = await response.json();
        toast({
          title: "NFT Minted!",
          description: `Your ${milestoneType} NFT has been added to your collection`,
        });
        return nftData;
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
    return null;
  }, [toast]);

  // Get smart fund suggestions for checkout
  const getCheckoutSuggestions = useCallback(async (bookingData: {
    destination: string;
    amount: number;
    type: string;
  }) => {
    try {
      const response = await fetch('/api/travel-funds/checkout/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting checkout suggestions:', error);
    }
    return [];
  }, []);

  useEffect(() => {
    fetchEnhancedFundData();
  }, [fetchEnhancedFundData]);

  return {
    // Basic fund data
    funds,
    loading,
    integrationData,
    enhancedStats,
    
    // Enhanced functions
    createFundFromDream,
    lockFundsForBidding,
    processBidResult,
    mintMilestoneNFT,
    getCheckoutSuggestions,
    
    // Utilities
    refetchData: fetchEnhancedFundData,
    totalFundBalance: funds.reduce((total, fund) => total + fund.balance, 0),
    activeFundsCount: funds.filter(fund => fund.target_amount > fund.balance).length
  };
};

export default useEnhancedTravelFunds;