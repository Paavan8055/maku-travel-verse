import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Calendar, Target, Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { travelFundClient } from '@/lib/travelFundClient';
import { useToast } from '@/hooks/use-toast';

interface FundDetails {
  id: string;
  name: string;
  description?: string;
  balance: number;
  target_amount?: number;
  currency: string;
  destination?: string;
  deadline?: string;
  fund_type: string;
}

const JoinFundPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [fundDetails, setFundDetails] = useState<FundDetails | null>(null);
  const [error, setError] = useState<string>('');

  const fundCode = searchParams.get('code');

  useEffect(() => {
    const fetchFundDetails = async () => {
      if (!fundCode) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        // Get fund details by code (preview mode - no joining required)
        const { data, error } = await travelFundClient.joinFundByCode(fundCode);
        
        if (error) {
          setError('Fund not found or invitation expired');
        } else {
          setFundDetails(data);
        }
      } catch (err) {
        setError('Unable to load fund details');
      } finally {
        setLoading(false);
      }
    };

    fetchFundDetails();
  }, [fundCode]);

  const handleJoinFund = async () => {
    if (!user) {
      // Redirect to auth with return path
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    if (!fundCode) return;

    setJoining(true);
    try {
      const { data, error } = await travelFundClient.joinFundByCode(fundCode);
      
      if (error) {
        toast({
          title: "Unable to join fund",
          description: error.message || "Please check the invitation and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Successfully joined fund!",
          description: `Welcome to "${data?.name}". You can now contribute and use the shared balance.`,
          variant: "default"
        });
        navigate('/travel-fund');
      }
    } catch (err) {
      toast({
        title: "Error joining fund",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !fundDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <p className="text-destructive mb-4">{error || 'Fund not found'}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = fundDetails.target_amount 
    ? Math.round((fundDetails.balance / fundDetails.target_amount) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-6">
          <Badge variant="secondary" className="mb-2 mx-auto w-fit">
            Travel Fund Invitation
          </Badge>
          <CardTitle className="text-3xl font-bold">{fundDetails.name}</CardTitle>
          {fundDetails.description && (
            <p className="text-muted-foreground mt-2">{fundDetails.description}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Fund Progress */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              ${fundDetails.balance.toLocaleString()} {fundDetails.currency}
            </div>
            {fundDetails.target_amount && (
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {progressPercentage}% of ${fundDetails.target_amount.toLocaleString()} goal
                </p>
              </div>
            )}
          </div>

          {/* Fund Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fundDetails.destination && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Destination: {fundDetails.destination}</span>
              </div>
            )}
            {fundDetails.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Deadline: {new Date(fundDetails.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
            {fundDetails.target_amount && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Target: ${fundDetails.target_amount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Type: {fundDetails.fund_type} fund</span>
            </div>
          </div>

          {/* Marketing Copy */}
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Join this travel fund to save money together for your dream trip!
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by MAKU.Travel - Making group travel savings simple and secure
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleJoinFund}
              className="flex-1"
              disabled={joining}
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {user ? 'Joining Fund...' : 'Redirecting...'}
                </>
              ) : (
                user ? 'Join This Fund' : 'Sign Up & Join Fund'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="px-6"
            >
              Learn More
            </Button>
          </div>

          {!user && (
            <p className="text-xs text-center text-muted-foreground">
              Already have an account? You'll be redirected to sign in.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinFundPage;