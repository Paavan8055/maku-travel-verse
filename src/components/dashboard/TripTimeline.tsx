import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowRight,
  Plus,
  Camera,
  Star
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'booked' | 'traveling' | 'completed';
  type: 'business' | 'leisure' | 'family' | 'solo';
  budget: number;
  spent: number;
  activities: number;
  photos?: string[];
  rating?: number;
  daysUntil?: number;
}

export const TripTimeline: React.FC<{ className?: string }> = ({ className }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data for demonstration
  useEffect(() => {
    const mockTrips: Trip[] = [
      {
        id: '1',
        destination: 'Tokyo, Japan',
        startDate: '2024-03-15',
        endDate: '2024-03-22',
        status: 'booked',
        type: 'leisure',
        budget: 3500,
        spent: 2100,
        activities: 8,
        daysUntil: 12
      },
      {
        id: '2',
        destination: 'Bali, Indonesia',
        startDate: '2024-01-10',
        endDate: '2024-01-17',
        status: 'completed',
        type: 'leisure',
        budget: 2200,
        spent: 2350,
        activities: 12,
        photos: ['/placeholder.svg'],
        rating: 5
      },
      {
        id: '3',
        destination: 'Sydney, Australia',
        startDate: '2024-05-01',
        endDate: '2024-05-08',
        status: 'planning',
        type: 'family',
        budget: 4000,
        spent: 0,
        activities: 0,
        daysUntil: 45
      }
    ];
    
    setTrips(mockTrips);
    setLoading(false);
  }, [user]);

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
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
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
        <Button onClick={() => navigate('/search')}>
          <Plus className="h-4 w-4 mr-2" />
          Plan New Trip
        </Button>
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
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
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
                        {trip.activities}
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
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
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
                    <span>{trip.activities} Activities</span>
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
            <Button onClick={() => navigate('/search')}>
              <Plus className="h-4 w-4 mr-2" />
              Plan Your First Trip
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};