import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Car, Clock, MapPin, Users, Star, Shield, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { IntelligentTransferInfo } from '@/components/travel/IntelligentTransferInfo';
import { IntelligentTransferSearchForm } from '@/components/search/IntelligentTransferSearchForm';
import { PerformanceWrapper } from '@/components/PerformanceWrapper';
import { useBackgroundPerformanceTracking } from '@/hooks/useBackgroundPerformanceTracking';

interface Transfer {
  id: string;
  provider: string;
  vehicleType: 'sedan' | 'suv' | 'van' | 'luxury' | 'shuttle';
  capacity: number;
  price: number;
  currency: string;
  duration: string;
  rating: number;
  reviewCount: number;
  features: string[];
  cancellationPolicy: string;
  availability: 'available' | 'limited' | 'full';
  image: string;
}

const TransferSearchPage = () => {
  const [searchParams] = useSearchParams();
  const { measureInteraction } = useBackgroundPerformanceTracking('TransferSearchPage');
  
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'rating'>('price');

  // Extract search parameters
  const pickup = searchParams.get('pickup') || '';
  const dropoff = searchParams.get('dropoff') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const passengers = parseInt(searchParams.get('passengers') || '2');

  // Check if user came from a search
  useEffect(() => {
    if (searchParams.get('searched') === 'true' && pickup && dropoff && date) {
      setHasSearched(true);
      loadTransferResults();
    }
  }, [searchParams, pickup, dropoff, date]);

  const loadTransferResults = async () => {
    setLoading(true);
    
    // Simulate transfer search results
    const mockTransfers: Transfer[] = [
      {
        id: 'tf1',
        provider: 'Elite Transfers',
        vehicleType: 'sedan',
        capacity: 4,
        price: 45,
        currency: 'AUD',
        duration: '25 mins',
        rating: 4.8,
        reviewCount: 342,
        features: ['Professional Driver', 'WiFi', 'Water Bottles', 'Phone Charger'],
        cancellationPolicy: 'Free cancellation up to 24 hours',
        availability: 'available',
        image: '/api/placeholder/300/200'
      },
      {
        id: 'tf2',
        provider: 'Airport Express',
        vehicleType: 'shuttle',
        capacity: 12,
        price: 18,
        currency: 'AUD',
        duration: '35 mins',
        rating: 4.5,
        reviewCount: 156,
        features: ['Shared Ride', 'Luggage Assistance', 'Multiple Stops'],
        cancellationPolicy: 'Free cancellation up to 2 hours',
        availability: 'available',
        image: '/api/placeholder/300/200'
      },
      {
        id: 'tf3',
        provider: 'Premium Cars',
        vehicleType: 'luxury',
        capacity: 4,
        price: 89,
        currency: 'AUD',
        duration: '22 mins',
        rating: 4.9,
        reviewCount: 89,
        features: ['Luxury Vehicle', 'Meet & Greet', 'Refreshments', 'Flight Tracking'],
        cancellationPolicy: 'Free cancellation up to 12 hours',
        availability: 'limited',
        image: '/api/placeholder/300/200'
      },
      {
        id: 'tf4',
        provider: 'Family Transfers',
        vehicleType: 'van',
        capacity: 8,
        price: 65,
        currency: 'AUD',
        duration: '28 mins',
        rating: 4.6,
        reviewCount: 234,
        features: ['Child Seats Available', 'Extra Luggage Space', 'Family Friendly'],
        cancellationPolicy: 'Free cancellation up to 6 hours',
        availability: 'available',
        image: '/api/placeholder/300/200'
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setTransfers(mockTransfers);
    setLoading(false);
  };

  const handleSearch = async (params: {
    pickup: string;
    dropoff: string;
    date: string;
    time: string;
    passengers: number;
  }) => {
    const searchUrl = new URLSearchParams({
      pickup: params.pickup,
      dropoff: params.dropoff,
      date: params.date,
      time: params.time,
      passengers: params.passengers.toString(),
      searched: 'true'
    });
    
    window.location.href = `/search/transfers?${searchUrl.toString()}`;
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'luxury': return '🚗';
      case 'van': return '🚐';
      case 'shuttle': return '🚌';
      default: return '🚕';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'limited': return 'text-amber-600 bg-amber-50';
      case 'full': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const sortedTransfers = [...transfers].sort((a, b) => {
    switch (sortBy) {
      case 'price': return a.price - b.price;
      case 'duration': return parseInt(a.duration) - parseInt(b.duration);
      case 'rating': return b.rating - a.rating;
      default: return 0;
    }
  });

  return (
    <PerformanceWrapper componentName="TransferSearchPage">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* Transfer Search Form */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6">Ground Transportation</h1>
            <IntelligentTransferSearchForm onSearch={handleSearch} />
          </div>

          {!hasSearched ? (
            <div className="space-y-8">
              {/* Pre-search content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Car className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">Airport Transfers</h3>
                    <p className="text-sm text-muted-foreground">
                      Reliable transportation to and from airports with flight tracking.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">City Transfers</h3>
                    <p className="text-sm text-muted-foreground">
                      Point-to-point transfers within the city with local driver knowledge.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">Safe & Secure</h3>
                    <p className="text-sm text-muted-foreground">
                      Licensed drivers, insured vehicles, and 24/7 customer support.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Intelligent Transfer Info */}
              <IntelligentTransferInfo
                pickup={pickup}
                dropoff={dropoff}
                date={date}
                passengers={passengers}
              />
              
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Transfer Options</h2>
                  <p className="text-muted-foreground">
                    {pickup} → {dropoff} • {date} at {time} • {passengers} passenger(s)
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === 'price' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('price')}
                  >
                    Best Price
                  </Button>
                  <Button
                    variant={sortBy === 'duration' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('duration')}
                  >
                    Fastest
                  </Button>
                  <Button
                    variant={sortBy === 'rating' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('rating')}
                  >
                    Top Rated
                  </Button>
                </div>
              </div>

              {/* Transfer Results */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-24 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedTransfers.map((transfer) => (
                    <Card key={transfer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                          {/* Vehicle Info */}
                          <div className="lg:col-span-2">
                            <div className="flex items-start gap-4">
                              <div className="text-4xl">{getVehicleIcon(transfer.vehicleType)}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{transfer.provider}</h3>
                                  <Badge className={getAvailabilityColor(transfer.availability)}>
                                    {transfer.availability}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    Up to {transfer.capacity} passengers
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {transfer.duration}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4" />
                                    {transfer.rating} ({transfer.reviewCount} reviews)
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-1">
                                  {transfer.features.slice(0, 3).map((feature, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {transfer.features.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{transfer.features.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Pricing & Booking */}
                          <div className="lg:col-span-2 flex flex-col justify-between">
                            <div className="text-right">
                              <div className="text-3xl font-bold text-primary">
                                ${transfer.price}
                                <span className="text-lg font-normal text-muted-foreground">
                                  {transfer.currency}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">Total price</p>
                              <p className="text-xs text-green-600 mt-1">{transfer.cancellationPolicy}</p>
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <Button variant="outline" className="flex-1">
                                View Details
                              </Button>
                              <Button className="flex-1 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {sortedTransfers.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">No transfers found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search criteria or dates.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PerformanceWrapper>
  );
};

export default TransferSearchPage;