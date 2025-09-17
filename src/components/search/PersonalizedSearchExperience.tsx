import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PersonalizedSearchExperienceProps {
  searchType: 'flight' | 'hotel' | 'activity';
  currentSearch: any;
  onRecommendationSelect: (recommendation: any) => void;
}

export const PersonalizedSearchExperience: React.FC<PersonalizedSearchExperienceProps> = ({
  searchType,
  currentSearch,
  onRecommendationSelect
}) => {
  const [quickActions, setQuickActions] = useState([]);

  useEffect(() => {
    // Generate quick actions based on search type
    const actions = generateQuickActions(searchType);
    setQuickActions(actions);
  }, [searchType]);

  const generateQuickActions = (type: string) => {
    const actions = {
      flight: [
        { label: 'Flexible Dates', action: 'flexible_dates' },
        { label: 'Nearby Airports', action: 'nearby_airports' },
        { label: 'Price Alerts', action: 'price_alerts' }
      ],
      hotel: [
        { label: 'Free Cancellation', action: 'free_cancel' },
        { label: 'Best Reviews', action: 'top_rated' },
        { label: 'Breakfast Included', action: 'breakfast' }
      ],
      activity: [
        { label: 'Skip-the-Line', action: 'skip_line' },
        { label: 'Family Friendly', action: 'family' },
        { label: 'Outdoor Adventures', action: 'outdoor' }
      ]
    };
    return actions[type] || [];
  };

  const handleQuickAction = (action: string) => {
    console.log('Quick action selected:', action);
    onRecommendationSelect({ type: 'quick_action', action, searchType });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Personalized for You</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</h4>
          <div className="flex flex-wrap gap-1">
            {quickActions.map((action: any, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/10 text-xs"
                onClick={() => handleQuickAction(action.action)}
              >
                {action.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quick Tip */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          💡 We're learning your preferences to show better results next time!
        </div>
      </CardContent>
    </Card>
  );
};