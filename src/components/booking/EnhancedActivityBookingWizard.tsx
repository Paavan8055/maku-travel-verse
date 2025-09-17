import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRealBooking } from '@/hooks/useRealBooking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Star, 
  CheckCircle, 
  CreditCard,
  Shield,
  Heart,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { ActivityBookingWizard } from './ActivityBookingWizard';
import ActivityWishlist from '@/features/user/components/ActivityWishlist';

interface EnhancedActivityData {
  id: string;
  name: string;
  description: string;
  duration: string;
  location: string;
  provider: string;
  providerUrl?: string;
  rating: number;
  reviews: number;
  price: {
    amount: number;
    currency: string;
  };
  inclusions: string[];
  meetingPoint: string;
  cancellationPolicy: string;
  date: string;
  time: string;
  participants: number;
  images?: string[];
  highlights?: string[];
  itinerary?: { time: string; activity: string; description: string }[];
}

interface ParticipantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  specialRequirements: string;
}

const steps = ['Review', 'Participants', 'Payment', 'Confirmation'];

export const EnhancedActivityBookingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activityData, setActivityData] = useState<EnhancedActivityData | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createBooking, loading: bookingLoading } = useRealBooking();

  useEffect(() => {
    // Load activity data from sessionStorage
    const storedData = sessionStorage.getItem('selectedActivity');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setActivityData(data);
        
        // Initialize participants array
        const participantCount = data.participants || 1;
        setParticipants(
          Array.from({ length: participantCount }, () => ({
            firstName: '',
            lastName: '',
            email: user?.email || '',
            phone: '',
            dateOfBirth: '',
            specialRequirements: ''
          }))
        );

        // Check if activity is in wishlist
        if (user) {
          checkWishlistStatus(data.id);
        }
      } catch (error) {
        console.error('Error loading activity data:', error);
        toast({
          title: "Error",
          description: "Could not load activity details. Please try again.",
          variant: "destructive"
        });
        navigate('/search/activities');
      }
    } else {
      toast({
        title: "No Activity Selected",
        description: "Please select an activity first.",
        variant: "destructive"
      });
      navigate('/search/activities');
    }
  }, [navigate, toast, user]);

  const checkWishlistStatus = (activityId: string) => {
    if (!user) return;
    const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
    setIsInWishlist(wishlist.some((item: any) => item.id === activityId));
  };

  const toggleWishlist = () => {
    if (!user || !activityData) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save activities to your wishlist"
      });
      return;
    }

    const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
    let wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];

    if (isInWishlist) {
      wishlist = wishlist.filter((item: any) => item.id !== activityData.id);
      toast({ title: "Removed from wishlist" });
    } else {
      wishlist.push({
        ...activityData,
        added_at: new Date().toISOString()
      });
      toast({ title: "Added to wishlist" });
    }

    localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(wishlist));
    setIsInWishlist(!isInWishlist);
  };

  const shareActivity = async () => {
    if (!activityData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: activityData.name,
          text: `Check out this activity: ${activityData.name}`,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(
        `Check out this activity: ${activityData.name}\n${window.location.href}`
      );
      toast({ title: "Link copied to clipboard" });
    }
  };

  const validateParticipants = () => {
    return participants.every(participant => 
      participant.firstName && 
      participant.lastName && 
      participant.email &&
      participant.phone
    );
  };

  const handleNext = () => {
    if (currentStep === 2 && !validateParticipants()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required participant details.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const processBooking = async () => {
    if (!activityData || !user) return;
    
    setPaymentProcessing(true);

    try {
      const bookingParams = {
        type: 'activity' as const,
        offerId: activityData.id,
        offerData: {
          activity_id: activityData.id,
          name: activityData.name,
          provider: activityData.provider,
          date: activityData.date,
          time: activityData.time,
          participants: participants,
          location: activityData.location,
          meetingPoint: activityData.meetingPoint
        },
        customerInfo: {
          firstName: participants[0]?.firstName || '',
          lastName: participants[0]?.lastName || '',
          email: participants[0]?.email || '',
          phone: participants[0]?.phone || ''
        }
      };

      const result = await createBooking(bookingParams);
      
      if (result) {
        setBookingConfirmed(true);
        setCurrentStep(4);
        
        toast({
          title: "Booking Confirmed!",
          description: `Your booking reference is ${result.confirmationCode}`,
        });
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (!activityData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading activity details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show fallback to original wizard for external provider bookings
  if (activityData.providerUrl && !user) {
    return <ActivityBookingWizard />;
  }

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Book Your Activity</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleWishlist}
              className={isInWishlist ? 'text-red-500' : ''}
            >
              <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={shareActivity}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Progress value={progressPercentage} className="mb-4" />
        <div className="flex items-center justify-between text-sm">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <div key={step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                  ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                    isCompleted ? 'border-primary bg-primary text-primary-foreground' : 
                    'border-muted bg-background text-muted-foreground'}
                `}>
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Activity Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {activityData.images?.[0] && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={activityData.images[0]}
                      alt={activityData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-bold mb-2">{activityData.name}</h3>
                  <p className="text-muted-foreground">{activityData.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(activityData.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{activityData.time} ({activityData.duration})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{activityData.participants} participant{activityData.participants > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 w-4 text-yellow-500" />
                    <span>{activityData.rating}/5 ({activityData.reviews} reviews)</span>
                  </div>
                </div>

                {activityData.highlights && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Highlights</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {activityData.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">What's Included</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activityData.inclusions.map((inclusion, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{inclusion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Activity:</span>
                    <span className="font-medium">{activityData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>{format(new Date(activityData.date), 'MMM d, yyyy')} at {activityData.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Participants:</span>
                    <span>{activityData.participants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <Badge variant="secondary">{activityData.provider}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{activityData.price.currency} {activityData.price.amount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user && <ActivityWishlist className="max-h-96" />}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        
        {currentStep === 3 && (
          <Button 
            onClick={processBooking}
            disabled={paymentProcessing || bookingLoading}
            className="flex items-center gap-2"
          >
            {paymentProcessing ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-current" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Complete Booking
              </>
            )}
          </Button>
        )}
        
        {currentStep < 3 && (
          <Button onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};