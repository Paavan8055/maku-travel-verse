import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Crown,
  Star,
  Users
} from 'lucide-react';
import { Leaderboard, LeaderboardEntry } from '@/types/gamification-types';
import { cn } from '@/lib/utils';

interface LeaderboardCardProps {
  leaderboard: Leaderboard;
  onViewAll?: () => void;
  maxEntries?: number;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  leaderboard,
  onViewAll,
  maxEntries = 5,
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const displayedEntries = leaderboard.entries.slice(0, maxEntries);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            {leaderboard.name}
          </CardTitle>
          
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {leaderboard.total_participants.toLocaleString()}
          </Badge>
        </div>
        
        {leaderboard.description && (
          <p className="text-sm text-muted-foreground">{leaderboard.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {displayedEntries.map((entry, index) => (
          <div
            key={entry.user_id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-colors',
              entry.rank <= 3 
                ? 'bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20' 
                : 'bg-muted/30 border-muted'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.avatar_url} alt={entry.username} />
                <AvatarFallback className="text-xs">
                  {entry.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{entry.username}</span>
                  
                  {/* Specialization Badge */}
                  {entry.specialization && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {entry.specialization}
                    </Badge>
                  )}
                </div>

                {/* Badges */}
                {entry.badges && entry.badges.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {entry.badges.slice(0, 3).map((badge, badgeIndex) => (
                      <span key={badgeIndex} className="text-xs" role="img">
                        {badge}
                      </span>
                    ))}
                    {entry.badges.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{entry.badges.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Score and Change */}
            <div className="text-right">
              <div className="font-bold text-primary">
                {entry.score.toLocaleString()}
              </div>
              
              {/* Weekly Change */}
              {entry.change_from_last_week !== 0 && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  getChangeColor(entry.change_from_last_week)
                )}>
                  {getChangeIcon(entry.change_from_last_week)}
                  <span>{Math.abs(entry.change_from_last_week)}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* User's Rank (if not in top entries) */}
        {leaderboard.user_rank && leaderboard.user_rank > maxEntries && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Your rank:</span>
              <Badge variant="outline">
                #{leaderboard.user_rank.toLocaleString()}
              </Badge>
            </div>
          </div>
        )}

        {/* View All Button */}
        {leaderboard.entries.length > maxEntries && onViewAll && (
          <Button 
            variant="outline" 
            className="w-full mt-3"
            onClick={onViewAll}
          >
            View Full Leaderboard
          </Button>
        )}

        {/* Footer Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <div className="flex items-center justify-between">
            <span>
              Updated {new Date(leaderboard.updated_at).toLocaleDateString()}
            </span>
            
            {leaderboard.ends_at && (
              <span>
                Ends {new Date(leaderboard.ends_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact leaderboard for smaller spaces
export const CompactLeaderboard: React.FC<{
  entries: LeaderboardEntry[];
  title?: string;
}> = ({ entries, title = "Top Players" }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.slice(0, 3).map((entry) => (
            <div key={entry.user_id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <span className="text-sm font-medium truncate">
                  {entry.username}
                </span>
              </div>
              <div className="text-sm font-bold text-primary">
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function for getRankIcon in compact version
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />;
    default:
      return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
  }
};