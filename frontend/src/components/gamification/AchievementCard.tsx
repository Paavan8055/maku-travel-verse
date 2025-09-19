import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Achievement } from '@/types/gamification-types';
import { cn } from '@/lib/utils';
import { Lock, Star, Trophy, Crown, Gem } from 'lucide-react';

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onClick,
  size = 'md',
  showProgress = true,
}) => {
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return 'from-purple-500 to-pink-500 text-white border-purple-300';
      case 'epic':
        return 'from-blue-500 to-cyan-500 text-white border-blue-300';
      case 'rare':
        return 'from-green-500 to-emerald-500 text-white border-green-300';
      case 'common':
        return 'from-gray-400 to-gray-500 text-white border-gray-300';
      default:
        return 'from-gray-400 to-gray-500 text-white border-gray-300';
    }
  };

  const getRarityIcon = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return <Crown className="h-4 w-4" />;
      case 'epic':
        return <Gem className="h-4 w-4" />;
      case 'rare':
        return <Star className="h-4 w-4" />;
      case 'common':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getCardSize = () => {
    switch (size) {
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <Card 
      className={cn(
        'group cursor-pointer transition-all duration-300 hover:shadow-lg',
        achievement.unlocked 
          ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5' 
          : 'border-muted bg-muted/30 opacity-75',
        onClick && 'hover:scale-105'
      )}
      onClick={onClick}
    >
      <CardContent className={getCardSize()}>
        <div className="flex items-start gap-3">
          {/* Achievement Icon */}
          <div className={cn(
            'flex items-center justify-center rounded-lg w-12 h-12 bg-gradient-to-br shrink-0',
            getRarityColor(achievement.rarity)
          )}>
            <span className="text-2xl" role="img" aria-label={achievement.name}>
              {achievement.icon}
            </span>
          </div>

          {/* Achievement Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn('font-semibold truncate', getTextSize())}>
                {achievement.name}
              </h3>
              
              {!achievement.unlocked && (
                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {achievement.description}
            </p>

            {/* Progress Bar */}
            {showProgress && achievement.max_progress > 1 && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress}/{achievement.max_progress}</span>
                </div>
                <Progress 
                  value={(achievement.progress / achievement.max_progress) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {/* Achievement Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Rarity Badge */}
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs bg-gradient-to-r border',
                    getRarityColor(achievement.rarity)
                  )}
                >
                  {getRarityIcon(achievement.rarity)}
                  <span className="ml-1 capitalize">{achievement.rarity}</span>
                </Badge>

                {/* Category Badge */}
                <Badge variant="secondary" className="text-xs capitalize">
                  {achievement.category}
                </Badge>
              </div>

              {/* Points */}
              <div className="text-xs font-medium text-primary">
                {achievement.points_value} pts
              </div>
            </div>

            {/* Unlock Date */}
            {achievement.unlocked && achievement.unlocked_at && (
              <div className="text-xs text-muted-foreground mt-1">
                Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact version for lists
export const AchievementBadge: React.FC<{ achievement: Achievement; onClick?: () => void }> = ({
  achievement,
  onClick,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        'h-auto p-2 flex items-center gap-2',
        achievement.unlocked 
          ? 'border-primary/30 bg-primary/5' 
          : 'border-muted bg-muted/30 opacity-60'
      )}
    >
      <span className="text-lg" role="img" aria-label={achievement.name}>
        {achievement.icon}
      </span>
      <div className="text-left">
        <div className="text-xs font-medium">{achievement.name}</div>
        <div className="text-xs text-muted-foreground">
          {achievement.points_value} pts
        </div>
      </div>
      {!achievement.unlocked && (
        <Lock className="h-3 w-3 text-muted-foreground" />
      )}
    </Button>
  );
};

// Grid component for displaying multiple achievements
export const AchievementGrid: React.FC<{
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
  maxDisplayed?: number;
}> = ({ achievements, onAchievementClick, maxDisplayed }) => {
  const displayedAchievements = maxDisplayed 
    ? achievements.slice(0, maxDisplayed) 
    : achievements;

  if (achievements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-8 w-8 mx-auto mb-2" />
        <p>No achievements to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayedAchievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          onClick={() => onAchievementClick?.(achievement)}
        />
      ))}
      
      {maxDisplayed && achievements.length > maxDisplayed && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="p-4 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-2xl mb-2">+{achievements.length - maxDisplayed}</div>
              <div className="text-sm">More achievements</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};