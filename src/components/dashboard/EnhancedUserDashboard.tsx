import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalBotInterface } from '@/components/master-bot/UniversalBotInterface';
import { BotResultsPanel } from '@/components/master-bot/BotResultsPanel';
import { useMasterBotController } from '@/hooks/useMasterBotController';
import { Badge } from '@/components/ui/badge';
import { 
  PlaneTakeoff, 
  Hotel, 
  MapPin, 
  Star, 
  TrendingUp,
  Clock,
  AlertCircle 
} from 'lucide-react';

export const EnhancedUserDashboard: React.FC = () => {
  const { botResults, getResultsByType, getHighPriorityResults } = useMasterBotController('user');

  const travelPlanningResults = getResultsByType('travel_planning');
  const bookingResults = getResultsByType('booking_assistance');
  const priceAlerts = getResultsByType('price_monitoring');
  const highPriorityResults = getHighPriorityResults();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Travel Dashboard</h1>
            <p className="text-muted-foreground">Plan your perfect journey with AI assistance</p>
          </div>
          {highPriorityResults.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {highPriorityResults.length} alerts
            </Badge>
          )}
        </div>

        <Tabs defaultValue="planning" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="planning">Travel Planning</TabsTrigger>
            <TabsTrigger value="bookings">Smart Bookings</TabsTrigger>
            <TabsTrigger value="insights">Personal Insights</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="planning" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PlaneTakeoff className="h-5 w-5 text-primary" />
                    Flight Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {travelPlanningResults.filter(r => r.result_data?.type === 'flight').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Personalized flight options based on your preferences
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Hotel className="h-5 w-5 text-primary" />
                    Hotel Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {travelPlanningResults.filter(r => r.result_data?.type === 'hotel').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Curated accommodations matching your style
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Destination Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {travelPlanningResults.filter(r => r.result_data?.type === 'destination').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    New places to explore based on your interests
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Travel Planning Results */}
            <BotResultsPanel dashboardType="user" className="col-span-full" />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Price Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {priceAlerts.slice(0, 3).map((alert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {alert.result_data?.destination || 'Flight Deal'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {alert.result_data?.description || 'Price drop detected'}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {alert.result_data?.savings || '15%'} off
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Booking Assistance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookingResults.slice(0, 3).map((booking, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {booking.result_data?.title || 'Booking Suggestion'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.result_data?.description || 'Smart booking recommendation'}
                          </p>
                        </div>
                        <Badge variant={booking.actionability_rating === 'high' ? 'default' : 'outline'}>
                          {booking.actionability_rating || 'medium'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Travel Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• You typically book flights 3-4 weeks in advance</p>
                    <p>• Preferred travel months: March, September, December</p>
                    <p>• Average trip duration: 7 days</p>
                    <p>• Favorite destination type: Coastal cities</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Savings Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Save 25% by booking Tuesday flights</p>
                    <p>• Consider alternative airports for better deals</p>
                    <p>• Your loyalty program has 2,500 unused points</p>
                    <p>• Bundle bookings for up to 15% savings</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UniversalBotInterface dashboardType="user" className="lg:col-span-1" />
              <BotResultsPanel dashboardType="user" className="lg:col-span-1" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};