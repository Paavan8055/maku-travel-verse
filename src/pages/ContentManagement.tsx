import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Image, 
  MapPin, 
  RefreshCw, 
  Plus, 
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DestinationGuide } from '@/components/content/DestinationGuide';

const ContentManagement = () => {
  const [destinations, setDestinations] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contentStats, setContentStats] = useState({
    totalDestinations: 0,
    publishedContent: 0,
    draftContent: 0,
    totalImages: 0,
    totalPOIs: 0,
    activeAlerts: 0
  });

  useEffect(() => {
    loadDestinations();
    loadContentStats();
  }, []);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('destination_content')
        .select(`
          *,
          content_images(count),
          poi_content(count)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Error loading destinations:', error);
      toast.error('Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  const loadContentStats = async () => {
    try {
      const [destinationsRes, imagesRes, poisRes, alertsRes] = await Promise.all([
        supabase.from('destination_content').select('content_status'),
        supabase.from('content_images').select('id'),
        supabase.from('poi_content').select('id'),
        supabase.from('travel_alerts').select('id')
      ]);

      const destinations = destinationsRes.data || [];
      const stats = {
        totalDestinations: destinations.length,
        publishedContent: destinations.filter(d => d.content_status === 'published').length,
        draftContent: destinations.filter(d => d.content_status === 'draft').length,
        totalImages: imagesRes.data?.length || 0,
        totalPOIs: poisRes.data?.length || 0,
        activeAlerts: alertsRes.data?.length || 0
      };

      setContentStats(stats);
    } catch (error) {
      console.error('Error loading content stats:', error);
    }
  };

  const refreshSupplierContent = async (destinationId?: string) => {
    try {
      setRefreshing(true);
      
      if (destinationId) {
        // Refresh specific destination
        const destination = destinations.find(d => d.destination_id === destinationId);
        if (!destination) return;

        const { data, error } = await supabase.functions.invoke('content-aggregator', {
          body: {
            destinationId: destination.destination_id,
            destinationName: destination.destination_name,
            country: destination.country,
            includeSupplierData: true
          }
        });

        if (error) throw error;
        toast.success(`Content refreshed for ${destination.destination_name}`);
      } else {
        // Refresh all destinations
        const promises = destinations.slice(0, 5).map(destination => 
          supabase.functions.invoke('content-aggregator', {
            body: {
              destinationId: destination.destination_id,
              destinationName: destination.destination_name,
              country: destination.country,
              includeSupplierData: true
            }
          })
        );

        await Promise.all(promises);
        toast.success('Content refreshed for all destinations');
      }

      loadDestinations();
      loadContentStats();
    } catch (error) {
      console.error('Error refreshing content:', error);
      toast.error('Failed to refresh content');
    } finally {
      setRefreshing(false);
    }
  };

  const createSampleDestination = async () => {
    try {
      const sampleDestinations = [
        {
          destination_id: 'sydney-australia',
          destination_name: 'Sydney',
          country: 'Australia',
          continent: 'Oceania',
          description: 'Sydney is Australia\'s largest city and a global destination known for its harbourfront Sydney Opera House, with a distinctive sail-like design.',
          highlights: ['Opera House', 'Harbour Bridge', 'Bondi Beach', 'Royal Botanic Gardens'],
          currency: 'AUD',
          language: ['English'],
          content_status: 'published'
        },
        {
          destination_id: 'tokyo-japan',
          destination_name: 'Tokyo',
          country: 'Japan',
          continent: 'Asia',
          description: 'Tokyo, Japan\'s busy capital, mixes the ultramodern and the traditional, from neon-lit skyscrapers to historic temples.',
          highlights: ['Tokyo Tower', 'Shibuya Crossing', 'Imperial Palace', 'Tsukiji Market'],
          currency: 'JPY',
          language: ['Japanese'],
          content_status: 'draft'
        },
        {
          destination_id: 'paris-france',
          destination_name: 'Paris',
          country: 'France',
          continent: 'Europe',
          description: 'Paris, France\'s capital, is a major European city and a global center for art, fashion, gastronomy and culture.',
          highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Champs-Élysées'],
          currency: 'EUR',
          language: ['French'],
          content_status: 'published'
        }
      ];

      for (const destination of sampleDestinations) {
        await supabase
          .from('destination_content')
          .upsert(destination, { onConflict: 'destination_id' });
      }

      toast.success('Sample destinations created');
      loadDestinations();
      loadContentStats();
    } catch (error) {
      console.error('Error creating sample destinations:', error);
      toast.error('Failed to create sample destinations');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (selectedDestination) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedDestination(null)}
              >
                ← Back to Content Management
              </Button>
            </div>
            
            <DestinationGuide
              destinationId={selectedDestination.destination_id}
              destinationName={selectedDestination.destination_name}
              country={selectedDestination.country}
              onContentUpdate={() => {
                loadDestinations();
                loadContentStats();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Content Management System
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage destination content with supplier API integration
            </p>
          </div>

          {/* Content Statistics */}
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Globe className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{contentStats.totalDestinations}</div>
                <div className="text-xs text-muted-foreground">Destinations</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{contentStats.publishedContent}</div>
                <div className="text-xs text-muted-foreground">Published</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{contentStats.draftContent}</div>
                <div className="text-xs text-muted-foreground">Drafts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Image className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{contentStats.totalImages}</div>
                <div className="text-xs text-muted-foreground">Images</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{contentStats.totalPOIs}</div>
                <div className="text-xs text-muted-foreground">POIs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{contentStats.activeAlerts}</div>
                <div className="text-xs text-muted-foreground">Active Alerts</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="destinations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="destinations">Destinations</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="destinations">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Destination Content</h2>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={createSampleDestination}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Sample Data
                    </Button>
                    <Button 
                      onClick={() => refreshSupplierContent()}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh All
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-20 bg-muted rounded"></div>
                            <div className="h-4 bg-muted rounded w-1/2"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {destinations.map((destination) => (
                      <Card key={destination.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{destination.destination_name}</CardTitle>
                            <Badge className={getStatusColor(destination.content_status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(destination.content_status)}
                                <span>{destination.content_status}</span>
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{destination.country}</p>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-4 line-clamp-3">{destination.description}</p>
                          
                          {destination.highlights && destination.highlights.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-1">
                                {destination.highlights.slice(0, 3).map((highlight, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {highlight}
                                  </Badge>
                                ))}
                                {destination.highlights.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{destination.highlights.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">
                              Updated: {new Date(destination.updated_at).toLocaleDateString()}
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => refreshSupplierContent(destination.destination_id)}
                                disabled={refreshing}
                              >
                                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedDestination(destination)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {!loading && destinations.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No destinations found</h3>
                      <p className="text-muted-foreground mb-4">
                        Get started by adding sample destination data
                      </p>
                      <Button onClick={createSampleDestination}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Sample Destinations
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="automation">
              <Card>
                <CardHeader>
                  <CardTitle>Content Automation</CardTitle>
                  <p className="text-muted-foreground">
                    Automated content aggregation from supplier APIs
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">Amadeus Integration</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Points of Interest and Safety Information
                          </p>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs">Active</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">HotelBeds Content</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Hotel Images and Descriptions
                          </p>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs">Active</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">Sabre Travel Alerts</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Real-time Travel Advisories
                          </p>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-xs">Coming Soon</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold">Automation Features</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">Daily Content Refresh</h4>
                            <p className="text-sm text-muted-foreground">Automatically update destination content from suppliers</p>
                          </div>
                          <Badge variant="secondary">Enabled</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">Image Optimization</h4>
                            <p className="text-sm text-muted-foreground">Automatically optimize and categorize images</p>
                          </div>
                          <Badge variant="secondary">Enabled</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">Content Translation</h4>
                            <p className="text-sm text-muted-foreground">Auto-translate content to multiple languages</p>
                          </div>
                          <Badge variant="outline">Coming Soon</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Content Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Content performance metrics and analytics dashboard coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;