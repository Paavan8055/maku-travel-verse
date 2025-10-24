import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { TrendingUp, Hotel, Wallet, DollarSign, Percent, Target, Download, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OffseasonAdminDashboard() {
  // Mock KPI data
  const kpis = {
    occupancyUplift: 42.3,
    roomsFilled: 1847,
    walletActivations: 3421,
    revenueGenerated: 892341.50,
    avgDiscount: 41.2,
    dreamMatchRate: 67.8,
    activeCampaigns: 89,
    partnerParticipation: 73.4
  };

  const recentDeals = [
    { id: '1', destination: 'Bali', traveler: 'Sarah M.', amount: 1375, discount: 45, date: '2025-06-15' },
    { id: '2', destination: 'Paris', traveler: 'Mike R.', amount: 2100, discount: 38, date: '2025-06-14' },
    { id: '3', destination: 'Tokyo', traveler: 'Emma L.', amount: 1850, discount: 42, date: '2025-06-14' },
  ];

  const topPartners = [
    { name: 'Coastal Paradise Resort', rooms: 145, revenue: 287500, utilization: 92 },
    { name: 'Mountain View Hotel', rooms: 128, revenue: 245000, utilization: 87 },
    { name: 'Urban Suites Downtown', rooms: 112, revenue: 198000, utilization: 78 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Off-Season Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time KPIs and performance metrics</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription>Occupancy Uplift</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{kpis.occupancyUplift}%</div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Target: 40%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(kpis.occupancyUplift, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription>Rooms Filled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{kpis.roomsFilled.toLocaleString()}</div>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Hotel className="w-4 h-4 mr-1" />
                <span>Across {kpis.activeCampaigns} campaigns</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardDescription>Wallet Activations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{kpis.walletActivations.toLocaleString()}</div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <Wallet className="w-4 h-4 mr-1" />
                <span>+18% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription>Revenue Generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">${(kpis.revenueGenerated / 1000).toFixed(0)}K</div>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <DollarSign className="w-4 h-4 mr-1" />
                <span>YTD performance</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Discount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpis.avgDiscount}%</div>
              <Badge className="mt-2 bg-orange-100 text-orange-700">Optimal Range</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Dream Match Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpis.dreamMatchRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Of submitted dreams</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpis.activeCampaigns}</div>
              <div className="text-sm text-gray-600 mt-1">12 ending this month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Partner Participation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpis.partnerParticipation}%</div>
              <div className="text-sm text-green-600 mt-1">+5.2% from last month</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Deals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Matched Deals</CardTitle>
              <CardDescription>Latest dream-to-campaign matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{deal.destination}</div>
                      <div className="text-sm text-gray-600">{deal.traveler} • {deal.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${deal.amount}</div>
                      <Badge className="bg-green-100 text-green-700">{deal.discount}% off</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Partners */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Partners</CardTitle>
              <CardDescription>By rooms filled this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPartners.map((partner, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">{partner.name}</div>
                      <div className="text-sm text-gray-600">{partner.utilization}% utilized</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">{partner.rooms} rooms</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">${partner.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-orange-500 h-1.5 rounded-full" 
                        style={{ width: `${partner.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Heatmap Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance Heatmap</CardTitle>
            <CardDescription>Occupancy rates by month and destination</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300 h-64 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Target className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Interactive heatmap visualization</p>
                <p className="text-gray-600 text-sm">Full implementation with D3.js in production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
