import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Award, Plane, Building } from "lucide-react";
import { LoyaltyProgramInput } from "@/features/booking/components/LoyaltyProgramInput";

interface LoyaltyProgram {
  programOwner: string;
  id: string;
  type: 'airline' | 'hotel';
}

interface TravelPreferences {
  seatPreference: string;
  mealPreference: string;
  specialRequests: string;
  accessibilityNeeds: string;
}

interface ProfileLoyaltySectionProps {
  loyaltyPrograms: LoyaltyProgram[];
  travelPreferences: TravelPreferences;
  onLoyaltyProgramsChange: (programs: LoyaltyProgram[]) => void;
  onTravelPreferencesChange: (preferences: TravelPreferences) => void;
}

export const ProfileLoyaltySection = ({
  loyaltyPrograms,
  travelPreferences,
  onLoyaltyProgramsChange,
  onTravelPreferencesChange
}: ProfileLoyaltySectionProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    // Save changes logic would go here
  };

  return (
    <div className="space-y-6">
      {/* Loyalty Programs Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Loyalty Programs
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <LoyaltyProgramInput
                programs={loyaltyPrograms}
                onChange={onLoyaltyProgramsChange}
              />
              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {loyaltyPrograms.length > 0 ? (
                <div className="grid gap-3">
                  {loyaltyPrograms.map((program, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {program.type === 'airline' ? (
                          <Plane className="h-4 w-4 text-primary" />
                        ) : (
                          <Building className="h-4 w-4 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">{program.programOwner}</p>
                          <p className="text-sm text-muted-foreground">{program.id}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {program.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No loyalty programs added yet. Add your frequent flyer and hotel programs to earn benefits.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Travel Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle>Travel Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seatPreference">Seat Preference</Label>
              <Select
                value={travelPreferences.seatPreference}
                onValueChange={(value) => 
                  onTravelPreferencesChange({
                    ...travelPreferences,
                    seatPreference: value
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="window">Window</SelectItem>
                  <SelectItem value="aisle">Aisle</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="no-preference">No Preference</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mealPreference">Meal Preference</Label>
              <Select
                value={travelPreferences.mealPreference}
                onValueChange={(value) => 
                  onTravelPreferencesChange({
                    ...travelPreferences,
                    mealPreference: value
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="kosher">Kosher</SelectItem>
                  <SelectItem value="halal">Halal</SelectItem>
                  <SelectItem value="gluten-free">Gluten Free</SelectItem>
                  <SelectItem value="diabetic">Diabetic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Input
                id="specialRequests"
                value={travelPreferences.specialRequests}
                onChange={(e) => 
                  onTravelPreferencesChange({
                    ...travelPreferences,
                    specialRequests: e.target.value
                  })
                }
                placeholder="Any special requests for your trips..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="accessibilityNeeds">Accessibility Needs</Label>
              <Input
                id="accessibilityNeeds"
                value={travelPreferences.accessibilityNeeds}
                onChange={(e) => 
                  onTravelPreferencesChange({
                    ...travelPreferences,
                    accessibilityNeeds: e.target.value
                  })
                }
                placeholder="Any accessibility requirements..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};