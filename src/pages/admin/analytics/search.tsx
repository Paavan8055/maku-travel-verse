import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Users, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminTravelIntelligence } from '@/features/admin/components/AdminTravelIntelligence';

const AdminSearchAnalyticsPage = () => {
  const { data: searchStats, isLoading, refetch } = useQuery({
    queryKey: ['admin-search-analytics'],
    queryFn: async () => {
      const { data: searches } = await supabase
        .from('search_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      const totalSearches = searches?.length || 0;
      const flightSearches = searches?.filter(s => s.product === 'flight').length || 0;
      const hotelSearches = searches?.filter(s => s.product === 'hotel').length || 0;
      const activitySearches = searches?.filter(s => s.product === 'activity').length || 0;

      const popularDestinations = searches?.reduce((acc: any, search) => {
        const params = search.params as any;
        const destination = params?.destination || params?.city_iata;
        if (destination) {
          acc[destination] = (acc[destination] || 0) + 1;
        }
        return acc;
      }, {});

      return {
        totalSearches,
        flightSearches,
        hotelSearches,
        activitySearches,
        popularDestinations: Object.entries(popularDestinations || {})
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 10),
        rawSearchData: searches || []
      };
    },
    refetchInterval: 30000
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="h-8 w-8" />
            Search Analytics
          </h1>
          <p className="text-muted-foreground">
            Monitor search patterns and user behavior across all products
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchStats?.totalSearches?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">All products combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flight Searches</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchStats?.flightSearches?.toLocaleString() || 0}</div>
            <Badge variant="secondary">
              {searchStats?.totalSearches ? Math.round((searchStats.flightSearches / searchStats.totalSearches) * 100) : 0}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hotel Searches</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchStats?.hotelSearches?.toLocaleString() || 0}</div>
            <Badge variant="secondary">
              {searchStats?.totalSearches ? Math.round((searchStats.hotelSearches / searchStats.totalSearches) * 100) : 0}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Searches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchStats?.activitySearches?.toLocaleString() || 0}</div>
            <Badge variant="secondary">
              {searchStats?.totalSearches ? Math.round((searchStats.activitySearches / searchStats.totalSearches) * 100) : 0}%
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="destinations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="destinations">Popular Destinations</TabsTrigger>
          <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
          <TabsTrigger value="patterns">Search Patterns</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="destinations">
          <Card>
            <CardHeader>
              <CardTitle>Top Destinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchStats?.popularDestinations?.map(([destination, count], index) => (
                  <div key={destination} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{destination}</span>
                    </div>
                    <Badge>{count as number} searches</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence">
          <AdminTravelIntelligence 
            searchData={searchStats?.rawSearchData || []}
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Search Patterns Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Search Pattern Analytics</h3>
                <p className="text-muted-foreground">
                  Detailed search pattern analysis coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle>Search to Booking Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Conversion Rate Analysis</h3>
                <p className="text-muted-foreground">
                  Search-to-booking conversion analytics coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSearchAnalyticsPage;