import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ShareFundDialog } from '@/components/travel-fund/ShareFundDialog';
import { useToast } from '@/hooks/use-toast';
import { useTravelFunds } from '@/hooks/useTravelFunds';
import { travelFundClient } from '@/lib/travelFundClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AnimatedLoadingState } from '@/components/ux/EnhancedUserExperience';
import { Users, Target, Calendar, TrendingUp, PlusCircle, Coins, Copy, Share2, UserPlus, Eye, EyeOff, Sparkles, Brain, Zap, Trophy } from 'lucide-react';

const TravelFundPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { funds, loading, createFund, refetch } = useTravelFunds();
  
  const [activeTab, setActiveTab] = useState('create');
  
  // Form states
  const [fundName, setFundName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [fundType, setFundType] = useState('');
  const [destination, setDestination] = useState('');
  
  // Add money states
  const [selectedFundId, setSelectedFundId] = useState('');
  const [addAmount, setAddAmount] = useState('');
  
  // Join fund state
  const [joinCode, setJoinCode] = useState('');
  
  // Share fund state
  const [shareFundId, setShareFundId] = useState<string | null>(null);
  
  // Show fund code state
  const [showFundCodes, setShowFundCodes] = useState<{ [key: string]: boolean }>({});
  
  // Loading state for payment processing
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const handleCreateFund = async () => {
    if (!fundName || !targetAmount || !fundType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const fundData = {
      name: fundName,
      description,
      target_amount: parseFloat(targetAmount),
      fund_type: fundType as 'personal' | 'group' | 'family',
      deadline: targetDate || undefined,
      destination: destination || undefined,
    };

    const result = await createFund(fundData);
    
    if (result) {
      // Reset form
      setFundName('');
      setTargetAmount('');
      setTargetDate('');
      setDescription('');
      setFundType('');
      setDestination('');
      setActiveTab('existing');
    }
  };

  const handleAddMoney = async () => {
    if (!selectedFundId || !addAmount) {
      toast({
        title: "Missing Information",
        description: "Please select a fund and enter an amount.",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(addAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    setRedirectUrl(null);

    // Timeout protection - clear loading state after 5 seconds if still processing
    const timeoutId = setTimeout(() => {
      setIsProcessingPayment(false);
      if (redirectUrl) {
        toast({
          title: "Redirect issue detected",
          description: "Click the payment button below to continue manually.",
          variant: "default",
        });
      }
    }, 5000);

    try {
      console.log('Processing payment for fund:', selectedFundId, 'amount:', amount);
      
      // Use the new payment integration with Stripe
      const { data: paymentData, error } = await travelFundClient.processPayment(selectedFundId, amount);
      
      if (error) {
        console.error('Payment error:', error);
        clearTimeout(timeoutId);
        setIsProcessingPayment(false);
        toast({
          title: "Payment failed",
          description: error.message || "Unable to process payment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (paymentData?.url) {
        console.log('Redirecting to Stripe checkout:', paymentData.url);
        setRedirectUrl(paymentData.url);
        
        toast({
          title: "Redirecting to payment",
          description: "You'll be redirected to complete your payment securely.",
          variant: "default",
        });
        
        // Clear loading state before redirect
        setIsProcessingPayment(false);
        clearTimeout(timeoutId);
        
        // Attempt redirect
        try {
          window.location.href = paymentData.url;
        } catch (redirectError) {
          console.error('Redirect failed:', redirectError);
          toast({
            title: "Redirect failed",
            description: "Please use the payment button below to continue.",
            variant: "default",
          });
        }
        return; // Don't clear form fields since we're redirecting
      } else {
        console.error('No payment URL received');
        clearTimeout(timeoutId);
        setIsProcessingPayment(false);
        toast({
          title: "Payment error",
          description: "No payment URL received. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      clearTimeout(timeoutId);
      setIsProcessingPayment(false);
      toast({
        title: "Payment error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinFund = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Missing code",
        description: "Please enter a valid fund code.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await travelFundClient.joinFundByCode(joinCode.trim().toUpperCase());
      
      if (error) {
        toast({
          title: "Unable to join fund",
          description: error.message || "Invalid fund code or fund not found.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Successfully joined fund!",
        description: `You've joined "${data?.name}". You can now contribute to this travel fund.`,
        variant: "default",
      });
      
      refetch(); // Refresh the funds list
      setJoinCode('');
      setActiveTab('existing');
    } catch (err) {
      toast({
        title: "Error joining fund",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyFundCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Fund code copied to clipboard.",
      variant: "default"
    });
  };

  const toggleFundCodeVisibility = (fundId: string) => {
    setShowFundCodes(prev => ({
      ...prev,
      [fundId]: !prev[fundId]
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section for Unauthenticated Users */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Travel Fund Manager
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Create collaborative savings goals, track contributions, and make your dream destinations a reality together.
            </p>
          </div>

          {/* Preview Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Collaborative Saving</h3>
                <p className="text-muted-foreground">Pool funds with family and friends for shared travel experiences</p>
              </CardContent>
            </Card>
            <Card className="border-secondary/20">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Goal Tracking</h3>
                <p className="text-muted-foreground">Set targets and watch your progress with visual indicators</p>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Analytics</h3>
                <p className="text-muted-foreground">Get insights on savings patterns and fund performance</p>
              </CardContent>
            </Card>
          </div>

          {/* Authentication Card */}
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Start Your Travel Journey</CardTitle>
              <CardDescription>
                Join thousands of travelers who are making their dreams come true through collaborative saving
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => navigate('/auth?tab=signup')} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
                <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                  Log In
                </Button>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account? <button onClick={() => navigate('/auth')} className="text-primary hover:underline">Sign in here</button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate stats from real funds
  const calculateStats = () => {
    // Ensure funds is an array before processing
    const safeFunds = Array.isArray(funds) ? funds : [];
    
    const totalDeposited = safeFunds.reduce((sum, fund) => sum + (fund?.balance || 0), 0);
    const activeGroups = safeFunds.filter(fund => (fund?.status === 'active' || !fund?.status)).length;
    const averageFundSize = safeFunds.length > 0 ? totalDeposited / safeFunds.length : 0;
    const successRate = 85; // Placeholder until we track completed funds
    
    return {
      totalDeposited,
      activeGroups,
      averageFundSize,
      successRate
    };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Travel Fund Manager
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create collaborative savings goals, track contributions, and make your dream destinations a reality together.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Coins className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">${stats.totalDeposited.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Deposited</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeGroups}</p>
                  <p className="text-sm text-muted-foreground">Active Groups</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold text-foreground">${stats.averageFundSize.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Avg Fund Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.successRate.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Fund</TabsTrigger>
            <TabsTrigger value="existing">My Funds ({funds.length})</TabsTrigger>
            <TabsTrigger value="add-money">Add Money</TabsTrigger>
            <TabsTrigger value="join">Join Fund</TabsTrigger>
          </TabsList>

            {/* Enhanced Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Enhanced Stats Dashboard */}
              {enhancedStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600">Total Saved</p>
                          <p className="text-2xl font-bold text-orange-700">${enhancedStats.totalValue.toLocaleString()}</p>
                        </div>
                        <Coins className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Active Funds</p>
                          <p className="text-2xl font-bold text-green-700">{enhancedStats.totalFunds}</p>
                        </div>
                        <Target className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">NFT Rewards</p>
                          <p className="text-2xl font-bold text-purple-700">{enhancedStats.nftRewardsEarned}</p>
                        </div>
                        <Trophy className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Contribution Streak</p>
                          <p className="text-2xl font-bold text-blue-700">{enhancedStats.contributionStreak} days</p>
                        </div>
                        <Zap className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Gamification Dashboard */}
              <FundGamification 
                fundId="global"
                userStats={{
                  level: Math.floor((enhancedStats?.totalValue || 0) / 1000) + 1,
                  totalXP: (enhancedStats?.totalValue || 0) * 10,
                  nextLevelXP: 10000,
                  currentStreak: enhancedStats?.contributionStreak || 0,
                  totalContributions: enhancedStats?.totalFunds || 0,
                  totalFundsCreated: funds.length,
                  totalGoalsAchieved: enhancedStats?.completedGoals || 0
                }}
                achievements={[]} // Would come from integrationData
                onClaimReward={(id) => console.log('Claim reward:', id)}
                onViewNFTCollection={() => navigate('/nft')}
              />

              {/* Enhanced Fund Cards Grid */}
              {funds.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Your Travel Funds</h3>
                    <Button 
                      onClick={() => setActiveTab('create')}
                      className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create New Fund
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {funds.map((fund) => (
                      <EnhancedFundCard
                        key={fund.id}
                        fund={{
                          id: fund.id,
                          name: fund.name,
                          destination: fund.destination || 'Adventure Awaits',
                          currentAmount: fund.balance,
                          targetAmount: fund.target_amount,
                          deadline: fund.deadline || '2025-12-31',
                          contributors: [], // Would be populated from API
                          fundType: fund.fund_type,
                          heroImage: `/lovable-uploads/hero-${fund.destination?.toLowerCase().replace(' ', '-')}.jpg`
                        }}
                        onContribute={(fundId) => {
                          setSelectedFundId(fundId);
                          setActiveTab('add-money');
                        }}
                        onShare={(fundId) => setShareFundId(fundId)}
                        onView={(fundId) => {
                          // Navigate to detailed fund view
                          navigate(`/travel-fund/${fundId}`);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="text-center p-8 bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
                  <CardContent>
                    <Sparkles className="h-16 w-16 mx-auto mb-4 text-orange-500" />
                    <h3 className="text-xl font-semibold mb-2">Start Your Savings Journey</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Create your first travel fund and turn your dream destinations into achievable goals. 
                      Earn NFT rewards as you progress!
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                      <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
                        <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                        <h4 className="font-medium mb-1">Smart Dreams</h4>
                        <p className="text-sm text-gray-600">AI-powered budget planning</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                        <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <h4 className="font-medium mb-1">NFT Rewards</h4>
                        <p className="text-sm text-gray-600">Milestone achievements</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <h4 className="font-medium mb-1">Smart Bidding</h4>
                        <p className="text-sm text-gray-600">Use funds for deals</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setActiveTab('create')}
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white px-8 py-3"
                    >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Create Your First Fund
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* NFT Rewards Section */}
              <FundNFTRewardSystem
                fundId="global"
                fundName="All Funds"
                currentAmount={enhancedStats?.totalValue || 0}
                targetAmount={(enhancedStats?.totalValue || 0) * 1.5} // 50% growth target
                contributorCount={funds.length}
                createdDate={new Date()}
                onNFTMinted={(nft) => {
                  toast({
                    title: "NFT Earned!",
                    description: `You've earned the ${nft.title} NFT!`,
                  });
                }}
                onViewCollection={() => navigate('/nft')}
              />
            </TabsContent>

          {/* Create Fund Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Travel Fund</CardTitle>
                <CardDescription>
                  Set up a collaborative savings goal for your next adventure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fundName">Fund Name *</Label>
                    <Input
                      id="fundName"
                      value={fundName}
                      onChange={(e) => setFundName(e.target.value)}
                      placeholder="e.g., Bali Adventure 2024"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g., Bali, Indonesia"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="targetAmount">Target Amount ($) *</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="5000"
                      className="mt-1"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="targetDate">Target Date</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fundType">Fund Type *</Label>
                  <Select value={fundType} onValueChange={setFundType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select fund type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Travel Fund</SelectItem>
                      <SelectItem value="group">Group Travel Fund</SelectItem>
                      <SelectItem value="family">Family Travel Fund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell others about your travel plans..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Fund Benefits:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Collaborative saving with progress tracking</li>
                    <li>• Secure fund management and transactions</li>
                    <li>• Easy sharing with family and friends</li>
                    <li>• Real-time updates on contributions</li>
                  </ul>
                </div>

                <Button onClick={handleCreateFund} className="w-full" disabled={!fundName || !targetAmount || !fundType}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Travel Fund
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Existing Funds Tab */}
          <TabsContent value="existing" className="space-y-6">
            {loading ? (
              <AnimatedLoadingState />
            ) : (
              <div className="grid gap-6">
                {funds.length > 0 ? (
                  funds.map((fund) => {
                    const progress = (fund.target_amount && fund.target_amount > 0) ? 
                      (fund.balance / fund.target_amount) * 100 : 0;
                    
                    return (
                      <Card key={fund.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">{fund.name || 'Unnamed Fund'}</CardTitle>
                              <CardDescription className="mt-1 capitalize">
                                {fund.fund_type?.replace('_', ' ') || 'Personal'} Fund
                                {fund.destination && ` • ${fund.destination}`}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Balance</p>
                              <p className="text-2xl font-bold text-primary">${fund.balance.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {fund.target_amount && (
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>${fund.balance.toLocaleString()} saved</span>
                                <span>${fund.target_amount.toLocaleString()} goal</span>
                              </div>
                              <Progress value={Math.min(progress, 100)} className="h-3" />
                            </div>
                          )}
                          
                          {fund.fund_code && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground">Fund Code</p>
                                  <p className="font-mono font-semibold">
                                    {showFundCodes[fund.id] ? fund.fund_code : '••••••••••'}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleFundCodeVisibility(fund.id)}
                                  >
                                    {showFundCodes[fund.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyFundCode(fund.fund_code!)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1"
                              onClick={() => {
                                setSelectedFundId(fund.id);
                                setActiveTab('add-money');
                              }}
                            >
                              Add Money
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setShareFundId(fund.id)}
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Travel Funds Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first travel fund to start saving for your dream destination!
                      </p>
                      <Button onClick={() => setActiveTab('create')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Your First Fund
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Add Money Tab */}
          <TabsContent value="add-money" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Money to Fund</CardTitle>
                <CardDescription>
                  Contribute to one of your active travel funds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="selectFund">Select Fund</Label>
                  <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a fund to contribute to" />
                    </SelectTrigger>
                    <SelectContent>
                      {funds.map((fund) => (
                        <SelectItem key={fund.id} value={fund.id}>
                          {fund.name || 'Unnamed Fund'} - ${fund.balance.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="addAmount">Amount ($)</Label>
                  <Input
                    id="addAmount"
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="100"
                    className="mt-1"
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <Button 
                  onClick={handleAddMoney} 
                  className="w-full" 
                  disabled={!selectedFundId || !addAmount || isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Coins className="mr-2 h-4 w-4" />
                      Add ${addAmount || '0'} to Fund
                    </>
                  )}
                </Button>
                
                {/* Fallback manual payment button */}
                {redirectUrl && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 mb-2">
                      Automatic redirect didn't work? Click the button below to complete your payment:
                    </p>
                    <Button 
                      onClick={() => window.open(redirectUrl, '_blank')} 
                      variant="outline" 
                      className="w-full"
                    >
                      Complete Payment Manually
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Join Fund Tab */}
          <TabsContent value="join" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Join an Existing Fund</CardTitle>
                <CardDescription>
                  Enter a fund code to join a collaborative travel fund
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="joinCode">Fund Code</Label>
                  <Input
                    id="joinCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter fund code (e.g., ABC123XYZ)"
                    className="mt-1 font-mono"
                  />
                </div>

                <Button onClick={handleJoinFund} className="w-full" disabled={!joinCode}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Fund
                </Button>

                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold mb-2">How to get a fund code:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ask the fund creator to share their fund code</li>
                    <li>• Fund codes are found in the fund details</li>
                    <li>• Each fund has a unique code for joining</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Share Fund Dialog */}
        {shareFundId && (
          <ShareFundDialog
            fund={funds.find(f => f.id === shareFundId)!}
            open={!!shareFundId}
            onOpenChange={(open) => !open && setShareFundId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default TravelFundPage;
