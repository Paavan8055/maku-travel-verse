import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Github } from 'lucide-react';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  const { signUp, signInWithOAuth } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting signup process for email:', formData.email);
      const { data, error } = await signUp(
        formData.email, 
        formData.password,
        {
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      );

      console.log('Signup response:', { data, error });

      if (error) {
        // Handle specific error cases
        if (error.message?.includes('User already registered') || 
            error.message?.includes('already been registered') ||
            error.status === 422) {
          toast({
            title: "Account Already Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive"
          });
          
          // Auto-switch to login after a delay
          setTimeout(() => {
            onSwitchToLogin();
          }, 2000);
        } else {
          toast({
            title: "Sign Up Error",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        console.log('Signup successful, checking session...');
        // Check if user was immediately confirmed
        if (data?.user && data?.session) {
          console.log('User immediately confirmed with session');
          toast({
            title: "Welcome to Maku.travel!",
            description: "Account created successfully. Redirecting to dashboard..."
          });
        } else if (data?.user && !data?.session) {
          console.log('User created but needs email confirmation');
          toast({
            title: "Check Your Email",
            description: "Please check your email and click the confirmation link to complete your signup."
          });
        } else {
          console.log('Unexpected signup response');
          toast({
            title: "Account Created",
            description: "Your account has been created. Please try signing in."
          });
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'twitter') => {
    setLoading(true);
    
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        toast({
          title: "OAuth Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with OAuth",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center space-y-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Join Maku.travel
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Create your account to start your travel journey
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-11 transition-all duration-200 hover:scale-105"
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
          >
            <Mail className="w-4 h-4 mr-2" />
            Continue with Google
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-11 transition-all duration-200 hover:scale-105"
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
          >
            <Github className="w-4 h-4 mr-2" />
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <Separator className="my-4" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">
              Or create account with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="pl-10"
                  required
                  aria-label="First name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="pl-10"
                  required
                  aria-label="Last name"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10"
                required
                aria-label="Email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="pl-10"
                required
                minLength={6}
                aria-label="Password"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={onSwitchToLogin}
          >
            Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  );
};