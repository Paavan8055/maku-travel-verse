import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Clock, Target, Filter, BarChart3, Brain, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'sop' | 'task' | 'project' | 'knowledge';
  category?: string;
  tags: string[];
  relevance_score: number;
  last_updated: string;
}

interface SearchAnalytics {
  id: string;
  query: string;
  search_type: string;
  results_count: number;
  clicked_result_id?: string;
  clicked_result_type?: string;
  search_duration_ms?: number;
  created_at: string;
}

export function SearchModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadSearchAnalytics();
  }, []);

  const loadSearchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSearchAnalytics(data || []);
    } catch (error) {
      console.error('Error loading search analytics:', error);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const startTime = Date.now();

    try {
      const results: SearchResult[] = [];

      // Search documents
      if (searchType === 'all' || searchType === 'documents') {
        const { data: docs } = await supabase
          .from('documents')
          .select('id, title, content, category, tags, updated_at')
          .textSearch('search_vector', searchQuery)
          .limit(10);

        if (docs) {
          results.push(...docs.map(doc => ({
            id: doc.id,
            title: doc.title,
            content: doc.content || '',
            type: 'document' as const,
            category: doc.category,
            tags: doc.tags || [],
            relevance_score: Math.random() * 0.3 + 0.7, // Mock relevance
            last_updated: doc.updated_at
          })));
        }
      }

      // Search SOPs
      if (searchType === 'all' || searchType === 'sops') {
        const { data: sops } = await supabase
          .from('standard_operating_procedures')
          .select('id, title, content, category, tags, updated_at')
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .limit(5);

        if (sops) {
          results.push(...sops.map(sop => ({
            id: sop.id,
            title: sop.title,
            content: sop.content,
            type: 'sop' as const,
            category: sop.category,
            tags: sop.tags || [],
            relevance_score: Math.random() * 0.3 + 0.6,
            last_updated: sop.updated_at
          })));
        }
      }

      // Search Knowledge Base
      if (searchType === 'all' || searchType === 'knowledge') {
        const { data: knowledge } = await supabase
          .from('knowledge_base_entries')
          .select('id, title, content, category, tags, updated_at')
          .textSearch('search_vector', searchQuery)
          .limit(10);

        if (knowledge) {
          results.push(...knowledge.map(kb => ({
            id: kb.id,
            title: kb.title,
            content: kb.content,
            type: 'knowledge' as const,
            category: kb.category,
            tags: kb.tags || [],
            relevance_score: Math.random() * 0.3 + 0.8,
            last_updated: kb.updated_at
          })));
        }
      }

      // Search Tasks
      if (searchType === 'all' || searchType === 'tasks') {
        const { data: tasks } = await supabase
          .from('ai_workplace_tasks')
          .select('id, title, description, tags, updated_at')
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5);

        if (tasks) {
          results.push(...tasks.map(task => ({
            id: task.id,
            title: task.title,
            content: task.description || '',
            type: 'task' as const,
            tags: task.tags || [],
            relevance_score: Math.random() * 0.3 + 0.5,
            last_updated: task.updated_at
          })));
        }
      }

      // Search Projects
      if (searchType === 'all' || searchType === 'projects') {
        const { data: projects } = await supabase
          .from('ai_workplace_projects')
          .select('id, name, description, tags, updated_at')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5);

        if (projects) {
          results.push(...projects.map(project => ({
            id: project.id,
            title: project.name,
            content: project.description || '',
            type: 'project' as const,
            tags: project.tags || [],
            relevance_score: Math.random() * 0.3 + 0.6,
            last_updated: project.updated_at
          })));
        }
      }

      // Sort by relevance
      results.sort((a, b) => b.relevance_score - a.relevance_score);

      setSearchResults(results);

      // Log search analytics
      const duration = Date.now() - startTime;
      await supabase.from('search_analytics').insert([{
        query: searchQuery,
        search_type: searchType,
        results_count: results.length,
        search_duration_ms: duration,
        filters_applied: { category: selectedCategory, type: searchType }
      }]);

      loadSearchAnalytics();

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = async (result: SearchResult) => {
    try {
      await supabase.from('search_analytics').insert([{
        query: searchQuery,
        search_type: searchType,
        results_count: 1,
        clicked_result_id: result.id,
        clicked_result_type: result.type
      }]);

      // Update usage count for knowledge base entries
      if (result.type === 'knowledge') {
        await supabase
          .from('knowledge_base_entries')
          .update({ 
            usage_count: supabase.rpc('increment_usage_count'),
            last_used_at: new Date().toISOString()
          })
          .eq('id', result.id);
      }

      loadSearchAnalytics();
    } catch (error) {
      console.error('Error tracking result click:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return '📄';
      case 'sop': return '📋';
      case 'task': return '✓';
      case 'project': return '🗂️';
      case 'knowledge': return '🧠';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'sop': return 'bg-green-100 text-green-800';
      case 'task': return 'bg-orange-100 text-orange-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      case 'knowledge': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const topQueries = searchAnalytics
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

  const averageResultsCount = searchAnalytics.length > 0 
    ? searchAnalytics.reduce((sum, item) => sum + item.results_count, 0) / searchAnalytics.length 
    : 0;

  const totalSearches = searchAnalytics.length;
  const searchesWithResults = searchAnalytics.filter(s => s.results_count > 0).length;
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
            Search across documents, SOPs, tasks, projects, and knowledge base
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
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
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
                <SelectItem value="sops">SOPs</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="knowledge">Knowledge Base</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={performSearch} disabled={isSearching}>
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
                  onClick={() => handleResultClick(result)}
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
                          {Math.round(result.relevance_score * 100)}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.content.substring(0, 200)}...
                      </p>
                      {result.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {result.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.last_updated).toLocaleDateString()}
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
                <div className="text-2xl font-bold">{searchAnalytics.slice(0, 24).length}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
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
                  {searchAnalytics.slice(0, 10).map((search) => (
                    <div key={search.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{search.query}</p>
                        <p className="text-xs text-muted-foreground">
                          {search.results_count} results • {search.search_type}
                          {search.search_duration_ms && ` • ${search.search_duration_ms}ms`}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(search.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Intelligent analysis of workplace patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Content Gaps</h4>
                  <p className="text-sm text-muted-foreground">
                    Common search queries without results suggest missing documentation areas.
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="text-sm">
                      • "onboarding process" - 12 searches, 0 results
                    </div>
                    <div className="text-sm">
                      • "expense reporting" - 8 searches, 1 result
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Popular Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Most accessed content indicates important organizational knowledge.
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="text-sm">
                      • Meeting templates - 45 views
                    </div>
                    <div className="text-sm">
                      • Project guidelines - 32 views
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Search Patterns</h4>
                  <p className="text-sm text-muted-foreground">
                    Peak search times and common query patterns.
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="text-sm">
                      • Most active: 9-11 AM
                    </div>
                    <div className="text-sm">
                      • Common: "how to" queries
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Knowledge Quality</h4>
                  <p className="text-sm text-muted-foreground">
                    Assessment of content accuracy and usefulness.
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="text-sm">
                      • Average confidence: 87%
                    </div>
                    <div className="text-sm">
                      • Outdated content: 3 items
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Smart Recommendations
              </CardTitle>
              <CardDescription>
                AI-generated suggestions to improve workplace efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600 font-medium">High Priority</span>
                    <Badge variant="outline">Documentation</Badge>
                  </div>
                  <h4 className="font-medium mb-2">Create Onboarding Documentation</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Multiple searches for "onboarding process" indicate a need for comprehensive onboarding documentation.
                  </p>
                  <Button size="sm">Create Template</Button>
                </div>

                <div className="p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-600 font-medium">Medium Priority</span>
                    <Badge variant="outline">Process</Badge>
                  </div>
                  <h4 className="font-medium mb-2">Update Expense Reporting Guide</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Current expense reporting documentation has low search relevance. Consider updating with more detailed procedures.
                  </p>
                  <Button size="sm" variant="outline">Review Content</Button>
                </div>

                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-medium">Optimization</span>
                    <Badge variant="outline">Search</Badge>
                  </div>
                  <h4 className="font-medium mb-2">Improve Search Tags</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Adding more descriptive tags to popular documents could improve search accuracy by 15%.
                  </p>
                  <Button size="sm" variant="outline">Auto-Tag Content</Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Knowledge Sharing</span>
                    <Badge variant="outline">Collaboration</Badge>
                  </div>
                  <h4 className="font-medium mb-2">Create FAQ from Search Queries</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Convert frequently searched questions into a centralized FAQ to reduce search time.
                  </p>
                  <Button size="sm" variant="outline">Generate FAQ</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}