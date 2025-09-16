import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoyaltyProgram {
  programOwner: string;
  id: string;
}

interface LoyaltyProgramInputProps {
  programs: LoyaltyProgram[];
  onChange: (programs: LoyaltyProgram[]) => void;
}

const airlinePrograms = [
  { code: 'QF', name: 'Qantas Frequent Flyer' },
  { code: 'VA', name: 'Virgin Australia Velocity' },
  { code: 'SQ', name: 'Singapore Airlines KrisFlyer' },
  { code: 'EK', name: 'Emirates Skywards' },
  { code: 'BA', name: 'British Airways Executive Club' },
  { code: 'AA', name: 'American Airlines AAdvantage' },
  { code: 'DL', name: 'Delta SkyMiles' },
  { code: 'UA', name: 'United MileagePlus' },
  { code: 'AF', name: 'Air France Flying Blue' },
  { code: 'LH', name: 'Lufthansa Miles & More' },
  { code: 'CX', name: 'Cathay Pacific Asia Miles' },
  { code: 'TG', name: 'Thai Airways Royal Orchid Plus' }
];

const hotelPrograms = [
  { code: 'HH', name: 'Hilton Honors' },
  { code: 'MAR', name: 'Marriott Bonvoy' },
  { code: 'IHG', name: 'IHG One Rewards' },
  { code: 'WOH', name: 'World of Hyatt' },
  { code: 'AC', name: 'Accor Live Limitless' },
  { code: 'WYN', name: 'Wyndham Rewards' },
  { code: 'CHO', name: 'Choice Privileges' }
];

export const LoyaltyProgramInput = ({ programs, onChange }: LoyaltyProgramInputProps) => {
  const [newProgram, setNewProgram] = useState<LoyaltyProgram>({ programOwner: '', id: '' });

  const addProgram = () => {
    if (newProgram.programOwner && newProgram.id) {
      onChange([...programs, { ...newProgram }]);
      setNewProgram({ programOwner: '', id: '' });
    }
  };

  const removeProgram = (index: number) => {
    onChange(programs.filter((_, i) => i !== index));
  };

  const updateProgram = (index: number, field: keyof LoyaltyProgram, value: string) => {
    const updated = programs.map((program, i) => 
      i === index ? { ...program, [field]: value } : program
    );
    onChange(updated);
  };

  const allPrograms = [...airlinePrograms, ...hotelPrograms];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Loyalty Programs</CardTitle>
        <p className="text-xs text-muted-foreground">
          Add your frequent flyer and hotel loyalty numbers to earn points and access member benefits
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Programs */}
        {programs.map((program, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor={`program-${index}`} className="text-xs">Program</Label>
              <Select
                value={program.programOwner}
                onValueChange={(value) => updateProgram(index, 'programOwner', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" disabled>Airline Programs</SelectItem>
                  {airlinePrograms.map((airline) => (
                    <SelectItem key={airline.code} value={airline.code}>
                      {airline.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="" disabled>Hotel Programs</SelectItem>
                  {hotelPrograms.map((hotel) => (
                    <SelectItem key={hotel.code} value={hotel.code}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor={`member-${index}`} className="text-xs">Member Number</Label>
              <Input
                id={`member-${index}`}
                placeholder="Member number"
                value={program.id}
                onChange={(e) => updateProgram(index, 'id', e.target.value)}
                className="h-8"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeProgram(index)}
              className="h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {/* Add New Program */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="new-program" className="text-xs">Add Program</Label>
              <Select
                value={newProgram.programOwner}
                onValueChange={(value) => setNewProgram({ ...newProgram, programOwner: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" disabled>Airline Programs</SelectItem>
                  {airlinePrograms.map((airline) => (
                    <SelectItem key={airline.code} value={airline.code}>
                      {airline.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="" disabled>Hotel Programs</SelectItem>
                  {hotelPrograms.map((hotel) => (
                    <SelectItem key={hotel.code} value={hotel.code}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="new-member" className="text-xs">Member Number</Label>
              <Input
                id="new-member"
                placeholder="Member number"
                value={newProgram.id}
                onChange={(e) => setNewProgram({ ...newProgram, id: e.target.value })}
                className="h-8"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProgram}
              disabled={!newProgram.programOwner || !newProgram.id}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {programs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No loyalty programs added. Add your frequent flyer numbers to earn miles and access member benefits.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
