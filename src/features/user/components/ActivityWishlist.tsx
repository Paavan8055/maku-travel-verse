import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, Clock, MapPin, Trash2, Eye, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedActivity } from '@/features/search/hooks/useEnhancedActivitySearch';

interface WishlistItem extends EnhancedActivity {
  added_at: string;
  note?: string;
}

interface ActivityWishlistProps {
  onActivitySelect?: (activity: EnhancedActivity) => void;
  className?: string;
}

export const ActivityWishlist: React.FC<ActivityWishlistProps> = ({
  onActivitySelect,
  className = ""
}) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load wishlist from Supabase
  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_activity_wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      setWishlist(data || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to load your wishlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove activity from wishlist
  const removeFromWishlist = async (activityId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_activity_wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('activity_id', activityId);

      if (error) throw error;

      setWishlist(prev => prev.filter(item => item.id !== activityId));
      
      toast({
        title: "Removed",
        description: "Activity removed from your wishlist"
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove activity from wishlist",
        variant: "destructive"
      });
    }
  };

  // Share activity
  const shareActivity = async (activity: WishlistItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activity.name,
          text: `Check out this activity: ${activity.name}`,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      const shareText = `Check out this activity: ${activity.name}\n${window.location.href}`;
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Activity link copied to clipboard"
      });
    }
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign in to view your wishlist</h3>
          <p className="text-muted-foreground">
            Save your favorite activities for later
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            My Wishlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-20 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          My Wishlist
          {wishlist.length > 0 && (
            <Badge variant="secondary">{wishlist.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {wishlist.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground">
              Start adding activities you'd like to do later
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlist.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex gap-4">
                  {/* Activity Image */}
                  <div className="w-24 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {(item.images?.[0] || item.photos?.[0]) ? (
                      <img
                        src={item.images?.[0] || item.photos?.[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-2">
                      {item.name}
                    </h4>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      {item.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-primary">
                        {item.price.currency} {item.price.total}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>

                    {item.note && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        Note: {item.note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    {onActivitySelect && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onActivitySelect(item)}
                        className="px-2"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => shareActivity(item)}
                      className="px-2"
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromWishlist(item.id)}
                      className="px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityWishlist;