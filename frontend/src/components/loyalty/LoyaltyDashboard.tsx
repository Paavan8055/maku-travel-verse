/**
 * Loyalty Program System for MAKU.Travel
 * 
 * Comprehensive loyalty program with points earning, tier management,
 * rewards redemption, and engagement features to increase customer retention.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Gift, 
  Plane, 
  Hotel, 
  Calendar,
  CreditCard,
  Trophy,
  Zap,
  Crown,
  Diamond,
  TrendingUp,
  MapPin,
  Users,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface LoyaltyTier {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  minPoints: number;
  maxPoints: number | null;
  benefits: string[];
  pointsMultiplier: number;
  perks: {
    freeUpgrades: boolean;
    prioritySupport: boolean;
    earlyAccess: boolean;
    loungeAccess: boolean;
    freeChanges: boolean;
    bonusPoints: number;
  };
}

export interface LoyaltyPoints {
  total: number;
  available: number;
  pending: number;
  lifetime: number;
  expiringPoints: number;
  expirationDate: string | null;
}

export interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  amount: number;
  description: string;
  bookingReference?: string;
  date: string;
  expiresAt?: string;
}

export interface Reward {
  id: string;
  category: 'discount' | 'upgrade' | 'experience' | 'merchandise';
  name: string;
  description: string;
  pointsCost: number;
  value: number;
  currency: string;
  availability: 'limited' | 'unlimited';
  remainingQuantity?: number;
  validUntil?: string;
  applicableServices: ('hotel' | 'flight' | 'activity')[];
  isPopular: boolean;
  isFeatured: boolean;
  image?: string;
  terms: string[];
}

export interface LoyaltyProfile {
  userId: string;
  membershipNumber: string;
  currentTier: string;
  points: LoyaltyPoints;
  memberSince: string;
  totalBookings: number;
  totalSpent: number;
  currentStreak: number; // consecutive months with activity
  longestStreak: number;
  achievements: string[];
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    preferredRewardTypes: string[];
  };
}

/**
 * Loyalty Program Configuration
 */
export class LoyaltyProgram {
  
  static readonly TIERS: LoyaltyTier[] = [
    {
      id: 'explorer',
      name: 'Explorer',
      icon: MapPin,
      color: 'bg-gray-500',
      minPoints: 0,
      maxPoints: 2499,
      pointsMultiplier: 1.0,
      benefits: [
        'Earn 1 point per $1 spent',
        'Member-only deals',
        'Email support'
      ],
      perks: {
        freeUpgrades: false,
        prioritySupport: false,
        earlyAccess: false,
        loungeAccess: false,
        freeChanges: false,
        bonusPoints: 0
      }
    },
    {
      id: 'adventurer',
      name: 'Adventurer',
      icon: Star,
      color: 'bg-blue-500',
      minPoints: 2500,
      maxPoints: 9999,
      pointsMultiplier: 1.25,
      benefits: [
        'Earn 1.25 points per $1 spent',
        'Priority email support',
        'Exclusive member deals',
        'Free standard room upgrades (subject to availability)'
      ],
      perks: {
        freeUpgrades: true,
        prioritySupport: true,
        earlyAccess: false,
        loungeAccess: false,
        freeChanges: false,
        bonusPoints: 500
      }
    },
    {
      id: 'elite',
      name: 'Elite',
      icon: Crown,
      color: 'bg-purple-500',
      minPoints: 10000,
      maxPoints: 24999,
      pointsMultiplier: 1.5,
      benefits: [
        'Earn 1.5 points per $1 spent',
        'Priority phone support',
        'Complimentary room upgrades',
        'Early access to sales',
        'Free change/cancellation (up to 24hrs)'
      ],
      perks: {
        freeUpgrades: true,
        prioritySupport: true,
        earlyAccess: true,
        loungeAccess: false,
        freeChanges: true,
        bonusPoints: 1000
      }
    },
    {
      id: 'platinum',
      name: 'Platinum',
      icon: Diamond,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      minPoints: 25000,
      maxPoints: null,
      pointsMultiplier: 2.0,
      benefits: [
        'Earn 2 points per $1 spent',
        'Dedicated concierge service',
        'Guaranteed room upgrades',
        'Airport lounge access',
        'Free changes anytime',
        'Exclusive experiences'
      ],
      perks: {
        freeUpgrades: true,
        prioritySupport: true,
        earlyAccess: true,
        loungeAccess: true,
        freeChanges: true,
        bonusPoints: 2500
      }
    }
  ];

