import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Calendar, 
  Users, 
  Trophy, 
  Clock,
  CheckCircle,
  Star,
  Zap,
  Award
} from 'lucide-react';
import { Challenge } from '@/types/gamification-types';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin?: (challengeId: string) => void;
  onViewDetails?: (challenge: Challenge) => void;
  loading?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onJoin,
  onViewDetails,
  loading = false,
}) => {
  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expert':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: Challenge['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const endDate = new Date(challenge.ends_at);
    const diffInMs = endDate.getTime() - now.getTime();
    
    if (diffInMs <= 0) return 'Expired';
    
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  const progressPercentage = challenge.target_value > 0 
    ? Math.min((challenge.current_progress / challenge.target_value) * 100, 100)
    : 0;

  return (
    <Card className={cn(
      'group cursor-pointer transition-all duration-300 hover:shadow-lg',
      challenge.is_participating && 'border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{challenge.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {challenge.description}
            </p>
          </div>
          
          {/* Challenge Icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent text-white shrink-0">
            <Target className="h-6 w-6" />
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge className={cn('border', getStatusColor(challenge.status))}>
            {challenge.status === 'active' && <Zap className="h-3 w-3 mr-1" />}
            {challenge.status === 'upcoming' && <Clock className="h-3 w-3 mr-1" />}
            {challenge.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
          </Badge>
          
          <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
            <Star className="h-3 w-3 mr-1" />
            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
          </Badge>
          
          <Badge variant="outline">
            {challenge.type === 'individual' && '👤'}
            {challenge.type === 'group' && '👥'}
            {challenge.type === 'community' && '🌍'}
            <span className="ml-1 capitalize">{challenge.type}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        {challenge.is_participating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Your Progress</span>
              <span className="text-muted-foreground">
                {challenge.current_progress}/{challenge.target_value}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {progressPercentage.toFixed(0)}% Complete
            </div>
          </div>
        )}

        {/* Challenge Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">Reward:</span>
            <span className="font-medium">{challenge.points_reward} pts</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Participants:</span>
            <span className="font-medium">{challenge.participants_count.toLocaleString()}</span>
          </div>
        </div>

        {/* Time Information */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{challenge.duration_days} days</span>
          </div>
          
          {challenge.status === 'active' && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-orange-600">
                {getTimeRemaining()}
              </span>
            </div>
          )}
        </div>

        {/* Special Rewards */}
        {challenge.badge_reward && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-purple-500" />
              <span className="text-muted-foreground">Special Badge:</span>
              <span className="font-medium">{challenge.badge_reward}</span>
            </div>
          </div>
        )}

        {challenge.special_unlock && (
          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-purple-500" />
              <span className="text-muted-foreground">Unlocks:</span>
              <span className="font-medium text-purple-700">{challenge.special_unlock}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!challenge.is_participating && challenge.status === 'active' && (
            <Button 
              onClick={() => onJoin?.(challenge.id)}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Joining...' : 'Join Challenge'}
            </Button>
          )}
          
          {challenge.is_participating && challenge.status === 'active' && (
            <Badge variant="default" className="flex-1 justify-center py-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Participating
            </Badge>
          )}
          
          {challenge.status === 'upcoming' && (
            <Button variant="outline" className="flex-1" disabled>
              <Clock className="h-4 w-4 mr-2" />
              Starts {new Date(challenge.starts_at).toLocaleDateString()}
            </Button>
          )}

          {challenge.status === 'completed' && (
            <Badge variant="secondary" className="flex-1 justify-center py-2">
              <Trophy className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewDetails?.(challenge)}
          >
            Details
          </Button>
        </div>

        {/* Leaderboard Preview */}
        {challenge.leaderboard && challenge.leaderboard.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Participants
            </h4>
            <div className="space-y-1">
              {challenge.leaderboard.slice(0, 3).map((entry, index) => (
                <div key={entry.user_id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{entry.rank}</span>
                    <span>{entry.username}</span>
                  </div>
                  <span className="font-medium text-primary">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact version for smaller spaces
export const CompactChallengeCard: React.FC<{
  challenge: Challenge;
  onJoin?: (challengeId: string) => void;
}> = ({ challenge, onJoin }) => {
  const progressPercentage = challenge.target_value > 0 
    ? Math.min((challenge.current_progress / challenge.target_value) * 100, 100)
    : 0;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{challenge.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {challenge.description}
            </p>
          </div>
          <Badge className={cn('text-xs', getStatusColor(challenge.status))}>
            {challenge.status}
          </Badge>
        </div>

        {challenge.is_participating && (
          <div className="mb-3">
            <Progress value={progressPercentage} className="h-1 mb-1" />
            <div className="text-xs text-muted-foreground">
              {challenge.current_progress}/{challenge.target_value}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {challenge.points_reward} pts
          </div>
          
          {!challenge.is_participating && challenge.status === 'active' && (
            <Button size="sm" variant="outline" onClick={() => onJoin?.(challenge.id)}>
              Join
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function for status colors (need to duplicate for compact version)
const getStatusColor = (status: Challenge['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'upcoming':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'expired':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};