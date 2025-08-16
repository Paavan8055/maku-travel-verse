import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Mail, Lock } from 'lucide-react';

interface AdminLoginFormProps {
  onSwitchToRegular: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onSwitchToRegular }) => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        toast({
          title: "Admin Sign In Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Check if user is admin after successful login using secure function
      const { data: isAdmin } = await supabase.rpc('get_admin_status');

      if (!isAdmin) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin dashboard."
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
    <Card className="w-full max-w-md mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Admin Access
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to the administrative dashboard
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@maku.travel"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10"
                required
                aria-label="Admin email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="pl-10"
                required
                aria-label="Password"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Access Admin Dashboard"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Not an admin? </span>
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={onSwitchToRegular}
          >
            Regular sign in
          </button>
        </div>
      </CardContent>
    </Card>
  );
};