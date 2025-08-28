
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, TrendingUp, Users, Clock } from 'lucide-react';

export default function AdminSearchAnalytics() {
  const searchMetrics = [
    {
      title: 'Total Searches',
      value: '12,547',
      change: '+8.2%',
      icon: Search
    },
    {
      title: 'Popular Destinations',
      value: 'Sydney, Melbourne',
      change: 'Top 2',
      icon: TrendingUp
    },
    {
      title: 'Active Users',
      value: '2,843',
      change: '+12.1%',
      icon: Users
    },
    {
      title: 'Avg Search Time',
      value: '1.2s',
      change: '-0.3s',
      icon: Clock
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Analytics</h1>
        <p className="text-muted-foreground">
          Analyze search patterns and user behavior
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {searchMetrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.change} from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Search Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-2 border-b">
              <span>Hotels in Sydney</span>
              <span className="text-sm text-muted-foreground">245 results</span>
            </div>
            <div className="flex justify-between items-center p-2 border-b">
              <span>Flights to Melbourne</span>
              <span className="text-sm text-muted-foreground">89 results</span>
            </div>
            <div className="flex justify-between items-center p-2 border-b">
              <span>Activities in Brisbane</span>
              <span className="text-sm text-muted-foreground">156 results</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
