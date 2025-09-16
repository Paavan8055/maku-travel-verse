import React, { useState, useEffect } from 'react';
import { Award, Star, Gift, CreditCard, Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface LoyaltyProgram {
  id: string;
  name: string;
  type: 'airline' | 'hotel' | 'credit_card';
  membershipLevel: string;
  points: number;
  pointsValue: number;
  nextTierPoints?: number;
  benefits: string[];
  canRedeem: boolean;
}

interface RedemptionOption {
  id: string;
  type: 'points' | 'miles' | 'cashback';
  title: string;
  description: string;
  pointsRequired: number;
  value: number;
  available: boolean;
}

interface LoyaltyProgramIntegrationProps {
  onPointsRedeem?: (option: RedemptionOption) => void;
  onEarnPoints?: (amount: number) => void;
  className?: string;
}

export const LoyaltyProgramIntegration: React.FC<LoyaltyProgramIntegrationProps> = ({
  onPointsRedeem,
  onEarnPoints,
  className
}) => {
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [redemptionOptions, setRedemptionOptions] = useState<RedemptionOption[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  useEffect(() => {
    // Mock loyalty programs
    const mockPrograms: LoyaltyProgram[] = [
      {
        id: 'marriott-bonvoy',
        name: 'Marriott Bonvoy',
        type: 'hotel',
        membershipLevel: 'Gold Elite',
        points: 25750,
        pointsValue: 257.50,
        nextTierPoints: 50000,
        benefits: ['Free WiFi', 'Late Checkout', 'Room Upgrades', 'Bonus Points'],
        canRedeem: true
      },
      {
        id: 'chase-sapphire',
        name: 'Chase Sapphire Reserve',
        type: 'credit_card',
        membershipLevel: 'Premium',
        points: 42300,
        pointsValue: 634.50,
        benefits: ['Travel Credits', 'Airport Lounge Access', 'Travel Insurance'],
        canRedeem: true
      },
      {
        id: 'emirates-skywards',
        name: 'Emirates Skywards',
        type: 'airline',
        membershipLevel: 'Silver',
        points: 18400,
        pointsValue: 368.00,
        nextTierPoints: 25000,
        benefits: ['Priority Boarding', 'Extra Baggage', 'Lounge Access'],
        canRedeem: true
      }
    ];

    const mockRedemptions: RedemptionOption[] = [
      {
        id: '1',
        type: 'points',
        title: 'Free Night Certificate',
        description: 'Redeem for one free night at participating hotels',
        pointsRequired: 25000,
        value: 250,
        available: true
      },
      {
        id: '2',
        type: 'points',
        title: 'Room Upgrade',
        description: 'Complimentary room upgrade to next category',
        pointsRequired: 15000,
        value: 150,
        available: true
      },
      {
        id: '3',
        type: 'cashback',
        title: 'Statement Credit',
        description: 'Cash back applied to your statement',
        pointsRequired: 10000,
        value: 100,
        available: true
      }
    ];

    setLoyaltyPrograms(mockPrograms);
    setRedemptionOptions(mockRedemptions);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Award className="h-4 w-4" />;
      case 'airline': return <Plane className="h-4 w-4" />;
      case 'credit_card': return <CreditCard className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'airline': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'credit_card': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getMembershipColor = (level: string) => {
    if (level.toLowerCase().includes('gold') || level.toLowerCase().includes('premium')) {
      return 'text-yellow-600';
    }
    if (level.toLowerCase().includes('silver')) {
      return 'text-gray-600';
    }
    if (level.toLowerCase().includes('platinum')) {
      return 'text-purple-600';
    }
    return 'text-blue-600';
  };

  const selectedProgramData = loyaltyPrograms.find(p => p.id === selectedProgram);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Loyalty Programs Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Your Loyalty Programs
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your points and redeem rewards
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loyaltyPrograms.map(program => (
              <Card
                key={program.id}
                className={`cursor-pointer transition-colors ${
                  selectedProgram === program.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedProgram(program.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={getTypeColor(program.type)}>
                      {getTypeIcon(program.type)}
                      {program.type.replace('_', ' ')}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{program.points.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-1">{program.name}</h4>
                  <p className={`text-sm font-medium mb-2 ${getMembershipColor(program.membershipLevel)}`}>
                    {program.membershipLevel}
                  </p>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    Value: ${program.pointsValue.toFixed(2)}
                  </div>

                  {program.nextTierPoints && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress to next tier</span>
                        <span>{program.points} / {program.nextTierPoints}</span>
                      </div>
                      <Progress 
                        value={(program.points / program.nextTierPoints) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Program Details & Redemption */}
      {selectedProgramData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Program Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                {selectedProgramData.name} Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedProgramData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Redemption Options */}
          <Card>
            <CardHeader>
              <CardTitle>Available Redemptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {redemptionOptions.map(option => (
                  <div
                    key={option.id}
                    className={`p-3 border rounded-lg transition-opacity ${
                      selectedProgramData.points >= option.pointsRequired
                        ? 'cursor-pointer hover:shadow-sm'
                        : 'opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-sm">{option.title}</h5>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {option.pointsRequired.toLocaleString()} pts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${option.value} value
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={selectedProgramData.points >= option.pointsRequired ? "default" : "secondary"}
                      disabled={selectedProgramData.points < option.pointsRequired}
                      onClick={() => onPointsRedeem?.(option)}
                      className="w-full"
                    >
                      {selectedProgramData.points >= option.pointsRequired ? 'Redeem' : 'Insufficient Points'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Earning Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Earn More Points</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete your booking to earn points with participating programs
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loyaltyPrograms.map(program => (
              <div key={program.id} className="text-center p-4 bg-muted/30 rounded-lg">
                <Badge className={`${getTypeColor(program.type)} mb-2`}>
                  {getTypeIcon(program.type)}
                  {program.name}
                </Badge>
                <p className="text-lg font-bold text-primary">+{Math.floor(Math.random() * 500 + 200)}</p>
                <p className="text-xs text-muted-foreground">points on this booking</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyProgramIntegration;