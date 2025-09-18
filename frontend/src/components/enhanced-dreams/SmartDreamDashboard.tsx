import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Sparkles, 
  TrendingUp,
  Brain,
  Users,
  Settings,
  RefreshCw
} from 'lucide-react';

import { UserInsightsPanel } from './UserInsightsPanel';
import { EnhancedDreamGrid } from './EnhancedDreamGrid';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';
import { useAuth } from '@/features/auth/context/AuthContext';
import { EnhancedDestination } from '@/types/enhanced-dream-types';

export const SmartDreamDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('discover');
  const [showAIInsights, setShowAIInsights] = useState(true);

  const {
    destinations,
    userProfile,
    userInsights,
    loading,
    error,
    searchDestinations,
    filterDestinations,
    refetch,
    behaviorTracking,
    setBehaviorTracking,
  } = useEnhancedDreams({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    continent: selectedContinent !== 'all' ? selectedContinent : undefined,
    includeAIContext: showAIInsights,
    limit: 50,
  });

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchDestinations(query);
    }
  };

  // Handle filter changes  
  const handleFilterChange = async (filterType: string, value: string) => {
    const filters = { [filterType]: value };
    await filterDestinations(filters);
    
    if (filterType === 'category') {
      setSelectedCategory(value);
    } else if (filterType === 'continent') {
      setSelectedContinent(value);
    }
  };

  // Handle destination click
  const handleDestinationClick = (destination: EnhancedDestination) => {
    // This will be expanded in future phases
    console.log('Destination clicked:', destination.name);
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'beaches', label: '🏖️ Beaches' },
    { value: 'mountains', label: '⛰️ Mountains' },
    { value: 'cultural', label: '🏛️ Cultural' },
    { value: 'spiritual', label: '🕉️ Spiritual' },
    { value: 'adventure', label: '🎯 Adventure' },
    { value: 'cities', label: '🏙️ Cities' },
  ];

  const continents = [
    { value: 'all', label: 'All Continents' },
    { value: 'Asia', label: '🌏 Asia' },
    { value: 'Europe', label: '🇪🇺 Europe' },
    { value: 'North America', label: '🌎 North America' },
    { value: 'South America', label: '🌎 South America' },
    { value: 'Africa', label: '🌍 Africa' },
    { value: 'Oceania', label: '🌊 Oceania' },
    { value: 'Antarctica', label: '🐧 Antarctica' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Smart Dream Hub
              </h1>
              <p className="text-muted-foreground text-sm">
                AI-powered destination discovery and planning
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* AI Toggle */}
              <Button
                variant={showAIInsights ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                AI Insights
                {showAIInsights && <Badge variant="secondary" className="ml-1">ON</Badge>}
              </Button>

              {/* Behavior Tracking Toggle */}
              <Button
                variant={behaviorTracking ? "default" : "outline"}
                size="sm"
                onClick={() => setBehaviorTracking(!behaviorTracking)}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Learning
                {behaviorTracking && <Badge variant="secondary" className="ml-1">ON</Badge>}
              </Button>

              {/* Refresh */}
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="planner">Planner</TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search dream destinations..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger className="w-full lg:w-[200px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Continent Filter */}
                  <Select value={selectedContinent} onValueChange={(value) => handleFilterChange('continent', value)}>
                    <SelectTrigger className="w-full lg:w-[200px]">
                      <SelectValue placeholder="Continent" />
                    </SelectTrigger>
                    <SelectContent>
                      {continents.map((continent) => (
                        <SelectItem key={continent.value} value={continent.value}>
                          {continent.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Active Filters */}
                {(selectedCategory !== 'all' || selectedContinent !== 'all' || searchQuery) && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                    {searchQuery && (
                      <Badge variant="secondary">
                        Search: "{searchQuery}"
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => handleSearch('')}
                        >
                          ×
                        </Button>
                      </Badge>
                    )}
                    {selectedCategory !== 'all' && (
                      <Badge variant="secondary">
                        {categories.find(c => c.value === selectedCategory)?.label}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => handleFilterChange('category', 'all')}
                        >
                          ×
                        </Button>
                      </Badge>
                    )}
                    {selectedContinent !== 'all' && (
                      <Badge variant="secondary">
                        {continents.find(c => c.value === selectedContinent)?.label}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => handleFilterChange('continent', 'all')}
                        >
                          ×
                        </Button>
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {error ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-destructive">Error: {error}</p>
                  <Button onClick={refetch} className="mt-2">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <EnhancedDreamGrid
                destinations={destinations}
                loading={loading}
                onDestinationClick={handleDestinationClick}
                showAIInsights={showAIInsights}
                viewMode={viewMode}
              />
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {user ? (
              <UserInsightsPanel
                profile={userProfile}
                insights={userInsights}
                loading={loading}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Sign in for AI Insights</h3>
                  <p className="text-muted-foreground mb-4">
                    Get personalized travel recommendations and unlock your travel DNA!
                  </p>
                  <Button onClick={() => window.location.href = '/auth'}>
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Social Tab - Placeholder for Phase 2 */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Social Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon!</h3>
                  <p className="text-muted-foreground">
                    Connect with friends, share dreams, and plan group trips together.
                  </p>
                  <Badge variant="secondary" className="mt-4">
                    Phase 2 Feature
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planner Tab - Placeholder for Phase 3 */}
          <TabsContent value="planner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  AI Trip Planner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon!</h3>
                  <p className="text-muted-foreground">
                    AI-powered multi-destination trip planning with optimal routing and timing.
                  </p>
                  <Badge variant="secondary" className="mt-4">
                    Phase 3 Feature
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};