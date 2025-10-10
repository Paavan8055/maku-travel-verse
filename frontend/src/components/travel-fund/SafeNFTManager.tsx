import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift, Eye, Sparkles } from 'lucide-react';

interface SafeNFTProps {
  funds: any[];
  onNFTClaimed: (nftId: string) => void;
  onViewCollection: () => void;
}

export const SafeNFTManager: React.FC<SafeNFTProps> = ({
  funds,
  onNFTClaimed,
  onViewCollection
}) => {
  try {
    // Safe calculations
    const totalNFTs = funds?.reduce((count, fund) => {
      const progress = fund?.target_amount > 0 ? (fund?.balance / fund?.target_amount) * 100 : 0;
      return count + Math.floor(progress / 25); // 1 NFT per 25% milestone
    }, 0) || 0;

    const availableNFTs = funds?.filter(fund => {
      const progress = fund?.target_amount > 0 ? (fund?.balance / fund?.target_amount) * 100 : 0;
      return progress >= 25;
    }).length || 0;

    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Gift className="h-5 w-5" />
            NFT Milestone Rewards
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* NFT Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <p className="text-lg font-bold text-purple-600">{totalNFTs}</p>
              <p className="text-xs text-purple-700">NFTs Earned</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-pink-200">
              <p className="text-lg font-bold text-pink-600">{availableNFTs}</p>
              <p className="text-xs text-pink-700">Available</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-orange-200">
              <p className="text-lg font-bold text-orange-600">4</p>
              <p className="text-xs text-orange-700">Milestones</p>
            </div>
          </div>

          {/* Milestone Progress */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Milestone Progress</h4>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((milestone) => {
                const reached = funds?.some(fund => {
                  const progress = fund?.target_amount > 0 ? (fund?.balance / fund?.target_amount) * 100 : 0;
                  return progress >= milestone;
                }) || false;

                return (
                  <div key={milestone} className="text-center">
                    <div className={`w-10 h-10 mx-auto mb-1 rounded-full flex items-center justify-center ${
                      reached 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {reached ? '🏆' : '🎯'}
                    </div>
                    <p className="text-xs">{milestone}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Rewards */}
          {availableNFTs > 0 && (
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">Rewards Ready!</span>
                <Badge className="bg-purple-500 text-white text-xs">
                  {availableNFTs} NFTs
                </Badge>
              </div>
              <p className="text-xs text-purple-600 mb-3">
                You've earned NFT rewards for reaching fund milestones
              </p>
              <Button
                onClick={() => onNFTClaimed('milestone_nft')}
                size="sm"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Gift className="h-3 w-3 mr-2" />
                Claim NFT Rewards
              </Button>
            </div>
          )}

          {/* View Collection Button */}
          <Button
            onClick={onViewCollection}
            variant="outline"
            className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            View NFT Collection
          </Button>
        </CardContent>
      </Card>
    );
  } catch (error) {
    // Ultra-safe fallback
    return (
      <Card className="border-purple-200">
        <CardContent className="p-4 text-center">
          <Gift className="h-8 w-8 mx-auto mb-2 text-purple-500" />
          <h3 className="font-semibold mb-2">NFT Rewards</h3>
          <p className="text-sm text-gray-600 mb-3">Earn NFTs by reaching fund milestones</p>
          <Button onClick={onViewCollection} size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
            View Collection
          </Button>
        </CardContent>
      </Card>
    );
  }
};

export default SafeNFTManager;