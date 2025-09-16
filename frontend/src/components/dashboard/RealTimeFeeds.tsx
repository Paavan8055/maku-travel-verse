import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { activityAPI } from '@/lib/otaDataClient';
import logger from "@/utils/logger";
import { 
  Activity, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Users, 
  Plane, 
  Hotel,
  Calendar,
  Star,
  AlertCircle
} from 'lucide-react';

interface RealTimeActivity {
  activity_type: string;
  item_type?: string;
  item_id?: string;
  location?: string;
  created_at: string;
  item_data?: any;
}

export const RealTimeFeeds: React.FC<{ className?: string }> = ({ className }) => {
  const [activities, setActivities] = useState<RealTimeActivity[]>([]);
  const [hotDestinations] = useState([
    { name: 'Bali, Indonesia', bookings: 45, trend: '+12%' },
    { name: 'Tokyo, Japan', bookings: 38, trend: '+8%' },
    { name: 'Paris, France', bookings: 32, trend: '+15%' },
    { name: 'Dubai, UAE', bookings: 28, trend: '+5%' }
  ]);
  const [priceAlerts] = useState([
    { destination: 'Sydney → Melbourne', price: '$89', change: '-23%', type: 'flight' },
    { destination: 'Marriott Sydney', price: '$189', change: '-15%', type: 'hotel' },
    { destination: 'Tokyo City Tour', price: '$45', change: '-8%', type: 'activity' }
  ]);

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        const data = await activityAPI.fetchRecentActivity(undefined, 10);
        setActivities(data || []);
      } catch (error) {
        logger.error('Error loading activities:', error);
      }
    };

    loadRecentActivity();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      loadRecentActivity();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (activityType: string, itemType?: string) => {
    switch (activityType) {
      case 'search':
        return <Activity className="h-4 w-4 text-travel-ocean" />;
      case 'booking':
        return itemType === 'flight' ? <Plane className="h-4 w-4 text-travel-sky" /> : 
               <Hotel className="h-4 w-4 text-travel-coral" />;
      case 'view':
        return <MapPin className="h-4 w-4 text-travel-forest" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityDescription = (activity: RealTimeActivity) => {
    const action = activity.activity_type.replace('_', ' ');
    const itemType = activity.item_type ? ` ${activity.item_type}` : '';
    const location = activity.location ? ` in ${activity.location}` : '';
    
    return `${action}${itemType}${location}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-travel-coral" />
            Real-time Travel Intelligence
          </h2>
          <p className="text-muted-foreground">Live data streams and market insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-600 font-medium">LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-travel-coral" />
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="mt-1">
                      {getActivityIcon(activity.activity_type, activity.item_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize truncate">
                        {getActivityDescription(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trending Destinations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-travel-gold" />
              Hot Destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hotDestinations.map((dest, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/50 to-transparent border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-travel-gold/20 rounded-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-travel-gold" />
                    </div>
                    <div>
                      <p className="font-medium">{dest.name}</p>
                      <p className="text-sm text-muted-foreground">{dest.bookings} bookings today</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {dest.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-travel-ocean" />
              Price Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priceAlerts.map((alert, index) => (
                <div key={index} className="p-3 rounded-lg border border-travel-ocean/20 bg-travel-ocean/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{alert.destination}</p>
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      {alert.change}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-travel-ocean">{alert.price}</span>
                    <Button size="sm" variant="outline" className="text-xs">
                      Book Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Set More Alerts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Market Intelligence */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-travel-forest" />
            Market Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-travel-sky/10 to-travel-ocean/10">
              <Plane className="h-8 w-8 text-travel-sky mx-auto mb-2" />
              <p className="text-2xl font-bold">+12%</p>
              <p className="text-sm text-muted-foreground">Flight bookings vs last week</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-travel-coral/10 to-travel-pink/10">
              <Hotel className="h-8 w-8 text-travel-coral mx-auto mb-2" />
              <p className="text-2xl font-bold">+8%</p>
              <p className="text-sm text-muted-foreground">Hotel bookings vs last week</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-travel-gold/10 to-travel-sunset/10">
              <Star className="h-8 w-8 text-travel-gold mx-auto mb-2" />
              <p className="text-2xl font-bold">4.8</p>
              <p className="text-sm text-muted-foreground">Average customer rating</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-travel-forest/10 to-travel-ocean/10">
              <Users className="h-8 w-8 text-travel-forest mx-auto mb-2" />
              <p className="text-2xl font-bold">2.4K</p>
              <p className="text-sm text-muted-foreground">Active users today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
