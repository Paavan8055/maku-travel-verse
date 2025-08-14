import React, { useState, useEffect } from 'react';
import { Heart, Bell, Share2, Tag, TrendingDown, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { favoritesAPI } from '@/lib/otaDataClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';

interface EnhancedFavoritesProps {
  itemType: string;
  itemId: string;
  itemData: any;
  currentPrice?: number;
  className?: string;
}

interface Favorite {
  id: string;
  item_type: string;
  item_id: string;
  item_data: any;
  current_price?: number;
  original_price?: number;
  price_alert_threshold?: number;
  is_price_alert_active: boolean;
  price_history: any;
  notes?: string;
  tags: any;
  is_shared: boolean;
  created_at: string;
}

export const EnhancedFavorites: React.FC<EnhancedFavoritesProps> = ({
  itemType,
  itemId,
  itemData,
  currentPrice,
  className = ''
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favorite, setFavorite] = useState<Favorite | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [priceAlert, setPriceAlert] = useState({
    threshold: currentPrice || 0,
    active: false
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkIfFavorited();
    }
  }, [user, itemId, itemType]);

  const checkIfFavorited = async () => {
    if (!user) return;

    try {
      const favorites = await favoritesAPI.fetchFavorites(user.id);
      const existingFavorite = favorites.find(
        (fav: Favorite) => fav.item_type === itemType && fav.item_id === itemId
      );
      
      if (existingFavorite) {
        setIsFavorited(true);
        setFavorite(existingFavorite);
        setNotes(existingFavorite.notes || '');
        setTags(existingFavorite.tags || []);
        setPriceAlert({
          threshold: existingFavorite.price_alert_threshold || currentPrice || 0,
          active: existingFavorite.is_price_alert_active
        });
      }
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please log in to save favorites');
      return;
    }

    try {
      if (isFavorited) {
        await favoritesAPI.removeFavorite(user.id, itemType, itemId);
        setIsFavorited(false);
        setFavorite(null);
      } else {
        const newFavorite = await favoritesAPI.addFavorite({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
          item_data: itemData,
          current_price: currentPrice,
          original_price: currentPrice,
          notes: notes,
          tags: tags,
          price_alert_threshold: priceAlert.threshold,
          is_price_alert_active: priceAlert.active
        });
        setIsFavorited(true);
        setFavorite(newFavorite);
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const updateFavorite = async () => {
    if (!favorite) return;

    try {
      await favoritesAPI.updatePriceAlert(favorite.id, priceAlert.threshold, priceAlert.active);
      setShowDialog(false);
      toast.success('Favorite updated successfully');
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const getPriceChange = () => {
    if (!favorite?.original_price || !currentPrice) return null;
    
    const change = currentPrice - favorite.original_price;
    const percentage = (change / favorite.original_price) * 100;
    
    return {
      amount: Math.abs(change),
      percentage: Math.abs(percentage),
      isIncrease: change > 0
    };
  };

  const priceChange = getPriceChange();

  return (
    <div className={className}>
      <Button
        variant={isFavorited ? "default" : "outline"}
        size="sm"
        onClick={toggleFavorite}
        className="gap-2"
      >
        <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        {isFavorited ? 'Saved' : 'Save'}
      </Button>

      {isFavorited && favorite && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="w-4 h-4" />
              Manage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Favorite</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Price Tracking */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Price Tracking</h4>
                  {priceChange && (
                    <Badge variant={priceChange.isIncrease ? "destructive" : "secondary"}>
                      {priceChange.isIncrease ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {priceChange.percentage.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Original Price:</span>
                    <span className="font-medium">
                      ${favorite.original_price?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Current Price:</span>
                    <span className="font-medium">
                      ${currentPrice?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Alert */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="price-alert">Price Alert</Label>
                  <Switch
                    id="price-alert"
                    checked={priceAlert.active}
                    onCheckedChange={(checked) => 
                      setPriceAlert(prev => ({ ...prev, active: checked }))
                    }
                  />
                </div>
                
                {priceAlert.active && (
                  <div className="space-y-2">
                    <Label>Alert me when price drops below:</Label>
                    <div className="flex gap-2">
                      <span className="self-center">$</span>
                      <Input
                        type="number"
                        value={priceAlert.threshold}
                        onChange={(e) => 
                          setPriceAlert(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Personal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add your thoughts about this item..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {['Honeymoon', 'Family Trip', 'Business', 'Weekend Getaway', 'Adventure'].map((tag) => (
                    <Badge
                      key={tag}
                      variant={tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={updateFavorite} className="flex-1">
                  <Bell className="w-4 h-4 mr-2" />
                  Update Alert
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};