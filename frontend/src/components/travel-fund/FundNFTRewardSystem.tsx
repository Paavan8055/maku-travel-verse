import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Trophy, 
  Star, 
  Crown, 
  Zap, 
  Gift, 
  Sparkles, 
  Target,
  Users,
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NFTReward {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  artwork_url?: string;
  milestone_type: 'progress' | 'contribution' | 'social' | 'achievement';
  unlock_threshold: number;
  current_progress: number;
  unlocked: boolean;
  claimed: boolean;
  unlock_date?: Date;
}

interface FundMilestone {
  percentage: number;
  title: string;
  description: string;
  nft_reward: NFTReward;
  reached: boolean;
  reached_date?: Date;
}

interface FundNFTRewardSystemProps {
  fundId: string;
  fundName: string;
  currentAmount: number;
  targetAmount: number;
  contributorCount: number;
  createdDate: Date;
  onNFTMinted: (nft: NFTReward) => void;
  onViewCollection: () => void;
}

export const FundNFTRewardSystem: React.FC<FundNFTRewardSystemProps> = ({
  fundId,
  fundName,
  currentAmount,
  targetAmount,
  contributorCount,
  createdDate,
  onNFTMinted,
  onViewCollection
}) => {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<FundMilestone[]>([]);
  const [availableNFTs, setAvailableNFTs] = useState<NFTReward[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newlyUnlockedNFT, setNewlyUnlockedNFT] = useState<NFTReward | null>(null);

  const progressPercentage = (currentAmount / targetAmount) * 100;

  // Initialize milestone NFT rewards
  useEffect(() => {
    const initializeMilestones = () => {
      const milestoneConfig = [
        {
          percentage: 25,
          title: "Dream Starter",
          description: "You've taken the first big step toward your dream!",
          nft_reward: {
            id: `${fundId}-milestone-25`,
            title: "Dream Starter NFT",
            description: `Commemorates reaching 25% of your ${fundName} goal`,
            icon: "🎯",
            rarity: 'common' as const,
            milestone_type: 'progress' as const,
            unlock_threshold: 25,
            current_progress: progressPercentage,
            unlocked: progressPercentage >= 25,
            claimed: false
          }
        },
        {
          percentage: 50,
          title: "Halfway Hero",
          description: "You're halfway to making your dream a reality!",
          nft_reward: {
            id: `${fundId}-milestone-50`,
            title: "Halfway Hero NFT",
            description: `Commemorates reaching 50% of your ${fundName} goal`,
            icon: "🚀",
            rarity: 'rare' as const,
            milestone_type: 'progress' as const,
            unlock_threshold: 50,
            current_progress: progressPercentage,
            unlocked: progressPercentage >= 50,
            claimed: false
          }
        },
        {
          percentage: 75,
          title: "Almost There Champion",
          description: "The finish line is in sight! Keep going!",
          nft_reward: {
            id: `${fundId}-milestone-75`,
            title: "Almost There NFT",
            description: `Commemorates reaching 75% of your ${fundName} goal`,
            icon: "⚡",
            rarity: 'epic' as const,
            milestone_type: 'progress' as const,
            unlock_threshold: 75,
            current_progress: progressPercentage,
            unlocked: progressPercentage >= 75,
            claimed: false
          }
        },
        {
          percentage: 100,
          title: "Goal Crusher",
          description: "Congratulations! Your dream is now within reach!",
          nft_reward: {
            id: `${fundId}-milestone-100`,
            title: "Goal Crusher NFT",
            description: `Commemorates completing your ${fundName} savings goal`,
            icon: "🏆",
            rarity: 'legendary' as const,
            milestone_type: 'achievement' as const,
            unlock_threshold: 100,
            current_progress: progressPercentage,
            unlocked: progressPercentage >= 100,
            claimed: false
          }
        }
      ];

      const milestonesWithStatus = milestoneConfig.map(config => ({
        ...config,
        reached: progressPercentage >= config.percentage,
        reached_date: progressPercentage >= config.percentage ? new Date() : undefined
      }));

      setMilestones(milestonesWithStatus);

      // Check for newly unlocked NFTs
      const newlyUnlocked = milestonesWithStatus
        .filter(m => m.reached && m.nft_reward.unlocked && !m.nft_reward.claimed)
        .map(m => m.nft_reward);

      setAvailableNFTs(newlyUnlocked);
    };

    initializeMilestones();
  }, [fundId, fundName, progressPercentage, targetAmount]);

  // Handle automatic NFT minting when milestones are reached
  useEffect(() => {
    const checkForNewMilestones = async () => {
      const newlyUnlocked = milestones
        .filter(m => m.reached && m.nft_reward.unlocked && !m.nft_reward.claimed)
        .map(m => m.nft_reward);

      if (newlyUnlocked.length > 0) {
        const latestNFT = newlyUnlocked[newlyUnlocked.length - 1];
        setNewlyUnlockedNFT(latestNFT);
        setShowCelebration(true);
        onNFTMinted(latestNFT);
      }
    };

    checkForNewMilestones();
  }, [milestones, onNFTMinted]);

  const handleClaimNFT = async (nftId: string) => {
    try {
      // Mock NFT claiming (in real implementation, call backend API)
      const response = await fetch(`/api/travel-funds/${fundId}/nft/mint-milestone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nft_id: nftId })
      });

      if (response.ok) {
        toast({
          title: "NFT Claimed!",
          description: "Your milestone NFT has been added to your collection",
        });

        // Update NFT status
        setAvailableNFTs(prev => 
          prev.map(nft => 
            nft.id === nftId ? { ...nft, claimed: true } : nft
          )
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim NFT. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600';
      case 'rare': return 'from-blue-500 to-blue-600';
      case 'epic': return 'from-purple-500 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-yellow-300';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Milestone Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            NFT Milestone Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {milestones.map((milestone) => {
              const IconComponent = milestone.reached ? Trophy : Target;
              return (
                <div key={milestone.percentage} className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    milestone.reached 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <span className="text-2xl">{milestone.nft_reward.icon}</span>
                  </div>
                  <p className="text-sm font-medium">{milestone.percentage}%</p>
                  <p className="text-xs text-gray-600">{milestone.title}</p>
                  {milestone.reached && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Unlocked
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Available NFT Rewards */}
      {availableNFTs.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Gift className="h-5 w-5" />
              NFT Rewards Ready to Claim!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableNFTs.map((nft) => (
                <div key={nft.id} className={`p-4 bg-white rounded-lg border-2 ${getRarityBorder(nft.rarity)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRarityColor(nft.rarity)} flex items-center justify-center`}>
                        <span className="text-xl">{nft.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{nft.title}</h4>
                        <p className="text-sm text-gray-600">{nft.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`bg-gradient-to-r ${getRarityColor(nft.rarity)} text-white text-xs`}>
                            {nft.rarity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Milestone: {nft.unlock_threshold}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleClaimNFT(nft.id)}
                      disabled={nft.claimed}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      {nft.claimed ? 'Claimed' : 'Mint NFT'}
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                onClick={onViewCollection}
                className="w-full"
              >
                View Full NFT Collection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Celebration Modal */}
      {showCelebration && newlyUnlockedNFT && (
        <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center p-6">
              {/* Celebration Animation */}
              <div className="text-8xl animate-bounce mb-4">🎉</div>
              
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Milestone Achieved!
              </h2>
              
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${getRarityColor(newlyUnlockedNFT.rarity)} flex items-center justify-center`}>
                <span className="text-3xl">{newlyUnlockedNFT.icon}</span>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{newlyUnlockedNFT.title}</h3>
              <p className="text-gray-600 mb-4">{newlyUnlockedNFT.description}</p>
              
              <div className="flex justify-center gap-2 mb-6">
                <Badge className={`bg-gradient-to-r ${getRarityColor(newlyUnlockedNFT.rarity)} text-white`}>
                  {newlyUnlockedNFT.rarity.toUpperCase()} NFT
                </Badge>
                <Badge variant="outline">
                  Milestone Reward
                </Badge>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => handleClaimNFT(newlyUnlockedNFT.id)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Claim My NFT
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowCelebration(false)}
                  className="w-full"
                >
                  Celebrate Later
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Additional NFT reward types for Travel Funds
export const FUND_NFT_TEMPLATES = {
  // Progress Milestones
  DREAM_STARTER: {
    title: "Dream Starter",
    description: "First 25% of travel fund goal reached",
    icon: "🎯",
    rarity: 'common',
    artwork_attributes: ['sunset_colors', 'journey_beginning', 'first_step']
  },
  
  HALFWAY_HERO: {
    title: "Halfway Hero", 
    description: "50% milestone achieved - halfway to your dream!",
    icon: "🚀",
    rarity: 'rare',
    artwork_attributes: ['mountain_peak', 'progress_path', 'determination']
  },
  
  ALMOST_THERE: {
    title: "Almost There Champion",
    description: "75% complete - your dream is within reach!",
    icon: "⚡",
    rarity: 'epic',
    artwork_attributes: ['lightning_energy', 'final_push', 'near_victory']
  },
  
  GOAL_CRUSHER: {
    title: "Goal Crusher",
    description: "100% savings goal achieved - dream unlocked!",
    icon: "🏆", 
    rarity: 'legendary',
    artwork_attributes: ['golden_achievement', 'dream_realized', 'victory_celebration']
  },
  
  // Contribution Rewards
  FIRST_CONTRIBUTOR: {
    title: "Fund Pioneer",
    description: "First person to contribute to this travel fund",
    icon: "🌟",
    rarity: 'rare',
    artwork_attributes: ['pioneer_spirit', 'first_contribution', 'leadership']
  },
  
  TOP_CONTRIBUTOR: {
    title: "Travel Fund Champion",
    description: "Largest contributor to this travel fund",
    icon: "👑",
    rarity: 'epic',
    artwork_attributes: ['golden_crown', 'generosity', 'fund_leader']
  },
  
  STREAK_MASTER: {
    title: "Consistent Saver",
    description: "Maintained 30-day contribution streak",
    icon: "🔥",
    rarity: 'epic',
    artwork_attributes: ['flame_streak', 'consistency', 'discipline']
  },
  
  // Social Rewards
  FUND_CREATOR: {
    title: "Dream Architect",
    description: "Created their first collaborative travel fund", 
    icon: "🏗️",
    rarity: 'rare',
    artwork_attributes: ['blueprint', 'creation', 'vision']
  },
  
  INVITE_MASTER: {
    title: "Community Builder",
    description: "Successfully invited 10+ people to travel funds",
    icon: "🌐",
    rarity: 'epic', 
    artwork_attributes: ['network_connections', 'community', 'social_influence']
  }
};

export default FundNFTRewardSystem;