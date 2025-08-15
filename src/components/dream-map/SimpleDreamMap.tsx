import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Search, Heart, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Destination {
  id: string;
  name: string;
  country: string;
  continent: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  best_time_to_visit: string;
  budget_range: string;
  avg_daily_cost: number;
  highlights: string[];
}

interface Bookmark {
  id: string;
  destination_id: string;
  user_id: string;
  notes: string;
  priority: number;
  created_at: string;
}

const categoryColors = {
  beaches: '#0ea5e9',
  mountains: '#84cc16',
  cultural: '#f59e0b',
  spiritual: '#8b5cf6',
  adventure: '#ef4444',
  cities: '#06b6d4',
};

const categoryIcons = {
  beaches: '🏖️',
  mountains: '⛰️',
  cultural: '🏛️',
  spiritual: '🕉️',
  adventure: '🎯',
  cities: '🏙️',
};

const SimpleDreamMap: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchDestinations();
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('dream_destinations')
        .select('*')
        .limit(20); // Limit for initial load
      
      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast({
        title: "Error",
        description: "Failed to load destinations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_dream_bookmarks')
        .select('*');
      
      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const addBookmark = async (destinationId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to bookmark destinations",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_dream_bookmarks')
        .insert({
          destination_id: destinationId,
          user_id: user.id,
          priority: 1
        });

      if (error) throw error;
      
      await fetchBookmarks();
      toast({
        title: "Added to Dream Board",
        description: "Destination added to your dream board!",
      });
    } catch (error) {
      console.error('Error adding bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to add destination to dream board",
        variant: "destructive",
      });
    }
  };

  const removeBookmark = async (destinationId: string) => {
    try {
      const { error } = await supabase
        .from('user_dream_bookmarks')
        .delete()
        .eq('destination_id', destinationId);

      if (error) throw error;
      
      await fetchBookmarks();
      toast({
        title: "Removed from Dream Board",
        description: "Destination removed from your dream board",
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const filteredDestinations = destinations.filter(destination => {
    const matchesSearch = destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         destination.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || destination.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const isBookmarked = (destinationId: string) => {
    return bookmarks.some(bookmark => bookmark.destination_id === destinationId);
  };

  const categories = [...new Set(destinations.map(d => d.category))];

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search destinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {categoryIcons[category as keyof typeof categoryIcons]} {category}
            </option>
          ))}
        </select>
      </div>

      {/* Dream Board Counter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dream Destinations</h3>
        <Badge variant="secondary">
          <Heart className="h-4 w-4 mr-1" />
          {bookmarks.length} bookmarked
        </Badge>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDestinations.map((destination) => (
          <Card key={destination.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-xl">
                      {categoryIcons[destination.category as keyof typeof categoryIcons]}
                    </span>
                    {destination.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {destination.country}, {destination.continent}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: categoryColors[destination.category as keyof typeof categoryColors],
                    color: categoryColors[destination.category as keyof typeof categoryColors]
                  }}
                >
                  {destination.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {destination.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>Best time: {destination.best_time_to_visit}</span>
                <span>${destination.avg_daily_cost}/day</span>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {destination.highlights.slice(0, 3).map((highlight, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {highlight}
                  </Badge>
                ))}
              </div>
              
              <Button
                onClick={() => 
                  isBookmarked(destination.id) 
                    ? removeBookmark(destination.id)
                    : addBookmark(destination.id)
                }
                variant={isBookmarked(destination.id) ? "destructive" : "default"}
                size="sm"
                className="w-full"
              >
                <Heart className={`h-4 w-4 mr-2 ${isBookmarked(destination.id) ? 'fill-current' : ''}`} />
                {isBookmarked(destination.id) ? 'Remove from Dream Board' : 'Add to Dream Board'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDestinations.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No destinations found. Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleDreamMap;