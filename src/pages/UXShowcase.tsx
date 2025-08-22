import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserFeedback, 
  LoadingState, 
  SearchLoadingState,
  BookingLoadingState,
  PaymentLoadingState,
  LoadingOverlay,
  AccessibilityEnhancer,
  AccessibleFormField,
  EnhancedSkeleton,
  HotelCardSkeleton,
  FlightCardSkeleton,
  SearchResultsSkeleton,
  useEnhancedErrorHandler
} from '@/components/ux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Accessibility, 
  MessageSquare, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Eye,
  Heart
} from 'lucide-react';

const UXShowcase: React.FC = () => {
  const { t } = useTranslation();
  const { handleError, handleValidationError, handleNetworkError } = useEnhancedErrorHandler();
  const [showOverlay, setShowOverlay] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    search: false,
    booking: false,
    payment: false
  });

  const triggerError = (type: 'network' | 'validation' | 'booking') => {
    switch (type) {
      case 'network':
        handleNetworkError(new Error('Failed to fetch data from server'));
        break;
      case 'validation':
        handleValidationError(new Error('Missing required parameters'), 'email');
        break;
      case 'booking':
        handleError({ 
          error: new Error('Booking failed due to availability'), 
          options: { context: 'booking', severity: 'high' }
        });
        break;
    }
  };

  const toggleLoadingState = (type: 'search' | 'booking' | 'payment') => {
    setLoadingStates(prev => ({ ...prev, [type]: !prev[type] }));
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }, 3000);
  };

  return (
    <AccessibilityEnhancer className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Phase 2: User Experience Polish
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enhanced error handling, loading states, accessibility improvements, 
            user feedback systems, and visual polish for a superior user experience.
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enhanced Error Messages
            </Badge>
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              <Eye className="h-3 w-3 mr-1" />
              Loading States
            </Badge>
            <Badge variant="default" className="bg-purple-100 text-purple-800">
              <Accessibility className="h-3 w-3 mr-1" />
              Accessibility
            </Badge>
            <Badge variant="default" className="bg-orange-100 text-orange-800">
              <Heart className="h-3 w-3 mr-1" />
              User Feedback
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="error-handling" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
            <TabsTrigger value="error-handling" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Error Handling
            </TabsTrigger>
            <TabsTrigger value="loading-states" className="flex items-center gap-2">
              <Loader2 className="h-4 w-4" />
              Loading States
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              Accessibility
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              User Feedback
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Error Handling */}
          <TabsContent value="error-handling" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Enhanced Error Messages & Handling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Our enhanced error handler provides contextual, actionable error messages 
                  with user guidance and automatic retry capabilities.
                </p>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <Button 
                    variant="outline" 
                    onClick={() => triggerError('network')}
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Network Error
                    <span className="text-xs text-muted-foreground">
                      With retry suggestions
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => triggerError('validation')}
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Validation Error
                    <span className="text-xs text-muted-foreground">
                      Field-specific guidance
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => triggerError('booking')}
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Booking Error
                    <span className="text-xs text-muted-foreground">
                      Context-aware messaging
                    </span>
                  </Button>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Features:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Contextual error messages based on user action</li>
                    <li>• Actionable suggestions for resolution</li>
                    <li>• Severity-based handling (low, medium, high, critical)</li>
                    <li>• Automatic retry scheduling for system errors</li>
                    <li>• Multilingual error messages</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loading States */}
          <TabsContent value="loading-states" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-blue-500" />
                  Enhanced Loading States & Skeletons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Beautiful loading states with progress indicators and context-aware skeleton screens
                  to keep users engaged during data fetching.
                </p>

                {/* Loading State Controls */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Button 
                    variant="outline" 
                    onClick={() => toggleLoadingState('search')}
                    disabled={loadingStates.search}
                  >
                    {loadingStates.search ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Search Loading
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => toggleLoadingState('booking')}
                    disabled={loadingStates.booking}
                  >
                    {loadingStates.booking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Booking Loading
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => toggleLoadingState('payment')}
                    disabled={loadingStates.payment}
                  >
                    {loadingStates.payment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Payment Loading
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => setShowOverlay(true)}
                  >
                    Show Overlay
                  </Button>
                </div>

                {/* Loading State Demos */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {loadingStates.search && (
                    <div>
                      <h4 className="font-medium mb-3">Search Loading State</h4>
                      <SearchLoadingState searchType="hotels" />
                    </div>
                  )}
                  
                  {loadingStates.booking && (
                    <div>
                      <h4 className="font-medium mb-3">Booking Loading State</h4>
                      <BookingLoadingState step="processing" />
                    </div>
                  )}
                  
                  {loadingStates.payment && (
                    <div>
                      <h4 className="font-medium mb-3">Payment Loading State</h4>
                      <Card>
                        <CardContent className="p-6">
                          <PaymentLoadingState />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Skeleton Examples */}
                <div>
                  <h4 className="font-medium mb-3">Skeleton Loaders</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Hotel Card</p>
                      <HotelCardSkeleton />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Flight Card</p>
                      <FlightCardSkeleton />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Enhanced Skeleton</p>
                      <EnhancedSkeleton variant="profile" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility */}
          <TabsContent value="accessibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="h-5 w-5 text-purple-500" />
                  Accessibility Enhancements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  WCAG 2.1 AA compliant components with proper ARIA labels, focus management, 
                  and screen reader support.
                </p>

                <div className="space-y-4">
                  <AccessibleFormField
                    label="Email Address"
                    required
                    hint="We'll use this to send booking confirmations"
                  >
                    <Input placeholder="your@email.com" />
                  </AccessibleFormField>
                  
                  <AccessibleFormField
                    label="Travel Preferences"
                    hint="Optional: Tell us about your travel style"
                  >
                    <Input placeholder="Family-friendly, adventure, luxury..." />
                  </AccessibleFormField>
                  
                  <AccessibleFormField
                    label="Special Requests"
                    error="Please provide more details about accessibility needs"
                  >
                    <Input placeholder="Wheelchair access, dietary requirements..." />
                  </AccessibleFormField>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Accessibility Features:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Skip links for keyboard navigation</li>
                    <li>• Proper heading hierarchy and landmarks</li>
                    <li>• ARIA labels and descriptions for all interactive elements</li>
                    <li>• Focus management and visual focus indicators</li>
                    <li>• Screen reader announcements for dynamic content</li>
                    <li>• High contrast mode support</li>
                    <li>• Reduced motion preferences respected</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  User Feedback System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Contextual feedback collection system to help us understand user experience 
                  and continuously improve our platform.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Feedback Widget</h4>
                    <UserFeedback context="ux-showcase" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Contextual Feedback</h4>
                    <UserFeedback context="search-experience" />
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Feedback Features:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Quick thumbs up/down rating system</li>
                    <li>• Optional detailed comments</li>
                    <li>• Context-aware feedback collection</li>
                    <li>• Local storage with backend sync capability</li>
                    <li>• Non-intrusive design that doesn't interrupt workflow</li>
                    <li>• Floating feedback button for global access</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Phase 2 Implementation Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              All Phase 2 user experience enhancements have been successfully implemented. 
              These improvements provide a more polished, accessible, and user-friendly experience 
              across the entire application.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-medium">Error Enhancement</h4>
                <p className="text-sm text-muted-foreground">Contextual & actionable</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium">Loading States</h4>
                <p className="text-sm text-muted-foreground">Beautiful & informative</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Accessibility className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-medium">Accessibility</h4>
                <p className="text-sm text-muted-foreground">WCAG 2.1 AA compliant</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Heart className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <h4 className="font-medium">User Feedback</h4>
                <p className="text-sm text-muted-foreground">Continuous improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay Demo */}
      <LoadingOverlay 
        isVisible={showOverlay}
        type="general"
        message="Demonstrating loading overlay..."
      />
      
      {showOverlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <Button 
            onClick={() => setShowOverlay(false)}
            className="absolute top-20 right-20"
            variant="outline"
          >
            Close Overlay
          </Button>
        </div>
      )}
    </AccessibilityEnhancer>
  );
};

export default UXShowcase;