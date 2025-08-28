import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building, Plane, MapPin, Clock, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const PartnerAuth = () => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState<'hotel' | 'airline' | 'activity_provider' | ''>('');
  const [onboardingChoice, setOnboardingChoice] = useState<'trial' | 'immediate' | ''>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    contactPerson: '',
    phone: ''
  });

  const businessTypes = [
    {
      type: 'hotel' as const,
      title: 'Hotel Partner',
      icon: Building,
      description: 'Manage hotels, resorts, and accommodations',
      fee: 333,
      features: ['Property management', 'Room inventory', 'Rate calendar', 'Guest management']
    },
    {
      type: 'airline' as const,
      title: 'Airline Partner', 
      icon: Plane,
      description: 'Manage flight routes and airline services',
      fee: 9999,
      features: ['Fleet management', 'Route planning', 'Schedule management', 'Safety compliance']
    },
    {
      type: 'activity_provider' as const,
      title: 'Activity Partner',
      icon: MapPin,
      description: 'Manage tours, activities, and experiences',
      fee: 333,
      features: ['Tour management', 'Time slots', 'Equipment tracking', 'Guide assignment']
    }
  ];

  const selectedType = businessTypes.find(bt => bt.type === selectedBusinessType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessType || !onboardingChoice) {
      toast({
        title: "Missing Information",
        description: "Please select business type and onboarding option.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // First create the user account
      const { error } = await signUp(formData.email, formData.password, {
        business_name: formData.businessName,
        business_type: selectedBusinessType,
        contact_person: formData.contactPerson,
        phone: formData.phone,
        onboarding_choice: onboardingChoice
      });

      if (error) {
        toast({
          title: "Registration Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Get the created user for partner profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = session.user;
        // Create partner profile
        const { error: profileError } = await supabase
          .from('partner_profiles')
          .insert({
            user_id: user.id,
            business_name: formData.businessName,
            business_type: selectedBusinessType as 'hotel' | 'airline' | 'activity_provider',
            contact_person: formData.contactPerson,
            phone: formData.phone,
            onboarding_choice: onboardingChoice,
            verification_status: 'pending',
            trial_status: onboardingChoice === 'trial' ? 'pending' : 'none',
            payment_status: 'unpaid'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Initiate payment flow
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-partner-checkout', {
          body: {
            business_type: selectedBusinessType,
            onboarding_choice: onboardingChoice,
            user_id: user.id
          }
        });

        if (paymentError) {
          throw new Error(paymentError.message);
        }

        // Handle the payment flow based on response
        if (paymentData.type === 'setup_intent') {
          // For trial - redirect to setup intent confirmation
          window.location.href = `/payment-setup?client_secret=${paymentData.client_secret}&type=trial&redirect_to=/partner-dashboard`;
        } else if (paymentData.type === 'payment_intent') {
          // For immediate payment - redirect to payment confirmation
          window.location.href = `/payment-setup?client_secret=${paymentData.client_secret}&type=immediate&redirect_to=/partner-dashboard`;
        }
        
        return; // Exit early since we're redirecting
      }

      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account."
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-['Playfair_Display'] mb-2">
            Partner <span className="hero-text">Registration</span>
          </h1>
          <p className="text-muted-foreground">
            Join the Maku.travel platform and grow your business
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Create Your Partner Account</CardTitle>
            <CardDescription>
              Choose your business type and get started with flexible onboarding options
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Business Type Selection */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Select Your Business Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {businessTypes.map((type) => (
                    <Card 
                      key={type.type}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedBusinessType === type.type ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedBusinessType(type.type)}
                    >
                      <CardContent className="p-6 text-center">
                        <type.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <h3 className="font-semibold mb-2">{type.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                        <Badge variant="secondary" className="mb-4">
                          A${type.fee} onboarding fee
                        </Badge>
                        <div className="space-y-1">
                          {type.features.map((feature, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground">{feature}</p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Onboarding Choice */}
              {selectedBusinessType && (
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Choose Your Onboarding Option</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        onboardingChoice === 'trial' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setOnboardingChoice('trial')}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <Clock className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-semibold">7-Day Trial</h3>
                            <p className="text-sm text-muted-foreground">Start free, pay later</p>
                          </div>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li>• Access dashboard features immediately</li>
                          <li>• Payment secured for auto-charge after trial</li>
                          <li>• Limited booking functionality during trial</li>
                          <li>• Cancel anytime within 7 days</li>
                        </ul>
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium">
                            Fee: A${selectedType?.fee} (charged after trial)
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        onboardingChoice === 'immediate' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setOnboardingChoice('immediate')}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <CreditCard className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-semibold">Skip Trial, Pay Now</h3>
                            <p className="text-sm text-muted-foreground">Full access immediately</p>
                          </div>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li>• Immediate full platform access</li>
                          <li>• Accept bookings right away</li>
                          <li>• All dashboard features unlocked</li>
                          <li>• Priority verification processing</li>
                        </ul>
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium">
                            Fee: A${selectedType?.fee} (one-time payment)
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Registration Form */}
              {onboardingChoice && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                        placeholder="Your Business Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        placeholder="Full Name"
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+61 XXX XXX XXX"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Your information is secure and will be used only for partner onboarding and verification.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : 
                     onboardingChoice === 'trial' ? "Start 7-Day Trial" : 
                     `Pay A${selectedType?.fee} & Get Started`}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerAuth;