import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Calendar, Clock, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ActivitySelect = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [participantCount, setParticipantCount] = useState(2);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mock activity data - in real app this would come from search results/API
  const activity = {
    id: "act_123",
    title: "City Walking Tour with Local Guide",
    description: "Explore the historic downtown area with an experienced local guide. Discover hidden gems, learn about the city's history, and enjoy stunning architectural views.",
    location: "Downtown Historic District",
    duration: "3 hours",
    difficulty: "Easy",
    minAge: 6,
    maxParticipants: 15,
    images: ["/placeholder.svg"],
    highlights: [
      "Professional local guide",
      "Historic landmarks tour",
      "Photo opportunities",
      "Small group experience"
    ],
    included: [
      "Professional guide",
      "Walking tour",
      "Historical insights",
      "Photo stops"
    ],
    notIncluded: [
      "Food and beverages",
      "Transportation to meeting point",
      "Personal expenses"
    ],
    meetingPoint: "Tourist Information Center, Main Street",
    pricing: {
      adult: 45,
      child: 25,
      currency: "USD"
    }
  };

  const availableTimes = [
    "09:00 AM",
    "11:00 AM", 
    "02:00 PM",
    "04:00 PM"
  ];

  const calculateTotal = () => {
    return participantCount * activity.pricing.adult;
  };

  const handleContinue = () => {
    const bookingData = {
      type: 'activity',
      activityId: activity.id,
      title: activity.title,
      date: selectedDate,
      time: selectedTime,
      participants: participantCount.toString(),
      total: calculateTotal().toString(),
      ...Object.fromEntries(searchParams)
    };

    const queryString = new URLSearchParams(bookingData).toString();
    navigate(`/booking/checkout/activity?${queryString}`);
  };

  const isValid = selectedDate && selectedTime && participantCount > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Select Activity Details</h1>
              <p className="text-sm text-muted-foreground">Choose your preferred date and time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <img 
                    src={activity.images[0]} 
                    alt={activity.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{activity.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {activity.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {activity.duration}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{activity.difficulty}</Badge>
                      <Badge variant="outline">Min age: {activity.minAge}+</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{activity.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">What's Included</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {activity.included.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Not Included</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {activity.notIncluded.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div>
                  <h4 className="font-medium mb-2">Meeting Point</h4>
                  <p className="text-sm text-muted-foreground">{activity.meetingPoint}</p>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select Time</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="w-full"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participant Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Number of Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Adults</p>
                    <p className="text-sm text-muted-foreground">${activity.pricing.adult} per person</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setParticipantCount(Math.max(1, participantCount - 1))}
                      disabled={participantCount <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">{participantCount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setParticipantCount(Math.min(activity.maxParticipants, participantCount + 1))}
                      disabled={participantCount >= activity.maxParticipants}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum {activity.maxParticipants} participants per booking
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">{activity.location}</p>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{selectedDate || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{selectedTime || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Participants:</span>
                    <span>{participantCount} adult{participantCount > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full btn-primary h-12"
                  size="lg"
                  onClick={handleContinue}
                  disabled={!isValid}
                >
                  Continue to Details
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Free cancellation up to 24 hours before the activity
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitySelect;