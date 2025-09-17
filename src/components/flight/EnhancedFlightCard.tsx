
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { humanizeFlightDuration } from "@/utils/flight";
import { 
  Plane, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Info
} from "lucide-react";

interface FareOption {
  type: string;
  price: number;
  currency?: string;
  features?: string[];
  seatsAvailable?: number;
  bookingClass?: string;
}

interface EnhancedFlight {
  id?: string;
  airline: string;
  flightNumber: string;
  outboundFlightNumber?: string;
  returnFlightNumber?: string;
  aircraft?: string;
  airlineLogo?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number | string;
  stops: number;
  stopoverInfo?: string;
  departure?: {
    date?: string;
    time?: string;
  };
  arrival?: {
    date?: string;
    time?: string;
  };
  price: number;
  amenities?: string[];
  fareOptions?: FareOption[];
  isRoundTrip?: boolean;
  amadeusOfferId?: string;
  currency?: string;
}

interface EnhancedFlightCardProps {
  flight: EnhancedFlight;
  onSelectFare?: (flight: EnhancedFlight, fare: FareOption) => void;
  showFareOptions?: boolean;
}

export const EnhancedFlightCard = ({ 
  flight, 
  onSelectFare,
  showFareOptions = true 
}: EnhancedFlightCardProps) => {
  const { formatCurrency } = useCurrency();
  const [selectedFare, setSelectedFare] = useState<string>("economy");
  const [showDetails, setShowDetails] = useState<boolean>(false);


  const getStopsText = (stops: number, stopoverInfo?: string) => {
    if (stops === 0) return "Direct";
    if (stopoverInfo) return `${stops} Stop ${stopoverInfo}`;
    return `${stops} stop${stops > 1 ? 's' : ''}`;
  };

  const getSeatAvailabilityColor = (seats: number) => {
    if (seats <= 3) return "text-destructive";
    if (seats <= 9) return "text-secondary";
    return "text-travel-forest";
  };

  const getSeatAvailabilityText = (seats: number) => {
    if (seats <= 3) return `Only ${seats} left`;
    if (seats <= 9) return `${seats} seats left`;
    return `${seats}+ available`;
  };

  const getAirlineLogo = (airline: string) => {
    // Return airline code initials as fallback for logo
    return airline.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgElement = e.currentTarget;
    // Switch to placeholder SVG on error
    imgElement.src = '/placeholder-airline.svg';
    imgElement.onerror = null; // Prevent infinite loop if placeholder also fails
  };

  // Use real fare options from flight data, fallback to default if none
  const availableFareOptions = flight.fareOptions && flight.fareOptions.length > 0 
    ? flight.fareOptions.filter(fare => 
        fare.type.toLowerCase() === 'economy' || fare.type.toLowerCase() === 'business'
      )
    : [
        {
          type: 'economy',
          price: typeof flight.price === 'number' ? flight.price : 399,
          currency: flight.currency || 'USD',
          features: ['Standard seat', 'Carry-on included'],
          seatsAvailable: 12
        },
        {
          type: 'business', 
          price: typeof flight.price === 'number' ? Math.round(flight.price * 3.2) : 1299,
          currency: flight.currency || 'USD',
          features: ['Extra legroom', 'Premium service', 'Lounge access'],
          seatsAvailable: 4
        }
      ];

  const formatDate = (dateStr?: string) => {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const date = dateStr ? new Date(dateStr) : new Date();
    const day = dayNames[date.getDay()];
    const dayNum = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day}, ${dayNum} ${month} ${year}`;
  };

  const detailsId = `flight-details-${flight.id || 'x'}`;

  return (
    <Card className="mb-3 hover:shadow-lg transition-all duration-300 border border-border/30 w-full max-w-none">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between w-full">
          
          {/* Left Section - Flight Details */}
          <div className="flex-1 max-w-4xl">
            
            {/* Flight Number Badges and Airline Info */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-3">
                {/* Airline Logo */}
                <div className="flex-shrink-0">
                  <img 
                    src={flight.airlineLogo || '/placeholder-airline.svg'} 
                    alt={`${flight.airline} logo`}
                    className="w-8 h-8 object-contain"
                    onError={handleImageError}
                  />
                </div>
                
                {/* Flight Number Badge */}
                <div className="bg-muted text-foreground px-2.5 py-1 rounded text-xs font-medium border">
                  {flight.outboundFlightNumber || flight.flightNumber}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{flight.airline}</span>
                {flight.aircraft && !flight.aircraft.toLowerCase().includes('unknown') && (
                  <span className="text-xs text-muted-foreground">{flight.aircraft}</span>
                )}
              </div>
            </div>

            {/* Flight Route */}
            <div className="flex items-center justify-between max-w-3xl">
              <div className="text-left">
                <div className="text-xs text-muted-foreground mb-1">{formatDate(flight.departure?.date)}</div>
                <div className="text-lg font-semibold text-foreground mb-1">{flight.departure?.time || flight.departureTime}</div>
                <div className="text-base font-medium text-muted-foreground">{flight.origin}</div>
              </div>
              
              <div className="flex-1 flex flex-col items-center px-8">
                <div className="text-xs text-muted-foreground mb-2">{humanizeFlightDuration(flight.duration)}</div>
                <div className="w-full border-t-2 border-dotted border-muted-foreground/30 relative">
                  <Plane className="h-4 w-4 text-muted-foreground absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-background px-1 rotate-90" />
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-medium">
                  {getStopsText(flight.stops, flight.stopoverInfo)}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">{formatDate(flight.arrival?.date)}</div>
                <div className="text-lg font-semibold text-foreground mb-1">{flight.arrival?.time || flight.arrivalTime}</div>
                <div className="text-base font-medium text-muted-foreground">{flight.destination}</div>
              </div>
            </div>

            {/* View Flight Details Link */}
            <div className="flex justify-end mt-4">
              <Button
                variant="link"
                className="text-destructive hover:text-destructive/80 p-0 h-auto text-sm font-medium"
                onClick={() => setShowDetails(v => !v)}
                aria-expanded={showDetails}
                aria-controls={detailsId}
              >
                {showDetails ? 'Hide Details' : 'View Flight Details'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {showDetails && (
              <section id={detailsId} aria-label="Flight details" className="mt-3 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-6 space-y-6">
                {/* Critical Travel Info - Always Visible */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Plane className="h-4 w-4 text-primary" />
                          Essential Flight Info
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Flight</span>
                              <span className="font-medium text-foreground">{flight.outboundFlightNumber || flight.flightNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Duration</span>
                              <span className="font-medium text-primary">{humanizeFlightDuration(flight.duration)}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Stops</span>
                              <span className="font-medium text-foreground">{getStopsText(flight.stops, flight.stopoverInfo)}</span>
                            </div>
                            {flight.aircraft && !flight.aircraft.toLowerCase().includes('unknown') && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Aircraft</span>
                                <span className="font-medium text-foreground">{flight.aircraft}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-secondary" />
                          Schedule & Route
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-md border border-border/50">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground uppercase tracking-wide">Departure</div>
                              <div className="font-semibold text-lg text-foreground">{flight.departure?.time || flight.departureTime}</div>
                              <div className="text-sm font-medium text-primary">{flight.origin}</div>
                            </div>
                            <div className="flex-1 flex justify-center">
                              <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground uppercase tracking-wide">Arrival</div>
                              <div className="font-semibold text-lg text-foreground">{flight.arrival?.time || flight.arrivalTime}</div>
                              <div className="text-sm font-medium text-primary">{flight.destination}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Info - Collapsible for Advanced Users */}
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Booking Reference & Trip Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground">Total Price</span>
                      <span className="font-semibold text-lg text-primary">{formatCurrency(flight.price, flight.currency || 'USD')}</span>
                    </div>
                    {flight.isRoundTrip !== undefined && (
                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-muted-foreground">Trip Type</span>
                        <span className="font-medium text-foreground">{flight.isRoundTrip ? 'Round Trip' : 'One Way'}</span>
                      </div>
                    )}
                    {flight.returnFlightNumber && (
                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-muted-foreground">Return Flight</span>
                        <span className="font-medium text-foreground">{flight.returnFlightNumber}</span>
                      </div>
                    )}
                  </div>
                  {flight.amadeusOfferId && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      <span className="font-mono bg-muted/50 px-2 py-1 rounded">Ref: {flight.amadeusOfferId.slice(0, 12)}...</span>
                    </div>
                  )}
                </div>

                {flight.fareOptions && flight.fareOptions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="font-medium text-foreground mb-2">Available Fare Classes</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {flight.fareOptions.slice(0, 4).map((fare, i) => (
                        <div key={i} className="bg-muted/30 rounded p-3">
                          <div className="font-medium capitalize">{fare.type}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(fare.price, fare.currency || flight.currency || 'USD')}
                            {fare.seatsAvailable && fare.seatsAvailable <= 10 && (
                              <span className="ml-2 text-orange-600">• Only {fare.seatsAvailable} left</span>
                            )}
                          </div>
                          {fare.features && (
                            <div className="text-xs mt-1">
                              {fare.features.slice(0, 2).map((feature, j) => (
                                <div key={j}>• {feature}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {flight.amenities && flight.amenities.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="font-medium text-foreground mb-2">Flight Amenities</div>
                    <div className="flex flex-wrap gap-2">
                      {flight.amenities.map((amenity, i) => (
                        <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-sm text-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {flight.stopoverInfo && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="font-medium text-foreground mb-2">Stopover Information</div>
                    <div className="text-xs">{flight.stopoverInfo}</div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Section - Fare Options */}
          <div className="ml-8 min-w-[320px]">
            {showFareOptions && availableFareOptions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {availableFareOptions.map((fare, index) => (
                  <div
                    key={index}
                    className={`relative border-2 rounded-xl p-5 transition-all duration-300 cursor-pointer group min-h-[160px] 
                      ${selectedFare === fare.type 
                        ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' 
                        : 'border-border/50 hover:border-primary/40 hover:shadow-md'
                      }`}
                    onClick={() => setSelectedFare(fare.type)}
                  >
                    {/* Priority Badge for Value/Popular Options */}
                    {fare.type.toLowerCase().includes('economy') && index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        BEST VALUE
                      </div>
                    )}
                    
                    <div className="flex flex-col h-full">
                      {/* Fare Class Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-sm uppercase tracking-wide text-foreground">{fare.type}</h4>
                        {selectedFare === fare.type && (
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                        )}
                      </div>
                      
                      {/* Critical: Seat Availability Alert */}
                      {fare.seatsAvailable !== undefined && fare.seatsAvailable <= 9 && (
                        <div className="bg-gradient-to-r from-destructive to-destructive/80 text-white px-3 py-1.5 rounded-lg text-xs font-bold text-center mb-3 animate-pulse">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {getSeatAvailabilityText(fare.seatsAvailable)}
                        </div>
                      )}
                      
                      {/* Price Display - Prominent */}
                      <div className="text-center mb-4 flex-1 flex flex-col justify-center">
                        <div className="text-2xl font-bold text-foreground mb-1">
                          {formatCurrency(fare.price, fare.currency || flight.currency || 'USD')}
                        </div>
                        <div className="text-xs text-muted-foreground">per traveler</div>
                        
                        {/* Price Context - Show savings if multiple fares */}
                        {availableFareOptions.length > 1 && index > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {fare.price > availableFareOptions[0].price && (
                              <span className="text-primary font-medium">
                                +{formatCurrency(fare.price - availableFareOptions[0].price, fare.currency || 'USD')} vs Basic
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Key Features - Max 3 for clarity */}
                      {fare.features && fare.features.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {fare.features.slice(0, 3).map((feature, i) => (
                            <div key={i} className="flex items-center space-x-2 text-xs">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                          {fare.features.length > 3 && (
                            <div className="text-xs text-primary font-medium">
                              +{fare.features.length - 3} more benefits
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Action Button - Contextual */}
                      {onSelectFare && (
                        <Button
                          className={`w-full font-bold text-sm py-3 mt-auto transition-all duration-200 ${
                            selectedFare === fare.type
                              ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg'
                              : 'bg-secondary/20 hover:bg-secondary/30 text-foreground border border-border'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFare(flight, fare);
                          }}
                        >
                          {selectedFare === fare.type ? 'BOOK THIS FARE' : 'SELECT FARE'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
