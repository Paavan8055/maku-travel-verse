import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Search, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

export const CorrelationTracker = () => {
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'failed'>('all');
  const { toast } = useToast();

  const fetchCorrelations = async () => {
    try {
      setLoading(true);
      
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

      const { data, error } = await query;

      if (error) throw error;

      setCorrelations(data || []);
    } catch (error) {
      console.error('Correlation fetch error:', error);
      toast({
        title: "Fetch Error",
        description: "Failed to fetch correlation data",
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
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-warning animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'failed': return 'bg-destructive';
      case 'in_progress': return 'bg-warning';
      default: return 'bg-muted';
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

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Correlation Tracker</h2>
        
        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="Search by correlation ID or user ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Correlations List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading correlations...
            </CardContent>
          </Card>
        ) : correlations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No correlations found</p>
            </CardContent>
          </Card>
        ) : (
          correlations.map((correlation) => (
            <Card key={correlation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(correlation.status)}
                    <CardTitle className="text-lg">{correlation.request_type}</CardTitle>
                    <Badge className={getStatusColor(correlation.status)}>
                      {correlation.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(correlation.duration_ms)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Correlation ID</p>
                    <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                      {correlation.correlation_id}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Timestamps</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Started: {new Date(correlation.created_at).toLocaleString()}</p>
                      {correlation.completed_at && (
                        <p>Completed: {new Date(correlation.completed_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {correlation.user_id && (
                    <div>
                      <p className="text-sm font-medium mb-1">User ID</p>
                      <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                        {correlation.user_id}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-1">Request Data</p>
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded max-h-20 overflow-y-auto">
                      <pre>{JSON.stringify(correlation.request_data, null, 2)}</pre>
                    </div>
                  </div>

                  {correlation.response_data && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium mb-1">Response Data</p>
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded max-h-32 overflow-y-auto">
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

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchCorrelations} disabled={loading}>
          Refresh Data
        </Button>
      </div>
    </div>
  );
};