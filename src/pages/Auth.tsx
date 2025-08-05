import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Navigate, useLocation } from 'react-router-dom';

const Auth = () => {
  const { user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const location = useLocation();

  // Get the intended destination after login
  const from = location.state?.from?.pathname || '/';

  // Redirect authenticated users to their intended destination
  useEffect(() => {
    if (user && !loading) {
      // Small delay to allow auth state to fully settle
      const timer = setTimeout(() => {
        window.location.href = from;
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
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {isSignUp ? (
          <SignUpForm onSwitchToLogin={() => setIsSignUp(false)} />
        ) : (
          <LoginForm onSwitchToSignUp={() => setIsSignUp(true)} />
        )}
      </div>
    </div>
  );
};

export default Auth;