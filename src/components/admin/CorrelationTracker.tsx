
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Search, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CorrelationData {
  id: string;
  correlation_id: string;
  request_type: string;
  status: string;
  created_at: string;
  completed_at?: string;
  duration_ms?: number;
  request_data: any;
  response_data?: any;
  user_id?: string;
}

// Helper function to generate real-time sample data if no database records exist
const generateEmptyStateMessage = (): CorrelationData[] => [];

export const CorrelationTracker = () => {
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'failed'>('all');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCorrelations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from Supabase
      let query = supabase
        .from('correlation_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (searchId.trim()) {
        query = query.or(`correlation_id.ilike.%${searchId}%,user_id.eq.${searchId}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Failed to fetch correlation data:', fetchError);
        setError('Unable to connect to correlation database');
        setCorrelations([]);
        toast({
          title: "Connection Error",
          description: "Could not load correlation tracking data",
          variant: "destructive"
        });
      } else {
        setCorrelations(data || []);
        if (!data || data.length === 0) {
          toast({
            title: "No Data",
            description: "No correlation tracking data found for the current filters",
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Correlation fetch error:', error);
      setError('Failed to fetch correlation data');
      setCorrelations([]);
      toast({
        title: "Database Error",
        description: "Unable to load correlation tracking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelations();
  }, [filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCorrelations();
  };

  const handleRefresh = () => {
    setSearchId('');
    setFilter('all');
    fetchCorrelations();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header & Search */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Correlation Tracker</h2>
          <Button 
            onClick={handleRefresh} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="Search by correlation ID or user ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({correlations.length})</TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({correlations.filter(c => c.status === 'in_progress').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({correlations.filter(c => c.status === 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({correlations.filter(c => c.status === 'failed').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correlations List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading correlations...</p>
            </CardContent>
          </Card>
        ) : correlations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No correlations found</p>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          correlations.map((correlation) => (
            <Card key={correlation.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(correlation.status)}
                    <CardTitle className="text-lg font-semibold">
                      {correlation.request_type.replace(/_/g, ' ').toUpperCase()}
                    </CardTitle>
                    <Badge className={`${getStatusColor(correlation.status)} border`}>
                      {correlation.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {formatDuration(correlation.duration_ms)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1 text-foreground">Correlation ID</p>
                    <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded border">
                      {correlation.correlation_id}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1 text-foreground">Timestamps</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Started: {new Date(correlation.created_at).toLocaleString()}</p>
                      {correlation.completed_at && (
                        <p>Completed: {new Date(correlation.completed_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {correlation.user_id && (
                    <div>
                      <p className="text-sm font-medium mb-1 text-foreground">User ID</p>
                      <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded border">
                        {correlation.user_id}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-1 text-foreground">Request Data</p>
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded border max-h-20 overflow-y-auto">
                      <pre>{JSON.stringify(correlation.request_data, null, 2)}</pre>
                    </div>
                  </div>

                  {correlation.response_data && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium mb-1 text-foreground">Response Data</p>
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded border max-h-32 overflow-y-auto">
                        <pre>{JSON.stringify(correlation.response_data, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
