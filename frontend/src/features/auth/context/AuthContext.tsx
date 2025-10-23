import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import logger from "@/utils/logger";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  checkingAdmin: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithOAuth: (provider: 'google' | 'github' | 'twitter') => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check admin status when user changes
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
      }
    );

    // THEN check for existing session with robust error handling
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (e) {
        logger.error('Auth init error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    // Function to check admin status
    const checkAdminStatus = async (userId: string) => {
      if (!userId) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      setCheckingAdmin(true);
      try {
        const { data, error } = await supabase.rpc('is_admin', { 
          user_id_param: userId 
        });
        
        if (error) {
          // Gracefully handle missing RPC function
          console.warn('Admin check skipped (RPC not available):', error.message);
          setIsAdmin(false);
        } else {
          setIsAdmin(data || false);
        }
      } catch (err: any) {
        // Prevent infinite loops from admin check errors
        console.warn('Admin check failed gracefully:', err?.message);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };
      } finally {
        setCheckingAdmin(false);
      }
    };

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });
      
      console.log('AuthContext: Signup response:', { 
        user: data?.user?.id, 
        session: !!data?.session, 
        error: error?.message 
      });
      
      return { data, error };
    } catch (err) {
      logger.error('AuthContext: Signup error:', err);
      return { data: null, error: err as any };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithOAuth = async (provider: 'google' | 'github' | 'twitter') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    checkingAdmin,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
  };

  console.log('AuthContext: Providing value:', { user: !!user, session: !!session, loading });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};