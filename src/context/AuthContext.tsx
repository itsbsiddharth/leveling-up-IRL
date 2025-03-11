
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  session: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  isLoading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setIsLoading(true);

      if (newSession) {
        try {
          // Fetch the user profile from the profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();

          if (profileError) throw profileError;

          setCurrentUser({
            id: newSession.user.id,
            username: profile?.username || newSession.user.email?.split('@')[0] || null,
            avatar_url: profile?.avatar_url,
            email: newSession.user.email || '',
          });
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // Even if there's an error fetching the profile, we can still set the basic user info
          setCurrentUser({
            id: newSession.user.id,
            username: newSession.user.email?.split('@')[0] || null,
            avatar_url: null,
            email: newSession.user.email || '',
          });
        }
      } else {
        setCurrentUser(null);
      }
      
      setIsLoading(false);
    });

    // Check for existing session on load
    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        try {
          // Fetch the user profile from the profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();

          if (profileError) throw profileError;

          setCurrentUser({
            id: initialSession.user.id,
            username: profile?.username || initialSession.user.email?.split('@')[0] || null,
            avatar_url: profile?.avatar_url,
            email: initialSession.user.email || '',
          });
        } catch (err) {
          console.error('Error fetching initial user profile:', err);
          // Even if there's an error fetching the profile, we can still set the basic user info
          setCurrentUser({
            id: initialSession.user.id,
            username: initialSession.user.email?.split('@')[0] || null,
            avatar_url: null,
            email: initialSession.user.email || '',
          });
        }
      }
      
      setSession(initialSession);
      setIsLoading(false);
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      // Only show success message if there was no error
      if (data.session) {
        toast.success('Successfully logged in!');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      toast.error('Failed to login', {
        description: err.message
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, username?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: username || email.split('@')[0]
          }
        }
      });
      
      if (error) throw error;
      
      // Only show success message if there was no error
      if (data.user) {
        toast.success('Successfully signed up!', { 
          description: 'You can now log in with your credentials.'
        });
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message);
      toast.error('Failed to sign up', {
        description: err.message
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Successfully logged out');
    } catch (err: any) {
      console.error('Logout error:', err);
      toast.error('Failed to log out', {
        description: err.message
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      session,
      login, 
      signup,
      logout, 
      isLoading, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
