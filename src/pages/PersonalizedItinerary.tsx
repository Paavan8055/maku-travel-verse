import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Download, Plane, Hotel, Car, Camera, DollarSign, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ItineraryFormData {
  groupSize: number;
  roomsRequired: number;
  startDate: string;
  endDate: string;
  travelStyle: string;
  budget: string;
  specialRequests: string;
}

const ROUTE_CITIES = [
  { name: 'Ahmedabad', code: 'AMD', state: 'Gujarat', type: 'departure' },
  { name: 'Chennai', code: 'MAA', state: 'Tamil Nadu', type: 'destination' },
  { name: 'Pondicherry', code: 'PNY', state: 'Puducherry', type: 'destination' },
  { name: 'Kumbakonam', code: 'KMK', state: 'Tamil Nadu', type: 'destination' },
  { name: 'Chettinad', code: 'CTD', state: 'Tamil Nadu', type: 'destination' },
  { name: 'Rameshwaram', code: 'RMM', state: 'Tamil Nadu', type: 'destination' },
  { name: 'Madurai', code: 'IXM', state: 'Tamil Nadu', type: 'destination' },
  { name: 'Hyderabad', code: 'HYD', state: 'Telangana', type: 'destination' },
];

export default function PersonalizedItinerary() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<ItineraryFormData>({
    groupSize: 10,
    roomsRequired: 5,
    startDate: '2025-02-12',
    endDate: '2025-02-20',
    travelStyle: 'cultural',
    budget: 'moderate',
    specialRequests: ''
  });
  const [generatedItinerary, setGeneratedItinerary] = useState<any>(null);

  const handleInputChange = (field: keyof ItineraryFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateItinerary = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('agents', {
        body: {
          intent: 'create_custom_itinerary',
          params: {
            route: ROUTE_CITIES,
            groupSize: formData.groupSize,
            roomsRequired: formData.roomsRequired,
            startDate: formData.startDate,
            endDate: formData.endDate,
            travelStyle: formData.travelStyle,
            budget: formData.budget,
            specialRequests: formData.specialRequests,
            includeTransport: true,
            includeAccommodation: true,
            includeActivities: true,
            includeCostBreakdown: true
          }
        }
      });

      if (error) {
        throw error;
      }

      setGeneratedItinerary(data.result);
      toast({
        title: "Itinerary Generated",
        description: "Your personalized South India itinerary is ready!",
      });
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate itinerary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadItinerary = () => {
    // In a real implementation, this would generate and download a PDF
    toast({
      title: "Download Started",
      description: "Your itinerary PDF will be ready shortly.",
    });
  };

  const getTripDuration = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent mb-4">
            Personalized South India Itinerary
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create a world-class travel experience through Ahmedabad → Chennai → Pondicherry → Kumbakonam → Chettinad → Rameshwaram → Madurai → Hyderabad
          </p>
        </div>

        {/* Route Preview */}
        <Card className="mb-8 bg-card/80 backdrop-blur-sm border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Travel Route Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {ROUTE_CITIES.map((city, index) => (
                <div key={city.code} className="flex items-center">
                  <Badge variant={city.type === 'departure' ? 'default' : 'secondary'} className="px-3 py-1">
                    {city.name}
                  </Badge>
                  {index < ROUTE_CITIES.length - 1 && (
                    <div className="mx-2 text-muted-foreground">→</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Form */}
          <div className="lg:col-span-1">
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Trip Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Group Details */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupSize">Group Size</Label>
                    <Input
                      id="groupSize"
                      type="number"
                      value={formData.groupSize}
                      onChange={(e) => handleInputChange('groupSize', parseInt(e.target.value))}
                      min="1"
                      max="50"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="roomsRequired">Rooms Required</Label>
                    <Input
                      id="roomsRequired"
                      type="number"
                      value={formData.roomsRequired}
                      onChange={(e) => handleInputChange('roomsRequired', parseInt(e.target.value))}
                      min="1"
                      max="25"
                    />
                  </div>
                </div>

                <Separator />

                {/* Travel Dates */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Duration: {getTripDuration()} days
                  </div>
                </div>

                <Separator />

                {/* Preferences */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="travelStyle">Travel Style</Label>
                    <Select value={formData.travelStyle} onValueChange={(value) => handleInputChange('travelStyle', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select travel style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="luxury">Luxury Experience</SelectItem>
                        <SelectItem value="cultural">Cultural Immersion</SelectItem>
                        <SelectItem value="adventure">Adventure Focused</SelectItem>
                        <SelectItem value="relaxed">Relaxed Pace</SelectItem>
                        <SelectItem value="spiritual">Spiritual Journey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="budget">Budget Range</Label>
                    <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">Economy (₹30,000-50,000 per person)</SelectItem>
                        <SelectItem value="moderate">Moderate (₹50,000-80,000 per person)</SelectItem>
                        <SelectItem value="premium">Premium (₹80,000-120,000 per person)</SelectItem>
                        <SelectItem value="luxury">Luxury (₹120,000+ per person)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Special Requests */}
                <div>
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    placeholder="Dietary restrictions, accessibility needs, specific interests..."
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={generateItinerary} 
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Generate Itinerary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Itinerary */}
          <div className="lg:col-span-2">
            {generatedItinerary ? (
              <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Your South India Itinerary
                    </CardTitle>
                    <Button onClick={downloadItinerary} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="font-semibold">{getTripDuration()} Days</div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="font-semibold">{formData.groupSize} People</div>
                        <div className="text-sm text-muted-foreground">{formData.roomsRequired} Rooms</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="font-semibold">₹{(formData.groupSize * 65000).toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Estimated Total</div>
                      </div>
                    </div>

                    {/* Itinerary Content */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Daily Itinerary</h3>
                      
                      {/* Sample itinerary display */}
                      <div className="space-y-4">
                        {ROUTE_CITIES.slice(0, -1).map((city, index) => (
                          <div key={city.code} className="border rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">Day {index + 1}</Badge>
                              <h4 className="font-semibold">{city.name}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Plane className="h-4 w-4 text-primary" />
                                <span>Transport arranged</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Hotel className="h-4 w-4 text-primary" />
                                <span>4-star accommodation</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Camera className="h-4 w-4 text-primary" />
                                <span>Cultural experiences</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Plan Your Journey?</h3>
                    <p className="text-muted-foreground mb-4">
                      Configure your trip details and generate a personalized itinerary
                    </p>
                    <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                      Configure Trip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}