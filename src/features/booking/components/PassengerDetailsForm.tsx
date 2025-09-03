import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { autofillService } from "@/lib/autofillService";
import { useBookingStore } from "@/store/bookingStore";
import logger from "@/utils/logger";

// Schema for hotel guest details
const GuestSchema = z.object({
  title: z.enum(["MR", "MRS", "MS", "DR", "PROF"], {
    required_error: "Title is required"
  }),
  firstName: z.string().min(1, "First name is required").transform(v => v.toUpperCase()).refine(v => /^[A-Z '-]+$/.test(v), {
    message: "Use letters A-Z only; no accents or special characters"
  }),
  lastName: z.string().min(1, "Last name is required").transform(v => v.toUpperCase()).refine(v => /^[A-Z '-]+$/.test(v), {
    message: "Use letters A-Z only; no accents or special characters"
  }),
  dateOfBirth: z.string().refine(v => !!Date.parse(v) && new Date(v) < new Date(), {
    message: "Enter a valid past date"
  }),
  nationality: z.string().min(2, "2-3 letter code").max(3, "2-3 letter code").transform(v => v.toUpperCase()).refine(v => /^[A-Z]{2,3}$/.test(v), {
    message: "Use 2-3 letter ISO code"
  }),
  idDocument: z.string().min(5, "ID document number is required").transform(v => v.toUpperCase()).refine(v => /^[A-Z0-9]+$/.test(v), {
    message: "Alphanumeric only"
  }),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/i, "Use international format, e.g., +15551234567"),
  specialRequests: z.string().optional(),
  acknowledge: z.boolean().refine(v => v === true, {
    message: "You must confirm before continuing"
  })
});
export type PassengerFormData = z.infer<typeof GuestSchema>;
interface PassengerDetailsFormProps {
  onChange?: (data: PassengerFormData | null, isValid: boolean) => void;
  initial?: Partial<PassengerFormData>;
  bookingType?: 'flight' | 'hotel' | 'activity';
}
export const PassengerDetailsForm: React.FC<PassengerDetailsFormProps> = ({
  onChange,
  initial,
  bookingType = 'hotel'
}) => {
  const [isAutofilling, setIsAutofilling] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing data from Zustand store on mount  
  const getInitialData = (): Partial<PassengerFormData> => {
    const { passengerInfo } = useBookingStore.getState();
    const defaultData: Partial<PassengerFormData> = {
      title: "MR",
      acknowledge: false,
      email: "",
      phone: "", 
      firstName: "",
      lastName: "",
      specialRequests: "",
      dateOfBirth: "",
      nationality: "",
      idDocument: ""
    };
    
    // Safely merge passengerInfo and initial, ensuring title is properly typed
    if (passengerInfo) {
      Object.assign(defaultData, passengerInfo);
    }
    if (initial) {
      Object.assign(defaultData, initial);
    }
    
    return defaultData;
  };

  const {
    register,
    setValue,
    reset,
    watch,
    formState: {
      errors,
      isValid
    }
  } = useForm<PassengerFormData>({
    resolver: zodResolver(GuestSchema),
    mode: "onChange",
    defaultValues: getInitialData()
  });

  // Force uppercase for name fields as user types
  const handleUpper = (field: keyof PassengerFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(field, e.target.value.toUpperCase() as any, {
      shouldValidate: true
    });
  };
  const handleDemoFill = () => {
    // Production app - remove demo data functionality
    toast({
      title: "Demo data not available",
      description: "Please enter passenger information manually",
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

      const formData = autofillService.userDataToPersonalForm(userData);
      reset(formData);

      toast({
        title: "Passport information loaded",
        description: "Form filled with your passport details",
      });
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Could not load your passport information",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsAutofilling(false), 500);
    }
  };

  const all = watch();
  useEffect(() => {
    // Save form data to sessionStorage whenever it changes
    if (isValid && all && all.firstName && all.lastName && all.email && all.dateOfBirth) {
      const passengerInfo = {
        firstName: all.firstName,
        lastName: all.lastName,
        email: all.email,
        phone: all.phone || '',
        dateOfBirth: all.dateOfBirth,
        gender: 'M' as const, // Default gender
        title: all.title,
        nationality: all.nationality,
        specialRequests: all.specialRequests
      };
      useBookingStore.getState().setPassengerInfo(passengerInfo);
    }
    onChange?.(isValid ? all : null, isValid);
  }, [all, isValid, onChange]);
  
  return <Card className="travel-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">
              {bookingType === 'flight' ? 'Passenger Details' : 
               bookingType === 'activity' ? 'Participant Details' : 'Guest Details'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {bookingType === 'flight' ? 
                'Enter passenger information as it appears on your ID document. This information will be used for flight check-in and boarding.' :
               bookingType === 'activity' ?
                'Enter participant information as it appears on your ID document.' :
                'Enter guest information as it appears on your ID document. This information will be used for hotel check-in.'}
            </p>
          </div>
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
              Use My Passport
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <div>
            <Label className="mb-2 block">Title</Label>
            <Select value={all.title} onValueChange={v => setValue("title", v as PassengerFormData["title"], {
            shouldValidate: true
          })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Title" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                {(["MR", "MRS", "MS", "DR", "PROF"] as const).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">First / Given Name</Label>
              <Input {...register("firstName")} onChange={handleUpper("firstName")} placeholder="JANE" />
              {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Last / Surname</Label>
              <Input {...register("lastName")} onChange={handleUpper("lastName")} placeholder="DOE" />
              {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4">
          <div>
            <Label className="mb-2 block">Date of Birth</Label>
            <Input 
              type="date" 
              {...register("dateOfBirth")} 
              max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              placeholder="Select your birth date"
              className="text-sm"
            />
            {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">Must be 18+ years old</p>
          </div>
          
          <div>
            <Label className="mb-2 block">Nationality (ISO Code)</Label>
            <Input 
              {...register("nationality")} 
              placeholder="AU, US, UK, etc." 
              maxLength={3}
              onChange={e => setValue("nationality", e.target.value.toUpperCase() as any, {
                shouldValidate: true
              })} 
            />
            {errors.nationality && <p className="text-xs text-destructive mt-1">{errors.nationality.message}</p>}
          </div>
          
          <div>
            <Label className="mb-2 block">ID Document Number</Label>
            <Input 
              {...register("idDocument")} 
              placeholder="Passport/ID Number" 
              onChange={e => setValue("idDocument", e.target.value.toUpperCase() as any, {
                shouldValidate: true
              })} 
            />
            {errors.idDocument && <p className="text-xs text-destructive mt-1">{errors.idDocument.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">As shown on your passport or ID</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
          <div>
            <Label className="mb-2 block">Email</Label>
            <Input type="email" {...register("email")} placeholder="name@example.com" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label className="mb-2 block">Mobile</Label>
            <Input {...register("phone")} placeholder="+123456789" />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="mt-4">
          <Label className="mb-2 block">Special Requests (Optional)</Label>
          <Input {...register("specialRequests")} placeholder="e.g., Wheelchair accessibility, dietary requirements, seat preferences" />
          {errors.specialRequests && <p className="text-xs text-destructive mt-1">{errors.specialRequests.message}</p>}
        </div>

        <div className="mt-4">
          <div className="flex items-start gap-3">
            <Checkbox id="acknowledge" checked={!!all.acknowledge} onCheckedChange={v => setValue("acknowledge", Boolean(v) as any, {
            shouldValidate: true
          })} />
            <Label htmlFor="acknowledge" className="text-sm leading-5">
              I confirm the provided information is accurate and will be used for {
                bookingType === 'flight' ? 'flight check-in, boarding, and communication purposes.' :
                bookingType === 'activity' ? 'activity booking and communication purposes.' :
                'hotel check-in and communication purposes.'
              }
            </Label>
          </div>
          {errors.acknowledge && <p className="text-xs text-destructive mt-1">{errors.acknowledge.message}</p>}
        </div>
      </CardContent>
    </Card>;
};