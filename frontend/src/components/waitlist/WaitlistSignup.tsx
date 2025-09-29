import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Mail, Users, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WaitlistSignupProps {
  variant?: 'hero' | 'card' | 'compact';
  showStats?: boolean;
}

export const WaitlistSignup: React.FC<WaitlistSignupProps> = ({ 
  variant = 'card', 
  showStats = false 
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/api/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          full_name: fullName || undefined,
          referral_code: referralCode || undefined,
          marketing_consent: marketingConsent,
          source: 'website'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        toast({
          title: "Welcome to Maku.Travel!",
          description: "You've been added to our waitlist. We'll notify you when access is available!",
          duration: 5000,
        });
      } else {
        throw new Error(data.error || 'Failed to join waitlist');
      }
    } catch (error: any) {
      console.error('Waitlist signup error:', error);
      
      if (error.message.includes('already registered')) {
        toast({
          title: "Already Registered",
          description: "This email is already on our waitlist!",
          variant: "default"
        });
      } else {
        toast({
          title: "Signup Failed",
          description: "There was an error joining the waitlist. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === 'hero') {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Join the Future of Travel
          </h2>
          <p className="text-gray-600">
            Be the first to experience AI-powered travel planning with blockchain rewards
          </p>
        </div>
        
        {isSuccess ? (
          <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              You're on the list!
            </h3>
            <p className="text-green-600">
              We'll notify you when Maku.Travel is ready for you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-center text-lg py-3"
            />
            
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="text-center"
            />
            
            <Input
              type="text"
              placeholder="Referral code (optional)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="text-center"
            />
            
            <div className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                id="marketing-consent"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="marketing-consent" className="text-gray-600">
                Send me updates about new features and travel deals
              </label>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white py-3 text-lg"
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </form>
        )}
        
        {showStats && (
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-500">1.2K+</div>
              <div className="text-sm text-gray-600">Early Access</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">50+</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">AI</div>
              <div className="text-sm text-gray-600">Powered</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex space-x-2">
        {isSuccess ? (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">You're on the list!</span>
          </div>
        ) : (
          <>
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? '...' : 'Join'}
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Mail className="w-5 h-5 text-orange-500" />
          <span>Join Maku.Travel Waitlist</span>
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Get early access to AI-powered travel planning with blockchain rewards
        </p>
      </CardHeader>
      
      <CardContent>
        {isSuccess ? (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800">Welcome aboard!</h3>
            <p className="text-green-600 text-sm">
              We'll keep you updated on our progress.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              type="text"
              placeholder="Full name (optional)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            
            <Input
              type="text"
              placeholder="Referral code (optional)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
            
            <div className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                id="marketing"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="marketing" className="text-gray-600">
                Send me travel updates and deals
              </label>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600"
            >
              {isSubmitting ? 'Adding to waitlist...' : 'Join Waitlist'}
            </Button>
          </form>
        )}
        
        {showStats && !isSuccess && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>1,200+ joined</span>
              </div>
              <div className="flex items-center space-x-1">
                <Gift className="w-3 h-3" />
                <span>Early bird rewards</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WaitlistSignup;