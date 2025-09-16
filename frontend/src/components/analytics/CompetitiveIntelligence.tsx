import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Globe, AlertTriangle, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompetitorData {
  name: string;
  marketShare: number;
  pricing: number;
  customerSatisfaction: number;
  trend: 'up' | 'down' | 'stable';
}

export const CompetitiveIntelligence: React.FC = () => {
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitiveData();
  }, []);

  const fetchCompetitiveData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('business-intelligence', {
        body: { action: 'competitive_analysis' }
      });

      const mockData: CompetitorData[] = [
        { name: 'Competitor A', marketShare: 28.5, pricing: 15, customerSatisfaction: 85, trend: 'up' },
        { name: 'Competitor B', marketShare: 22.1, pricing: 12, customerSatisfaction: 78, trend: 'down' },
        { name: 'MAKU Travel', marketShare: 12.8, pricing: 18, customerSatisfaction: 94, trend: 'up' }
      ];

      setCompetitors(mockData);
    } catch (error) {
      console.error('Error fetching competitive data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Competitive Intelligence</h2>
      </div>

      <div className="grid gap-4">
        {competitors.map((competitor, idx) => (
          <Card key={idx} className={competitor.name === 'MAKU Travel' ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {competitor.name === 'MAKU Travel' && <Crown className="h-5 w-5 text-yellow-500" />}
                  {competitor.name}
                </CardTitle>
                <Badge variant={competitor.trend === 'up' ? 'default' : 'destructive'}>
                  {competitor.marketShare}% Market Share
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">{competitor.pricing}%</div>
                  <div className="text-sm text-muted-foreground">Price Premium</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{competitor.customerSatisfaction}%</div>
                  <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                </div>
                <div className="text-center">
                  <TrendingUp className={`h-6 w-6 mx-auto ${competitor.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  <div className="text-sm text-muted-foreground capitalize">{competitor.trend}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};