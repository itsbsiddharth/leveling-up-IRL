
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const useAuthState = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateUserProfile = async (session: Session) => {
    try {
      // Fetch the user profile from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Even if there's an error fetching the profile, we can still set the basic user info
        setCurrentUser({
          id: session.user.id,
          username: session.user.email?.split('@')[0] || null,
          avatar_url: null,
          email: session.user.email || '',
        });
        return;
      }

      console.log('Profile fetched successfully:', profile);
      setCurrentUser({
        id: session.user.id,
        username: profile?.username || session.user.email?.split('@')[0] || null,
        avatar_url: profile?.avatar_url,
        email: session.user.email || '',
      });
    } catch (err) {
      console.error('Error in updateUserProfile:', err);
      // Set basic user info as fallback
      setCurrentUser({
        id: session.user.id,
        username: session.user.email?.split('@')[0] || null,
        avatar_url: null,
        email: session.user.email || '',
      });
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // Check for existing session on load
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting initial session:', sessionError);
          setError(sessionError.message);
          setIsLoading(false);
          return;
        }
        
        console.log("Initial session check:", initialSession?.user?.id);
        setSession(initialSession);
        
        if (initialSession) {
          await updateUserProfile(initialSession);
        } else {
          setCurrentUser(null);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error in initializeAuth:', err);
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.id);
      setSession(newSession);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsLoading(true);
        if (newSession) {
          await updateUserProfile(newSession);
        }
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    initializeAuth();

    // Cleanup the subscription
    return () => {
      console.log('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  return {
    currentUser,
    setCurrentUser,
    session,
    isLoading,
    error,
    setError,
  };
};
