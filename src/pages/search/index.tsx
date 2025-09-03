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
  const [loading, setLoading] = useState(false);

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
                  <Card className="text-center p-12">
                    <CardContent>
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Search completed</h3>
                      <p className="text-muted-foreground">
                        Advanced search functionality ready
                      </p>
                    </CardContent>
                  </Card>
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