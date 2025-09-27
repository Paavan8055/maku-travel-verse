import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Trophy, 
  Coins, 
  Star, 
  Gift, 
  ChevronDown,
  Sparkles,
  Target,
  Crown,
  Zap,
  Calendar
} from 'lucide-react';

interface RewardsDropdownProps {
  userTier?: string;
  availableRewards?: number;
  activeQuests?: number;
}

const RewardsDropdown: React.FC<RewardsDropdownProps> = ({ 
  userTier = 'Explorer',
  availableRewards = 0,
  activeQuests = 3
}) => {
  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'legend': return Crown;
      case 'adventurer': return Trophy;
      case 'explorer': return Star;
      default: return Target;
    }
  };

  const TierIcon = getTierIcon(userTier);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Trophy className="w-4 h-4 mr-2" />
          <span>Rewards</span>
          <ChevronDown className="w-4 h-4 ml-1" />
          {availableRewards > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 bg-green-500 text-white border-none px-1 min-w-5 h-5 text-xs"
            >
              {availableRewards}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        {/* User Status */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <TierIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{userTier} Tier</p>
              <p className="text-sm text-gray-600">Level up for more rewards</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-3 grid grid-cols-3 gap-2 border-b border-gray-200">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{availableRewards}</div>
            <div className="text-xs text-gray-600">Available</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{activeQuests}</div>
            <div className="text-xs text-gray-600">Active Quests</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">73%</div>
            <div className="text-xs text-gray-600">Next Tier</div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-2">
          <DropdownMenuItem className="cursor-pointer">
            <Trophy className="w-4 h-4 mr-3 text-purple-600" />
            <div className="flex-1">
              <p className="font-medium">My NFT Collection</p>
              <p className="text-xs text-gray-600">View and manage your travel NFTs</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Target className="w-4 h-4 mr-3 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium">Active Quests</p>
              <p className="text-xs text-gray-600">{activeQuests} quests in progress</p>
            </div>
            {activeQuests > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activeQuests}
              </Badge>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Coins className="w-4 h-4 mr-3 text-green-600" />
            <div className="flex-1">
              <p className="font-medium">Airdrop Progress</p>
              <p className="text-xs text-gray-600">Track your tier advancement</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Calendar className="w-4 h-4 mr-3 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium">Upcoming Events</p>
              <p className="text-xs text-gray-600">Summer 2024 airdrop active</p>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Live
            </Badge>
          </DropdownMenuItem>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="text-xs">
              <Gift className="w-3 h-3 mr-1" />
              Claim Rewards
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              View Marketplace
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface EnhancedNavigationProps {
  currentPath?: string;
  userAuthenticated?: boolean;
  userTier?: string;
  availableRewards?: number;
  activeQuests?: number;
}

const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({
  currentPath = '/',
  userAuthenticated = false,
  userTier = 'Explorer',
  availableRewards = 0,
  activeQuests = 3
}) => {
  const navItems = [
    { name: "Smart Dreams", href: "/smart-dreams", icon: Sparkles },
    { name: "Partners", href: "/partners", icon: Star },
    { name: "AI Intelligence", href: "/ai-intelligence", icon: Zap }
  ];

  return (
    <nav className="flex items-center space-x-6">
      {/* Standard Navigation */}
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = currentPath === item.href;
        
        return (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-orange-100 text-orange-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <IconComponent className="w-4 h-4" />
            <span className="font-medium">{item.name}</span>
          </a>
        );
      })}

      {/* Enhanced Rewards Dropdown */}
      {userAuthenticated && (
        <RewardsDropdown 
          userTier={userTier}
          availableRewards={availableRewards}
          activeQuests={activeQuests}
        />
      )}

      {/* Quick Action Buttons */}
      <div className="flex items-center space-x-2">
        {!userAuthenticated ? (
          <>
            <Button variant="ghost" size="sm">
              <Gift className="w-4 h-4 mr-2" />
              Join Rewards
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
              Get Started
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline">
            <Coins className="w-4 h-4 mr-2" />
            {availableRewards} Credits
          </Button>
        )}
      </div>
    </nav>
  );
};

export { EnhancedNavigation, RewardsDropdown };