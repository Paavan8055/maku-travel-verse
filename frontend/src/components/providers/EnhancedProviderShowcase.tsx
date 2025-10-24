import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  Building, 
  MapPin, 
  Clock, 
  Star, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProviderResult {
  provider_id: string;
  provider_name: string;
  success: boolean;
  results: any[];
  total_results: number;
  response_time_ms: number;
  error?: string;
}

interface SearchResponse {
  success: boolean;
  search_id: string;
  providers_searched: number;
  total_results: number;
  responses: ProviderResult[];
}

const EnhancedProviderShowcase: React.FC = () => {
  const [activeSearch, setActiveSearch] = useState<'flights' | 'hotels' | 'activities'>('hotels');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [providerHealth, setProviderHealth] = useState<any>(null);
  const { toast } = useToast();

  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchProviderHealth();
  }, []);

  const fetchProviderHealth = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/providers/health`);
      const data = await response.json();
      if (data.success) {
        setProviderHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch provider health:', error);
    }
  };

  const testSearch = async (searchType: 'flights' | 'hotels' | 'activities') => {
    setLoading(true);
    setActiveSearch(searchType);
    
    try {
      let searchData = {};
      let endpoint = '';
      
      if (searchType === 'flights') {
        endpoint = '/api/providers/search/flights';
        searchData = {
          origin: 'NYC',
          destination: 'LAX', 
          departure_date: '2024-12-01',
          adults: 1,
          cabin_class: 'economy'
        };
      } else if (searchType === 'hotels') {
        endpoint = '/api/providers/search/hotels';
        searchData = {
          destination: 'Paris',
          checkin_date: '2024-12-01',
          checkout_date: '2024-12-03',
          adults: 2,
          rooms: 1
        };
      } else {
        endpoint = '/api/providers/search/activities';
        searchData = {
          destination: 'London',
          date: '2024-12-01',
          participants: 2
        };
      }

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data);
        toast({
          title: "Search Complete",
          description: `Found ${data.total_results} results from ${data.providers_searched} providers`,
        });
      } else {
        throw new Error(data.error || 'Search failed');
      }
      
    } catch (error: any) {
      console.error('Search failed:', error);
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (providerId: string) => {
    if (providerId.includes('flight')) return <Plane className="w-5 h-5" />;
    if (providerId.includes('hotel')) return <Building className="w-5 h-5" />;
    if (providerId.includes('activit')) return <MapPin className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Enhanced Provider Integration
        </h1>
        <p className="text-gray-600">
          Experience our new provider ecosystem with Expedia, Nuitée, and GetYourGuide
        </p>
      </div>

      {/* Provider Health Status */}
      {providerHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Provider Health Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {providerHealth.summary.total_providers}
                </div>
                <p className="text-sm text-gray-600">Total Providers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {providerHealth.summary.healthy_providers}
                </div>
                <p className="text-sm text-gray-600">Healthy</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {providerHealth.summary.unhealthy_providers}
                </div>
                <p className="text-sm text-gray-600">Unhealthy</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(providerHealth.providers).filter(p => 
                    ['expedia_flights', 'expedia_hotels', 'nuitee_hotels', 'getyourguide_activities'].includes(p)
                  ).length}
                </div>
                <p className="text-sm text-gray-600">New Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Test Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Live Provider Testing</CardTitle>
          <p className="text-sm text-gray-600">
            Test our enhanced provider integration with real API calls
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Type Selector */}
            <div className="flex space-x-2">
              <Button 
                variant={activeSearch === 'flights' ? 'default' : 'outline'}
                onClick={() => testSearch('flights')}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Plane className="w-4 h-4" />
                <span>Test Flights</span>
              </Button>
              <Button 
                variant={activeSearch === 'hotels' ? 'default' : 'outline'}
                onClick={() => testSearch('hotels')}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Building className="w-4 h-4" />
                <span>Test Hotels</span>
              </Button>
              <Button 
                variant={activeSearch === 'activities' ? 'default' : 'outline'}
                onClick={() => testSearch('activities')}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Test Activities</span>
              </Button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Searching across multiple providers...</p>
              </div>
            )}

            {/* Search Results */}
            {searchResults && !loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <h3 className="font-semibold text-green-800">
                      Search Completed Successfully
                    </h3>
                    <p className="text-sm text-green-600">
                      Found {searchResults.total_results} results from {searchResults.providers_searched} providers
                    </p>
                  </div>
                  <Badge className="bg-green-500">
                    ID: {searchResults.search_id.substring(0, 8)}
                  </Badge>
                </div>

                {/* Provider Results */}
                <div className="grid gap-4">
                  {searchResults.responses.map((provider) => (
                    <Card key={provider.provider_id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getProviderIcon(provider.provider_id)}
                            <div>
                              <CardTitle className="text-lg">{provider.provider_name}</CardTitle>
                              <p className="text-sm text-gray-500">ID: {provider.provider_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={provider.success ? 'default' : 'destructive'}>
                              {provider.success ? 'Success' : 'Failed'}
                            </Badge>
                            <div className="text-sm text-gray-500 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{provider.response_time_ms}ms</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {provider.success ? (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Found {provider.total_results} result(s)
                            </p>
                            {provider.results.slice(0, 2).map((result, index) => (
                              <div key={index} className="p-3 bg-white rounded-lg mb-2">
                                {activeSearch === 'flights' && (
                                  <div>
                                    <p className="font-medium">{result.airline || 'Flight'} {result.flight_number}</p>
                                    <p className="text-sm text-gray-600">
                                      {result.origin} → {result.destination} • {result.duration}
                                    </p>
                                    <p className="text-lg font-bold text-green-600">
                                      ${result.price} {result.currency}
                                    </p>
                                  </div>
                                )}
                                {activeSearch === 'hotels' && (
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="font-medium">{result.name}</p>
                                      {result.rating && (
                                        <div className="flex items-center space-x-1">
                                          <Star className="w-3 h-3 text-yellow-500" />
                                          <span className="text-sm">{result.rating}</span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">{result.destination}</p>
                                    <p className="text-lg font-bold text-green-600">
                                      ${result.price_per_night}/night
                                    </p>
                                    {result.amenities && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {result.amenities.slice(0, 3).map((amenity: string) => (
                                          <Badge key={amenity} variant="outline" className="text-xs">
                                            {amenity}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {activeSearch === 'activities' && (
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="font-medium">{result.title}</p>
                                      {result.rating && (
                                        <div className="flex items-center space-x-1">
                                          <Star className="w-3 h-3 text-yellow-500" />
                                          <span className="text-sm">{result.rating}</span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">{result.category} • {result.duration}</p>
                                    <p className="text-lg font-bold text-green-600">
                                      ${result.price} {result.currency}
                                    </p>
                                    {result.highlights && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {result.highlights.slice(0, 3).map((highlight: string) => (
                                          <Badge key={highlight} variant="outline" className="text-xs">
                                            {highlight}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {result.demo_mode && (
                                  <Badge variant="secondary" className="mt-2">
                                    Demo Mode
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-red-600 font-medium">Provider Error</p>
                            <p className="text-sm text-gray-600">{provider.error}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Provider Highlights */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              <Plane className="w-5 h-5" />
              <span>Expedia Flights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✈️ 700+ airline partnerships</li>
              <li>🎯 Real-time pricing</li>
              <li>💺 Seat selection</li>
              <li>🧳 Baggage options</li>
            </ul>
            <div className="mt-4 p-2 bg-blue-50 rounded">
              <p className="text-xs text-blue-600">
                <strong>Provider ID:</strong> expedia_flights
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-700">
              <Building className="w-5 h-5" />
              <span>Nuitée Hotels</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>🏨 Curated boutique hotels</li>
              <li>⭐ Premium properties</li>
              <li>🔔 Concierge service</li>
              <li>📱 Flexible booking</li>
            </ul>
            <div className="mt-4 p-2 bg-purple-50 rounded">
              <p className="text-xs text-purple-600">
                <strong>Provider ID:</strong> nuitee_hotels
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <MapPin className="w-5 h-5" />
              <span>GetYourGuide</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>🎭 200,000+ activities</li>
              <li>✅ Instant confirmation</li>
              <li>📱 Mobile tickets</li>
              <li>👥 Expert guides</li>
            </ul>
            <div className="mt-4 p-2 bg-green-50 rounded">
              <p className="text-xs text-green-600">
                <strong>Provider ID:</strong> getyourguide_activities
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Health Grid */}
      {providerHealth && (
        <Card>
          <CardHeader>
            <CardTitle>All Provider Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(providerHealth.providers).map(([providerId, provider]: [string, any]) => (
                <div key={providerId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getProviderIcon(providerId)}
                    <div>
                      <p className="font-medium text-sm">{provider.provider_name}</p>
                      <p className="text-xs text-gray-500">{provider.provider_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <CheckCircle className={`w-4 h-4 ${getStatusColor(provider.is_healthy)}`} />
                    {provider.avg_response_time_ms > 0 && (
                      <p className="text-xs text-gray-500">
                        {Math.round(provider.avg_response_time_ms)}ms
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <p className="text-gray-600">
          Ready to test our enhanced provider ecosystem?
        </p>
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={() => testSearch('hotels')}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            Test Hotel Search
          </Button>
          <Button 
            onClick={() => testSearch('activities')}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
          >
            Test Activities
          </Button>
          <Button 
            onClick={fetchProviderHealth}
            variant="outline"
            disabled={loading}
          >
            Refresh Status
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProviderShowcase;