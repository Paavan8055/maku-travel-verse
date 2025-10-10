import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  Coins,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

interface AdminFundData {
  id: string;
  name: string;
  creator: string;
  destination: string;
  currentAmount: number;
  targetAmount: number;
  contributorCount: number;
  createdAt: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  flagged: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

interface FundMetrics {
  totalActiveFunds: number;
  totalSavingsAmount: number;
  averageGoalCompletion: number;
  userEngagementRate: number;
  nftRewardsDistributed: number;
  monthlyGrowthRate: number;
}

export const AdminFundManagement: React.FC = () => {
  const [funds, setFunds] = useState<AdminFundData[]>([]);
  const [metrics, setMetrics] = useState<FundMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  
  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMetrics({
        totalActiveFunds: 1247,
        totalSavingsAmount: 890450,
        averageGoalCompletion: 73.2,
        userEngagementRate: 84.6,
        nftRewardsDistributed: 3891,
        monthlyGrowthRate: 15.8
      });
      
      setFunds([
        {
          id: '1',
          name: 'Bali Adventure 2025',
          creator: 'Sarah Johnson',
          destination: 'Bali, Indonesia',
          currentAmount: 3450,
          targetAmount: 5000,
          contributorCount: 8,
          createdAt: new Date('2025-09-15'),
          status: 'active',
          flagged: false,
          riskLevel: 'low'
        },
        {
          id: '2', 
          name: 'Family Europe Trip',
          creator: 'Michael Chen',
          destination: 'Paris, France',
          currentAmount: 8900,
          targetAmount: 12000,
          contributorCount: 4,
          createdAt: new Date('2025-08-20'),
          status: 'active',
          flagged: false,
          riskLevel: 'low'
        },
        {
          id: '3',
          name: 'Solo Japan Journey',
          creator: 'Emma Williams', 
          destination: 'Tokyo, Japan',
          currentAmount: 2100,
          targetAmount: 6000,
          contributorCount: 1,
          createdAt: new Date('2025-10-01'),
          status: 'active',
          flagged: true,
          riskLevel: 'medium'
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const filteredFunds = funds.filter(fund => {
    const matchesSearch = fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fund.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fund.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || fund.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || fund.riskLevel === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 text-white">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500 text-white">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge variant="outline" className="border-green-500 text-green-600">Low Risk</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium Risk</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-red-500 text-red-600">High Risk</Badge>;
      default:
        return null;
    }
  };

  const chartData = [
    { month: 'Jun', funds: 65, amount: 45000 },
    { month: 'Jul', funds: 89, amount: 67000 },
    { month: 'Aug', funds: 125, amount: 89000 },
    { month: 'Sep', funds: 178, amount: 134000 },
    { month: 'Oct', funds: 234, amount: 189000 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Funds</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalActiveFunds.toLocaleString()}</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-900">${(metrics.totalSavingsAmount / 1000).toFixed(0)}K</p>
                </div>
                <Coins className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageGoalCompletion}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.userEngagementRate}%</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">NFT Rewards</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.nftRewardsDistributed.toLocaleString()}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className="text-2xl font-bold text-gray-900">+{metrics.monthlyGrowthRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funds">Fund Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fund Growth Trends</CardTitle>
              <CardDescription>Monthly fund creation and savings trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="funds" fill="#f97316" name="New Funds" />
                  <Bar dataKey="amount" fill="#22c55e" name="Total Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Fund Management Tab */}
        <TabsContent value="funds" className="space-y-4">
          {/* Search and Filter Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search funds, creators, destinations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Fund List */}
          <div className="space-y-4">
            {filteredFunds.map((fund) => (
              <Card key={fund.id} className={`${fund.flagged ? 'border-red-300 bg-red-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-green-500 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{fund.name}</h3>
                          {fund.flagged && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        <p className="text-sm text-gray-600">
                          by {fund.creator} • {fund.destination}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            ${fund.currentAmount.toLocaleString()} / ${fund.targetAmount.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-600">
                            {fund.contributorCount} contributors
                          </span>
                          <span className="text-sm text-gray-600">
                            {Math.round((fund.currentAmount / fund.targetAmount) * 100)}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(fund.status)}
                      {getRiskBadge(fund.riskLevel)}
                      
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fund Configuration</CardTitle>
              <CardDescription>Configure global fund settings and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Maximum Fund Amount</label>
                  <Input type="number" defaultValue="50000" placeholder="Enter max amount" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Minimum Contribution</label>
                  <Input type="number" defaultValue="10" placeholder="Enter min contribution" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Maximum Contributors</label>
                  <Input type="number" defaultValue="50" placeholder="Enter max contributors" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fund Duration Limit (days)</label>
                  <Input type="number" defaultValue="365" placeholder="Enter max duration" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>NFT Reward Configuration</CardTitle>
              <CardDescription>Configure automatic NFT reward distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Milestone NFTs</p>
                    <p className="text-sm text-gray-600">Automatic NFT rewards at 25%, 50%, 75%, 100% completion</p>
                  </div>
                  <Button size="sm">Configure</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Contribution NFTs</p>
                    <p className="text-sm text-gray-600">Rewards based on contribution tiers (Bronze, Silver, Gold, Platinum)</p>
                  </div>
                  <Button size="sm">Configure</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Achievement NFTs</p>
                    <p className="text-sm text-gray-600">Special rewards for streaks, social engagement, and goal crushing</p>
                  </div>
                  <Button size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFundManagement;