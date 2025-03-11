
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const authService = {
  login: async (email: string, password: string) => {
    console.log("Attempting to login with:", email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
    if (error) {
      console.error("Login error:", error);
      throw error;
    }
      
    console.log("Login successful:", data.user?.id);
    toast.success('Successfully logged in!');
    return data;
  },

  signup: async (email: string, password: string, username?: string) => {
    console.log("Attempting to signup with:", email, username);
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: username || email.split('@')[0]
        }
      }
    });
      
    if (error) {
      console.error("Signup error:", error);
      throw error;
    }
      
    console.log("Signup response:", data);
      
    if (data.user) {
      toast.success('Successfully signed up!', { 
        description: 'You can now log in with your credentials.'
      });
    }
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    toast.success('Successfully logged out');
  }
};
