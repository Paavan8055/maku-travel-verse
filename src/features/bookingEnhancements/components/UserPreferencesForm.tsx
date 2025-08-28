import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { fetchUserPreferences, saveUserPreferences } from "@/lib/bookingDataClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Plane, Hotel, Utensils, Globe, DollarSign } from "lucide-react";

const airlines = ["Qantas", "Virgin Australia", "Jetstar", "Emirates", "Singapore Airlines"];
const mealOptions = ["Vegetarian", "Vegan", "Gluten-free", "Kosher", "Halal"];
const currencies = ["AUD", "USD", "EUR", "GBP", "SGD"];
const languages = ["en", "es", "fr", "de", "it", "ja", "zh"];

export default function UserPreferencesForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    preferred_airlines: [] as string[],
    seat_class: "economy",
    room_type: "standard",
    meal_preferences: [] as string[],
    language: "en",
    currency: "AUD"
  });

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const data = await fetchUserPreferences(user?.id || '');
      if (data) {
        setPreferences({
          preferred_airlines: data.preferred_airlines || [],
          seat_class: data.seat_class || "economy",
          room_type: data.room_type || "standard",
          meal_preferences: data.meal_preferences || [],
          language: data.language || "en",
          currency: data.currency || "AUD"
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await saveUserPreferences({
        user_id: user.id,
        ...preferences
      });
      
      toast({
        title: "Preferences saved",
        description: "Your travel preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAirline = (airline: string) => {
    setPreferences(prev => ({
      ...prev,
      preferred_airlines: prev.preferred_airlines.includes(airline)
        ? prev.preferred_airlines.filter(a => a !== airline)
        : [...prev.preferred_airlines, airline]
    }));
  };

  const toggleMeal = (meal: string) => {
    setPreferences(prev => ({
      ...prev,
      meal_preferences: prev.meal_preferences.includes(meal)
        ? prev.meal_preferences.filter(m => m !== meal)
        : [...prev.meal_preferences, meal]
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Travel Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Airlines */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Preferred Airlines
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {airlines.map((airline) => (
              <div key={airline} className="flex items-center space-x-2">
                <Checkbox
                  id={airline}
                  checked={preferences.preferred_airlines.includes(airline)}
                  onCheckedChange={() => toggleAirline(airline)}
                />
                <Label htmlFor={airline} className="text-sm">{airline}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Seat Class */}
        <div className="space-y-3">
          <Label>Preferred Seat Class</Label>
          <Select value={preferences.seat_class} onValueChange={(value) => 
            setPreferences(prev => ({ ...prev, seat_class: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="premium_economy">Premium Economy</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="first">First Class</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Room Type */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            Preferred Room Type
          </Label>
          <Select value={preferences.room_type} onValueChange={(value) => 
            setPreferences(prev => ({ ...prev, room_type: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Room</SelectItem>
              <SelectItem value="deluxe">Deluxe Room</SelectItem>
              <SelectItem value="suite">Suite</SelectItem>
              <SelectItem value="ocean_view">Ocean View</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Meal Preferences */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Meal Preferences
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {mealOptions.map((meal) => (
              <div key={meal} className="flex items-center space-x-2">
                <Checkbox
                  id={meal}
                  checked={preferences.meal_preferences.includes(meal)}
                  onCheckedChange={() => toggleMeal(meal)}
                />
                <Label htmlFor={meal} className="text-sm">{meal}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Language & Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Language
            </Label>
            <Select value={preferences.language} onValueChange={(value) => 
              setPreferences(prev => ({ ...prev, language: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Currency
            </Label>
            <Select value={preferences.currency} onValueChange={(value) => 
              setPreferences(prev => ({ ...prev, currency: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(curr => (
                  <SelectItem key={curr} value={curr}>
                    {curr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading || !user}
          className="w-full"
        >
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}