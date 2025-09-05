import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { AdvancedFilters } from "@/components/search/AdvancedFilters";
import { SmartRecommendations } from "@/components/search/SmartRecommendations";
import { LazyImage } from "@/components/performance/LazyImage";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useLazyFlightSearch, useLazyHotelSearch, useLazyActivitySearch } from "@/hooks/useLazySearch";
import { SearchSummary } from "@/components/search/SearchSummary";
import { SearchExecuteButton } from "@/components/search/SearchExecuteButton";
import { SearchProviderIndicator } from "@/components/search/ProviderStatus";

const UnifiedSearchPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { metrics } = usePerformanceMonitor('UnifiedSearchPage');
  const { accessibilityProps } = useAccessibility({ announceChanges: true });
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const allowedSearchTypes = ['all', 'hotels', 'flights', 'activities', 'cars'] as const;
  type SearchType = typeof allowedSearchTypes[number];
  const isSearchType = (value: string): value is SearchType =>
    allowedSearchTypes.includes(value as SearchType);
  const initialType = searchParams.get('type');
  const [searchType, setSearchType] = useState<SearchType>(
    initialType && isSearchType(initialType) ? initialType : 'all'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  
  // Lazy search hooks
  const flightSearch = useLazyFlightSearch();
  const hotelSearch = useLazyHotelSearch();
  const activitySearch = useLazyActivitySearch();

  // Get active search hook based on search type
  const getActiveSearch = () => {
    switch (searchType) {
      case 'flights':
        return flightSearch;
      case 'hotels':
        return hotelSearch;
      case 'activities':
        return activitySearch;
      default:
        return null;
    }
  };

  const activeSearch = getActiveSearch();

  // Demo search preparation - normally this would come from forms
  const handleDemoSearch = () => {
    const demoParams = {
      flights: {
        origin: 'SYD',
        destination: 'MEL',
        departureDate: '2025-09-15',
        adults: 1
      },
      hotels: {
        destination: 'Sydney',
        checkIn: '2025-09-15',
        checkOut: '2025-09-17',
        adults: 2,
        rooms: 1
      },
      activities: {
        destination: 'Sydney',
        checkIn: '2025-09-15',
        checkOut: '2025-09-17'
      }
    };

    if (searchType === 'flights') {
      flightSearch.prepareSearch(demoParams.flights);
    } else if (searchType === 'hotels') {
      hotelSearch.prepareSearch(demoParams.hotels);
    } else if (searchType === 'activities') {
      activitySearch.prepareSearch(demoParams.activities);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 font-['Playfair_Display']">
              {t('common.search')} <span className="hero-text">Results</span>
            </h1>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('hero.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={searchType}
                onValueChange={(value: SearchType) => setSearchType(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="hotels">{t('navigation.hotels')}</SelectItem>
                  <SelectItem value="flights">{t('navigation.flights')}</SelectItem>
                  <SelectItem value="activities">{t('navigation.activities')}</SelectItem>
                  <SelectItem value="cars">{t('navigation.cars')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {showFilters && (
              <div className="w-80 flex-shrink-0">
                <AdvancedFilters
                  searchType={searchType === 'all' ? 'hotels' : searchType}
                  onFiltersChange={() => {}}
                />
              </div>
            )}

            <div className="flex-1">
              <Tabs defaultValue="results" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="results">Search Results</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="results">
                  <div className="space-y-6">
                    {/* Provider Status */}
                    <div className="flex justify-center">
                      <SearchProviderIndicator />
                    </div>

                    {/* Demo Search Button for testing */}
                    {searchType !== 'all' && searchType !== 'cars' && (
                      <Card className="p-6">
                        <CardContent>
                          <div className="text-center space-y-4">
                            <h3 className="text-lg font-semibold">Test {searchType} Search</h3>
                            <p className="text-muted-foreground">
                              Prepare a demo search to test the new lazy loading system
                            </p>
                            <Button onClick={handleDemoSearch} variant="outline">
                              Prepare Demo Search
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Search Summary */}
                    {activeSearch?.isSearchReady && (
                      <SearchSummary
                        searchType={searchType as 'flight' | 'hotel' | 'activity'}
                        searchParams={activeSearch.searchParams}
                        isReady={activeSearch.isSearchReady}
                      />
                    )}

                    {/* Search Execute Button */}
                    {activeSearch && (
                      <SearchExecuteButton
                        searchType={searchType as 'flight' | 'hotel' | 'activity'}
                        isReady={activeSearch.isSearchReady}
                        isLoading={activeSearch.loading}
                        onExecute={activeSearch.executeSearch}
                      />
                    )}

                    {/* Search Results */}
                    {activeSearch?.results && activeSearch.results.length > 0 && (
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Search Results ({activeSearch.results.length} found)
                          </h3>
                          <div className="space-y-4">
                            {activeSearch.results.slice(0, 5).map((result: any, index: number) => (
                              <div key={index} className="p-4 border rounded-lg">
                                <pre className="text-sm text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(result, null, 2).substring(0, 200)}...
                                </pre>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Error Display */}
                    {activeSearch?.error && (
                      <Card className="border-destructive">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold text-destructive mb-2">Search Error</h3>
                          <p className="text-muted-foreground">{activeSearch.error}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Default state */}
                    {!activeSearch && (
                      <Card className="text-center p-12">
                        <CardContent>
                          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2">Advanced Search Ready</h3>
                          <p className="text-muted-foreground">
                            Select flights, hotels, or activities to start searching. APIs are now optimized with Amadeus as the primary provider.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="recommendations">
                  <SmartRecommendations />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnifiedSearchPage;