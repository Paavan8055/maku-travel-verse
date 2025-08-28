import React, { useState, useEffect } from 'react';
import { Eye, Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { activityAPI } from '@/lib/otaDataClient';

interface SocialProofIndicatorsProps {
  itemType: string;
  itemId: string;
  itemData?: any;
  className?: string;
}

interface ActivityData {
  recent_views: number;
  bookings_today: number;
  availability: 'high' | 'medium' | 'low';
  trending_score: number;
}

export const SocialProofIndicators: React.FC<SocialProofIndicatorsProps> = ({
  itemType,
  itemId,
  itemData,
  className = ''
}) => {
  const [activityData, setActivityData] = useState<ActivityData>({
    recent_views: 0,
    bookings_today: 0,
    availability: 'high',
    trending_score: 0
  });

  useEffect(() => {
    // Log this view
    activityAPI.logActivity({
      activity_type: 'view',
      item_type: itemType,
      item_id: itemId,
      item_data: itemData
    });

    // Simulate social proof data (in real app, this would come from backend)
    generateSocialProofData();
  }, [itemType, itemId]);

  const generateSocialProofData = () => {
    // Simulate realistic activity data
    setActivityData({
      recent_views: Math.floor(Math.random() * 50) + 10,
      bookings_today: Math.floor(Math.random() * 20) + 1,
      availability: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
      trending_score: Math.floor(Math.random() * 100)
    });
  };

  const getAvailabilityInfo = () => {
    switch (activityData.availability) {
      case 'low':
        return {
          text: 'Limited availability',
          variant: 'destructive' as const,
          icon: AlertCircle
        };
      case 'medium':
        return {
          text: 'Few spots left',
          variant: 'secondary' as const,
          icon: Clock
        };
      default:
        return {
          text: 'Good availability',
          variant: 'secondary' as const,
          icon: Users
        };
    }
  };

  const availabilityInfo = getAvailabilityInfo();
  const AvailabilityIcon = availabilityInfo.icon;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Recent Activity */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1.5">
          <Eye className="w-3 h-3" />
          {activityData.recent_views} people viewed today
        </Badge>
        
        <Badge variant="outline" className="gap-1.5">
          <Users className="w-3 h-3" />
          {activityData.bookings_today} booked today
        </Badge>
      </div>

      {/* Availability Status */}
      <Badge variant={availabilityInfo.variant} className="gap-1.5">
        <AvailabilityIcon className="w-3 h-3" />
        {availabilityInfo.text}
      </Badge>

      {/* Trending Indicator */}
      {activityData.trending_score > 70 && (
        <Badge variant="default" className="gap-1.5">
          <TrendingUp className="w-3 h-3" />
          Trending destination
        </Badge>
      )}

      {/* Urgency Messages */}
      {activityData.availability === 'low' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                High demand! Only a few spots remaining for your dates.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent booking notification */}
      {activityData.bookings_today > 5 && (
        <div className="text-sm text-muted flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Someone just booked this 3 minutes ago</span>
        </div>
      )}
    </div>
  );
};