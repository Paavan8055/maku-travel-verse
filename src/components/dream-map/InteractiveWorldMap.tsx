import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Search, Shuffle, Heart, Calendar, DollarSign, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

function createCustomIcon(category: string, isBookmarked: boolean = false): DivIcon {
  const color = categoryColors[category as keyof typeof categoryColors] || '#6b7280';
  const icon = categoryIcons[category as keyof typeof categoryIcons] || '📍';
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ${isBookmarked ? 'border-color: #fbbf24;' : ''}
      ">
        ${icon}
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const InteractiveWorldMap: React.FC = () => {
  console.log('InteractiveWorldMap: Component mounting');
  
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedContinent, setSelectedContinent] = useState<string>('');
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isBookmarkPanelOpen, setIsBookmarkPanelOpen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { toast } = useToast();
  
  console.log('InteractiveWorldMap: About to call useAuth');
  let user: any = null;
  
  try {
    const authResult = useAuth();
    user = authResult.user;
    console.log('InteractiveWorldMap: useAuth result:', { user: !!user });
  } catch (error) {
    console.error('InteractiveWorldMap: useAuth error:', error);
    setMapError('Authentication error');
  }

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
        .select('*');
      
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
      if (bookmarks.length >= 100) {
        toast({
          title: "Limit Reached",
          description: "You can only bookmark 100 dream destinations",
          variant: "destructive",
        });
        return;
      }

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
      toast({
        title: "Error",
        description: "Failed to remove destination",
        variant: "destructive",
      });
    }
  };

  const getRandomDestination = () => {
    const unbookmarkedDestinations = destinations.filter(
      dest => !bookmarks.some(bookmark => bookmark.destination_id === dest.id)
    );
    if (unbookmarkedDestinations.length > 0) {
      const randomIndex = Math.floor(Math.random() * unbookmarkedDestinations.length);
      return unbookmarkedDestinations[randomIndex];
    }
    return null;
  };

  const filteredDestinations = destinations.filter(destination => {
    const matchesSearch = destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         destination.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || destination.category === selectedCategory;
    const matchesContinent = !selectedContinent || destination.continent === selectedContinent;
    const matchesBudget = !selectedBudget || destination.budget_range === selectedBudget;
    
    return matchesSearch && matchesCategory && matchesContinent && matchesBudget;
  });

  const bookmarkedDestinations = destinations.filter(dest => 
    bookmarks.some(bookmark => bookmark.destination_id === dest.id)
  );

  const isBookmarked = (destinationId: string) => {
    return bookmarks.some(bookmark => bookmark.destination_id === destinationId);
  };

  const categories = [...new Set(destinations.map(d => d.category))];
  const continents = [...new Set(destinations.map(d => d.continent))];
  const budgetRanges = [...new Set(destinations.map(d => d.budget_range))];

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">Map temporarily unavailable</h3>
          <p className="text-muted-foreground mb-4">{mapError}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full">
      {/* Search and Filter Controls */}
      <div className="absolute top-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search destinations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm px-2 py-1 rounded border bg-background"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {categoryIcons[category as keyof typeof categoryIcons]} {category}
                </option>
              ))}
            </select>
            
            <select
              value={selectedContinent}
              onChange={(e) => setSelectedContinent(e.target.value)}
              className="text-sm px-2 py-1 rounded border bg-background"
            >
              <option value="">All Continents</option>
              {continents.map(continent => (
                <option key={continent} value={continent}>{continent}</option>
              ))}
            </select>
            
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="text-sm px-2 py-1 rounded border bg-background"
            >
              <option value="">All Budgets</option>
              {budgetRanges.map(budget => (
                <option key={budget} value={budget}>{budget}</option>
              ))}
            </select>
          </div>
          
          <Button
            onClick={() => {
              const random = getRandomDestination();
              if (random) {
                toast({
                  title: "Random Destination",
                  description: `Check out ${random.name}!`,
                });
              } else {
                toast({
                  title: "All Explored!",
                  description: "You've bookmarked all available destinations!",
                });
              }
            }}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Random Destination
          </Button>
        </div>
      </div>

      {/* Bookmarks Counter */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          onClick={() => setIsBookmarkPanelOpen(!isBookmarkPanelOpen)}
          variant="default"
          className="bg-primary hover:bg-primary/90"
        >
          <Heart className="h-4 w-4 mr-2" />
          Dream Board ({bookmarks.length}/100)
        </Button>
      </div>

      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {filteredDestinations.map((destination) => (
          <Marker
            key={destination.id}
            position={[destination.latitude, destination.longitude]}
            icon={createCustomIcon(destination.category, isBookmarked(destination.id))}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{destination.name}</h3>
                  <Badge variant="secondary">
                    {categoryIcons[destination.category as keyof typeof categoryIcons]} {destination.category}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{destination.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{destination.country}, {destination.continent}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Best time: {destination.best_time_to_visit}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>${destination.avg_daily_cost}/day ({destination.budget_range})</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Highlights:</p>
                  <div className="flex flex-wrap gap-1">
                    {destination.highlights.map((highlight, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  {isBookmarked(destination.id) ? (
                    <Button
                      onClick={() => removeBookmark(destination.id)}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      <Heart className="h-4 w-4 mr-2 fill-current" />
                      Remove from Dream Board
                    </Button>
                  ) : (
                    <Button
                      onClick={() => addBookmark(destination.id)}
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Add to Dream Board
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Bookmarks Panel */}
      {isBookmarkPanelOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-background border-t shadow-lg max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">My Dream Board ({bookmarks.length}/100)</h3>
              <Button
                onClick={() => setIsBookmarkPanelOpen(false)}
                variant="ghost"
                size="sm"
              >
                ×
              </Button>
            </div>
            
            {bookmarkedDestinations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No dream destinations yet. Start exploring the map and add places you'd love to visit!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarkedDestinations.map((destination) => (
                  <Card key={destination.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{destination.name}</span>
                        <span className="text-lg">
                          {categoryIcons[destination.category as keyof typeof categoryIcons]}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-2">{destination.country}</p>
                      <p className="text-xs mb-2">${destination.avg_daily_cost}/day</p>
                      <Button
                        onClick={() => removeBookmark(destination.id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveWorldMap;
