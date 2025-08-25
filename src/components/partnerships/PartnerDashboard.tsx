/**
 * Marketing Partnership Framework for MAKU.Travel
 * 
 * Comprehensive affiliate tracking, commission management, and partner
 * onboarding system to scale marketing efforts through partnerships.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  TrendingUp,
  DollarSign,
  Link,
  Share,
  BarChart,
  Globe,
  Target,
  Gift,
  UserPlus,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Partner {
  id: string;
  name: string;
  email: string;
  website?: string;
  type: 'affiliate' | 'influencer' | 'corporate' | 'travel_agent';
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinedDate: string;
  commissionRate: number; // percentage
  paymentMethod: 'bank_transfer' | 'paypal' | 'stripe';
  paymentDetails: Record<string, any>;
  referralCode: string;
  trackingId: string;
  socialMedia?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    blog?: string;
  };
  metrics: PartnerMetrics;
  agreements: {
    termsAccepted: boolean;
    termsAcceptedDate: string;
    marketingApproval: boolean;
    exclusivity: boolean;
  };
}

export interface PartnerMetrics {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
  averageOrderValue: number;
  lastActivityDate: string;
  monthlyStats: {
    clicks: number;
    conversions: number;
    revenue: number;
    commission: number;
  };
  topPerformingServices: Array<{
    service: string;
    conversions: number;
    revenue: number;
  }>;
}

export interface AffiliateLink {
  id: string;
  partnerId: string;
  url: string;
  shortCode: string;
  destination: string;
  campaign: string;
  medium: 'social' | 'email' | 'blog' | 'video' | 'display';
  isActive: boolean;
  createdDate: string;
  expirationDate?: string;
  clicks: number;
  conversions: number;
}

export interface CommissionStructure {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'tiered';
  rates: {
    hotel: number;
    flight: number;
    activity: number;
    package: number;
  };
  minimumCommission: number;
  maximumCommission?: number;
  tierThresholds?: Array<{
    minRevenue: number;
    rate: number;
  }>;
  bonuses?: Array<{
    condition: string;
    bonus: number;
    type: 'percentage' | 'fixed';
  }>;
}

/**
 * Marketing Partnership Manager
 */
export class PartnershipManager {
  
  static readonly COMMISSION_STRUCTURES: CommissionStructure[] = [
    {
      id: 'standard',
      name: 'Standard Affiliate',
      type: 'percentage',
      rates: {
        hotel: 5.0,
        flight: 2.0,
        activity: 8.0,
        package: 6.0
      },
      minimumCommission: 10
    },
    {
      id: 'influencer',
      name: 'Influencer Program',
      type: 'percentage',
      rates: {
        hotel: 6.0,
        flight: 3.0,
        activity: 10.0,
        package: 8.0
      },
      minimumCommission: 15,
      bonuses: [
        {
          condition: 'first_5_conversions',
          bonus: 2.0,
          type: 'percentage'
        }
      ]
    },
    {
      id: 'tiered',
      name: 'Tiered Commission',
      type: 'tiered',
      rates: {
        hotel: 4.0,
        flight: 1.5,
        activity: 7.0,
        package: 5.0
      },
      minimumCommission: 5,
      tierThresholds: [
        { minRevenue: 0, rate: 1.0 },
        { minRevenue: 1000, rate: 1.2 },
        { minRevenue: 5000, rate: 1.5 },
        { minRevenue: 10000, rate: 2.0 }
      ]
    }
  ];

  /**
   * Generate unique referral code
   */
  static generateReferralCode(partnerName: string): string {
    const cleanName = partnerName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${cleanName.substr(0, 6)}${randomSuffix}`;
  }

  /**
   * Generate tracking ID
   */
  static generateTrackingId(): string {
    return 'PID_' + Math.random().toString(36).substr(2, 16).toUpperCase();
  }

  /**
   * Create affiliate link
   */
  static createAffiliateLink(
    partnerId: string, 
    destination: string, 
    campaign: string = 'general',
    medium: AffiliateLink['medium'] = 'social'
  ): AffiliateLink {
    const shortCode = Math.random().toString(36).substr(2, 8);
    const baseUrl = window.location.origin;
    
    return {
      id: `link_${Date.now()}`,
      partnerId,
      url: `${baseUrl}?ref=${shortCode}&utm_source=affiliate&utm_medium=${medium}&utm_campaign=${campaign}`,
      shortCode,
      destination,
      campaign,
      medium,
      isActive: true,
      createdDate: new Date().toISOString(),
      clicks: 0,
      conversions: 0
    };
  }

  /**
   * Calculate commission for booking
   */
  static calculateCommission(
    bookingValue: number,
    serviceType: 'hotel' | 'flight' | 'activity' | 'package',
    commissionStructure: CommissionStructure,
    partnerMetrics: PartnerMetrics
  ): number {
    let rate = commissionStructure.rates[serviceType];
    
    // Apply tier multiplier if applicable
    if (commissionStructure.type === 'tiered' && commissionStructure.tierThresholds) {
      const tier = commissionStructure.tierThresholds
        .reverse()
        .find(t => partnerMetrics.totalRevenue >= t.minRevenue);
      
      if (tier) {
        rate *= tier.rate;
      }
    }
    
    let commission = (bookingValue * rate) / 100;
    
    // Apply bonuses
    if (commissionStructure.bonuses) {
      commissionStructure.bonuses.forEach(bonus => {
        if (this.checkBonusCondition(bonus.condition, partnerMetrics)) {
          if (bonus.type === 'percentage') {
            commission += (bookingValue * bonus.bonus) / 100;
          } else {
            commission += bonus.bonus;
          }
        }
      });
    }
    
    // Apply minimum/maximum limits
    commission = Math.max(commission, commissionStructure.minimumCommission);
    if (commissionStructure.maximumCommission) {
      commission = Math.min(commission, commissionStructure.maximumCommission);
    }
    
    return commission;
  }

  /**
   * Check bonus conditions
   */
  private static checkBonusCondition(condition: string, metrics: PartnerMetrics): boolean {
    switch (condition) {
      case 'first_5_conversions':
        return metrics.totalConversions <= 5;
      case 'monthly_target_10k':
        return metrics.monthlyStats.revenue >= 10000;
      default:
        return false;
    }
  }

  /**
   * Get partner tier based on performance
   */
  static getPartnerTier(metrics: PartnerMetrics): Partner['tier'] {
    const { totalRevenue, totalConversions, conversionRate } = metrics;
    
    if (totalRevenue >= 50000 && totalConversions >= 100 && conversionRate >= 5.0) {
      return 'platinum';
    } else if (totalRevenue >= 20000 && totalConversions >= 50 && conversionRate >= 3.0) {
      return 'gold';
    } else if (totalRevenue >= 5000 && totalConversions >= 20 && conversionRate >= 2.0) {
      return 'silver';
    } else {
      return 'bronze';
    }
  }
}

/**
 * Partner Onboarding Component
 */
interface PartnerOnboardingProps {
  onSubmit: (partnerData: Partial<Partner>) => void;
}

export const PartnerOnboarding: React.FC<PartnerOnboardingProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    type: 'affiliate' as Partner['type'],
    socialMedia: {
      instagram: '',
      youtube: '',
      tiktok: '',
      blog: ''
    },
    businessDescription: '',
    marketingPlan: '',
    expectedVolume: '',
    paymentMethod: 'paypal' as Partner['paymentMethod']
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const handleSubmit = () => {
    const partnerData: Partial<Partner> = {
      ...formData,
      referralCode: PartnershipManager.generateReferralCode(formData.name),
      trackingId: PartnershipManager.generateTrackingId(),
      status: 'pending',
      tier: 'bronze',
      commissionRate: PartnershipManager.COMMISSION_STRUCTURES[0].rates.hotel,
      joinedDate: new Date().toISOString(),
      agreements: {
        termsAccepted: true,
        termsAcceptedDate: new Date().toISOString(),
        marketingApproval: true,
        exclusivity: false
      },
      metrics: {
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalCommission: 0,
        conversionRate: 0,
        averageOrderValue: 0,
        lastActivityDate: new Date().toISOString(),
        monthlyStats: {
          clicks: 0,
          conversions: 0,
          revenue: 0,
          commission: 0
        },
        topPerformingServices: []
      }
    };

    onSubmit(partnerData);
    toast({
      title: "Application Submitted",
      description: "Your partnership application has been submitted for review.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Join MAKU Travel Partners</h2>
        <p className="text-muted-foreground">Start earning commissions by promoting travel bookings</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map(step => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Basic Information'}
            {currentStep === 2 && 'Marketing Details'}
            {currentStep === 3 && 'Payment & Terms'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name / Business Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name or business name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Partner Type</Label>
                <Select value={formData.type} onValueChange={(value: Partner['type']) => 
                  setFormData(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="affiliate">Affiliate Marketer</SelectItem>
                    <SelectItem value="influencer">Social Media Influencer</SelectItem>
                    <SelectItem value="corporate">Corporate Partner</SelectItem>
                    <SelectItem value="travel_agent">Travel Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Social Media Profiles</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="Instagram handle (optional)"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="YouTube channel (optional)"
                    value={formData.socialMedia.youtube}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="Blog URL (optional)"
                    value={formData.socialMedia.blog}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, blog: e.target.value }
                    }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                  placeholder="Tell us about your business and audience"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="marketingPlan">Marketing Plan</Label>
                <Textarea
                  id="marketingPlan"
                  value={formData.marketingPlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketingPlan: e.target.value }))}
                  placeholder="How do you plan to promote MAKU Travel?"
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value: Partner['paymentMethod']) => 
                  setFormData(prev => ({ ...prev, paymentMethod: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Commission Structure</h4>
                <div className="text-sm space-y-1">
                  <div>Hotels: 5.0% commission</div>
                  <div>Flights: 2.0% commission</div>
                  <div>Activities: 8.0% commission</div>
                  <div>Packages: 6.0% commission</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Commission rates may be adjusted based on performance and volume.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="terms" required />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the Terms and Conditions and Privacy Policy
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="marketing" />
                  <Label htmlFor="marketing" className="text-sm">
                    I consent to receive marketing communications
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                Submit Application
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Partner Dashboard Component
 */
interface PartnerDashboardProps {
  partner: Partner;
  affiliateLinks: AffiliateLink[];
  onCreateLink: (destination: string, campaign: string, medium: AffiliateLink['medium']) => void;
  onExportData: () => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
  partner,
  affiliateLinks,
  onCreateLink,
  onExportData
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [newLinkForm, setNewLinkForm] = useState({
    destination: '',
    campaign: '',
    medium: 'social' as AffiliateLink['medium']
  });
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreateLink = () => {
    onCreateLink(newLinkForm.destination, newLinkForm.campaign, newLinkForm.medium);
    setNewLinkForm({ destination: '', campaign: '', medium: 'social' });
    toast({
      title: "Link Created",
      description: "Your new affiliate link has been generated.",
    });
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
    toast({
      title: "Link Copied",
      description: "Affiliate link copied to clipboard.",
    });
  };

  const tierColors = {
    bronze: 'bg-orange-100 text-orange-800',
    silver: 'bg-gray-100 text-gray-800',
    gold: 'bg-yellow-100 text-yellow-800',
    platinum: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partner Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {partner.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={tierColors[partner.tier]}>
            {partner.tier.charAt(0).toUpperCase() + partner.tier.slice(1)} Partner
          </Badge>
          <Button variant="outline" onClick={onExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Total Clicks</div>
            </div>
            <div className="text-2xl font-bold">{partner.metrics.totalClicks.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {partner.metrics.monthlyStats.clicks} this month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Conversions</div>
            </div>
            <div className="text-2xl font-bold">{partner.metrics.totalConversions}</div>
            <div className="text-xs text-muted-foreground">
              {partner.metrics.conversionRate.toFixed(1)}% conversion rate
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Total Revenue</div>
            </div>
            <div className="text-2xl font-bold">${partner.metrics.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              ${partner.metrics.monthlyStats.revenue} this month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Commission Earned</div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${partner.metrics.totalCommission.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              ${partner.metrics.monthlyStats.commission} this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="links">Affiliate Links</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Referral Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share className="h-5 w-5" />
                <span>Your Referral Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input value={partner.referralCode} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  onClick={() => handleCopyLink(partner.referralCode)}
                >
                  {copiedLink === partner.referralCode ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Share this code with your audience to earn commissions on their bookings.
              </p>
            </CardContent>
          </Card>

          {/* Top Performing Services */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {partner.metrics.topPerformingServices.slice(0, 3).map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{service.service}</div>
                      <div className="text-sm text-muted-foreground">
                        {service.conversions} conversions
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${service.revenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-6">
          {/* Create New Link */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Affiliate Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="destination">Destination Page</Label>
                  <Input
                    id="destination"
                    value={newLinkForm.destination}
                    onChange={(e) => setNewLinkForm(prev => ({ ...prev, destination: e.target.value }))}
                    placeholder="e.g., /hotels/sydney"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign">Campaign Name</Label>
                  <Input
                    id="campaign"
                    value={newLinkForm.campaign}
                    onChange={(e) => setNewLinkForm(prev => ({ ...prev, campaign: e.target.value }))}
                    placeholder="e.g., summer-sale"
                  />
                </div>
                <div>
                  <Label htmlFor="medium">Medium</Label>
                  <Select value={newLinkForm.medium} onValueChange={(value: AffiliateLink['medium']) => 
                    setNewLinkForm(prev => ({ ...prev, medium: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="display">Display Ad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateLink} className="mt-4">
                <Link className="h-4 w-4 mr-2" />
                Generate Link
              </Button>
            </CardContent>
          </Card>

          {/* Existing Links */}
          <Card>
            <CardHeader>
              <CardTitle>Your Affiliate Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {affiliateLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{link.url}</div>
                      <div className="text-sm text-muted-foreground">
                        {link.campaign} • {link.medium} • {link.clicks} clicks • {link.conversions} conversions
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={link.isActive ? 'default' : 'secondary'}>
                        {link.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(link.url)}
                      >
                        {copiedLink === link.url ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">Performance Analytics Coming Soon</h4>
              <p className="text-sm text-muted-foreground">
                Detailed performance charts and analytics will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">Payment History Coming Soon</h4>
              <p className="text-sm text-muted-foreground">
                Your commission payment history and payout details will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartnerDashboard;
