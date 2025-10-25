/**
 * Next-Generation Partner Dashboard
 * Enterprise-grade analytics, occupancy optimization, inventory management
 * Industry-leading OTA dashboard design
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, DollarSign, Calendar, Target, BarChart3,
  Users, Award, AlertCircle, Download, Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const NextGenPartnerDashboard = () => {
  const [stats, setStats] = useState({
    occupancy_rate: 0,
    adr: 0,
    revpar: 0,
    bookings_this_month: 0,
    revenue_this_month: 0,
    avg_lead_time: 0,
    bid_win_rate: 0
  });

  useEffect(() => {
    fetchPartnerStats();
  }, []);

  const fetchPartnerStats = async () => {
    // TODO: Connect to real API
    // Mock data for demonstration
    setStats({
      occupancy_rate: 72.5,
      adr: 245,
      revpar: 177.6,
      bookings_this_month: 47,
      revenue_this_month: 45230,
      avg_lead_time: 23,
      bid_win_rate: 67
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Partner Dashboard</h1>
            <p className="text-slate-600">Real-time analytics & occupancy optimization</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-600">Occupancy Rate</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats.occupancy_rate}%</p>
            <p className="text-sm text-green-600">↑ 8.3% vs last month</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-600">ADR</p>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-1">${stats.adr}</p>
            <p className="text-sm text-slate-500">Average Daily Rate</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-600">RevPAR</p>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-1">${stats.revpar}</p>
            <p className="text-sm text-slate-500">Revenue per Available Room</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-600">Bid Win Rate</p>
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats.bid_win_rate}%</p>
            <p className="text-sm text-green-600">↑ 12% improvement</p>
          </Card>
        </div>

        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="analytics">
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="occupancy">Occupancy Optimizer</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="settlements">Settlements</TabsTrigger>
              <TabsTrigger value="benchmarking">Benchmarking</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-bold mb-4">Revenue Trends</h3>
                  <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                    <p className="text-slate-500">Chart: Revenue Last 12 Months</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold mb-4">Booking Lead Times</h3>
                  <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                    <p className="text-slate-500">Chart: Lead Time Distribution</p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="occupancy" className="mt-6">
              <div className="space-y-6">
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
                          Auto-Bid 30% Discount (Estimated +12% occupancy)
                        </Button>
                        <Button variant="outline">
                          Review Matching Dreams
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold mb-4">Occupancy Calendar - Next 90 Days</h3>
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
              </div>
            </TabsContent>

            <TabsContent value="settlements" className="mt-6">
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

            <TabsContent value="benchmarking" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-xl mb-6">Market Benchmarking</h3>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">Your ADR</p>
                    <p className="text-3xl font-bold mb-1">${stats.adr}</p>
                    <p className="text-sm text-green-600">↑ 5% above market avg</p>
                  </div>
                  <div className="text-center p-6 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">Market Avg ADR</p>
                    <p className="text-3xl font-bold mb-1">$233</p>
                    <p className="text-sm text-slate-500">Maldives luxury segment</p>
                  </div>
                  <div className="text-center p-6 bg-slate-50 rounded-lg">
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

export default NextGenPartnerDashboard;