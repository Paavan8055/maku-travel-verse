import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchUserFavorites, toggleFavorite } from "@/lib/bookingDataClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Heart, MapPin, Plane, Hotel, Camera, Trash2 } from "lucide-react";
import logger from "@/utils/logger";

interface Favorite {
  id: string;
  item_type: string;
  item_id: string;
  item_data: any;
  created_at: string;
}

export default function FavoritesSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await fetchUserFavorites(user.id);
      setFavorites(data);
    } catch (error) {
      logger.error('Error loading favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (favorite: Favorite) => {
    if (!user) return;

    try {
      const result = await toggleFavorite(
        user.id, 
        favorite.item_type, 
        favorite.item_id, 
        favorite.item_data
      );
      
      if (result.action === 'removed') {
        setFavorites(prev => prev.filter(f => f.id !== favorite.id));
        toast({
          title: "Removed from favorites",
          description: "Item removed from your favorites.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'hotel':
        return <Hotel className="h-4 w-4" />;
      case 'flight':
        return <Plane className="h-4 w-4" />;
      case 'experience':
        return <Camera className="h-4 w-4" />;
      case 'destination':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const getItemTitle = (favorite: Favorite) => {
    const data = favorite.item_data;
    return data?.name || data?.title || data?.destination || `${favorite.item_type} ${favorite.item_id}`;
  };

  const getItemSubtitle = (favorite: Favorite) => {
    const data = favorite.item_data;
    switch (favorite.item_type) {
      case 'hotel':
        return data?.location || data?.address;
      case 'flight':
        return `${data?.departure} → ${data?.arrival}`;
      case 'experience':
        return data?.category || data?.location;
      case 'destination':
        return data?.country || data?.region;
      default:
        return '';
    }
  };

  const handleQuickBook = (favorite: Favorite) => {
    // TODO: Integrate with booking flow
    toast({
      title: "Quick Book",
      description: `Starting booking for ${getItemTitle(favorite)}`,
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Your Favorites
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Error fetching favorites. Please try again.</p>
          </div>
        )}
        
        {favorites.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved favorites yet.</p>
            <p className="text-sm">Heart items while browsing to see them here.</p>
          </div>
        )}
        
        {favorites.length > 0 && (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getItemIcon(favorite.item_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {getItemTitle(favorite)}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {getItemSubtitle(favorite)}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {favorite.item_type}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(favorite)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                    data-testid="remove-favorite-btn"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={() => handleQuickBook(favorite)}
                  size="sm"
                  className="w-full hover-scale"
                >
                  Quick Book
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {favorites.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 Click the heart icon on any listing to save it here for quick booking.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}