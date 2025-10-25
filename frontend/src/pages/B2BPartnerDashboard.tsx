/**
 * B2B Partner Dashboard - Bidding Platform
 * Hotels/Airlines bid on user dreams to optimize occupancy
 */

import { useState, useEffect } from 'react';
import {
  Target, TrendingDown, Calendar, DollarSign, Users, Clock,
  Send, Filter, ArrowUp, ArrowDown, Award, BarChart3
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DreamOpportunity {
  dreamId: string;
  userId: string;
  destination: string;
  budget: { min: number; max: number };
  dates: { start: string; end: string; flexible: boolean };
  travelers: number;
  preferences: string[];
  urgency: 'high' | 'medium' | 'low';
  savingsProgress: number;
  activeBids: number;
  yourBidRank?: number;
}

const B2BPartnerDashboard = () => {
  const [opportunities, setOpportunities] = useState<DreamOpportunity[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    // TODO: Connect to real API
    // Mock data
    setOpportunities([
      {
        dreamId: 'dream-user-123',
        userId: 'user-456',
        destination: 'Maldives',
        budget: { min: 5000, max: 7500 },
        dates: { start: '2025-05-15', end: '2025-05-22', flexible: true },
        travelers: 2,
        preferences: ['Overwater villa', 'Spa', 'Diving'],
        urgency: 'high',
        savingsProgress: 65,
        activeBids: 8,
        yourBidRank: 3
      },
      {
        dreamId: 'dream-user-789',
        userId: 'user-012',
        destination: 'Bali',
        budget: { min: 2000, max: 3500 },
        dates: { start: '2025-06-01', end: '2025-06-10', flexible: true },
        travelers: 4,
        preferences: ['Family-friendly', 'Beach', 'Cultural tours'],
        urgency: 'medium',
        savingsProgress: 40,
        activeBids: 5
      }
    ]);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Partner Bidding Dashboard</h1>
          <p className="text-slate-600">Bid on user dreams to optimize your occupancy</p>
        </div>
      </div>

      {/* Stats */}
      <section className="p-6 bg-gradient-to-br from-purple-600 to-rose-600">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6">
          {[
            { label: 'Active Dreams', value: '47', icon: Target, color: 'text-white' },
            { label: 'Your Active Bids', value: '12', icon: Send, color: 'text-yellow-300' },
            { label: 'Won This Month', value: '23', icon: Award, color: 'text-green-300' },
            { label: 'Revenue Generated', value: '$45.2K', icon: DollarSign, color: 'text-white' }
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="opportunities">
            <TabsList>
              <TabsTrigger value="opportunities">Dream Opportunities</TabsTrigger>
              <TabsTrigger value="myBids">My Bids</TabsTrigger>
              <TabsTrigger value="occupancy">Occupancy Optimizer</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities" className="mt-6">
              {/* Filters */}
              <Card className="p-4 mb-6">
                <div className="flex gap-4">
                  <Input placeholder="Filter by destination..." className="max-w-xs" />
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </Card>

              {/* Opportunities List */}
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <Card key={opp.dreamId} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{opp.destination} Dream</h3>
                          <Badge className={getUrgencyColor(opp.urgency)}>
                            {opp.urgency} urgency
                          </Badge>
                          {opp.yourBidRank && (
                            <Badge className="bg-purple-100 text-purple-700">
                              Your bid: #{opp.yourBidRank}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span><Users className="w-4 h-4 inline mr-1" />{opp.travelers} travelers</span>
                          <span><Calendar className="w-4 h-4 inline mr-1" />{opp.dates.start}</span>
                          <span><DollarSign className="w-4 h-4 inline mr-1" />${opp.budget.min}-${opp.budget.max}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-600 mb-1">Savings Progress</p>
                        <p className="text-3xl font-bold text-green-600">{opp.savingsProgress}%</p>
                        <Badge className="mt-2">{opp.activeBids} Active Bids</Badge>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2">USER PREFERENCES</p>
                      <div className="flex flex-wrap gap-2">
                        {opp.preferences.map((pref, idx) => (
                          <Badge key={idx} variant="outline">{pref}</Badge>
                        ))}
                        {opp.dates.flexible && (
                          <Badge className="bg-orange-100 text-orange-700">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Flexible Dates (Better for you!)
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    {opp.dates.flexible && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          💡 <strong>AI Suggestion:</strong> This user has flexible dates and 65% savings. 
                          Offer 25-30% discount for off-season dates (May) to win bid and fill occupancy!
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1">
                        View Full Dream Details
                      </Button>
                      <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                        <Send className="w-4 h-4 mr-2" />
                        Submit Bid
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="occupancy">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Occupancy Optimizer</h3>
                <p className="text-slate-600 mb-6">
                  AI identifies your low-occupancy periods and matches with flexible-date dreams
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">May 15-30, 2025</h4>
                      <Badge className="bg-red-600 text-white">38% Occupancy</Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">
                      📊 <strong>15 dreams</strong> match this period with flexible dates
                    </p>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      Auto-Bid on All 15 Dreams (30% off)
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Jun 1-15, 2025</h4>
                      <Badge className="bg-yellow-600 text-white">62% Occupancy</Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">
                      📊 <strong>8 dreams</strong> match this period
                    </p>
                    <Button className="w-full" variant="outline">
                      Review Matching Dreams
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Bid Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Win Rate</span>
                      <span className="font-bold text-green-600">67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Discount Offered</span>
                      <span className="font-bold">26%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Occupancy Improvement</span>
                      <span className="font-bold text-purple-600">+18%</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Revenue Impact</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Revenue This Month</span>
                      <span className="font-bold">$45,230</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">OTA Fees Saved</span>
                      <span className="font-bold text-green-600">$6,785</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Net Gain</span>
                      <span className="font-bold text-purple-600">+$12,450</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default B2BPartnerDashboard;
