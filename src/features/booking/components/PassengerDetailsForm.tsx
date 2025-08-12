import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Schema reflecting common airline/APIS requirements
const PassengerSchema = z.object({
  title: z.enum(["MR", "MRS", "MS", "MSTR", "MISS"], {
    required_error: "Title is required",
  }),
  firstName: z
    .string()
    .min(1, "First name is required")
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z '-]+$/.test(v), {
      message: "Use letters A-Z only; no accents or special characters",
    }),
  middleName: z
    .string()
    .optional()
    .transform((v) => (v ? v.toUpperCase() : v))
    .refine((v) => (v ? /^[A-Z '-]+$/.test(v) : true), {
      message: "Use letters A-Z only",
    }),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z '-]+$/.test(v), {
      message: "Use letters A-Z only; no accents or special characters",
    }),
  gender: z.enum(["M", "F", "U"]).optional(),
  dateOfBirth: z.string().refine((v) => !!Date.parse(v) && new Date(v) < new Date(), {
    message: "Enter a valid past date",
  }),
  nationality: z
    .string()
    .min(2, "2-3 letter code")
    .max(3, "2-3 letter code")
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z]{2,3}$/.test(v), { message: "Use 2-3 letter ISO code" }),
  passportNumber: z
    .string()
    .min(5)
    .max(15)
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9]+$/.test(v), { message: "Alphanumeric only" }),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/i, "Use international format, e.g., +15551234567"),
  acknowledge: z.boolean().refine((v) => v === true, {
    message: "You must confirm before continuing",
  }),
});

export type PassengerFormData = z.infer<typeof PassengerSchema>;

interface PassengerDetailsFormProps {
  onChange?: (data: PassengerFormData | null, isValid: boolean) => void;
  initial?: Partial<PassengerFormData>;
}

export const PassengerDetailsForm: React.FC<PassengerDetailsFormProps> = ({ onChange, initial }) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<PassengerFormData>({
    resolver: zodResolver(PassengerSchema),
    mode: "onChange",
      defaultValues: {
        title: "MR",
        
        acknowledge: false,
        ...initial,
      },
  });

  // Force uppercase for name fields as user types
  const handleUpper = (field: keyof PassengerFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(field, e.target.value.toUpperCase() as any, { shouldValidate: true });
  };

  const all = watch();
  useEffect(() => {
    onChange?.(isValid ? all : null, isValid);
  }, [all, isValid, onChange]);

  return (
    <Card className="travel-card">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Passenger Details (as per passport)</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Enter names exactly as on the passport. Use A–Z only (no accents). Passport must have 6+ months validity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <div>
            <Label className="mb-2 block">Title</Label>
            <Select value={all.title} onValueChange={(v) => setValue("title", v as PassengerFormData["title"], { shouldValidate: true })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Title" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                {(["MR","MRS","MS","MSTR","MISS"] as const).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">First / Given Name</Label>
              <Input {...register("firstName")} onChange={handleUpper("firstName")} placeholder="JANE" />
              {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Middle Name (optional)</Label>
              <Input {...register("middleName")} onChange={handleUpper("middleName")} placeholder="ANN" />
              {errors.middleName && <p className="text-xs text-destructive mt-1">{errors.middleName.message}</p>}
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
            <Input type="date" {...register("dateOfBirth")} />
            {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth.message}</p>}
          </div>
          <div>
            <Label className="mb-2 block">Gender (optional)</Label>
            <Select value={all.gender} onValueChange={(v) => setValue("gender", v as PassengerFormData["gender"], { shouldValidate: true })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="U">Unspecified</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-xs text-destructive mt-1">{errors.gender.message}</p>}
          </div>
          <div>
            <Label className="mb-2 block">Nationality</Label>
            <Input {...register("nationality")} placeholder="AUS / IND" onChange={(e)=>setValue("nationality", e.target.value.toUpperCase() as any, { shouldValidate: true })} />
            {errors.nationality && <p className="text-xs text-destructive mt-1">{errors.nationality.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4">
          <div>
            <Label className="mb-2 block">Passport Number</Label>
            <Input {...register("passportNumber")} placeholder="X1234567" onChange={(e)=>setValue("passportNumber", e.target.value.toUpperCase() as any, { shouldValidate: true })} />
            {errors.passportNumber && <p className="text-xs text-destructive mt-1">{errors.passportNumber.message}</p>}
          </div>
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
          <div className="flex items-start gap-3">
            <Checkbox
              id="acknowledge"
              checked={!!all.acknowledge}
              onCheckedChange={(v) =>
                setValue("acknowledge", Boolean(v) as any, { shouldValidate: true })
              }
            />
            <Label htmlFor="acknowledge" className="text-sm leading-5">
              I confirm the provided information is accurate and may be shared with airlines and border authorities for APIS/secure flight screening.
            </Label>
          </div>
          {errors.acknowledge && (
            <p className="text-xs text-destructive mt-1">{errors.acknowledge.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