  static readonly REWARDS_CATALOG: Reward[] = [
    // Discount Rewards
    {
      id: 'discount-50',
      category: 'discount',
      name: '$50 Travel Credit',
      description: 'Redeem for $50 off your next booking',
      pointsCost: 5000,
      value: 50,
      currency: 'AUD',
      availability: 'unlimited',
      applicableServices: ['hotel', 'flight', 'activity'],
      isPopular: true,
      isFeatured: false,
      terms: ['Valid for 12 months', 'Cannot be combined with other offers', 'Minimum booking value $100']
    },
    {
      id: 'discount-100',
      category: 'discount',
      name: '$100 Travel Credit',
      description: 'Redeem for $100 off your next booking',
      pointsCost: 9500,
      value: 100,
      currency: 'AUD',
      availability: 'unlimited',
      applicableServices: ['hotel', 'flight', 'activity'],
      isPopular: true,
      isFeatured: true,
      terms: ['Valid for 12 months', 'Cannot be combined with other offers', 'Minimum booking value $200']
    },
    
    // Upgrade Rewards
    {
      id: 'room-upgrade',
      category: 'upgrade',
      name: 'Hotel Room Upgrade',
      description: 'Complimentary upgrade to next room category',
      pointsCost: 3000,
      value: 150,
      currency: 'AUD',
      availability: 'limited',
      remainingQuantity: 50,
      applicableServices: ['hotel'],
      isPopular: true,
      isFeatured: false,
      terms: ['Subject to availability', 'Valid for 6 months', 'Cannot be transferred']
    },
    {
      id: 'flight-upgrade',
      category: 'upgrade',
      name: 'Flight Seat Upgrade',
      description: 'Upgrade to Premium Economy or Business Class',
      pointsCost: 8000,
      value: 400,
      currency: 'AUD',
      availability: 'limited',
      remainingQuantity: 25,
      applicableServices: ['flight'],
      isPopular: false,
      isFeatured: true,
      terms: ['Subject to availability', 'Valid for 3 months', 'Long-haul flights only']
    },
    
    // Experience Rewards
    {
      id: 'spa-treatment',
      category: 'experience',
      name: 'Luxury Spa Treatment',
      description: '90-minute signature spa treatment at partner hotels',
      pointsCost: 6000,
      value: 200,
      currency: 'AUD',
      availability: 'limited',
      remainingQuantity: 30,
      applicableServices: ['hotel'],
      isPopular: false,
      isFeatured: false,
      terms: ['Available at select hotels', 'Valid for 6 months', 'Advance booking required']
    },
    {
      id: 'dining-experience',
      category: 'experience',
      name: 'Fine Dining Experience',
      description: 'Multi-course dinner for two at award-winning restaurants',
      pointsCost: 7500,
      value: 300,
      currency: 'AUD',
      availability: 'limited',
      remainingQuantity: 20,
      applicableServices: ['hotel', 'activity'],
      isPopular: false,
      isFeatured: true,
      terms: ['Available in major cities', 'Valid for 6 months', 'Reservations required']
    },
    
    // Merchandise Rewards
    {
      id: 'luggage-set',
      category: 'merchandise',
      name: 'Premium Luggage Set',
      description: 'High-quality hardcase luggage set with MAKU branding',
      pointsCost: 15000,
      value: 500,
      currency: 'AUD',
      availability: 'limited',
      remainingQuantity: 10,
      applicableServices: ['hotel', 'flight', 'activity'],
      isPopular: false,
      isFeatured: false,
      terms: ['Shipped within 2 weeks', 'Valid for 3 months', '2-year warranty included']
    }
  ];

  /**
   * Calculate points for a booking
   */
  static calculatePointsEarned(bookingValue: number, currentTier: string): number {
    const tier = this.TIERS.find(t => t.id === currentTier) || this.TIERS[0];
    return Math.floor(bookingValue * tier.pointsMultiplier);
  }

  /**
   * Determine tier based on points
   */
  static getTierFromPoints(points: number): LoyaltyTier {
    return this.TIERS
      .reverse()
      .find(tier => points >= tier.minPoints) || this.TIERS[0];
  }

  /**
   * Calculate progress to next tier
   */
  static getTierProgress(points: number): { currentTier: LoyaltyTier; nextTier: LoyaltyTier | null; progress: number; pointsNeeded: number } {
    const currentTier = this.getTierFromPoints(points);
    const currentTierIndex = this.TIERS.findIndex(t => t.id === currentTier.id);
    const nextTier = currentTierIndex < this.TIERS.length - 1 ? this.TIERS[currentTierIndex + 1] : null;
    
    if (!nextTier) {
      return { currentTier, nextTier: null, progress: 100, pointsNeeded: 0 };
    }
    
    const pointsInCurrentTier = points - currentTier.minPoints;
    const pointsRequiredForNextTier = nextTier.minPoints - currentTier.minPoints;
    const progress = (pointsInCurrentTier / pointsRequiredForNextTier) * 100;
    const pointsNeeded = nextTier.minPoints - points;
    
    return { currentTier, nextTier, progress, pointsNeeded };
  }

  /**
   * Get available rewards for user's points
   */
  static getAvailableRewards(userPoints: number): Reward[] {
    return this.REWARDS_CATALOG.filter(reward => 
      reward.pointsCost <= userPoints &&
      (reward.availability === 'unlimited' || (reward.remainingQuantity && reward.remainingQuantity > 0))
    );
  }

