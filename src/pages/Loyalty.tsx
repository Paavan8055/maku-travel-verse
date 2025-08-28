import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Gift, Plane, Building, TrendingUp, Crown, Award, Zap } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Loyalty = () => {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState({
    currentPoints: 0,
    totalPoints: 0,
    tier: 'Explorer',
    nextTier: 'Adventurer',
    pointsToNextTier: 1000,
    tierProgress: 0
  });

  const tiers = [
    {
      name: 'Explorer',
      minPoints: 0,
      benefits: ['1x points on bookings', 'Standard customer support', 'Basic travel insurance'],
      icon: <Star className="w-6 h-6" />,
      color: 'text-gray-600'
    },
    {
      name: 'Adventurer',
      minPoints: 1000,
      benefits: ['1.5x points on bookings', 'Priority customer support', 'Free seat selection', '5% booking discount'],
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-blue-600'
    },
    {
      name: 'Voyager',
      minPoints: 5000,
      benefits: ['2x points on bookings', 'Dedicated concierge', 'Free upgrades when available', '10% booking discount', 'Lounge access'],
      icon: <Award className="w-6 h-6" />,
      color: 'text-purple-600'
    },
    {
      name: 'Elite',
      minPoints: 15000,
      benefits: ['3x points on bookings', 'Personal travel advisor', 'Guaranteed upgrades', '15% booking discount', 'Premium lounge access', 'Exclusive partner offers'],
      icon: <Crown className="w-6 h-6" />,
      color: 'text-gold'
    }
  ];

  const pointsActivities = [
    { action: 'Book a flight', points: '+50-500 points', icon: <Plane className="w-5 h-5" /> },
    { action: 'Book a hotel', points: '+25-250 points', icon: <Building className="w-5 h-5" /> },
    { action: 'Book activities', points: '+10-100 points', icon: <Star className="w-5 h-5" /> },
    { action: 'Write a review', points: '+50 points', icon: <Award className="w-5 h-5" /> },
    { action: 'Refer a friend', points: '+500 points', icon: <Gift className="w-5 h-5" /> },
    { action: 'Complete your profile', points: '+100 points', icon: <Zap className="w-5 h-5" /> }
  ];

  const rewardOptions = [
    { title: 'Flight Discount', points: 1000, description: '$50 off your next flight booking' },
    { title: 'Hotel Credit', points: 2000, description: '$100 hotel booking credit' },
    { title: 'Activity Voucher', points: 500, description: '$25 activity booking voucher' },
    { title: 'Free Upgrade', points: 3000, description: 'Complimentary room or seat upgrade' },
    { title: 'Travel Insurance', points: 800, description: 'Free comprehensive travel insurance' },
    { title: 'Lounge Access', points: 1500, description: 'Airport lounge access pass' }
  ];

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching loyalty data:', error);
        return;
      }

      if (data) {
        const currentTierIndex = tiers.findIndex(tier => data.total_points >= tier.minPoints);
        const currentTier = tiers[Math.max(0, currentTierIndex)] || tiers[0];
        const nextTier = tiers[Math.min(tiers.length - 1, currentTierIndex + 1)];
        
        const pointsToNextTier = nextTier ? nextTier.minPoints - data.total_points : 0;
        const tierProgress = nextTier ? 
          ((data.total_points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100 : 100;

        setLoyaltyData({
          currentPoints: data.total_points || 0,
          totalPoints: data.total_points || 0,
          tier: currentTier.name,
          nextTier: nextTier?.name || currentTier.name,
          pointsToNextTier: Math.max(0, pointsToNextTier),
          tierProgress: Math.max(0, Math.min(100, tierProgress))
        });
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    }
  };

  const handleRedeemReward = async (reward: typeof rewardOptions[0]) => {
    if (loyaltyData.currentPoints < reward.points) {
      toast.error('Insufficient points for this reward');
      return;
    }

    try {
      const { error } = await supabase
        .from('loyalty_points')
        .update({ 
          total_points: loyaltyData.currentPoints - reward.points 
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success(`${reward.title} redeemed successfully!`);
      fetchLoyaltyData();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward');
    }
  };

  const getCurrentTier = () => {
    return tiers.find(tier => tier.name === loyaltyData.tier) || tiers[0];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Join MAKU Members</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to access your loyalty rewards and exclusive benefits
          </p>
          <Button>Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              MAKU Members
            </h1>
            <p className="text-lg text-muted-foreground">
              Your loyalty rewards program for exclusive travel benefits
            </p>
          </div>

          {/* Current Status */}
          <Card className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {loyaltyData.currentPoints.toLocaleString()}
                  </div>
                  <p className="text-muted-foreground">Available Points</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getCurrentTier().icon}
                    <span className="text-2xl font-bold ml-2">{loyaltyData.tier}</span>
                  </div>
                  <p className="text-muted-foreground">Current Tier</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold mb-2">
                    {loyaltyData.pointsToNextTier > 0 
                      ? `${loyaltyData.pointsToNextTier} points to ${loyaltyData.nextTier}`
                      : 'Maximum tier reached!'
                    }
                  </div>
                  <Progress value={loyaltyData.tierProgress} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="earn">Earn Points</TabsTrigger>
              <TabsTrigger value="redeem">Redeem</TabsTrigger>
              <TabsTrigger value="tiers">Tiers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Hotel booking - Sydney</span>
                        <Badge>+125 points</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Flight booking - Melbourne</span>
                        <Badge>+200 points</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Profile completion</span>
                        <Badge>+100 points</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getCurrentTier().benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-primary" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="earn">
              <Card>
                <CardHeader>
                  <CardTitle>Ways to Earn Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {pointsActivities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="text-primary">{activity.icon}</div>
                          <span>{activity.action}</span>
                        </div>
                        <Badge variant="outline">{activity.points}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="redeem">
              <Card>
                <CardHeader>
                  <CardTitle>Redeem Your Points</CardTitle>
                  <p className="text-muted-foreground">
                    Available Points: {loyaltyData.currentPoints.toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {rewardOptions.map((reward, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{reward.title}</h3>
                          <Badge>{reward.points} points</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {reward.description}
                        </p>
                        <Button 
                          onClick={() => handleRedeemReward(reward)}
                          disabled={loyaltyData.currentPoints < reward.points}
                          className="w-full"
                          variant={loyaltyData.currentPoints >= reward.points ? "default" : "outline"}
                        >
                          {loyaltyData.currentPoints >= reward.points ? 'Redeem' : 'Insufficient Points'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tiers">
              <div className="grid gap-6">
                {tiers.map((tier, index) => (
                  <Card key={index} className={`${loyaltyData.tier === tier.name ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={tier.color}>{tier.icon}</div>
                          <span>{tier.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {tier.minPoints.toLocaleString()} points
                          </div>
                          {loyaltyData.tier === tier.name && (
                            <Badge>Current Tier</Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {tier.benefits.map((benefit, bIndex) => (
                          <div key={bIndex} className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-primary" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Loyalty;