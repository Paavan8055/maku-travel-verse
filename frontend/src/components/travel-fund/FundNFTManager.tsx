import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Trophy, 
  Star, 
  Crown, 
  Gift, 
  Sparkles,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NFTReward {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  fundId: string;
  milestoneType: string;
  artworkUrl?: string;
  unlocked: boolean;
  claimed: boolean;
  unlockedAt?: Date;
}

interface FundNFTManagerProps {
  funds: any[];
  onNFTClaimed: (nftId: string) => void;
  onViewCollection: () => void;
}

export const FundNFTManager: React.FC<FundNFTManagerProps> = ({
  funds,
  onNFTClaimed,
  onViewCollection
}) => {
  const { toast } = useToast();
  const [availableNFTs, setAvailableNFTs] = useState<NFTReward[]>([]);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTReward | null>(null);

  // Generate NFT rewards based on fund progress
  useEffect(() => {
    const nftRewards: NFTReward[] = [];

    funds.forEach((fund) => {
      const progressPercentage = (fund.balance / fund.target_amount) * 100;

      // Progress milestone NFTs
      const milestones = [
        { threshold: 25, title: 'Dream Starter', icon: '🎯', rarity: 'common' as const },
        { threshold: 50, title: 'Halfway Hero', icon: '🚀', rarity: 'rare' as const },
        { threshold: 75, title: 'Almost There', icon: '⚡', rarity: 'epic' as const },
        { threshold: 100, title: 'Goal Crusher', icon: '🏆', rarity: 'legendary' as const }
      ];

      milestones.forEach((milestone) => {
        if (progressPercentage >= milestone.threshold) {
          nftRewards.push({
            id: `${fund.id}_milestone_${milestone.threshold}`,
            title: `${milestone.title} NFT`,
            description: `Commemorates reaching ${milestone.threshold}% of your ${fund.name} goal`,
            icon: milestone.icon,
            rarity: milestone.rarity,
            fundId: fund.id,
            milestoneType: `${milestone.threshold}_percent`,
            unlocked: true,
            claimed: false, // In real implementation, this would come from API
            unlockedAt: new Date()
          });
        }
      });
    });

    setAvailableNFTs(nftRewards);
  }, [funds]);

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

  const handleClaimNFT = async (nft: NFTReward) => {
    try {
      // Call backend API to mint NFT
      const response = await fetch(`/api/travel-funds/${nft.fundId}/nft/mint-milestone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone_type: nft.milestoneType })
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "NFT Minted! 🎉",
          description: `Your ${nft.title} has been added to your collection`,
        });

        // Update NFT status
        setAvailableNFTs(prev => 
          prev.map(n => 
            n.id === nft.id ? { ...n, claimed: true } : n
          )
        );

        onNFTClaimed(nft.id);
        setSelectedNFT(nft);
        setShowNFTModal(true);
      }
    } catch (error) {
      toast({
        title: "Minting failed",
        description: "Failed to mint NFT. Please try again.",
        variant: "destructive"
      });
    }
  };

  const unclaimedNFTs = availableNFTs.filter(nft => !nft.claimed);

  return (
    <div className="space-y-6">
      {/* NFT Rewards Overview */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            NFT Collection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-600">{availableNFTs.length}</p>
              <p className="text-xs text-yellow-700">NFTs Earned</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-600">{unclaimedNFTs.length}</p>
              <p className="text-xs text-purple-700">Ready to Claim</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">
                {availableNFTs.filter(nft => nft.rarity === 'legendary').length}
              </p>
              <p className="text-xs text-green-700">Legendary</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((availableNFTs.filter(nft => nft.claimed).length / availableNFTs.length) * 100) || 0}%
              </p>
              <p className="text-xs text-blue-700">Claimed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available NFT Rewards */}
      {unclaimedNFTs.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Gift className="h-5 w-5" />
              NFT Rewards Ready to Claim! ({unclaimedNFTs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unclaimedNFTs.slice(0, 4).map((nft) => (
                <div key={nft.id} className={`p-4 bg-white rounded-xl border-2 ${getRarityBorder(nft.rarity)} shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRarityColor(nft.rarity)} flex items-center justify-center shadow-lg`}>
                        <span className="text-xl">{nft.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{nft.title}</h4>
                        <Badge className={`bg-gradient-to-r ${getRarityColor(nft.rarity)} text-white text-xs mt-1`}>
                          {nft.rarity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{nft.description}</p>
                  
                  <Button
                    onClick={() => handleClaimNFT(nft)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Mint NFT
                  </Button>
                </div>
              ))}
            </div>
            
            {availableNFTs.length > 4 && (
              <Button 
                variant="outline" 
                onClick={onViewCollection}
                className="w-full mt-4 border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Collection ({availableNFTs.length} Total)
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Milestone Progress Tracker */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            Milestone Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funds.map((fund) => {
              const progress = (fund.balance / fund.target_amount) * 100;
              return (
                <div key={fund.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{fund.name}</h4>
                    <span className="text-sm font-bold text-orange-600">{Math.round(progress)}%</span>
                  </div>
                  
                  {/* Milestone markers */}
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                    
                    {/* Milestone indicators */}
                    {[25, 50, 75, 100].map((milestone) => (
                      <div
                        key={milestone}
                        className={`
                          absolute top-0 w-1 h-full
                          ${progress >= milestone ? 'bg-yellow-400' : 'bg-gray-400'}
                        `}
                        style={{ left: `${milestone}%` }}
                      />
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>Goal</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* NFT Celebration Modal */}
      {showNFTModal && selectedNFT && (
        <Dialog open={showNFTModal} onOpenChange={setShowNFTModal}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center p-6">
              {/* Celebration Animation */}
              <div className="text-8xl animate-bounce mb-4">🎉</div>
              
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                NFT Minted Successfully!
              </h2>
              
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${getRarityColor(selectedNFT.rarity)} flex items-center justify-center shadow-xl`}>
                <span className="text-3xl">{selectedNFT.icon}</span>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{selectedNFT.title}</h3>
              <p className="text-gray-600 mb-4">{selectedNFT.description}</p>
              
              <Badge className={`bg-gradient-to-r ${getRarityColor(selectedNFT.rarity)} text-white mb-6`}>
                {selectedNFT.rarity.toUpperCase()} RARITY
              </Badge>
              
              <div className="space-y-3">
                <Button
                  onClick={onViewCollection}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View in Collection
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowNFTModal(false)}
                  className="w-full"
                >
                  Continue Saving
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FundNFTManager;