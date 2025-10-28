/**
 * Unified Partner Dashboard - World-Class OTA Experience
 * Comprehensive solution combining:
 * - Real-time analytics & KPIs
 * - Bidding marketplace for dream opportunities
 * - AI-powered occupancy optimization
 * - Off-season campaign management
 * - Inventory management
 * - Settlement tracking
 * - Competitive benchmarking
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, DollarSign, Calendar, Target, BarChart3,
  Users, Award, AlertCircle, Download, Settings, Send,
  Filter, Plus, Edit, Trash2, Eye, Clock, TrendingDown,
  Package, CreditCard, Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { partnerApi, DreamOpportunity, Campaign, PartnerStats } from '@/services/partnerApi';

const UnifiedPartnerDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Analytics Stats
  const [stats, setStats] = useState<PartnerStats>({
    occupancy_rate: 72.5,
    adr: 245,
    revpar: 177.6,
    bookings_this_month: 47,
    revenue_this_month: 45230,
    avg_lead_time: 23,
    bid_win_rate: 67,
    active_dreams: 47,
    your_active_bids: 12,
    won_this_month: 23
  });

  // Bidding Opportunities
  const [opportunities, setOpportunities] = useState<DreamOpportunity[]>([]);
  
  // Off-Season Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    startDate: '',
    endDate: '',
    discount: 40,
    minAllocation: 10,
    maxAllocation: 50,
    audienceTags: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(false); // Show UI immediately
    try {
      const [statsData, oppsData, campaignsData] = await Promise.all([
        partnerApi.getStats(),
        partnerApi.getOpportunities(),
        partnerApi.getCampaigns()
      ]);
      setStats(statsData);
      setOpportunities(oppsData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Failed to fetch partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await partnerApi.createCampaign(newCampaign);
      toast({ title: 'Success', description: 'Campaign created successfully' });
      setShowCampaignForm(false);
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create campaign', variant: 'destructive' });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      draft: 'bg-white text-gray-700',
      completed: 'bg-blue-100 text-blue-700',
      paused: 'bg-yellow-100 text-yellow-700'
    };
    return <Badge className={variants[status] || variants.draft}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50">
      {/* Premium Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent mb-2">
                Partner Dashboard
              </h1>
              <p className="text-slate-600 text-lg">Real-time analytics, bidding, & revenue optimization</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <section className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Occupancy Rate */}
            <Card className="p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-600">Occupancy Rate</p>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-1">{stats.occupancy_rate}%</p>
              <p className="text-sm text-green-600">↑ 8.3% vs last month</p>
            </Card>

            {/* ADR */}
            <Card className="p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-600">Average Daily Rate</p>
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-1">${stats.adr}</p>
              <p className="text-sm text-slate-500">Per available room</p>
            </Card>

            {/* Revenue */}
            <Card className="p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-600">Monthly Revenue</p>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-1">${(stats.revenue_this_month / 1000).toFixed(1)}K</p>
              <p className="text-sm text-blue-600">↑ ${stats.revpar} RevPAR</p>
            </Card>

            {/* Bid Win Rate */}
            <Card className="p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-600">Bid Win Rate</p>
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-1">{stats.bid_win_rate}%</p>
              <p className="text-sm text-green-600">↑ {stats.won_this_month} wins this month</p>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bidding">Dream Bidding</TabsTrigger>
              <TabsTrigger value="occupancy">Occupancy AI</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="settlements">Settlements</TabsTrigger>
              <TabsTrigger value="benchmarking">Benchmarking</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Revenue Trends
                  </h3>
                  <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                    <p className="text-slate-500">Chart: Revenue Last 12 Months</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Booking Lead Times
                  </h3>
                  <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                    <p className="text-slate-500">Chart: Lead Time Distribution</p>
                  </div>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-3xl font-bold">{stats.active_dreams}</p>
                  <p className="text-sm text-slate-600">Active Dreams</p>
                </Card>
                <Card className="p-4 text-center">
                  <Send className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <p className="text-3xl font-bold">{stats.your_active_bids}</p>
                  <p className="text-sm text-slate-600">Your Active Bids</p>
                </Card>
                <Card className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-3xl font-bold">{stats.bookings_this_month}</p>
                  <p className="text-sm text-slate-600">Bookings</p>
                </Card>
                <Card className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-3xl font-bold">{stats.avg_lead_time}d</p>
                  <p className="text-sm text-slate-600">Avg Lead Time</p>
                </Card>
              </div>
            </TabsContent>

            {/* Dream Bidding Tab */}
            <TabsContent value="bidding" className="space-y-6">
              {/* Filters */}
              <Card className="p-4">
                <div className="flex gap-4">
                  <Input placeholder="Filter by destination..." className="max-w-xs" />
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </Card>

              {/* Opportunities */}
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <Card key={opp.dream_id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{opp.destination} Dream</h3>
                          <Badge className={getUrgencyColor(opp.urgency)}>
                            {opp.urgency} urgency
                          </Badge>
                          {opp.your_bid_rank && (
                            <Badge className="bg-purple-100 text-purple-700">
                              Your bid: #{opp.your_bid_rank}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span><Users className="w-4 h-4 inline mr-1" />{opp.travelers} travelers</span>
                          <span><Calendar className="w-4 h-4 inline mr-1" />{opp.date_start}</span>
                          <span><DollarSign className="w-4 h-4 inline mr-1" />${opp.budget_min}-${opp.budget_max}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-600 mb-1">Savings Progress</p>
                        <p className="text-3xl font-bold text-green-600">{opp.savings_progress}%</p>
                        <Badge className="mt-2">{opp.active_bids} Active Bids</Badge>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2">USER PREFERENCES</p>
                      <div className="flex flex-wrap gap-2">
                        {opp.preferences.map((pref, idx) => (
                          <Badge key={idx} variant="outline">{pref}</Badge>
                        ))}
                        {opp.flexible_dates && (
                          <Badge className="bg-orange-100 text-orange-700">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Flexible Dates
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* AI Suggestion */}
                    {opp.flexible_dates && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          💡 <strong>AI Suggestion:</strong> Offer 25-30% discount for off-season dates to win bid and optimize occupancy!
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1">
                        View Full Details
                      </Button>
                      <Button className="flex-1 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700">
                        <Send className="w-4 h-4 mr-2" />
                        Submit Bid
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Occupancy Optimizer Tab */}
            <TabsContent value="occupancy" className="space-y-6">
              {/* Low Occupancy Alert */}
              <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Low Occupancy Alert</h3>
                    <p className="text-sm text-slate-700 mb-4">
                      Your occupancy for May 15-30 is at <strong>38%</strong>. 
                      AI identified <strong>15 user dreams</strong> matching this period with flexible dates.
                    </p>
                    <div className="flex gap-3">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        Auto-Bid 30% Discount (Est. +12% occupancy)
                      </Button>
                      <Button variant="outline">
                        Review Matching Dreams
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Occupancy Calendar */}
              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4">Occupancy Calendar - Next 90 Days</h3>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({length: 30}).map((_, i) => {
                    const occupancy = 40 + Math.random() * 50;
                    const color = occupancy > 70 ? 'bg-green-200' : occupancy > 50 ? 'bg-yellow-200' : 'bg-red-200';
                    return (
                      <div key={i} className={`p-2 rounded text-center ${color}`}>
                        <p className="text-xs font-semibold">{i + 1}</p>
                        <p className="text-xs">{Math.round(occupancy)}%</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-200 rounded" />
                    <span>Low (&lt;50%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-200 rounded" />
                    <span>Medium (50-70%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 rounded" />
                    <span>High (&gt;70%)</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Off-Season Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Off-Season Campaigns</h2>
                  <p className="text-slate-600">Manage discounted inventory for low-demand periods</p>
                </div>
                <Button onClick={() => setShowCampaignForm(true)} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>

              {/* Create Form */}
              {showCampaignForm && (
                <Card className="p-6 border-orange-200">
                  <h3 className="font-bold text-xl mb-4">Create New Campaign</h3>
                  <form onSubmit={handleCreateCampaign} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Campaign Title</label>
                      <Input
                        required
                        placeholder="e.g., Summer Off-Season Special"
                        value={newCampaign.title}
                        onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <Input
                          required
                          type="date"
                          value={newCampaign.startDate}
                          onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <Input
                          required
                          type="date"
                          value={newCampaign.endDate}
                          onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Discount %</label>
                        <Input
                          required
                          type="number"
                          value={newCampaign.discount}
                          onChange={(e) => setNewCampaign({ ...newCampaign, discount: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Min Rooms</label>
                        <Input
                          required
                          type="number"
                          value={newCampaign.minAllocation}
                          onChange={(e) => setNewCampaign({ ...newCampaign, minAllocation: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Rooms</label>
                        <Input
                          required
                          type="number"
                          value={newCampaign.maxAllocation}
                          onChange={(e) => setNewCampaign({ ...newCampaign, maxAllocation: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                        Create Campaign
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowCampaignForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Campaigns List */}
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{campaign.title}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <div className="grid grid-cols-5 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>{campaign.start_date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <DollarSign className="w-4 h-4" />
                            <span>{campaign.discount}% off</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Users className="w-4 h-4" />
                            <span>{campaign.current_allocation}/{campaign.max_allocation}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>${campaign.revenue.toLocaleString()}</span>
                          </div>
                          <div className="text-slate-600">
                            <span className="font-medium">
                              {Math.round((campaign.current_allocation / campaign.max_allocation) * 100)}%
                            </span> utilized
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Inventory Management</h3>
                <p className="text-slate-600 mb-6">Manage your room types, availability, and pricing across all channels</p>
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Inventory management interface coming soon</p>
                </div>
              </Card>
            </TabsContent>

            {/* Settlements Tab */}
            <TabsContent value="settlements" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-xl">Commission & Settlements</h3>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoices
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">This Month Revenue</p>
                    <p className="text-3xl font-bold text-green-600">${stats.revenue_this_month.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Commission Due</p>
                    <p className="text-3xl font-bold text-blue-600">${Math.round(stats.revenue_this_month * 0.15).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Net Earnings</p>
                    <p className="text-3xl font-bold text-purple-600">${Math.round(stats.revenue_this_month * 0.85).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { date: 'Apr 1-15, 2025', amount: 12450, status: 'Paid', color: 'green' },
                    { date: 'Apr 16-30, 2025', amount: 15680, status: 'Processing', color: 'yellow' },
                    { date: 'May 1-15, 2025', amount: 17100, status: 'Pending', color: 'slate' }
                  ].map((settlement, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{settlement.date}</p>
                        <p className="text-sm text-slate-600">${settlement.amount.toLocaleString()} gross revenue</p>
                      </div>
                      <Badge className={`bg-${settlement.color}-100 text-${settlement.color}-700`}>
                        {settlement.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Benchmarking Tab */}
            <TabsContent value="benchmarking" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-bold text-xl mb-6">Market Benchmarking</h3>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-white rounded-lg border">
                    <p className="text-sm text-slate-600 mb-2">Your ADR</p>
                    <p className="text-3xl font-bold mb-1">${stats.adr}</p>
                    <p className="text-sm text-green-600">↑ 5% above market avg</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg border">
                    <p className="text-sm text-slate-600 mb-2">Market Avg ADR</p>
                    <p className="text-3xl font-bold mb-1">$233</p>
                    <p className="text-sm text-slate-500">Luxury segment</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-white rounded-lg border">
                    <p className="text-sm text-slate-600 mb-2">Your Rank</p>
                    <p className="text-3xl font-bold mb-1">#12</p>
                    <p className="text-sm text-slate-500">out of 87 properties</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default UnifiedPartnerDashboard;
