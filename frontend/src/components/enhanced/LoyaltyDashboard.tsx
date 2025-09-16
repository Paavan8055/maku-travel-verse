import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, 
  Gift, 
  Crown, 
  Star, 
  TrendingUp, 
  Clock, 
  Plane, 
  Hotel, 
  MapPin, 
  CreditCard,
  Trophy
} from 'lucide-react';

interface LoyaltyData {
  balance: number;
  tier: string;
  benefits: any;
  nextTier: string | null;
  pointsToNextTier: number;
}

interface Transaction {
  id: string;
  type: 'earn' | 'redeem';
  points: number;
  transaction_type: string;
  created_at: string;
  booking_id?: string;
  amount_spent?: number;
}

const LoyaltyDashboard: React.FC = () => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLoyaltyData();
    loadTransactionHistory();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('loyalty-points-manager', {
        body: { action: 'check_balance', userId: 'current' }
      });

      if (error) throw error;
      setLoyaltyData(data);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
      toast({
        title: "Failed to load loyalty data",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('loyalty-points-manager', {
        body: { action: 'get_history', userId: 'current' }
      });

      if (error) throw error;
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return <Award className="h-5 w-5 text-amber-600" />;
      case 'silver':
        return <Star className="h-5 w-5 text-gray-500" />;
      case 'gold':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'platinum':
        return <Trophy className="h-5 w-5 text-purple-500" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-gradient-to-r from-amber-600 to-amber-700';
      case 'silver':
        return 'bg-gradient-to-r from-gray-400 to-gray-600';
      case 'gold':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'platinum':
        return 'bg-gradient-to-r from-purple-400 to-purple-600';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  const getTransactionIcon = (type: string, transactionType: string) => {
    if (type === 'earn') {
      switch (transactionType) {
        case 'booking':
          return <CreditCard className="h-4 w-4 text-green-500" />;
        case 'referral':
          return <Gift className="h-4 w-4 text-blue-500" />;
        case 'review':
          return <Star className="h-4 w-4 text-yellow-500" />;
        default:
          return <TrendingUp className="h-4 w-4 text-green-500" />;
      }
    } else {
      return <Gift className="h-4 w-4 text-red-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const redeemPoints = async (amount: number, type: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('loyalty-points-manager', {
        body: {
          action: 'redeem',
          userId: 'current',
          amount,
          redemptionType: type
        }
      });

      if (error) throw error;

      toast({
        title: "Points Redeemed Successfully!",
        description: `${amount} points redeemed for ${type}`,
      });

      // Reload data
      await loadLoyaltyData();
      await loadTransactionHistory();
    } catch (error) {
      console.error('Redemption failed:', error);
      toast({
        title: "Redemption Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-muted rounded-lg mb-6"></div>
          <div className="grid gap-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier Status Card */}
      {loyaltyData && (
        <Card className="overflow-hidden">
          <div className={`${getTierColor(loyaltyData.tier)} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getTierIcon(loyaltyData.tier)}
                <div>
                  <h2 className="text-2xl font-bold capitalize">{loyaltyData.tier} Member</h2>
                  <p className="text-white/80">MAKU Loyalty Program</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{loyaltyData.balance.toLocaleString()}</p>
                <p className="text-white/80">Points</p>
              </div>
            </div>
          </div>
          
          {loyaltyData.nextTier && (
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Progress to {loyaltyData.nextTier.charAt(0).toUpperCase() + loyaltyData.nextTier.slice(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {loyaltyData.pointsToNextTier} points to go
                  </span>
                </div>
                <Progress 
                  value={((loyaltyData.balance) / (loyaltyData.balance + loyaltyData.pointsToNextTier)) * 100} 
                />
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="redeem">Redeem</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions
                    .filter(t => t.type === 'earn' && new Date(t.created_at).getMonth() === new Date().getMonth())
                    .reduce((sum, t) => sum + t.points, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Points earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions.filter(t => t.transaction_type === 'booking').length}
                </div>
                <p className="text-xs text-muted-foreground">Lifetime bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions.length > 0 ? formatDate(transactions[transactions.length - 1].created_at) : 'New'}
                </div>
                <p className="text-xs text-muted-foreground">Join date</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benefits">
          {loyaltyData?.benefits && (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your {loyaltyData.tier.charAt(0).toUpperCase() + loyaltyData.tier.slice(1)} Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Earn {loyaltyData.benefits.pointsMultiplier}x points on bookings</span>
                    </div>
                    
                    {loyaltyData.benefits.upgradePriority && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Priority room & seat upgrades</span>
                      </div>
                    )}
                    
                    {loyaltyData.benefits.freeWifi && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Complimentary WiFi</span>
                      </div>
                    )}
                    
                    {loyaltyData.benefits.prioritySupport && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Priority customer support</span>
                      </div>
                    )}
                    
                    {loyaltyData.benefits.loungeAccess && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Airport lounge access</span>
                      </div>
                    )}
                    
                    {loyaltyData.benefits.freeUpgrades && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Complimentary upgrades</span>
                      </div>
                    )}
                    
                    {loyaltyData.benefits.dedicatedConcierge && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Dedicated concierge service</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="redeem">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>$10 Travel Credit</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Redeem for a $10 credit on your next booking
                </p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">1,000 points</Badge>
                  <Button
                    size="sm"
                    disabled={!loyaltyData || loyaltyData.balance < 1000}
                    onClick={() => redeemPoints(1000, 'travel_credit')}
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Hotel className="h-5 w-5" />
                  <span>Room Upgrade</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to the next room category
                </p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">2,500 points</Badge>
                  <Button
                    size="sm"
                    disabled={!loyaltyData || loyaltyData.balance < 2500}
                    onClick={() => redeemPoints(2500, 'room_upgrade')}
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plane className="h-5 w-5" />
                  <span>Flight Upgrade</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to premium economy or business
                </p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">5,000 points</Badge>
                  <Button
                    size="sm"
                    disabled={!loyaltyData || loyaltyData.balance < 5000}
                    onClick={() => redeemPoints(5000, 'flight_upgrade')}
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Free Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get a free activity on your next trip
                </p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">3,500 points</Badge>
                  <Button
                    size="sm"
                    disabled={!loyaltyData || loyaltyData.balance < 3500}
                    onClick={() => redeemPoints(3500, 'free_activity')}
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions yet. Start booking to earn points!
                  </p>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type, transaction.transaction_type)}
                        <div>
                          <p className="font-medium">
                            {transaction.type === 'earn' ? 'Earned' : 'Redeemed'} {Math.abs(transaction.points)} points
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.transaction_type.replace('_', ' ')} • {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'earn' ? '+' : '-'}{Math.abs(transaction.points)}
                        </p>
                        {transaction.amount_spent && (
                          <p className="text-sm text-muted-foreground">
                            ${transaction.amount_spent}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoyaltyDashboard;