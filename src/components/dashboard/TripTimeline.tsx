import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plane, 
  Hotel, 
  CheckCircle,
  Plus,
  Camera,
  Star,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '@/hooks/useTrips';
import { CreateTripDialog } from './CreateTripDialog';

export const TripTimeline: React.FC<{ className?: string }> = ({ className }) => {
  const { trips, loading, error } = useTrips();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'booked':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'traveling':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTripIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Calendar className="h-4 w-4" />;
      case 'booked':
        return <CheckCircle className="h-4 w-4" />;
      case 'traveling':
        return <Plane className="h-4 w-4" />;
      case 'completed':
        return <Camera className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const upcomingTrips = trips.filter(trip => trip.status === 'booked' || trip.status === 'planning');
  const completedTrips = trips.filter(trip => trip.status === 'completed');

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading your trips...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card className="border-destructive/20">
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">Failed to load trips: {error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Trip Timeline
          </h2>
          <p className="text-muted-foreground">Track your travel journey</p>
        </div>
        <div className="flex gap-2">
          <CreateTripDialog />
          <Button onClick={() => navigate('/search')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Plan New Trip
          </Button>
        </div>
      </div>

      {/* Upcoming Trips */}
      {upcomingTrips.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-travel-ocean" />
            Upcoming Adventures
          </h3>
          <div className="space-y-4">
            {upcomingTrips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-travel-ocean">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-travel-ocean/10">
                        {getTripIcon(trip.status)}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">{trip.destination}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(trip.status)}>
                      {trip.status}
                    </Badge>
                  </div>

                  {trip.daysUntil && trip.daysUntil > 0 && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-travel-gold/10 to-travel-sunset/10 rounded-lg">
                      <p className="text-sm font-medium text-travel-gold">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {trip.daysUntil} days until departure
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-travel-ocean">
                        ${trip.budget.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Budget</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-travel-forest">
                        ${trip.spent.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Spent So Far</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-travel-coral">
                        {trip.activities_count}
                      </p>
                      <p className="text-xs text-muted-foreground">Activities Planned</p>
                    </div>
                  </div>

                  {trip.budget > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Budget Progress</span>
                        <span>{Math.round((trip.spent / trip.budget) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(trip.spent / trip.budget) * 100} 
                        className="h-2" 
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      View Itinerary
                    </Button>
                    <Button variant="outline" size="sm">
                      <Hotel className="h-4 w-4 mr-2" />
                      Manage Bookings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Trips */}
      {completedTrips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-travel-forest" />
            Travel Memories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedTrips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{trip.destination}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </p>
                    </div>
                    {trip.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-travel-gold text-travel-gold" />
                        <span className="text-sm font-medium">{trip.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-sm mb-3">
                    <span>Total Spent: ${trip.spent.toLocaleString()}</span>
                    <span>{trip.activities_count} Activities</span>
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    View Travel Journal
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {trips.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start Your Travel Journey</h3>
            <p className="text-muted-foreground mb-6">Plan your first trip and begin collecting memories!</p>
            <CreateTripDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
