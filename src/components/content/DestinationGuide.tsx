import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Star, 
  Camera, 
  Shield, 
  Cloud, 
  AlertTriangle, 
  Info,
  Clock,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DestinationGuideProps {
  destinationId: string;
  destinationName: string;
  country: string;
  onContentUpdate?: () => void;
}

interface DestinationContent {
  id: string;
  destination_name: string;
  country: string;
  description: string;
  highlights: string[];
  safety_info: any;
  weather_info: any;
  currency: string;
  language: string[];
  supplier_data: any;
  content_status: string;
}

interface ContentImage {
  id: string;
  image_url: string;
  image_caption: string;
  image_category: string;
  is_featured: boolean;
}

interface POIContent {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  coordinates: any;
}

interface TravelAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  effective_date: string;
  expiry_date: string;
}

export const DestinationGuide: React.FC<DestinationGuideProps> = ({
  destinationId,
  destinationName,
  country,
  onContentUpdate
}) => {
  const [content, setContent] = useState<DestinationContent | null>(null);
  const [images, setImages] = useState<ContentImage[]>([]);
  const [pois, setPois] = useState<POIContent[]>([]);
  const [alerts, setAlerts] = useState<TravelAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingContent, setRefreshingContent] = useState(false);

  useEffect(() => {
    loadDestinationContent();
  }, [destinationId]);

  const loadDestinationContent = async () => {
    try {
      setLoading(true);

      // Load destination content
      const { data: contentData } = await supabase
        .from('destination_content')
        .select('*')
        .eq('destination_id', destinationId)
        .single();

      setContent(contentData);

      // Load images
      const { data: imagesData } = await supabase
        .from('content_images')
        .select('*')
        .eq('destination_id', destinationId)
        .order('display_order');

      setImages(imagesData || []);

      // Load POIs
      const { data: poisData } = await supabase
        .from('poi_content')
        .select('*')
        .eq('destination_id', destinationId)
        .order('rating', { ascending: false });

      setPois(poisData || []);

      // Load travel alerts
      const { data: alertsData } = await supabase
        .from('travel_alerts')
        .select('*')
        .eq('destination_code', destinationId)
        .order('created_at', { ascending: false });

      setAlerts(alertsData || []);

    } catch (error) {
      console.error('Error loading destination content:', error);
      toast.error('Failed to load destination content');
    } finally {
      setLoading(false);
    }
  };

  const refreshSupplierContent = async () => {
    try {
      setRefreshingContent(true);
      
      const { data, error } = await supabase.functions.invoke('content-aggregator', {
        body: {
          destinationId,
          destinationName,
          country,
          includeSupplierData: true
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Content refreshed successfully');
        loadDestinationContent();
        onContentUpdate?.();
      }

    } catch (error) {
      console.error('Error refreshing content:', error);
      toast.error('Failed to refresh content from suppliers');
    } finally {
      setRefreshingContent(false);
    }
  };

  const renderSafetyInfo = () => {
    if (!content?.safety_info) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Safety Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(content.safety_info).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <Badge variant={value === 'high' ? 'destructive' : value === 'medium' ? 'default' : 'secondary'}>
                  {value as string}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderImages = () => {
    if (images.length === 0) return null;

    const featuredImage = images.find(img => img.is_featured) || images[0];
    const otherImages = images.filter(img => !img.is_featured).slice(0, 8);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Photos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featuredImage && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={featuredImage.image_url}
                  alt={featuredImage.image_caption}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {otherImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {otherImages.map((image) => (
                  <div key={image.id} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.image_caption}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPOIs = () => {
    if (pois.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Things to Do</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pois.slice(0, 6).map((poi) => (
              <div key={poi.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{poi.name}</h4>
                    {poi.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{poi.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{poi.description}</p>
                  <Badge variant="outline" className="mt-1">
                    {poi.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAlerts = () => {
    if (alerts.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Travel Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg border-l-4 border-l-orange-500 bg-orange-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{alert.title}</h4>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                {alert.expiry_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Valid until: {new Date(alert.expiry_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{destinationName}</h1>
          <p className="text-muted-foreground">{country}</p>
        </div>
        <Button 
          onClick={refreshSupplierContent}
          disabled={refreshingContent}
          variant="outline"
        >
          {refreshingContent ? 'Refreshing...' : 'Refresh Content'}
        </Button>
      </div>

      {content && (
        <Card>
          <CardContent className="p-6">
            <p className="text-lg leading-relaxed">{content.description}</p>
            {content.highlights.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Highlights</h3>
                <div className="flex flex-wrap gap-2">
                  {content.highlights.map((highlight, index) => (
                    <Badge key={index} variant="secondary">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attractions">Attractions</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderImages()}
          {content?.weather_info && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cloud className="w-5 h-5" />
                  <span>Weather Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Weather data integration coming soon...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attractions">
          {renderPOIs()}
        </TabsContent>

        <TabsContent value="safety">
          {renderSafetyInfo()}
        </TabsContent>

        <TabsContent value="alerts">
          {renderAlerts()}
        </TabsContent>
      </Tabs>
    </div>
  );
};