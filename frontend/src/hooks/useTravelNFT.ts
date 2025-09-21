import { useState, useEffect } from 'react';

interface TravelNFTMetadata {
  destination: string;
  provider: string;
  booking_value: number;
  trip_date: string;
  experience_type: string;
  rarity_score: number;
}

interface TravelNFT {
  id: string;
  token_id: number;
  name: string;
  image: string;
  metadata: TravelNFTMetadata;
  blockchain: 'cronos' | 'bsc' | 'ethereum';
  contract_address: string;
  owner: string;
  minted_at: string;
  rewards: {
    platform_credits: number;
    priority_access: boolean;
    exclusive_offers: boolean;
    discount_percentage: number;
  };
}

interface AirdropEligibility {
  total_points: number;
  tier: string;
  estimated_allocation: number;
  completion_percentage: number;
  next_milestone: {
    points_needed: number;
    tier_name: string;
    additional_benefits: string[];
  };
}

interface UseTravelNFTReturn {
  userNFTs: TravelNFT[];
  airdropEligibility: AirdropEligibility | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  mintTravelNFT: (bookingData: any) => Promise<boolean>;
  claimAirdropRewards: () => Promise<boolean>;
}

export const useTravelNFT = (userId?: string): UseTravelNFTReturn => {
  const [userNFTs, setUserNFTs] = useState<TravelNFT[]>([]);
  const [airdropEligibility, setAirdropEligibility] = useState<AirdropEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserNFTs = async () => {
    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 
                         process.env.REACT_APP_BACKEND_URL || 
                         "https://travel-portal-dev.preview.emergentagent.com";

      // First check if blockchain endpoints are available
      const healthResponse = await fetch(`${backendUrl}/api/blockchain/networks`);
      if (!healthResponse.ok) {
        throw new Error('Blockchain services not available');
      }

      // Mock NFT data for now since smart contracts aren't deployed yet
      setUserNFTs([
        {
          id: 'travel_nft_001',
          token_id: 1001,
          name: 'Santorini Sunset Collection',
          image: '/api/placeholder/400/600',
          metadata: {
            destination: 'Santorini, Greece',
            provider: 'expedia',
            booking_value: 1500,
            trip_date: '2024-06-15',
            experience_type: 'luxury_resort',
            rarity_score: 85
          },
          blockchain: 'cronos',
          contract_address: '0x742d35Cc6346C4C75eE21F7bA0C9a3De5C4B6aAe',
          owner: userId || 'user_123',
          minted_at: '2024-06-20T10:30:00Z',
          rewards: {
            platform_credits: 200,
            priority_access: true,
            exclusive_offers: true,
            discount_percentage: 15
          }
        },
        {
          id: 'travel_nft_002',
          token_id: 1002,
          name: 'Tokyo Cultural Master',
          image: '/api/placeholder/400/600',
          metadata: {
            destination: 'Tokyo, Japan',
            provider: 'amadeus',
            booking_value: 1200,
            trip_date: '2024-04-10',
            experience_type: 'cultural_immersion',
            rarity_score: 72
          },
          blockchain: 'cronos',
          contract_address: '0x742d35Cc6346C4C75eE21F7bA0C9a3De5C4B6aAe',
          owner: userId || 'user_123',
          minted_at: '2024-04-15T14:20:00Z',
          rewards: {
            platform_credits: 150,
            priority_access: false,
            exclusive_offers: true,
            discount_percentage: 10
          }
        }
      ]);

    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NFT data');
    }
  };

  const fetchAirdropEligibility = async () => {
    try {
      // Calculate based on user activity and NFT holdings
      const totalCredits = userNFTs.reduce((acc, nft) => acc + nft.rewards.platform_credits, 0);
      const bookingValue = userNFTs.reduce((acc, nft) => acc + nft.metadata.booking_value, 0);
      
      // Points calculation based on activity
      const basePoints = Math.floor(bookingValue / 10); // 1 point per $10 spent
      const nftBonus = userNFTs.length * 50; // 50 points per NFT
      const providerBonus = [...new Set(userNFTs.map(nft => nft.metadata.provider))].length * 100; // 100 points per unique provider
      
      const totalPoints = basePoints + nftBonus + providerBonus;
      
      // Determine tier
      let tier = 'Wanderer';
      if (totalPoints >= 1000) tier = 'Legend';
      else if (totalPoints >= 500) tier = 'Adventurer';
      else if (totalPoints >= 200) tier = 'Explorer';

      // Calculate next milestone
      let nextMilestone = { points_needed: 200 - totalPoints, tier_name: 'Explorer', additional_benefits: ['10% credits', 'Priority support'] };
      if (totalPoints >= 200) nextMilestone = { points_needed: 500 - totalPoints, tier_name: 'Adventurer', additional_benefits: ['15% credits', 'Exclusive offers'] };
      if (totalPoints >= 500) nextMilestone = { points_needed: 1000 - totalPoints, tier_name: 'Legend', additional_benefits: ['25% credits', 'VIP treatment'] };
      if (totalPoints >= 1000) nextMilestone = { points_needed: 0, tier_name: 'Legend', additional_benefits: ['Maximum benefits'] };

      setAirdropEligibility({
        total_points: totalPoints,
        tier,
        estimated_allocation: Math.floor(totalPoints * 2.5),
        completion_percentage: Math.min(100, (totalPoints / 1000) * 100),
        next_milestone: nextMilestone
      });

    } catch (err) {
      console.error('Error calculating airdrop eligibility:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate eligibility');
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchUserNFTs(),
        fetchAirdropEligibility()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const mintTravelNFT = async (bookingData: any): Promise<boolean> => {
    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 
                         process.env.REACT_APP_BACKEND_URL || 
                         "https://travel-portal-dev.preview.emergentagent.com";

      // Call smart contract deployment endpoint to simulate NFT minting
      const response = await fetch(`${backendUrl}/api/blockchain/smart-contracts/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token' // In production, use real auth
        },
        body: JSON.stringify({
          contract_type: 'travel_nft',
          network: 'cronos',
          metadata: {
            booking_id: bookingData.booking_id,
            destination: bookingData.destination,
            provider: bookingData.provider,
            booking_value: bookingData.total_price,
            experience_type: bookingData.type
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('NFT minting initiated:', result);
        await refreshData(); // Refresh data after minting
        return true;
      } else {
        throw new Error('Failed to mint NFT');
      }
    } catch (err) {
      console.error('Error minting NFT:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint NFT');
      return false;
    }
  };

  const claimAirdropRewards = async (): Promise<boolean> => {
    try {
      // Simulate claiming airdrop rewards
      console.log('Claiming airdrop rewards for tier:', airdropEligibility?.tier);
      return true;
    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim rewards');
      return false;
    }
  };

  useEffect(() => {
    refreshData();
  }, [userId]);

  return {
    userNFTs,
    airdropEligibility,
    isLoading,
    error,
    refreshData,
    mintTravelNFT,
    claimAirdropRewards
  };
};

export default useTravelNFT;