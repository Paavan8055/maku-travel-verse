import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { Plus, Calendar, TrendingUp, DollarSign, Users, Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OffseasonPartnerDashboard() {
  const [campaigns, setCampaigns] = useState([
    {
      id: '1',
      title: 'Summer Off-Season Special',
      startDate: '2025-06-01',
      endDate: '2025-08-31',
      discount: 40,
      minAllocation: 10,
      maxAllocation: 50,
      currentAllocation: 35,
      status: 'active',
      revenue: 67500
    },
    {
      id: '2',
      title: 'Winter Escape',
      startDate: '2025-12-01',
      endDate: '2026-02-28',
      discount: 35,
      minAllocation: 15,
      maxAllocation: 60,
      currentAllocation: 12,
      status: 'active',
      revenue: 28400
    },
    {
      id: '3',
      title: 'Spring Break Alternative',
      startDate: '2025-04-15',
      endDate: '2025-05-15',
      discount: 45,
      minAllocation: 5,
      maxAllocation: 30,
      currentAllocation: 30,
      status: 'completed',
      revenue: 45000
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    startDate: '',
    endDate: '',
    discount: 40,
    minAllocation: 10,
    maxAllocation: 50,
    audienceTags: ''
  });

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating campaign:', newCampaign);
    // In production, this would call POST /api/partners/campaigns
    setShowCreateForm(false);
    setNewCampaign({
      title: '',
      startDate: '',
      endDate: '',
      discount: 40,
      minAllocation: 10,
      maxAllocation: 50,
      audienceTags: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      completed: 'bg-blue-100 text-blue-700',
      paused: 'bg-yellow-100 text-yellow-700'
    };
    return <Badge className={variants[status] || variants.draft}>{status.toUpperCase()}</Badge>;
  };

  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalRoomsFilled = campaigns.reduce((sum, c) => sum + c.currentAllocation, 0);
  const avgUtilization = campaigns.length > 0 
    ? Math.round((campaigns.reduce((sum, c) => sum + (c.currentAllocation / c.maxAllocation), 0) / campaigns.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your off-season campaigns and track performance</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+12.5% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{activeCampaigns}</div>
              <div className="text-sm text-gray-600 mt-1">2 ending this month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rooms Filled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalRoomsFilled}</div>
              <div className="text-sm text-gray-600 mt-1">Across all campaigns</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{avgUtilization}%</div>
              <div className="text-sm text-gray-600 mt-1">Of max allocation</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Campaign Form */}
        {showCreateForm && (
          <Card className="mb-8 border-orange-200">
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
              <CardDescription>Define your off-season inventory and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCampaign} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Title *</label>
                  <Input
                    required
                    placeholder="e.g., Summer Off-Season Special"
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <Input
                      required
                      type="date"
                      value={newCampaign.startDate}
                      onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <Input
                      required
                      type="date"
                      value={newCampaign.endDate}
                      onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount % *</label>
                    <Input
                      required
                      type="number"
                      min="1"
                      max="100"
                      value={newCampaign.discount}
                      onChange={(e) => setNewCampaign({ ...newCampaign, discount: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Rooms *</label>
                    <Input
                      required
                      type="number"
                      min="1"
                      value={newCampaign.minAllocation}
                      onChange={(e) => setNewCampaign({ ...newCampaign, minAllocation: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Rooms *</label>
                    <Input
                      required
                      type="number"
                      min="1"
                      value={newCampaign.maxAllocation}
                      onChange={(e) => setNewCampaign({ ...newCampaign, maxAllocation: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audience Tags (comma separated)
                  </label>
                  <Input
                    placeholder="e.g., family, beach, summer"
                    value={newCampaign.audienceTags}
                    onChange={(e) => setNewCampaign({ ...newCampaign, audienceTags: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Help us match your campaign with the right travelers
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    Create Campaign
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Campaigns</h2>
          
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{campaign.startDate} to {campaign.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>{campaign.discount}% discount</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{campaign.currentAllocation} / {campaign.maxAllocation} rooms</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>${campaign.revenue.toLocaleString()} revenue</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">
                          {Math.round((campaign.currentAllocation / campaign.maxAllocation) * 100)}%
                        </span> utilized
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" title="View Ledger">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Edit Campaign">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
