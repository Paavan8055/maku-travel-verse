import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Virtual scrolling will be implemented when needed
import { Layers, Filter, SortAsc, Grid, List as ListIcon, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TierConfig {
  tier: 1 | 2 | 3;
  title: string;
  description: string;
  fields: string[];
  expandable: boolean;
}

interface ProgressiveResultsLayoutProps<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  renderItem: (item: T, tier: 1 | 2 | 3) => React.ReactNode;
  useVirtualScrolling?: boolean;
  enableTierToggle?: boolean;
  className?: string;
  itemHeight?: number;
  estimateItemSize?: (index: number) => number;
}

const tierConfigs: TierConfig[] = [
  {
    tier: 1,
    title: 'Essential',
    description: 'Core information for quick decisions',
    fields: ['title', 'price', 'rating', 'availability'],
    expandable: false
  },
  {
    tier: 2,
    title: 'Detailed',
    description: 'Additional context and insights',
    fields: ['description', 'amenities', 'location', 'reviews'],
    expandable: true
  },
  {
    tier: 3,
    title: 'Comprehensive',
    description: 'Complete information and analytics',
    fields: ['specifications', 'policies', 'comparisons', 'analytics'],
    expandable: true
  }
];

export function ProgressiveResultsLayout<T>({
  data,
  loading,
  error,
  renderItem,
  useVirtualScrolling = false,
  enableTierToggle = true,
  className = '',
  itemHeight = 200,
  estimateItemSize
}: ProgressiveResultsLayoutProps<T>) {
  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [showTierIndicators, setShowTierIndicators] = useState(true);

  // Performance optimization: memoize sorted data
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return ((a as any).price || 0) - ((b as any).price || 0);
        case 'rating':
          return ((b as any).rating || 0) - ((a as any).rating || 0);
        case 'alphabetical':
          return ((a as any).title || '').localeCompare((b as any).title || '');
        default:
          return 0; // Keep original order for relevance
      }
    });
  }, [data, sortBy]);

  // Virtual list item renderer (simplified for now)
  const VirtualItem = useCallback(({ index }: { index: number }) => (
    <div className="p-2">
      {renderItem(sortedData[index], activeTier)}
    </div>
  ), [sortedData, renderItem, activeTier]);

  // Progressive loading skeleton
  const LoadingSkeleton = ({ tier }: { tier: 1 | 2 | 3 }) => (
    <div className="space-y-4">
      {[...Array(tier === 1 ? 3 : tier === 2 ? 6 : 9)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              {tier >= 2 && (
                <>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </>
              )}
              {tier === 3 && (
                <>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {enableTierToggle && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="animate-pulse h-6 bg-muted rounded w-32"></div>
                <div className="animate-pulse h-8 bg-muted rounded w-24"></div>
              </div>
            </CardHeader>
          </Card>
        )}
        <LoadingSkeleton tier={activeTier} />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Error loading results: {error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No results found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progressive Information Controls */}
      {enableTierToggle && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Information Detail Level
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTierIndicators(!showTierIndicators)}
                >
                  {showTierIndicators ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tier Selection */}
            <Tabs value={activeTier.toString()} onValueChange={(value) => setActiveTier(parseInt(value) as 1 | 2 | 3)}>
              <TabsList className="grid w-full grid-cols-3">
                {tierConfigs.map((config) => (
                  <TabsTrigger key={config.tier} value={config.tier.toString()}>
                    {config.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {showTierIndicators && (
                <div className="mt-2">
                  {tierConfigs.map((config) => (
                    <TabsContent key={config.tier} value={config.tier.toString()} className="mt-0">
                      <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium mb-1">{config.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {config.fields.map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </div>
              )}
            </Tabs>

            {/* View and Sort Controls */}
            <div className="flex items-center justify-between">
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
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Badge variant="secondary">
                {sortedData.length} result{sortedData.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      <div className="space-y-4">
        {useVirtualScrolling && sortedData.length > 50 ? (
          // Virtual scrolling placeholder - will be implemented when react-window is properly configured
          <div className="h-96 border rounded-lg overflow-y-auto">
            <div className="space-y-4 p-4">
              {sortedData.map((item, index) => (
                <div key={index}>
                  {renderItem(item, activeTier)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Standard rendering for smaller datasets
          <div className={cn(
            'space-y-4',
            viewMode === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0'
          )}>
            {sortedData.map((item, index) => (
              <div key={index} className={cn(viewMode === 'list' && 'mb-4')}>
                {renderItem(item, activeTier)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progressive Enhancement Indicators */}
      {showTierIndicators && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-medium">Showing {tierConfigs.find(c => c.tier === activeTier)?.title} view</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {activeTier === 1 && 'Quick overview • '}
                  {activeTier === 2 && 'Detailed information • '}
                  {activeTier === 3 && 'Complete analysis • '}
                  {sortedData.length} items
                </span>
                {activeTier < 3 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setActiveTier(Math.min(3, activeTier + 1) as 1 | 2 | 3)}
                    className="h-auto p-0 text-xs"
                  >
                    Show more details
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}