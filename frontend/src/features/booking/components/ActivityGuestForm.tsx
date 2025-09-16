import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Users, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { autofillService } from "@/lib/autofillService";

const ParticipantSchema = z.object({
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  dietaryRestrictions: z.string().optional(),
  emergencyContact: z.string().optional()
});

const ActivityGuestSchema = z.object({
  participants: z.array(ParticipantSchema).min(1, "At least one participant is required"),
  specialRequests: z.string().optional(),
  acknowledgment: z.boolean().refine(val => val === true, {
    message: "You must acknowledge the terms and conditions"
  })
});

export type ActivityGuestFormData = z.infer<typeof ActivityGuestSchema>;

interface ActivityGuestFormProps {
  onChange?: (isValid: boolean, data: ActivityGuestFormData) => void;
  initial?: Partial<ActivityGuestFormData>;
  participantCount?: number;
}

export default function ActivityGuestForm({ onChange, initial, participantCount = 1 }: ActivityGuestFormProps) {
  const [isAutofilling, setIsAutofilling] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ActivityGuestFormData>({
    resolver: zodResolver(ActivityGuestSchema),
    mode: "onBlur",
    defaultValues: {
      participants: Array.from({ length: participantCount }, () => ({
        title: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        email: "",
        phone: "",
        dietaryRestrictions: "",
        emergencyContact: ""
      })),
      specialRequests: "",
      acknowledgment: false,
      ...initial
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "participants"
  });

  const { formState: { isValid } } = form;

  // Memoize the change handler to prevent infinite loops
  const handleFormChange = useCallback(() => {
    if (onChange) {
      const currentData = form.getValues();
      onChange(isValid, currentData);
    }
  }, [onChange, isValid, form]);

  // Use form subscription instead of watch to avoid creating new objects
  useEffect(() => {
    const subscription = form.watch(() => {
      handleFormChange();
    });
    
    // Initial call
    handleFormChange();
    
    return () => subscription.unsubscribe();
  }, [form, handleFormChange]);

  const handleUpper = (value: string) => value.toUpperCase();

  const handleDemoFill = () => {
    // Production app - remove demo data functionality
    toast({
      title: "Demo data not available",
      description: "Please enter participant information manually",
      variant: "destructive"
    });
  };

  const handleUserDataFill = async () => {
    if (!user?.id) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to use saved information",
        variant: "destructive"
      });
      return;
    }

    setIsAutofilling(true);
    try {
      const userData = await autofillService.loadUserStoredData(user.id);
      
      if (!userData.hasStoredData) {
        toast({
          title: "No saved data found",
          description: "Please save your preferences and passport info first",
          variant: "destructive"
        });
        return;
      }

      // Fill first participant with user data, others with variations
      const participants = fields.map((_, index) => {
        if (index === 0) {
          const userParticipant = autofillService.userDataToPersonalForm(userData);
          return {
            title: userParticipant.title === 'MR' ? 'Mr' : 'Mrs',
            firstName: userParticipant.firstName,
            lastName: userParticipant.lastName,
            dateOfBirth: userParticipant.dateOfBirth,
            email: userParticipant.email,
            phone: userParticipant.phone,
            dietaryRestrictions: "",
            emergencyContact: userParticipant.phone
          };
        } else {
          // Additional participants - use empty template
          return {
            title: "",
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            email: "",
            phone: "",
            dietaryRestrictions: "",
            emergencyContact: ""
          };
        }
      });

      form.setValue('participants', participants);
      form.setValue('specialRequests', (userData.preferences as any)?.special_requests || "");

      toast({
        title: "Information loaded",
        description: "Form filled with your saved information",
      });
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Could not load your saved information",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsAutofilling(false), 500);
    }
  };

  const addParticipant = () => {
    append({
      title: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      dietaryRestrictions: "",
      emergencyContact: ""
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participant Details
        </h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDemoFill}
            disabled={isAutofilling}
            className="text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Fill Demo Data
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUserDataFill}
            disabled={isAutofilling}
            className="text-xs"
          >
            Use My Info
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Participant {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name={`participants.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                          <SelectItem value="Dr">Dr</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`participants.${index}.firstName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          onChange={(e) => field.onChange(handleUpper(e.target.value))}
                          placeholder="Enter first name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`participants.${index}.lastName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          onChange={(e) => field.onChange(handleUpper(e.target.value))}
                          placeholder="Enter last name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name={`participants.${index}.dateOfBirth`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`participants.${index}.email`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter email address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`participants.${index}.phone`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`participants.${index}.emergencyContact`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Emergency contact number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`participants.${index}.dietaryRestrictions`}
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Dietary Restrictions (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Vegetarian, Gluten-free, No nuts" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addParticipant}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Participant
          </Button>

          <FormField
            control={form.control}
            name="specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Requests (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Enter any special requests for the activity"
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acknowledgment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I acknowledge that I have read and agree to the activity booking terms, 
                    cancellation policy, and safety requirements.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Card>
  );
}