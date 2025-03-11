
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';
import { toast } from 'sonner';

export const useAuthState = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.id);
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
      console.log("Initial session check:", initialSession?.user?.id);
      
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

  return {
    currentUser,
    setCurrentUser,
    session,
    isLoading,
    error,
    setError,
  };
};
