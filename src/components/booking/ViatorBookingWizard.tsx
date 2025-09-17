import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users, MapPin, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ViatorActivityData {
  id: string;
  title: string;
  description: string;
  provider: string;
  location: string;
  duration: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  inclusions: string[];
  meetingPoint: string;
  cancellationPolicy: string;
  date: string;
  time: string;
  participants: number;
  viatorData?: {
    productCode: string;
  };
}

interface BookingQuestion {
  id: string;
  question: string;
  required: boolean;
  questionType: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: Array<{
    value: string;
    label: string;
  }>;
}

interface TravelerData {
  firstName: string;
  lastName: string;
  title: string;
  dateOfBirth: string;
  specialRequirements: string;
}

interface BookingAnswers {
  [questionId: string]: string;
}

const steps = ['Activity Review', 'Travelers', 'Booking Questions', 'Payment', 'Confirmation'];

export const ViatorBookingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activityData, setActivityData] = useState<ViatorActivityData | null>(null);
  const [travelers, setTravelers] = useState<TravelerData[]>([]);
  const [bookingQuestions, setBookingQuestions] = useState<BookingQuestion[]>([]);
  const [bookingAnswers, setBookingAnswers] = useState<BookingAnswers>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load activity data from sessionStorage
    const storedData = sessionStorage.getItem('selectedActivity');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setActivityData(data);
        
        // Initialize travelers array
        const participantCount = data.participants || 1;
        setTravelers(
          Array.from({ length: participantCount }, () => ({
            firstName: '',
            lastName: '',
            title: 'Mr',
            dateOfBirth: '',
            specialRequirements: ''
          }))
        );

        // Load booking questions if this is a Viator product
        if (data.viatorData?.productCode) {
          loadBookingQuestions(data.viatorData.productCode);
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
  }, [navigate, toast]);

  const loadBookingQuestions = async (productCode: string) => {
    setIsLoadingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('viator-product-details', {
        body: { productCode, includeBookingQuestions: true }
      });

      if (error) {
        console.error('Error loading booking questions:', error);
        return;
      }

      setBookingQuestions(data.bookingQuestions || []);
    } catch (error) {
      console.error('Error loading booking questions:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const updateTraveler = (index: number, field: keyof TravelerData, value: string) => {
    setTravelers(prev => 
      prev.map((traveler, i) => 
        i === index ? { ...traveler, [field]: value } : traveler
      )
    );
  };

  const updateBookingAnswer = (questionId: string, answer: string) => {
    setBookingAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const validateTravelers = () => {
    return travelers.every(traveler => 
      traveler.firstName && 
      traveler.lastName && 
      traveler.title
    );
  };

  const validateBookingQuestions = () => {
    const requiredQuestions = bookingQuestions.filter(q => q.required);
    return requiredQuestions.every(question => 
      bookingAnswers[question.id] && bookingAnswers[question.id].trim() !== ''
    );
  };

  const handleNext = () => {
    if (currentStep === 2 && !validateTravelers()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required traveler details.",
        variant: "destructive"
      });
      return;
    }

    if (currentStep === 3 && !validateBookingQuestions()) {
      toast({
        title: "Incomplete Information",
        description: "Please answer all required booking questions.",
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

  const handleCreateBooking = async () => {
    if (!activityData?.viatorData?.productCode) {
      toast({
        title: "Error",
        description: "Invalid activity data. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const bookingRequest = {
        productCode: activityData.viatorData.productCode,
        travelDate: activityData.date,
        travelers: travelers.map(traveler => ({
          firstName: traveler.firstName,
          lastName: traveler.lastName,
          title: traveler.title,
          dateOfBirth: traveler.dateOfBirth || undefined
        })),
        bookingQuestionAnswers: Object.entries(bookingAnswers).map(([questionId, answer]) => ({
          questionId,
          answer
        })),
        customerInfo: {
          firstName: travelers[0]?.firstName || '',
          lastName: travelers[0]?.lastName || '',
          email: 'customer@example.com', // TODO: Get from user context
          phone: '+61400000000', // TODO: Get from user context
          country: 'AU'
        },
        specialRequests: travelers.map(t => t.specialRequirements).filter(r => r).join('; ')
      };

      const { data, error } = await supabase.functions.invoke('viator-booking', {
        body: bookingRequest
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Booking Successful!",
          description: `Your booking has been confirmed. Reference: ${data.booking.bookingReference}`,
        });

        // Store booking data for confirmation page
        sessionStorage.setItem('completedBooking', JSON.stringify(data.booking));
        setCurrentStep(5); // Go to confirmation step
      } else {
        throw new Error(data.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Error",
        description: error instanceof Error ? error.message : "There was an error processing your booking. Please try again.",
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

      {/* Step 1: Activity Review */}
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
              <h3 className="text-2xl font-bold">{activityData.title}</h3>
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
                <span>{activityData.rating}/5 ({activityData.reviewCount} reviews)</span>
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
                  {activityData.currency} {activityData.price}
                </p>
                <p className="text-sm text-muted-foreground">Total for {activityData.participants} participant{activityData.participants > 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Travelers */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Traveler Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {travelers.map((traveler, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold">Traveler {index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`title-${index}`}>Title *</Label>
                    <Select value={traveler.title} onValueChange={(value) => updateTraveler(index, 'title', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Miss">Miss</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                    <Input
                      id={`firstName-${index}`}
                      value={traveler.firstName}
                      onChange={(e) => updateTraveler(index, 'firstName', e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`lastName-${index}`}>Last Name *</Label>
                    <Input
                      id={`lastName-${index}`}
                      value={traveler.lastName}
                      onChange={(e) => updateTraveler(index, 'lastName', e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`dateOfBirth-${index}`}>Date of Birth</Label>
                    <Input
                      id={`dateOfBirth-${index}`}
                      type="date"
                      value={traveler.dateOfBirth}
                      onChange={(e) => updateTraveler(index, 'dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`specialRequirements-${index}`}>Special Requirements</Label>
                  <Textarea
                    id={`specialRequirements-${index}`}
                    value={traveler.specialRequirements}
                    onChange={(e) => updateTraveler(index, 'specialRequirements', e.target.value)}
                    placeholder="Any dietary requirements, mobility assistance, etc."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Booking Questions */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingQuestions ? (
              <p className="text-muted-foreground">Loading booking questions...</p>
            ) : bookingQuestions.length === 0 ? (
              <p className="text-muted-foreground">No additional information required.</p>
            ) : (
              bookingQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={`question-${question.id}`}>
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  {question.questionType === 'text' && (
                    <Input
                      id={`question-${question.id}`}
                      value={bookingAnswers[question.id] || ''}
                      onChange={(e) => updateBookingAnswer(question.id, e.target.value)}
                      placeholder="Enter your answer"
                    />
                  )}
                  
                  {question.questionType === 'select' && question.options && (
                    <Select 
                      value={bookingAnswers[question.id] || ''} 
                      onValueChange={(value) => updateBookingAnswer(question.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {question.questionType === 'date' && (
                    <Input
                      id={`question-${question.id}`}
                      type="date"
                      value={bookingAnswers[question.id] || ''}
                      onChange={(e) => updateBookingAnswer(question.id, e.target.value)}
                    />
                  )}
                  
                  {question.questionType === 'number' && (
                    <Input
                      id={`question-${question.id}`}
                      type="number"
                      value={bookingAnswers[question.id] || ''}
                      onChange={(e) => updateBookingAnswer(question.id, e.target.value)}
                      placeholder="Enter a number"
                    />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Payment */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Native Viator Booking</h4>
              <p className="text-blue-800 text-sm">
                This booking will be processed directly through Viator's system with instant confirmation.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-4">Booking Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Activity:</span>
                  <span className="font-medium">{activityData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{format(new Date(activityData.date), 'MMM d, yyyy')} at {activityData.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Travelers:</span>
                  <span>{activityData.participants}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span>{activityData.provider}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{activityData.currency} {activityData.price}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCreateBooking}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Processing Booking...' : 'Confirm Booking'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Confirmation */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Booking Confirmed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-700 mb-2">Booking Successful!</h3>
              <p className="text-muted-foreground">
                Your activity has been booked and confirmed. You should receive a confirmation email shortly.
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Next Steps</h4>
              <ul className="list-disc list-inside text-green-800 text-sm space-y-1">
                <li>Check your email for booking confirmation and voucher</li>
                <li>Arrive at the meeting point 15 minutes before departure</li>
                <li>Bring a printed or digital copy of your voucher</li>
                <li>Have valid ID ready if required</li>
              </ul>
            </div>

            <Button 
              onClick={() => navigate('/search/activities')}
              className="w-full"
              size="lg"
            >
              Book Another Activity
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          
          {currentStep < 4 && (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  );
};