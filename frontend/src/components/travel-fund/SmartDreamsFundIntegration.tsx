import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Brain, 
  Target, 
  Users, 
  Calendar, 
  Coins, 
  MapPin, 
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTravelFunds } from '@/hooks/useTravelFunds';
import { useAIIntelligence } from '@/hooks/useAIIntelligence';

interface DreamData {
  destination: string;
  travelStyle: string;
  duration: number;
  companions: number;
  budget?: number;
  travelDates?: {
    start: Date;
    end: Date;
  };
  dreamName?: string;
}

interface SmartFundRecommendation {
  suggestedAmount: number;
  timelineMonths: number;
  monthlyContribution: number;
  riskAssessment: 'low' | 'medium' | 'high';
  successProbability: number;
}

interface SmartDreamsFundIntegrationProps {
  dreamData: DreamData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFundCreated: (fundId: string) => void;
}

export const SmartDreamsFundIntegration: React.FC<SmartDreamsFundIntegrationProps> = ({
  dreamData,
  open,
  onOpenChange,
  onFundCreated
}) => {
  const { toast } = useToast();
  const { createFund } = useTravelFunds();
  const { travelDNA } = useAIIntelligence();
  
  const [recommendation, setRecommendation] = useState<SmartFundRecommendation | null>(null);
  const [fundName, setFundName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [deadline, setDeadline] = useState('');
  const [fundType, setFundType] = useState<'personal' | 'group' | 'family'>('personal');
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // AI-powered budget estimation
  useEffect(() => {
    const generateRecommendation = async () => {
      try {
        // Mock AI budget calculation (in real implementation, call AI service)
        const baseCost = {
          hotel: dreamData.duration * 150, // $150/night average
          flights: 800 + (dreamData.companions * 200), // Base + companions
          activities: dreamData.duration * 100, // $100/day activities
          food: dreamData.duration * 75, // $75/day food
          local: dreamData.duration * 50 // $50/day local transport
        };

        const totalEstimate = Object.values(baseCost).reduce((sum, cost) => sum + cost, 0);
        const safetyBuffer = totalEstimate * 0.2; // 20% buffer
        const recommendedAmount = totalEstimate + safetyBuffer;

        // Calculate timeline based on Travel DNA if available
        const timelineMultiplier = travelDNA?.planning_style === 'spontaneous' ? 0.5 : 1.5;
        const timelineMonths = Math.max(3, Math.round(12 * timelineMultiplier));
        
        const monthlyAmount = recommendedAmount / timelineMonths;

        setRecommendation({
          suggestedAmount: Math.round(recommendedAmount),
          timelineMonths: timelineMonths,
          monthlyContribution: Math.round(monthlyAmount),
          riskAssessment: monthlyAmount > 500 ? 'high' : monthlyAmount > 200 ? 'medium' : 'low',
          successProbability: Math.min(95, 100 - (monthlyAmount / 50))
        });

        // Auto-generate fund name
        const dreamName = dreamData.dreamName || `${dreamData.destination} Adventure`;
        setFundName(`${dreamName} 2025`);
        setTargetAmount(Math.round(recommendedAmount));
        
        // Set deadline based on travel dates or recommendation
        const defaultDeadline = dreamData.travelDates?.start || 
          new Date(Date.now() + (timelineMonths * 30 * 24 * 60 * 60 * 1000));
        setDeadline(defaultDeadline.toISOString().split('T')[0]);
        
      } catch (error) {
        console.error('Error generating recommendation:', error);
      }
    };

    if (dreamData.destination) {
      generateRecommendation();
    }
  }, [dreamData, travelDNA]);

  const handleCreateFund = async () => {
    setIsCreating(true);
    
    try {
      const fundData = {
        name: fundName,
        description: `AI-generated savings plan for ${dreamData.destination} adventure`,
        target_amount: targetAmount,
        deadline: deadline,
        destination: dreamData.destination,
        fund_type: fundType,
        // Smart Dreams integration metadata
        smart_dreams_integration: {
          source: 'smart_dreams',
          dream_data: dreamData,
          ai_recommendation: recommendation,
          generated_at: new Date().toISOString()
        }
      };

      const result = await createFund(fundData);
      
      if (result) {
        toast({
          title: "Dream fund created!",
          description: `Your ${dreamData.destination} savings fund is ready. Start inviting friends!`,
        });
        onFundCreated(result.id);
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create fund. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Turn Your Dream Into Reality
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Budget Recommendation */}
          {recommendation && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Budget Analysis for {dreamData.destination}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-600" />
                    <p className="text-sm text-gray-600">Estimated Cost</p>
                    <p className="text-xl font-bold">${recommendation.suggestedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Calendar className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                    <p className="text-sm text-gray-600">Timeline</p>
                    <p className="text-xl font-bold">{recommendation.timelineMonths} months</p>
                  </div>
                  <div>
                    <TrendingUp className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                    <p className="text-sm text-gray-600">Monthly Goal</p>
                    <p className="text-xl font-bold">${recommendation.monthlyContribution}</p>
                  </div>
                  <div>
                    <Target className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-xl font-bold">{recommendation.successProbability}%</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Budget Breakdown</span>
                    <Badge variant="outline">AI Estimated</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accommodation ({dreamData.duration} nights)</span>
                      <span>${(dreamData.duration * 150).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flights ({dreamData.companions + 1} people)</span>
                      <span>${(800 + dreamData.companions * 200).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activities & Experiences</span>
                      <span>${(dreamData.duration * 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Food & Dining</span>
                      <span>${(dreamData.duration * 75).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Local Transport</span>
                      <span>${(dreamData.duration * 50).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Safety Buffer (20%)</span>
                      <span>${Math.round(recommendation.suggestedAmount * 0.2).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fund Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Your Dream Fund</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fundName">Fund Name</Label>
                <Input
                  id="fundName"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  placeholder="e.g., Bali Adventure 2025"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount ($)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    min="100"
                    step="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Target Date</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fund Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['personal', 'group', 'family'].map((type) => (
                    <Button
                      key={type}
                      variant={fundType === type ? 'default' : 'outline'}
                      onClick={() => setFundType(type as any)}
                      className="capitalize"
                    >
                      {type === 'personal' && <Target className="h-4 w-4 mr-1" />}
                      {type === 'group' && <Users className="h-4 w-4 mr-1" />}
                      {type === 'family' && <Users className="h-4 w-4 mr-1" />}
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Companion Invitations */}
              {(fundType === 'group' || fundType === 'family') && (
                <div className="space-y-2">
                  <Label>Invite Companions</Label>
                  <div className="space-y-2">
                    {dreamData.companions > 0 && (
                      <p className="text-sm text-gray-600">
                        Your dream includes {dreamData.companions} companion{dreamData.companions > 1 ? 's' : ''}. 
                        Invite them to contribute!
                      </p>
                    )}
                    <Input
                      placeholder="Enter email addresses (comma separated)"
                      onChange={(e) => setInviteEmails(e.target.value.split(',').map(email => email.trim()))}
                    />
                  </div>
                </div>
              )}

              {/* Savings Strategy Preview */}
              {recommendation && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Your Savings Strategy
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Monthly Contribution:</span>
                      <span className="font-semibold ml-2">${recommendation.monthlyContribution}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Success Probability:</span>
                      <span className="font-semibold ml-2 text-green-600">{recommendation.successProbability}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-white rounded">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress Timeline</span>
                      <span>{recommendation.timelineMonths} months to go</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: '5%' }} // Starting progress
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart Dreams Integration Benefits */}
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Smart Dreams Benefits
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-orange-500" />
                  <span>AI-optimized budget planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-green-500" />
                  <span>Milestone NFT rewards</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-blue-500" />
                  <span>Automatic companion invites</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                  <span>Progress tracking in Smart Dreams</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCreateFund}
              disabled={!fundName || !targetAmount || isCreating}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {isCreating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating Dream Fund...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Dream Fund
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartDreamsFundIntegration;