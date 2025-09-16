import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Calendar, Clock, MapPin, Users, Star, Camera, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import { ActivityBookingProgress } from "@/components/activity/ActivityBookingProgress";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/utils/logger";

interface ActivityOffer {
  id: string;
  activityId: string;
  name: string;
  description: string;
  location: {
    city: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  category: string;
  duration: string;
  rating: number;
  reviewCount: number;
  images: string[];
  highlights: string[];
  included: string[];
  excluded: string[];
  price: {
    total: number;
    currency: string;
    perPerson: number;
  };
  participants: {
    adults: number;
    children: number;
  };
  selectedDate: string;
  selectedTime: string;
  cancellationPolicy: string;
  offerId?: string;
}

const ActivityBookingReview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [activityOffer, setActivityOffer] = useState<ActivityOffer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivityData = async () => {
      try {
        // Try to get activity data from session storage first
        const storedActivity = sessionStorage.getItem('selectedActivityOffer');
        
        if (storedActivity) {
          const activity = JSON.parse(storedActivity);
          setActivityOffer(activity);
          setLoading(false);
          return;
        }

        // If not in session storage, get from URL params
        const activityId = searchParams.get('activityId');
        const offerId = searchParams.get('offerId');
        
        if (!activityId || !offerId) {
          toast({
            title: "Activity data missing",
            description: "Please go back and select an activity.",
            variant: "destructive",
          });
          navigate('/search/activities');
          return;
        }

        // Attempt to get real activity data from provider
        const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const selectedTime = searchParams.get('time') || '10:00';
        const adults = parseInt(searchParams.get('adults') || '2');
        const children = parseInt(searchParams.get('children') || '0');
        const destination = searchParams.get('destination') || 'sydney';

        // Try to fetch live activity data from provider rotation
        const searchActivities = async () => {
          try {
            const { data: activitySearchData, error } = await supabase.functions.invoke('provider-rotation', {
              body: {
                searchType: 'activity',
                params: {
                  destination,
                  date: selectedDate,
                  participants: adults + children,
                  radius: 20
                }
              }
            });

            if (error) {
              throw new Error(`Provider search failed: ${error.message}`);
            }

            if (activitySearchData?.success && activitySearchData?.data?.activities?.length > 0) {
              // Find the specific activity offer by ID
              const selectedActivity = activitySearchData.data.activities.find((activity: any) => 
                activity.id === activityId || activity.code === activityId
              );

              if (selectedActivity) {
                // Transform provider data to our format
                const providerActivity: ActivityOffer = {
                  id: selectedActivity.id || offerId,
                  activityId: selectedActivity.code || activityId,
                  name: selectedActivity.name || "Activity Experience",
                  description: selectedActivity.description || "Exciting activity experience with professional guides",
                  location: {
                    city: selectedActivity.destination?.name || destination,
                    address: selectedActivity.location?.address || "Location details will be provided",
                    coordinates: {
                      latitude: selectedActivity.location?.latitude || -33.8688,
                      longitude: selectedActivity.location?.longitude || 151.2093
                    }
                  },
                  category: selectedActivity.category?.name || "Adventure & Outdoor",
                  duration: selectedActivity.duration || "3-4 hours",
                  rating: selectedActivity.rating || 4.5,
                  reviewCount: selectedActivity.reviewCount || 0,
                  images: selectedActivity.images?.map((img: any) => img.url) || ["/placeholder.svg"],
                  highlights: selectedActivity.highlights || [
                    "Professional guided experience",
                    "All necessary equipment included",
                    "Small group size for personalized attention"
                  ],
                  included: selectedActivity.included || [
                    "Professional guide",
                    "All equipment",
                    "Safety briefing"
                  ],
                  excluded: selectedActivity.excluded || [
                    "Hotel transfers",
                    "Personal expenses",
                    "Gratuities"
                  ],
                  price: {
                    total: parseFloat(selectedActivity.price?.total || selectedActivity.priceFrom || '89') * (adults + children * 0.8),
                    currency: selectedActivity.price?.currency || "AUD",
                    perPerson: parseFloat(selectedActivity.price?.adult || selectedActivity.priceFrom || '89')
                  },
                  participants: { adults, children },
                  selectedDate,
                  selectedTime,
                  cancellationPolicy: selectedActivity.cancellationPolicy || "Free cancellation up to 24 hours before activity",
                  offerId: selectedActivity.id || offerId
                };

                setActivityOffer(providerActivity);
                setLoading(false);
                logger.info('Successfully loaded live activity data from provider');
                return;
              }
            }

            // If no specific activity found, show error
            throw new Error('Activity not found in search results');

          } catch (providerError) {
            logger.warn('Provider search failed, falling back to cached data:', providerError);
            
            // Fallback: Try to create basic activity structure from params
            const price = parseFloat(searchParams.get('price') || '89');
            const fallbackActivity: ActivityOffer = {
              id: offerId,
              activityId,
              name: `Activity Experience`,
              description: "Activity details will be confirmed upon booking.",
              location: {
                city: destination === 'sydney' ? 'Sydney' : destination,
                address: "Location details pending",
                coordinates: {
                  latitude: -33.8688,
                  longitude: 151.2093
                }
              },
              category: "Experience",
              duration: "Duration to be confirmed",
              rating: 4.0,
              reviewCount: 0,
              images: ["/placeholder.svg"],
              highlights: [
                "Experience details will be confirmed",
                "Professional service included"
              ],
              included: [
                "Details will be confirmed at booking"
              ],
              excluded: [
                "Details will be confirmed at booking"
              ],
              price: {
                total: price * (adults + children * 0.8),
                currency: "AUD",
                perPerson: price
              },
              participants: { adults, children },
              selectedDate,
              selectedTime,
              cancellationPolicy: "Cancellation policy will be confirmed",
              offerId
            };

            setActivityOffer(fallbackActivity);
            setLoading(false);
            
            toast({
              title: "Limited activity data available",
              description: "Using cached information. Full details will be confirmed at booking.",
              variant: "default",
            });
          }
        };

        await searchActivities();
      } catch (error) {
        logger.error('Error loading activity data:', error);
        toast({
          title: "Error loading activity data",
          description: "Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    loadActivityData();
  }, [searchParams, navigate, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2024-01-01T${timeString}`).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleContinue = () => {
    if (!activityOffer) {
      toast({
        title: "Activity data missing",
        description: "Please go back and select an activity.",
        variant: "destructive",
      });
      return;
    }

    // Store activity data for checkout
    sessionStorage.setItem('selectedActivityOffer', JSON.stringify(activityOffer));

    // Navigate to checkout with booking parameters
    const queryParams = new URLSearchParams();
    queryParams.set('bookingType', 'activity');
    queryParams.set('activityId', activityOffer.activityId);
    queryParams.set('offerId', activityOffer.offerId || activityOffer.id);
    queryParams.set('date', activityOffer.selectedDate);
    queryParams.set('time', activityOffer.selectedTime);
    queryParams.set('adults', activityOffer.participants.adults.toString());
    queryParams.set('children', activityOffer.participants.children.toString());
    queryParams.set('amount', activityOffer.price.total.toString());
    queryParams.set('currency', activityOffer.price.currency);

    navigate(`/activity-checkout?${queryParams.toString()}`);
  };

  const handleGoBack = () => {
    navigate('/search/activities');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading activity details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activityOffer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="border-dashed border-2 border-border/50 max-w-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No activity selected. Please go back and select an activity.</p>
              <Button onClick={handleGoBack}>
                Select Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ActivityBookingProgress currentStep={2} />
      
      {/* Header */}
      <div className="pt-6 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Activity Search
          </Button>
          
          <h1 className="text-3xl font-bold">Review Your <span className="hero-text">Activity Booking</span></h1>
          <p className="text-muted-foreground mt-2">
            Please review your activity details before proceeding to participant information
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Information */}
            <Card className="border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <img 
                    src={activityOffer.images[0]} 
                    alt={activityOffer.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {activityOffer.category}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold mb-2">{activityOffer.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      {activityOffer.location.address}, {activityOffer.location.city}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{activityOffer.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({activityOffer.reviewCount} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {activityOffer.duration}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Activity Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Date</div>
                    <div className="text-sm text-muted-foreground">{formatDate(activityOffer.selectedDate)}</div>
                  </div>
                  <div className="text-center">
                    <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Time</div>
                    <div className="text-sm text-muted-foreground">{formatTime(activityOffer.selectedTime)}</div>
                  </div>
                  <div className="text-center">
                    <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">Participants</div>
                    <div className="text-sm text-muted-foreground">
                      {activityOffer.participants.adults} Adult{activityOffer.participants.adults > 1 ? 's' : ''}
                      {activityOffer.participants.children > 0 && `, ${activityOffer.participants.children} Child${activityOffer.participants.children > 1 ? 'ren' : ''}`}
                    </div>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">About This Activity</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{activityOffer.description}</p>
                </div>

                {/* Highlights */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Highlights</h3>
                  <ul className="space-y-2">
                    {activityOffer.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What's Included */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      What's Included
                    </h4>
                    <ul className="space-y-1">
                      {activityOffer.included.map((item, index) => (
                        <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      What's Not Included
                    </h4>
                    <ul className="space-y-1">
                      {activityOffer.excluded.map((item, index) => (
                        <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                          <span className="text-red-600 mt-1">✗</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-1">Cancellation Policy</h4>
                  <p className="text-sm text-green-700">{activityOffer.cancellationPolicy}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Price Summary</h3>
                
                <div className="space-y-4">
                  {activityOffer.participants.adults > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">
                        Adult × {activityOffer.participants.adults}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(activityOffer.price.perPerson * activityOffer.participants.adults)}
                      </span>
                    </div>
                  )}
                  
                  {activityOffer.participants.children > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">
                        Child × {activityOffer.participants.children}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(activityOffer.price.perPerson * 0.8 * activityOffer.participants.children)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-xl font-bold text-foreground">
                      {formatCurrency(activityOffer.price.total)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    for {activityOffer.participants.adults + activityOffer.participants.children} participant{(activityOffer.participants.adults + activityOffer.participants.children) > 1 ? 's' : ''}
                  </p>
                </div>

                <Button 
                  onClick={handleContinue}
                  className="w-full mt-6 btn-primary h-12"
                >
                  CONTINUE TO PARTICIPANT DETAILS
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityBookingReview;