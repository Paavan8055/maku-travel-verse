import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
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
import { Sparkles, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { autofillService } from "@/lib/autofillService";
import logger from "@/utils/logger";

const HotelGuestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  arrivalTime: z.string().optional(),
  specialRequests: z.string().optional(),
  smsNotifications: z.boolean().default(false),
  emailUpdates: z.boolean().default(true),
  roomPreferences: z.string().optional(),
  acknowledgment: z.boolean().refine(val => val === true, {
    message: "You must acknowledge the terms and conditions"
  })
});

export type HotelGuestFormData = z.infer<typeof HotelGuestSchema>;

interface HotelGuestFormProps {
  onChange?: (data: HotelGuestFormData, isValid: boolean) => void;
  initial?: Partial<HotelGuestFormData>;
}

export default function HotelGuestForm({ onChange, initial }: HotelGuestFormProps) {
  const [isAutofilling, setIsAutofilling] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing data from sessionStorage on mount
  const getInitialData = () => {
    try {
      const savedData = sessionStorage.getItem('guestInfo');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        return { ...parsed, ...initial }; // initial props take precedence
      }
    } catch (error) {
      logger.error('Error loading saved guest data:', error);
    }
    return {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      arrivalTime: "",
      specialRequests: "",
      smsNotifications: false,
      emailUpdates: true,
      roomPreferences: "",
      acknowledgment: false,
      ...initial
    };
  };

  const form = useForm<HotelGuestFormData>({
    resolver: zodResolver(HotelGuestSchema),
    mode: "onBlur", // Changed from onChange to reduce re-renders
    defaultValues: getInitialData()
  });

  const { watch, formState: { isValid } } = form;
  
  // Memoize the change handler to prevent infinite loops
  const handleFormChange = useCallback(() => {
    if (onChange) {
      const currentData = form.getValues();
      // Save form data to sessionStorage whenever it changes
      if (isValid) {
        sessionStorage.setItem('guestInfo', JSON.stringify(currentData));
      }
      onChange(currentData, isValid);
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
      description: "Please enter guest information manually",
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

      const formData = autofillService.userDataToHotelForm(userData);
      form.reset(formData);

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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Guest Details</h2>
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
            <User className="h-3 w-3 mr-1" />
            Use My Info
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form className="space-y-4">
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
              name="lastName"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
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

            <FormField
              control={form.control}
              name="phone"
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
          </div>

          <FormField
            control={form.control}
            name="arrivalTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Arrival Time (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., 3:00 PM or After 6:00 PM" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roomPreferences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Preferences (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., High floor, Quiet room, Near elevator" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Requests (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Enter any special requests or accessibility needs"
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <FormField
              control={form.control}
              name="smsNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Receive SMS notifications about booking updates</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailUpdates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Receive email updates about your stay</FormLabel>
                  </div>
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
                      I acknowledge that I have read and agree to the hotel's booking terms, 
                      cancellation policy, and privacy policy.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </Card>
  );
}