  /**
   * Get featured and popular rewards
   */
  static getFeaturedRewards(): { featured: Reward[]; popular: Reward[] } {
    const featured = this.REWARDS_CATALOG.filter(r => r.isFeatured);
    const popular = this.REWARDS_CATALOG.filter(r => r.isPopular);
    return { featured, popular };
  }
}

/**
 * Loyalty Dashboard Component
 */
interface LoyaltyDashboardProps {
  profile: LoyaltyProfile;
  onRedeemReward: (rewardId: string) => void;
  onViewTransactions: () => void;
}

export const LoyaltyDashboard: React.FC<LoyaltyDashboardProps> = ({
  profile,
  onRedeemReward,
  onViewTransactions
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  
  const tierProgress = LoyaltyProgram.getTierProgress(profile.points.total);
  const availableRewards = LoyaltyProgram.getAvailableRewards(profile.points.available);
  const { featured, popular } = LoyaltyProgram.getFeaturedRewards();

  const handleRewardRedeem = (reward: Reward) => {
    if (profile.points.available < reward.pointsCost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.pointsCost - profile.points.available} more points to redeem this reward.`,
        variant: "destructive"
      });
      return;
    }
    
    onRedeemReward(reward.id);
    toast({
      title: "Reward Redeemed",
      description: `Successfully redeemed ${reward.name}!`,
    });
  };

  const renderRewardCard = (reward: Reward) => (
    <Card key={reward.id} className="relative hover:shadow-md transition-all duration-200">
      {reward.isFeatured && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="default" className="rounded-full">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">{reward.name}</h4>
            <p className="text-sm text-muted-foreground">{reward.description}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {reward.pointsCost.toLocaleString()} pts
              </Badge>
              <span className="text-sm text-muted-foreground">
                (~${reward.value} value)
              </span>
            </div>
            
            {reward.availability === 'limited' && reward.remainingQuantity && (
              <Badge variant="secondary" className="text-xs">
                {reward.remainingQuantity} left
              </Badge>
            )}
          </div>
          
          <Button
            onClick={() => handleRewardRedeem(reward)}
            disabled={profile.points.available < reward.pointsCost}
            className="w-full"
            size="sm"
          >
            {profile.points.available >= reward.pointsCost ? 'Redeem' : 'Insufficient Points'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const TierIcon = tierProgress.currentTier.icon;
  const NextTierIcon = tierProgress.nextTier?.icon;

  return (
    <div className="space-y-6">
      {/* Tier Status Card */}
      <Card className={`${tierProgress.currentTier.color} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TierIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{tierProgress.currentTier.name}</h2>
                <p className="text-white/80">Member since {profile.memberSince}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{profile.points.total.toLocaleString()}</div>
              <div className="text-white/80 text-sm">Total Points</div>
            </div>
          </div>
          
          {tierProgress.nextTier && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress to {tierProgress.nextTier.name}</span>
                <span>{tierProgress.pointsNeeded.toLocaleString()} points needed</span>
              </div>
              <Progress value={tierProgress.progress} className="h-2 bg-white/20" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{profile.points.available.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Available Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{profile.totalBookings}</div>
            <div className="text-sm text-muted-foreground">Total Bookings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{profile.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Month Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">${profile.totalSpent.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Lifetime Spent</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Expiring Points Alert */}
          {profile.points.expiringPoints > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-orange-800">Points Expiring Soon</h4>
                    <p className="text-sm text-orange-700">
                      {profile.points.expiringPoints.toLocaleString()} points expire on {profile.points.expirationDate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Featured Rewards */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Featured Rewards</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map(renderRewardCard)}
            </div>
          </div>

          {/* Tier Benefits Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5" />
                <span>Your {tierProgress.currentTier.name} Benefits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {tierProgress.currentTier.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Available Rewards</h3>
            <div className="text-sm text-muted-foreground">
              {profile.points.available.toLocaleString()} points available
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableRewards.map(renderRewardCard)}
          </div>
          
          {availableRewards.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-medium mb-2">No Rewards Available</h4>
                <p className="text-sm text-muted-foreground">
                  Keep earning points to unlock exciting rewards!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="benefits" className="space-y-6">
          <div className="grid gap-6">
            {LoyaltyProgram.TIERS.map(tier => {
              const TierIconComponent = tier.icon;
              const isCurrent = tier.id === tierProgress.currentTier.id;
              
              return (
                <Card key={tier.id} className={`${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className={`p-2 ${tier.color} text-white rounded-lg`}>
                        <TierIconComponent className="h-5 w-5" />
                      </div>
                      <span>{tier.name}</span>
                      {isCurrent && <Badge>Current Tier</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {tier.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {tier.maxPoints ? 
                          `${tier.minPoints.toLocaleString()} - ${tier.maxPoints.toLocaleString()} points` :
                          `${tier.minPoints.toLocaleString()}+ points`
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Button variant="outline" onClick={onViewTransactions}>
              View All Transactions
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">Activity Coming Soon</h4>
              <p className="text-sm text-muted-foreground">
                Your points earning and redemption history will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoyaltyDashboard;