import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const passengerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  dateOfBirth: z.date({
    required_error: 'Date of birth is required',
  }),
  gender: z.enum(['M', 'F', 'X']),
  title: z.enum(['Mr', 'Mrs', 'Ms', 'Miss', 'Dr']),
  passportNumber: z.string().min(6, 'Passport number is required'),
  passportExpiry: z.date({
    required_error: 'Passport expiry is required',
  }),
  nationality: z.string().min(2, 'Nationality is required'),
  specialRequests: z.array(z.string()).optional(),
  frequentFlyerNumber: z.string().optional(),
  knownTravelerNumber: z.string().optional(),
  seatPreference: z.enum(['aisle', 'window', 'middle', 'none']).optional(),
  mealPreference: z.enum(['standard', 'vegetarian', 'vegan', 'kosher', 'halal', 'gluten-free', 'none']).optional(),
});

type PassengerData = z.infer<typeof passengerSchema>;

interface PassengerDetailsFormProps {
  passengerCount: number;
  onSubmit: (passengers: PassengerData[]) => void;
  onBack: () => void;
  initialData?: PassengerData[];
}

export const PassengerDetailsForm = ({ passengerCount, onSubmit, onBack, initialData = [] }: PassengerDetailsFormProps) => {
  const [passengers, setPassengers] = useState<PassengerData[]>(
    Array.from({ length: passengerCount }, (_, i) => initialData[i] || {} as PassengerData)
  );
  const [activePassenger, setActivePassenger] = useState(0);

  const form = useForm<PassengerData>({
    resolver: zodResolver(passengerSchema),
    defaultValues: passengers[activePassenger] || {},
  });

  const handlePassengerSubmit = (data: PassengerData) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[activePassenger] = data;
    setPassengers(updatedPassengers);

    if (activePassenger < passengerCount - 1) {
      setActivePassenger(activePassenger + 1);
      form.reset(updatedPassengers[activePassenger + 1] || {});
    } else {
      // All passengers completed
      onSubmit(updatedPassengers);
    }
  };

  const isPassengerComplete = (index: number) => {
    const passenger = passengers[index];
    return passenger && passenger.firstName && passenger.lastName && passenger.dateOfBirth;
  };

  return (
    <div className="space-y-6">
      {/* Passenger Navigation */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: passengerCount }, (_, i) => (
          <Button
            key={i}
            variant={activePassenger === i ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActivePassenger(i);
              form.reset(passengers[i] || {});
            }}
            className={cn(
              "relative",
              isPassengerComplete(i) && "ring-2 ring-green-500"
            )}
          >
            Passenger {i + 1}
            {isPassengerComplete(i) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
            )}
          </Button>
        ))}
      </div>

      {/* Passenger Form */}
      <Card>
        <CardHeader>
          <CardTitle>Passenger {activePassenger + 1} Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePassengerSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                          <SelectItem value="Miss">Miss</SelectItem>
                          <SelectItem value="Dr">Dr</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="X">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Passport Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Passport Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="passportNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter passport number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter nationality" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passportExpiry"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Passport Expiry</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick expiry date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Travel Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Travel Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="seatPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seat Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aisle">Aisle</SelectItem>
                            <SelectItem value="window">Window</SelectItem>
                            <SelectItem value="middle">Middle</SelectItem>
                            <SelectItem value="none">No preference</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mealPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select meal preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                            <SelectItem value="kosher">Kosher</SelectItem>
                            <SelectItem value="halal">Halal</SelectItem>
                            <SelectItem value="gluten-free">Gluten Free</SelectItem>
                            <SelectItem value="none">No preference</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="frequentFlyerNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequent Flyer Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter frequent flyer number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="knownTravelerNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Known Traveler Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter known traveler number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit">
                  {activePassenger < passengerCount - 1 ? 'Next Passenger' : 'Continue to Payment'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};