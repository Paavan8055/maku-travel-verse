import React, { useState, useEffect } from 'react';
import { Crown, Star, Gift, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { loyaltyAPI } from '@/lib/otaDataClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import logger from "@/utils/logger";

interface LoyaltyWidgetProps {
  className?: string;
  compact?: boolean;
}

interface LoyaltyData {
  total_points: number;
  current_tier: string;
  points_to_next_tier: number;
  lifetime_points: number;
}

interface TierInfo {
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  benefits: string[];
  threshold: number;
}

const TIERS: Record<string, TierInfo> = {
  Explorer: {
    name: 'Explorer',
    icon: Star,
    color: 'bg-gray-500',
    benefits: ['5% off bookings', 'Free cancellation'],
    threshold: 0
  },
  Adventurer: {
    name: 'Adventurer',
    icon: Zap,
    color: 'bg-blue-500',
    benefits: ['10% off bookings', 'Priority support', 'Free upgrades'],
    threshold: 1000
  },
  Globetrotter: {
    name: 'Globetrotter',
    icon: Gift,
    color: 'bg-purple-500',
    benefits: ['15% off bookings', 'VIP lounge access', 'Exclusive deals'],
    threshold: 5000
  },
  VIP: {
    name: 'VIP',
    icon: Crown,
    color: 'bg-yellow-500',
    benefits: ['20% off bookings', 'Personal concierge', 'Luxury perks'],
    threshold: 15000
  }
};

export const LoyaltyWidget: React.FC<LoyaltyWidgetProps> = ({
  className = '',
  compact = false
}) => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadLoyaltyData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadLoyaltyData = async () => {
    if (!user) return;

    try {
      const data = await loyaltyAPI.fetchPoints(user.id);
      setLoyaltyData(data);
    } catch (error) {
      logger.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return null;
  }

  if (!loyaltyData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted">
            <Star className="w-8 h-8 mx-auto mb-2" />
            <p>Join Maku Rewards to earn points!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTier = TIERS[loyaltyData.current_tier] || TIERS.Explorer;
  const TierIcon = currentTier.icon;
  
  const nextTierName = getNextTier(loyaltyData.current_tier);
  const nextTier = nextTierName ? TIERS[nextTierName] : null;
  
  const progressPercent = nextTier 
    ? ((loyaltyData.total_points - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100
    : 100;

  function getNextTier(currentTierName: string): string | null {
    const tiers = ['Explorer', 'Adventurer', 'Globetrotter', 'VIP'];
    const currentIndex = tiers.indexOf(currentTierName);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`w-8 h-8 rounded-full ${currentTier.color} flex items-center justify-center`}>
          <TierIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <Badge variant="secondary">{loyaltyData.total_points} points</Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${currentTier.color} flex items-center justify-center`}>
            <TierIcon className="w-3 h-3 text-white" />
          </div>
          Maku Rewards
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{currentTier.name} Status</span>
            <span className="font-semibold">{loyaltyData.total_points} points</span>
          </div>
          
          {nextTier && (
            <>
              <Progress value={Math.min(progressPercent, 100)} className="h-2" />
              <div className="text-sm text-muted">
                {loyaltyData.points_to_next_tier} points to {nextTier.name}
              </div>
            </>
          )}
        </div>

        {/* Current Benefits */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Your Benefits</h4>
          <div className="space-y-1">
            {currentTier.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            View History
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Redeem Points
          </Button>
        </div>

        {/* Earning Reminder */}
        <div className="text-xs text-muted bg-secondary/50 p-3 rounded-lg">
          💡 Earn 10 points per $1 spent on bookings
        </div>
      </CardContent>
    </Card>
  );
};