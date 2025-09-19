import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  Trophy, 
  TrendingUp,
  UserPlus,
  Target,
  Share2,
  Users
} from 'lucide-react';
import { SocialActivity } from '@/types/gamification-types';
import { cn } from '@/lib/utils';

interface SocialActivityFeedProps {
  activities: SocialActivity[];
  onLike?: (activityId: string) => void;
  onComment?: (activityId: string) => void;
  onShare?: (activityId: string) => void;
  loading?: boolean;
}

export const SocialActivityFeed: React.FC<SocialActivityFeedProps> = ({
  activities,
  onLike,
  onComment,
  onShare,
  loading = false,
}) => {
  const getActivityIcon = (activityType: SocialActivity['activity_type']) => {
    switch (activityType) {
      case 'destination_added':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'achievement_unlocked':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'level_up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'friend_added':
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case 'challenge_completed':
        return <Target className="h-4 w-4 text-orange-500" />;
      case 'trip_planned':
        return <Share2 className="h-4 w-4 text-pink-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: SocialActivity) => {
    const { activity_type, activity_data } = activity;
    
    switch (activity_type) {
      case 'destination_added':
        return `added ${activity_data.destination_name} to their dream destinations`;
      case 'achievement_unlocked':
        return `unlocked the "${activity_data.achievement_name}" achievement`;
      case 'level_up':
        return `reached Level ${activity_data.level}`;
      case 'friend_added':
        return `became travel buddies with ${activity_data.friend_name}`;
      case 'challenge_completed':
        return `completed the "${activity_data.challenge_name}" challenge`;
      case 'trip_planned':
        return `planned a trip to ${activity_data.destination_name}`;
      default:
        return 'had some travel activity';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground">
              Connect with friends to see their travel activities here!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Social Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="group">
              <div className="flex gap-3">
                {/* User Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.avatar_url} alt={activity.username} />
                  <AvatarFallback>
                    {activity.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    {/* Activity Icon */}
                    <div className="mt-1">
                      {getActivityIcon(activity.activity_type)}
                    </div>

                    {/* Activity Text */}
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.username}</span>
                        {' '}
                        <span className="text-muted-foreground">
                          {getActivityText(activity)}
                        </span>
                      </p>
                      
                      {/* Timestamp */}
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTimeAgo(activity.created_at)}
                      </p>
                    </div>

                    {/* Visibility Badge */}
                    {activity.visibility !== 'public' && (
                      <Badge variant="outline" className="text-xs">
                        {activity.visibility}
                      </Badge>
                    )}
                  </div>

                  {/* Special Activity Data Display */}
                  {activity.activity_type === 'destination_added' && activity.activity_data.destination_name && (
                    <div className="ml-6 p-2 bg-muted/30 rounded-lg mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {activity.activity_data.destination_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {activity.activity_type === 'achievement_unlocked' && (
                    <div className="ml-6 p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          {activity.activity_data.achievement_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Like Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-6 px-2 text-xs',
                        activity.is_liked_by_user 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-muted-foreground hover:text-red-500'
                      )}
                      onClick={() => onLike?.(activity.id)}
                    >
                      <Heart className={cn(
                        'h-3 w-3 mr1',
                        activity.is_liked_by_user && 'fill-current'
                      )} />
                      {activity.likes_count > 0 && activity.likes_count}
                    </Button>

                    {/* Comment Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-blue-500"
                      onClick={() => onComment?.(activity.id)}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {activity.comments_count > 0 && activity.comments_count}
                    </Button>

                    {/* Share Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-green-500"
                      onClick={() => onShare?.(activity.id)}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              {activities.indexOf(activity) < activities.length - 1 && (
                <div className="border-t border-muted mt-4"></div>
              )}
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-6">
          <Button variant="outline" size="sm">
            Load More Activities
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact version for sidebar or smaller spaces
export const CompactSocialFeed: React.FC<{
  activities: SocialActivity[];
  maxItems?: number;
}> = ({ activities, maxItems = 3 }) => {
  const displayedActivities = activities.slice(0, maxItems);

  if (displayedActivities.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedActivities.map((activity) => (
            <div key={activity.id} className="flex gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={activity.avatar_url} alt={activity.username} />
                <AvatarFallback className="text-xs">
                  {activity.username.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground">
                    {activity.username}
                  </span>
                  {' '}
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getTimeAgo(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function for getActivityText
const getActivityText = (activity: SocialActivity) => {
  const { activity_type, activity_data } = activity;
  
  switch (activity_type) {
    case 'destination_added':
      return `added ${activity_data.destination_name}`;
    case 'achievement_unlocked':
      return `unlocked "${activity_data.achievement_name}"`;
    case 'level_up':
      return `reached Level ${activity_data.level}`;
    case 'friend_added':
      return `added ${activity_data.friend_name}`;
    case 'challenge_completed':
      return `completed "${activity_data.challenge_name}"`;
    case 'trip_planned':
      return `planned trip to ${activity_data.destination_name}`;
    default:
      return 'had some activity';
  }
};

const getTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};