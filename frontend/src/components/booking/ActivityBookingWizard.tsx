/**
 * ActivityBookingWizard Component
 * Author: MAKU Travel Platform
 * Created: 2025-09-05
 * Purpose: Multi-step wizard for activity booking with provider integration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users, MapPin, Star, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityData {
  id: string;
  name: string;
  description: string;
  duration: string;
  location: string;
  provider: string;
  providerUrl: string;
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

export const ActivityBookingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load activity data from sessionStorage
    const storedData = sessionStorage.getItem('selectedActivity');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setActivityData(data);
        
        // Initialize participants array based on number of participants
        const participantCount = data.participants || 1;
        setParticipants(
          Array.from({ length: participantCount }, () => ({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            specialRequirements: ''
          }))
        );
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
  }, [navigate, toast]);

  const updateParticipant = (index: number, field: keyof ParticipantData, value: string) => {
    setParticipants(prev => 
      prev.map((participant, i) => 
        i === index ? { ...participant, [field]: value } : participant
      )
    );
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

  const handleProceedToProvider = async () => {
    if (!activityData) return;
    
    setIsProcessing(true);
    
    try {
      // Since this is external provider booking, we redirect to provider's booking page
      toast({
        title: "Redirecting to Provider",
        description: `Redirecting to ${activityData.provider} to complete your booking.`,
      });
      
      // Open provider's booking URL in a new tab
      window.open(activityData.providerUrl, '_blank');
      
      // Navigate back to activities page
      setTimeout(() => {
        navigate('/search/activities');
      }, 2000);
    } catch (error) {
      console.error('Error processing booking:', error);
      toast({
        title: "Booking Error",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
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
                {index < steps.length - 1 && (
                  <div className={`ml-4 w-12 h-0.5 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Activity Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold">{activityData.name}</h3>
              <p className="text-muted-foreground mt-2">{activityData.description}</p>
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
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{activityData.rating}/5 ({activityData.reviews} reviews)</span>
              </div>
            </div>

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

            <div>
              <h4 className="font-semibold mb-2">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{activityData.meetingPoint}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Cancellation Policy</h4>
              <p className="text-sm text-muted-foreground">{activityData.cancellationPolicy}</p>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <Badge variant="secondary">Provided by {activityData.provider}</Badge>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {activityData.price.currency} {activityData.price.amount}
                </p>
                <p className="text-sm text-muted-foreground">Total for {activityData.participants} participant{activityData.participants > 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participant Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {participants.map((participant, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold">Participant {index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                    <Input
                      id={`firstName-${index}`}
                      value={participant.firstName}
                      onChange={(e) => updateParticipant(index, 'firstName', e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`lastName-${index}`}>Last Name *</Label>
                    <Input
                      id={`lastName-${index}`}
                      value={participant.lastName}
                      onChange={(e) => updateParticipant(index, 'lastName', e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`email-${index}`}>Email *</Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`phone-${index}`}>Phone *</Label>
                    <Input
                      id={`phone-${index}`}
                      value={participant.phone}
                      onChange={(e) => updateParticipant(index, 'phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`dateOfBirth-${index}`}>Date of Birth</Label>
                    <Input
                      id={`dateOfBirth-${index}`}
                      type="date"
                      value={participant.dateOfBirth}
                      onChange={(e) => updateParticipant(index, 'dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`specialRequirements-${index}`}>Special Requirements</Label>
                  <Textarea
                    id={`specialRequirements-${index}`}
                    value={participant.specialRequirements}
                    onChange={(e) => updateParticipant(index, 'specialRequirements', e.target.value)}
                    placeholder="Any dietary requirements, mobility assistance, etc."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Provider Booking</h4>
              <p className="text-blue-800 text-sm">
                This activity is provided by {activityData.provider}. You'll be redirected to their secure booking platform to complete your reservation and payment.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-4">Booking Summary</h4>
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
                  <span>{activityData.provider}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{activityData.price.currency} {activityData.price.amount}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleProceedToProvider}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Redirecting...' : `Continue to ${activityData.provider}`}
            </Button>
          </CardContent>
        </Card>
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
        
        {currentStep < steps.length - 1 && (
          <Button onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};