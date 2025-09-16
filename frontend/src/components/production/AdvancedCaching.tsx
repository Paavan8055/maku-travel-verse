import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  HardDrive, 
  Zap, 
  BarChart3, 
  RefreshCw,
  Trash2,
  Settings,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useCacheManager } from '@/hooks/useCacheManager';
import logger from '@/utils/logger';

interface CacheMetrics {
  memoryCache: {
    size: number;
    hitRate: number;
    missRate: number;
    items: number;
    averageAccessTime: number;
  };
  persistentCache: {
    size: number;
    hitRate: number;
    items: number;
    expiredItems: number;
  };
  apiCache: {
    queries: number;
    hits: number;
    misses: number;
    averageResponseTime: number;
  };
  imageCache: {
    size: number;
    compressionRatio: number;
    loadTime: number;
    bandwidth: number;
  };
}

interface CacheStrategy {
  id: string;
  name: string;
  type: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  enabled: boolean;
  ttl: number;
  maxSize: number;
  priority: 'high' | 'medium' | 'low';
  hitRate: number;
}

const AdvancedCaching: React.FC = () => {
  const memoryCache = useCacheManager({ 
    storage: 'memory', 
    ttl: 300000, 
    maxSize: 100,
    keyPrefix: 'prod-' 
  });
  
  const persistentCache = useCacheManager({ 
    storage: 'localStorage', 
    ttl: 3600000, 
    maxSize: 500 
  });

  const [metrics, setMetrics] = useState<CacheMetrics>({
    memoryCache: {
      size: 24.5,
      hitRate: 87.3,
      missRate: 12.7,
      items: 156,
      averageAccessTime: 0.8
    },
    persistentCache: {
      size: 145.2,
      hitRate: 92.1,
      items: 342,
      expiredItems: 23
    },
    apiCache: {
      queries: 1247,
      hits: 1089,
      misses: 158,
      averageResponseTime: 245
    },
    imageCache: {
      size: 89.3,
      compressionRatio: 0.31,
      loadTime: 1.2,
      bandwidth: 156.7
    }
  });

  const [cacheStrategies, setCacheStrategies] = useState<CacheStrategy[]>([
    {
      id: 'search-results',
      name: 'Search Results',
      type: 'memory',
      enabled: true,
      ttl: 300,
      maxSize: 50,
      priority: 'high',
      hitRate: 94.2
    },
    {
      id: 'user-preferences',
      name: 'User Preferences',
      type: 'localStorage',
      enabled: true,
      ttl: 86400,
      maxSize: 10,
      priority: 'high',
      hitRate: 98.1
    },
    {
      id: 'api-responses',
      name: 'API Responses',
      type: 'memory',
      enabled: true,
      ttl: 600,
      maxSize: 100,
      priority: 'medium',
      hitRate: 78.9
    },
    {
      id: 'static-assets',
      name: 'Static Assets',
      type: 'localStorage',
      enabled: true,
      ttl: 604800,
      maxSize: 200,
      priority: 'low',
      hitRate: 99.5
    },
    {
      id: 'analytics-data',
      name: 'Analytics Data',
      type: 'sessionStorage',
      enabled: false,
      ttl: 1800,
      maxSize: 25,
      priority: 'low',
      hitRate: 65.3
    }
  ]);

  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    // Update metrics every 10 seconds
    const interval = setInterval(updateMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = useCallback(() => {
    // Simulate real-time metrics updates
    setMetrics(prev => ({
      memoryCache: {
        ...prev.memoryCache,
        hitRate: Math.min(100, Math.max(0, prev.memoryCache.hitRate + (Math.random() - 0.5) * 2)),
        items: prev.memoryCache.items + Math.floor((Math.random() - 0.5) * 10),
        averageAccessTime: Math.max(0.1, prev.memoryCache.averageAccessTime + (Math.random() - 0.5) * 0.2)
      },
      persistentCache: {
        ...prev.persistentCache,
        hitRate: Math.min(100, Math.max(0, prev.persistentCache.hitRate + (Math.random() - 0.5) * 1)),
        items: prev.persistentCache.items + Math.floor((Math.random() - 0.5) * 5)
      },
      apiCache: {
        ...prev.apiCache,
        queries: prev.apiCache.queries + Math.floor(Math.random() * 20),
        hits: prev.apiCache.hits + Math.floor(Math.random() * 15),
        averageResponseTime: Math.max(50, prev.apiCache.averageResponseTime + (Math.random() - 0.5) * 50)
      },
      imageCache: {
        ...prev.imageCache,
        loadTime: Math.max(0.1, prev.imageCache.loadTime + (Math.random() - 0.5) * 0.3),
        bandwidth: Math.max(0, prev.imageCache.bandwidth + (Math.random() - 0.5) * 20)
      }
    }));
  }, []);

  const toggleCacheStrategy = (strategyId: string) => {
    setCacheStrategies(prev =>
      prev.map(strategy =>
        strategy.id === strategyId
          ? { ...strategy, enabled: !strategy.enabled }
          : strategy
      )
    );
  };

  const optimizeCache = async () => {
    setIsOptimizing(true);
    
    try {
      // Simulate cache optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear expired items
      memoryCache.clearExpired();
      persistentCache.clearExpired();
      
      // Update metrics to show improvement
      setMetrics(prev => ({
        ...prev,
        memoryCache: {
          ...prev.memoryCache,
          hitRate: Math.min(100, prev.memoryCache.hitRate + 5),
          averageAccessTime: prev.memoryCache.averageAccessTime * 0.8
        },
        persistentCache: {
          ...prev.persistentCache,
          hitRate: Math.min(100, prev.persistentCache.hitRate + 3),
          expiredItems: 0
        }
      }));
      
      logger.info('Cache optimization completed');
    } catch (error) {
      logger.error('Cache optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const clearAllCaches = async () => {
    memoryCache.clear();
    persistentCache.clear();
    
    setMetrics(prev => ({
      ...prev,
      memoryCache: { ...prev.memoryCache, items: 0, size: 0 },
      persistentCache: { ...prev.persistentCache, items: 0, size: 0 }
    }));
    
    logger.info('All caches cleared');
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Cache Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Memory Cache</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(metrics.memoryCache.hitRate, 85)}`}>
                  {metrics.memoryCache.hitRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">{metrics.memoryCache.items} items</p>
              </div>
              <HardDrive className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Cache</p>
                <p className={`text-2xl font-bold ${getPerformanceColor((metrics.apiCache.hits / metrics.apiCache.queries) * 100, 80)}`}>
                  {((metrics.apiCache.hits / metrics.apiCache.queries) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">{metrics.apiCache.queries} queries</p>
              </div>
              <Database className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{(metrics.memoryCache.size + metrics.persistentCache.size).toFixed(1)}MB</p>
                <p className="text-xs text-muted-foreground">Total cached</p>
              </div>
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Access Time</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(2 - metrics.memoryCache.averageAccessTime, 1.5)}`}>
                  {metrics.memoryCache.averageAccessTime.toFixed(1)}ms
                </p>
              </div>
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cache Management</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={optimizeCache}
                disabled={isOptimizing}
              >
                {isOptimizing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Optimize
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllCaches}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="strategies" className="space-y-4">
            <TabsList>
              <TabsTrigger value="strategies">Cache Strategies</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="strategies">
              <div className="space-y-4">
                {cacheStrategies.map((strategy) => (
                  <div key={strategy.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={strategy.enabled}
                        onCheckedChange={() => toggleCacheStrategy(strategy.id)}
                      />
                      <div>
                        <p className="font-medium">{strategy.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {strategy.type}
                          </Badge>
                          <Badge variant={
                            strategy.priority === 'high' ? 'default' :
                            strategy.priority === 'medium' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {strategy.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            TTL: {strategy.ttl < 3600 ? `${strategy.ttl}s` : `${Math.floor(strategy.ttl / 3600)}h`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${getPerformanceColor(strategy.hitRate, 85)}`}>
                        {strategy.hitRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">hit rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Memory Cache Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Hit Rate</span>
                        <span className="font-bold">{metrics.memoryCache.hitRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.memoryCache.hitRate} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Average Access Time</span>
                        <span className="font-bold">{metrics.memoryCache.averageAccessTime.toFixed(1)}ms</span>
                      </div>
                      <Progress value={Math.min(100, (2 - metrics.memoryCache.averageAccessTime) * 50)} />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Cache Size</span>
                      <span className="font-bold">{metrics.memoryCache.size.toFixed(1)}MB</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API Cache Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Queries</span>
                      <span className="font-bold">{metrics.apiCache.queries.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cache Hits</span>
                      <span className="font-bold text-green-600">{metrics.apiCache.hits.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cache Misses</span>
                      <span className="font-bold text-red-600">{metrics.apiCache.misses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Avg Response Time</span>
                      <span className="font-bold">{metrics.apiCache.averageResponseTime}ms</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-2">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">+23%</p>
                      <p className="text-sm text-muted-foreground">Performance Improvement</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-2">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">-156ms</p>
                      <p className="text-sm text-muted-foreground">Reduced Load Time</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-2">
                        <Database className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-600">-34%</p>
                      <p className="text-sm text-muted-foreground">Reduced API Calls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export { AdvancedCaching };
export default AdvancedCaching;