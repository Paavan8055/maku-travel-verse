/**
 * Integration Hub for MAKU.Travel Performance & UX Enhancements
 * 
 * Centralized component that orchestrates cross-selling, loyalty programs,
 * and partnership features throughout the booking flow.
 */

import React, { useState, useEffect, useContext, createContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Import our enhancement components
import CrossSellDisplay, { CrossSellingEngine, type CrossSellItem, type BookingContext } from '@/components/booking/CrossSellDisplay';
import LoyaltyDashboard, { LoyaltyProgram, type LoyaltyProfile } from '@/components/loyalty/LoyaltyDashboard';
import PartnerDashboard, { PartnershipManager, type Partner, type AffiliateLink } from '@/components/partnerships/PartnerDashboard';

// Context for sharing enhancement data across components
interface EnhancementContextType {
  loyalty: {
    profile: LoyaltyProfile | null;
    pointsEarned: number;
    availableRewards: any[];
  };
  crossSell: {
    selectedItems: CrossSellItem[];
    totalValue: number;
    addItem: (item: CrossSellItem) => void;
    removeItem: (itemId: string) => void;
  };
  partnership: {
    isPartner: boolean;
    partnerData: Partner | null;
    referralCode: string | null;
  };
  updateLoyaltyProfile: (profile: LoyaltyProfile) => void;
  trackConversion: (value: number, type: string) => void;
}

const EnhancementContext = createContext<EnhancementContextType | null>(null);

export const useEnhancements = () => {
  const context = useContext(EnhancementContext);
  if (!context) {
    throw new Error('useEnhancements must be used within EnhancementProvider');
  }
  return context;
};

/**
 * Enhancement Provider Component
 */
interface EnhancementProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export const EnhancementProvider: React.FC<EnhancementProviderProps> = ({ children, userId }) => {
  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile | null>(null);
  const [selectedCrossSellItems, setSelectedCrossSellItems] = useState<CrossSellItem[]>([]);
  const [partnerData, setPartnerData] = useState<Partner | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadUserEnhancementData(userId);
    }
  }, [userId]);

  const loadUserEnhancementData = async (userId: string) => {
    try {
      // Load loyalty profile
      const { data: loyaltyData } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (loyaltyData) {
        // Transform loyalty data to profile format
        const profile: LoyaltyProfile = {
          userId,
          membershipNumber: `MAK${userId.slice(0, 8).toUpperCase()}`,
          currentTier: LoyaltyProgram.getTierFromPoints(loyaltyData.total_points || 0).id,
          points: {
            total: loyaltyData.total_points || 0,
            available: loyaltyData.total_points || 0,
            pending: 0,
            lifetime: loyaltyData.lifetime_points || 0,
            expiringPoints: 0,
            expirationDate: null
          },
          memberSince: loyaltyData.created_at || new Date().toISOString(),
          totalBookings: 0, // Would be loaded from bookings table
          totalSpent: 0,
          currentStreak: 1,
          longestStreak: 1,
          achievements: [],
          preferences: {
            emailNotifications: true,
            smsNotifications: false,
            preferredRewardTypes: ['discount', 'upgrade']
          }
        };
        
        setLoyaltyProfile(profile);
      }

      // Check if user is a partner
      const { data: partnerData } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (partnerData) {
        setIsPartner(true);
        // Transform partner data if needed
        // setPartnerData(partnerData as any); // TODO: Transform partner data structure
      }

    } catch (error) {
      console.error('Error loading enhancement data:', error);
    }
  };

  const addCrossSellItem = (item: CrossSellItem) => {
    setSelectedCrossSellItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeCrossSellItem = (itemId: string) => {
    setSelectedCrossSellItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateLoyaltyProfile = (profile: LoyaltyProfile) => {
    setLoyaltyProfile(profile);
  };

  const trackConversion = async (value: number, type: string) => {
    try {
      // Track conversion for loyalty points
      if (loyaltyProfile) {
        const pointsEarned = LoyaltyProgram.calculatePointsEarned(value, loyaltyProfile.currentTier);
        
        // Update loyalty points in database
        await supabase
          .from('loyalty_points')
          .update({
            total_points: (loyaltyProfile.points.total + pointsEarned),
            available_points: (loyaltyProfile.points.available + pointsEarned),
            lifetime_points: (loyaltyProfile.points.lifetime + pointsEarned)
          })
          .eq('user_id', userId);

        toast({
          title: "Points Earned!",
          description: `You earned ${pointsEarned} loyalty points for this booking.`,
        });
      }

      // Track affiliate conversion if applicable
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');
      
      if (referralCode) {
        // Track affiliate conversion
        await supabase.functions.invoke('track-affiliate-conversion', {
          body: {
            referralCode,
            bookingValue: value,
            serviceType: type
          }
        });
      }

    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  };

  const contextValue: EnhancementContextType = {
    loyalty: {
      profile: loyaltyProfile,
      pointsEarned: 0,
      availableRewards: loyaltyProfile ? LoyaltyProgram.getAvailableRewards(loyaltyProfile.points.available) : []
    },
    crossSell: {
      selectedItems: selectedCrossSellItems,
      totalValue: selectedCrossSellItems.reduce((sum, item) => sum + item.price, 0),
      addItem: addCrossSellItem,
      removeItem: removeCrossSellItem
    },
    partnership: {
      isPartner,
      partnerData,
      referralCode: partnerData?.referralCode || null
    },
    updateLoyaltyProfile,
    trackConversion
  };

  return (
    <EnhancementContext.Provider value={contextValue}>
      {children}
    </EnhancementContext.Provider>
  );
};

/**
 * Booking Enhancement Panel Component
 * Shows cross-sell options during booking flow
 */
interface BookingEnhancementPanelProps {
  bookingContext: BookingContext;
  onContinue: () => void;
}

export const BookingEnhancementPanel: React.FC<BookingEnhancementPanelProps> = ({
  bookingContext,
  onContinue
}) => {
  const { crossSell, loyalty } = useEnhancements();
  const [showPanel, setShowPanel] = useState(true);

  if (!showPanel) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Enhance Your Experience</CardTitle>
          <Button
            variant="ghost"
            onClick={() => setShowPanel(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CrossSellDisplay
          context={bookingContext}
          onAddItem={crossSell.addItem}
          onRemoveItem={crossSell.removeItem}
          selectedItems={crossSell.selectedItems.map(item => item.id)}
          showCompact={true}
        />
        
        {crossSell.selectedItems.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Additional Value: +${crossSell.totalValue.toFixed(2)} AUD
              </span>
              {loyalty.profile && (
                <Badge variant="outline">
                  +{LoyaltyProgram.calculatePointsEarned(crossSell.totalValue, loyalty.profile.currentTier)} points
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => setShowPanel(false)}>
            Continue Without Add-ons
          </Button>
          <Button onClick={onContinue}>
            Continue with Selected Items
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Loyalty Points Display Component
 * Shows points earning potential during booking
 */
interface LoyaltyPointsDisplayProps {
  bookingValue: number;
  compact?: boolean;
}

export const LoyaltyPointsDisplay: React.FC<LoyaltyPointsDisplayProps> = ({
  bookingValue,
  compact = false
}) => {
  const { loyalty } = useEnhancements();

  if (!loyalty.profile) return null;

  const pointsToEarn = LoyaltyProgram.calculatePointsEarned(bookingValue, loyalty.profile.currentTier);
  const tierProgress = LoyaltyProgram.getTierProgress(loyalty.profile.points.total);

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Badge variant="outline">
          +{pointsToEarn} points
        </Badge>
        <span className="text-muted-foreground">
          {tierProgress.currentTier.name} Member
        </span>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Loyalty Rewards</h4>
            <p className="text-sm text-blue-700">
              Earn {pointsToEarn} points with this booking
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-900">
              {loyalty.profile.points.available.toLocaleString()}
            </div>
            <div className="text-xs text-blue-700">Available Points</div>
          </div>
        </div>
        
        {tierProgress.nextTier && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress to {tierProgress.nextTier.name}</span>
              <span>{tierProgress.pointsNeeded.toLocaleString()} points needed</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${tierProgress.progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Partner Referral Display Component
 * Shows referral information if user came through partner link
 */
export const PartnerReferralDisplay: React.FC = () => {
  const [referralInfo, setReferralInfo] = useState<{
    partnerName: string;
    discount?: number;
  } | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      // In a real implementation, this would fetch partner details
      setReferralInfo({
        partnerName: 'Travel Partner',
        discount: 5
      });
    }
  }, []);

  if (!referralInfo) return null;

  return (
    <Card className="bg-green-50 border-green-200 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Partner Referral
          </Badge>
          <span className="text-sm text-green-700">
            Referred by {referralInfo.partnerName}
            {referralInfo.discount && ` • ${referralInfo.discount}% discount applied`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Enhancement Dashboard
 * Admin view for managing all enhancement features
 */
export const EnhancementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    crossSellRevenue: 0,
    loyaltyMembers: 0,
    partnerConversions: 0,
    totalEnhancementValue: 0
  });

  useEffect(() => {
    loadEnhancementStats();
  }, []);

  const loadEnhancementStats = async () => {
    try {
      // Load enhancement statistics
      const { data } = await supabase.functions.invoke('enhancement-analytics', {
        body: { period: '30d' }
      });
      
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading enhancement stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enhancement Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor cross-selling, loyalty programs, and partnership performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              ${stats.crossSellRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Cross-sell Revenue</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.loyaltyMembers.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Loyalty Members</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.partnerConversions.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Partner Conversions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              ${stats.totalEnhancementValue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Enhancement Value</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cross-Selling Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-medium">15.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Add-on Value</span>
                    <span className="font-medium">$47.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most Popular Add-on</span>
                    <span className="font-medium">Travel Insurance</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loyalty Program Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Members</span>
                    <span className="font-medium">{stats.loyaltyMembers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Points per Member</span>
                    <span className="font-medium">2,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Redemption Rate</span>
                    <span className="font-medium">23.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-8 text-center">
              <h4 className="font-medium mb-2">Advanced Analytics Coming Soon</h4>
              <p className="text-sm text-muted-foreground">
                Detailed analytics charts and insights will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardContent className="p-8 text-center">
              <h4 className="font-medium mb-2">Configuration Panel Coming Soon</h4>
              <p className="text-sm text-muted-foreground">
                Enhancement feature configuration will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancementDashboard;