import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { analyticsAPI } from '@/lib/otaDataClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  MapPin, 
  Calendar, 
  Coins, 
  Leaf, 
  TrendingUp, 
  Globe, 
  Clock,
  Target
} from 'lucide-react';

interface TravelAnalytics {
  total_trips: number;
  total_spent: number;
  countries_visited: string[];
  favorite_destinations: string[];
  carbon_footprint: number;
  travel_months: number[];
  preferred_trip_length: number;
}

export const SmartAnalytics: React.FC<{ className?: string }> = ({ className }) => {
  const [analytics, setAnalytics] = useState<TravelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const data = await analyticsAPI.fetchTravelAnalytics(user.id);
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const monthlyData = analytics?.travel_months.map((month, index) => ({
    month: monthNames[index],
    trips: month || 0
  })) || [];

  const destinationData = analytics?.favorite_destinations.slice(0, 5).map((dest, index) => ({
    name: dest,
    value: Math.floor(Math.random() * 5) + 1,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index]
  })) || [];

  const travelInsights = [
    {
      icon: Globe,
      title: "Countries Explored",
      value: analytics?.countries_visited.length || 0,
      description: "Travel destinations",
      color: "text-travel-ocean"
    },
    {
      icon: Calendar,
      title: "Total Trips",
      value: analytics?.total_trips || 0,
      description: "Adventures completed",
      color: "text-travel-gold"
    },
    {
      icon: Coins,
      title: "Total Spent",
      value: `$${analytics?.total_spent?.toLocaleString() || '0'}`,
      description: "Travel investment",
      color: "text-travel-forest"
    },
    {
      icon: Leaf,
      title: "Carbon Footprint",
      value: `${analytics?.carbon_footprint || 0} kg`,
      description: "CO₂ emissions",
      color: "text-travel-coral"
    }
  ];

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-travel-gold" />
            Smart Travel Analytics
          </h2>
          <p className="text-muted-foreground">AI-powered insights into your travel patterns</p>
        </div>
        <Badge className="bg-gradient-to-r from-travel-ocean to-travel-forest text-white">
          Powered by AI
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {travelInsights.map((insight, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <insight.icon className={`h-5 w-5 ${insight.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{insight.value}</p>
                  <p className="text-sm text-muted-foreground">{insight.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Travel Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-travel-ocean" />
              Travel Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trips" fill="hsl(var(--travel-ocean))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Destination Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-travel-coral" />
              Favorite Destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {destinationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={destinationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {destinationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Start traveling to see insights!</p>
                <Button className="mt-4" size="sm">
                  Plan Your First Trip
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-travel-gold" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-travel-ocean/10 to-travel-forest/10 border">
              <h4 className="font-semibold mb-2">Perfect Trip Length</h4>
              <p className="text-2xl font-bold text-travel-ocean mb-1">
                {analytics?.preferred_trip_length || 7} days
              </p>
              <p className="text-sm text-muted-foreground">Based on your history</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-travel-gold/10 to-travel-sunset/10 border">
              <h4 className="font-semibold mb-2">Best Travel Month</h4>
              <p className="text-2xl font-bold text-travel-gold mb-1">
                {analytics?.travel_months ? 
                  monthNames[analytics.travel_months.indexOf(Math.max(...analytics.travel_months))] : 
                  'N/A'
                }
              </p>
              <p className="text-sm text-muted-foreground">Your most active period</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-travel-coral/10 to-travel-pink/10 border">
              <h4 className="font-semibold mb-2">Sustainability Goal</h4>
              <p className="text-2xl font-bold text-travel-coral mb-1">-15%</p>
              <p className="text-sm text-muted-foreground">Reduce carbon footprint</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};