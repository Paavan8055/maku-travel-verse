import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

const Auth = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Set initial signup state based on URL parameter
  const [isSignUp, setIsSignUp] = useState(() => searchParams.get('tab') === 'signup');

  // Get the intended destination after login
  const from = location.state?.from?.pathname || '/';

  // Handle form switching with URL parameter updates
  const handleSwitchToSignUp = () => {
    setIsSignUp(true);
    setSearchParams({ tab: 'signup' });
  };

  const handleSwitchToLogin = () => {
    setIsSignUp(false);
    setSearchParams({});
  };

  // Redirect authenticated users to their intended destination
  useEffect(() => {
    if (user && !loading) {
      // Check if coming from roadmap or should go to dashboard
      const destination = from === '/roadmap' || from === '/' ? '/dashboard' : from;
      // Small delay to allow auth state to fully settle
      const timer = setTimeout(() => {
        window.location.href = destination;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, from]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    const destination = from === '/roadmap' || from === '/' ? '/dashboard' : from;
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {isSignUp ? (
          <SignUpForm onSwitchToLogin={handleSwitchToLogin} />
        ) : (
          <LoginForm onSwitchToSignUp={handleSwitchToSignUp} />
        )}
      </div>
    </div>
  );
};

export default Auth;