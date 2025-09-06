import React, { useState } from 'react';
import { Search, TrendingUp, Clock, Target, Filter, BarChart3, Brain, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'knowledge' | 'calendar';
  score: number;
  source: string;
  created_at: string;
}

interface SearchHistory {
  id: string;
  query: string;
  results_count: number;
  timestamp: string;
}

export function SearchModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      
      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Project Documentation',
          content: `Content related to ${searchQuery}...`,
          type: 'document',
          score: 0.95,
          source: 'Documents',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'API Reference',
          content: `Knowledge base entry about ${searchQuery}...`,
          type: 'knowledge',
          score: 0.90,
          source: 'Knowledge Base',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Team Meeting',
          content: `Calendar event discussing ${searchQuery}...`,
          type: 'calendar',
          score: 0.85,
          source: 'Calendar',
          created_at: new Date().toISOString(),
        },
      ];

      setSearchResults(mockResults);
      
      // Add to search history
      const historyItem: SearchHistory = {
        id: Date.now().toString(),
        query: searchQuery,
        results_count: mockResults.length,
        timestamp: new Date().toISOString(),
      };
      setSearchHistory(prev => [historyItem, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: 'Error',
        description: 'Failed to search content',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return '📄';
      case 'knowledge': return '🧠';
      case 'calendar': return '📅';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'knowledge': return 'bg-indigo-100 text-indigo-800';
      case 'calendar': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const topQueries = searchHistory
    .reduce((acc, item) => {
      const existing = acc.find(q => q.query === item.query);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ query: item.query, count: 1 });
      }
      return acc;
    }, [] as { query: string; count: number }[])
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const averageResultsCount = searchHistory.length > 0 
    ? searchHistory.reduce((sum, item) => sum + item.results_count, 0) / searchHistory.length 
    : 0;

  const totalSearches = searchHistory.length;
  const searchesWithResults = searchHistory.filter(s => s.results_count > 0).length;
  const successRate = totalSearches > 0 ? (searchesWithResults / totalSearches) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Search & Intelligence</h2>
          <p className="text-muted-foreground">
            Intelligent search across all workplace content with analytics
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unified Search</CardTitle>
          <CardDescription>
            Search across documents, tasks, projects, and knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search anything in your workplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="knowledge">Knowledge Base</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Search Results ({searchResults.length})</h3>
              {searchResults.map((result) => (
                <div 
                  key={`${result.type}-${result.id}`}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getTypeIcon(result.type)}</span>
                        <h4 className="font-medium">{result.title}</h4>
                        <Badge className={getTypeColor(result.type)} variant="secondary">
                          {result.type}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(result.score * 100)}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.content.substring(0, 200)}...
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Search Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSearches}</div>
                <p className="text-xs text-muted-foreground">
                  {searchesWithResults} with results
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Searches with results
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Results</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageResultsCount.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Per search query
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchHistory.slice(0, 5).length}</div>
                <p className="text-xs text-muted-foreground">
                  Last few searches
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topQueries.map((query, index) => (
                    <div key={query.query} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm">{query.query}</span>
                      </div>
                      <Badge variant="secondary">{query.count}</Badge>
                    </div>
                  ))}
                  {topQueries.length === 0 && (
                    <p className="text-sm text-muted-foreground">No search queries yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Search Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchHistory.slice(0, 10).map((search) => (
                    <div key={search.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{search.query}</p>
                        <p className="text-xs text-muted-foreground">
                          {search.results_count} results
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(search.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {searchHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground">No search history yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Content Gap Analysis</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Users frequently search for "deployment procedures" but no relevant content exists.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Popular Topics</h4>
                    <p className="text-sm text-green-700 mt-1">
                      API documentation is the most accessed knowledge base category.
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-900">Search Patterns</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Most searches happen during business hours, peak at 10 AM.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Usage Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Document searches</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-3/4 h-2 bg-blue-500 rounded"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Knowledge base</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-1/2 h-2 bg-green-500 rounded"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">50%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Calendar events</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-1/3 h-2 bg-orange-500 rounded"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">33%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Intelligent Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium">Create Missing Content</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Consider creating documentation for frequently searched topics like "API authentication" and "deployment workflows".
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Create Content
                    </Button>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium">Improve Search Tags</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add more descriptive tags to existing documents to improve search relevance.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Review Tags
                    </Button>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-medium">Update Outdated Content</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Several knowledge base entries haven't been updated in over 6 months.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Review Content
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}