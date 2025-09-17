import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Download,
  Share2,
  Edit,
  Save,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { format, addDays, parseISO } from 'date-fns';
import { EnhancedActivity } from '@/features/search/hooks/useEnhancedActivitySearch';

interface ItineraryItem {
  id: string;
  type: 'activity' | 'hotel' | 'flight' | 'custom';
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  location: string;
  price?: { total: number; currency: string };
  activity?: EnhancedActivity;
  notes?: string;
}

interface DayPlan {
  date: string;
  items: ItineraryItem[];
}

interface ItineraryPlannerProps {
  tripName?: string;
  startDate?: string;
  endDate?: string;
  destination?: string;
  onSave?: (itinerary: DayPlan[]) => void;
  className?: string;
}

export const ItineraryPlanner: React.FC<ItineraryPlannerProps> = ({
  tripName: initialTripName = "My Trip",
  startDate = new Date().toISOString().split('T')[0],
  endDate = addDays(new Date(), 3).toISOString().split('T')[0],
  destination = "Sydney",
  onSave,
  className = ""
}) => {
  const [tripName, setTripName] = useState(initialTripName);
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [editingTripName, setEditingTripName] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize itinerary days
  useEffect(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days: DayPlan[] = [];
    
    let currentDate = start;
    while (currentDate <= end) {
      days.push({
        date: currentDate.toISOString().split('T')[0],
        items: []
      });
      currentDate = addDays(currentDate, 1);
    }
    
    setItinerary(days);
  }, [startDate, endDate]);

  // Load saved itinerary from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`itinerary_${user.id}_${tripName}`);
      if (saved) {
        try {
          const savedItinerary = JSON.parse(saved);
          setItinerary(savedItinerary);
        } catch (error) {
          console.error('Error loading saved itinerary:', error);
        }
      }
    }
  }, [user, tripName]);

  // Save itinerary to localStorage
  const saveItinerary = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your itinerary"
      });
      return;
    }

    localStorage.setItem(`itinerary_${user.id}_${tripName}`, JSON.stringify(itinerary));
    onSave?.(itinerary);
    
    toast({
      title: "Itinerary Saved",
      description: "Your trip itinerary has been saved"
    });
  };

  // Add custom item to itinerary
  const addCustomItem = (dayIndex: number) => {
    const newItem: ItineraryItem = {
      id: `custom_${Date.now()}`,
      type: 'custom',
      name: 'New Activity',
      startTime: '09:00',
      endTime: '10:00',
      location: destination,
      notes: ''
    };

    setItinerary(prev => 
      prev.map((day, index) => 
        index === dayIndex 
          ? { ...day, items: [...day.items, newItem] }
          : day
      )
    );
  };

  // Update itinerary item
  const updateItem = (dayIndex: number, itemId: string, updates: Partial<ItineraryItem>) => {
    setItinerary(prev =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              items: day.items.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              )
            }
          : day
      )
    );
  };

  // Remove item from itinerary
  const removeItem = (dayIndex: number, itemId: string) => {
    setItinerary(prev =>
      prev.map((day, index) =>
        index === dayIndex
          ? { ...day, items: day.items.filter(item => item.id !== itemId) }
          : day
      )
    );
  };

  // Add activity from search results
  const addActivity = (dayIndex: number, activity: EnhancedActivity) => {
    const newItem: ItineraryItem = {
      id: `activity_${activity.id}_${Date.now()}`,
      type: 'activity',
      name: activity.name,
      description: activity.description,
      startTime: '09:00',
      endTime: '12:00', // Default 3 hours
      location: activity.location,
      price: activity.price,
      activity,
      notes: ''
    };

    setItinerary(prev =>
      prev.map((day, index) =>
        index === dayIndex
          ? { ...day, items: [...day.items, newItem] }
          : day
      )
    );

    toast({
      title: "Activity Added",
      description: `${activity.name} has been added to your itinerary`
    });
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    return itinerary.reduce((total, day) => {
      return total + day.items.reduce((dayTotal, item) => {
        return dayTotal + (item.price?.total || 0);
      }, 0);
    }, 0);
  };

  // Export itinerary
  const exportItinerary = () => {
    const itineraryText = itinerary.map(day => {
      const dayText = `${format(parseISO(day.date), 'EEEE, MMMM d, yyyy')}\n`;
      const itemsText = day.items.map(item => 
        `${item.startTime} - ${item.endTime}: ${item.name} at ${item.location}`
      ).join('\n');
      return dayText + itemsText;
    }).join('\n\n');

    const blob = new Blob([`${tripName}\n\n${itineraryText}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tripName.replace(/\s+/g, '_')}_itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share itinerary
  const shareItinerary = async () => {
    const itineraryText = `Check out my ${tripName} itinerary!\n\n` +
      itinerary.map(day => {
        const dayText = format(parseISO(day.date), 'MMM d');
        const itemCount = day.items.length;
        return `${dayText}: ${itemCount} activities planned`;
      }).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tripName} Itinerary`,
          text: itineraryText,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(itineraryText);
      toast({ title: "Itinerary copied to clipboard" });
    }
  };

  const totalCost = calculateTotalCost();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {editingTripName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    className="text-xl font-bold"
                    onBlur={() => setEditingTripName(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingTripName(false);
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingTripName(false)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{tripName}</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingTripName(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {itinerary.length} day{itinerary.length !== 1 ? 's' : ''}
              </Badge>
              {totalCost > 0 && (
                <Badge variant="outline">
                  AUD {totalCost.toFixed(0)}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button onClick={saveItinerary} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={exportItinerary} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={shareItinerary} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Day Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Trip Days</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                {itinerary.map((day, index) => (
                  <Button
                    key={day.date}
                    variant={selectedDay === index ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedDay(index)}
                  >
                    <div>
                      <div className="font-medium">
                        Day {index + 1}
                      </div>
                      <div className="text-xs opacity-70">
                        {format(parseISO(day.date), 'MMM d')}
                      </div>
                      <div className="text-xs opacity-70">
                        {day.items.length} activities
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Details */}
        <div className="lg:col-span-3">
          {itinerary[selectedDay] && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Day {selectedDay + 1}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(itinerary[selectedDay].date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    onClick={() => addCustomItem(selectedDay)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {itinerary[selectedDay].items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">No activities planned</h3>
                    <p className="text-sm mb-4">
                      Add some activities to start building your day
                    </p>
                    <Button onClick={() => addCustomItem(selectedDay)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Activity
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itinerary[selectedDay].items
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((item, itemIndex) => (
                        <Card key={item.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="time"
                                      value={item.startTime}
                                      onChange={(e) => updateItem(selectedDay, item.id, { startTime: e.target.value })}
                                      className="w-24 h-8 text-xs"
                                    />
                                    <span className="text-xs text-muted-foreground">-</span>
                                    <Input
                                      type="time"
                                      value={item.endTime}
                                      onChange={(e) => updateItem(selectedDay, item.id, { endTime: e.target.value })}
                                      className="w-24 h-8 text-xs"
                                    />
                                  </div>
                                  {item.type === 'activity' && (
                                    <Badge variant="secondary" className="text-xs">
                                      Activity
                                    </Badge>
                                  )}
                                </div>
                                
                                <Input
                                  value={item.name}
                                  onChange={(e) => updateItem(selectedDay, item.id, { name: e.target.value })}
                                  className="font-medium mb-2"
                                  placeholder="Activity name"
                                />
                                
                                <div className="flex items-center gap-2 mb-2">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <Input
                                    value={item.location}
                                    onChange={(e) => updateItem(selectedDay, item.id, { location: e.target.value })}
                                    placeholder="Location"
                                    className="text-sm"
                                  />
                                </div>

                                {item.activity?.rating && (
                                  <div className="flex items-center gap-1 mb-2">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs">{item.activity.rating}/5</span>
                                  </div>
                                )}

                                {item.price && (
                                  <div className="text-sm font-medium text-primary">
                                    {item.price.currency} {item.price.total}
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeItem(selectedDay, item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryPlanner;