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
import { useToast } from '@/hooks/use-toast';
import { useTravelFunds } from '@/hooks/useTravelFunds';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AnimatedLoadingState } from '@/components/ux/EnhancedUserExperience';
import { Users, Target, Calendar, TrendingUp, PlusCircle, Coins, Copy, Share2, UserPlus } from 'lucide-react';

const TravelFundPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { funds, loading, createFund, addFunds, joinFundByCode } = useTravelFunds();
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

    const result = await addFunds(selectedFundId, parseFloat(addAmount));
    
    if (result) {
      setSelectedFundId('');
      setAddAmount('');
    }
  };

  const handleJoinFund = async () => {
    if (!joinCode) {
      toast({
        title: "Missing Information",
        description: "Please enter a fund code.",
        variant: "destructive"
      });
      return;
    }

    const result = await joinFundByCode(joinCode);
    
    if (result) {
      setJoinCode('');
      setActiveTab('existing');
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
            <TabsTrigger value="create">Create New Fund</TabsTrigger>
            <TabsTrigger value="existing">My Funds</TabsTrigger>
            <TabsTrigger value="add-money">Add Money</TabsTrigger>
            <TabsTrigger value="join">Join Fund</TabsTrigger>
          </TabsList>

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
                                  <p className="font-mono font-semibold">{fund.fund_code}</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyFundCode(fund.fund_code!)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
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
                            <Button variant="outline" className="flex-1">
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

                <Button onClick={handleAddMoney} className="w-full" disabled={!selectedFundId || !addAmount}>
                  <Coins className="mr-2 h-4 w-4" />
                  Add ${addAmount || '0'} to Fund
                </Button>
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
      </div>
    </div>
  );
};

export default TravelFundPage;
