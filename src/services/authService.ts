
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthLoginResult, AuthSignupResult } from '@/types/auth';

export const authService = {
  login: async (email: string, password: string): Promise<AuthLoginResult> => {
    console.log("Attempting to login with:", email);
    
    try {
      // For development simplicity
      if (email === 'dev@example.com' && password === 'devpass123') {
        console.log("DEV MODE: Using development bypass");
        // Create a mock session for development
        return {
          user: {
            id: 'dev-user-id',
            email: 'dev@example.com',
            user_metadata: { name: 'Developer' }
          },
          session: {
            access_token: 'dev-token',
            refresh_token: 'dev-refresh',
            expires_at: Date.now() + 3600000,
            expires_in: 3600,
            token_type: 'bearer',
            user: { id: 'dev-user-id', email: 'dev@example.com' }
          }
        };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error("Login error:", error);
        toast.error('Login failed', { description: error.message });
        throw error;
      }
      
      console.log("Login successful:", data.user?.id);
      toast.success('Successfully logged in!');
      return data;
    } catch (err) {
      console.error("Login exception:", err);
      throw err;
    }
  },

  signup: async (email: string, password: string, username?: string): Promise<AuthSignupResult> => {
    console.log("Attempting to signup with:", email, username);
    
    try {
      // For development simplicity
      if (email === 'dev@example.com') {
        console.log("DEV MODE: Creating development account");
        // Create a mock session for development
        return {
          user: {
            id: 'dev-user-id',
            email: 'dev@example.com',
            user_metadata: { name: username || 'Developer' }
          },
          session: {
            access_token: 'dev-token',
            refresh_token: 'dev-refresh',
            expires_at: Date.now() + 3600000,
            expires_in: 3600,
            token_type: 'bearer',
            user: { id: 'dev-user-id', email: 'dev@example.com' }
          }
        };
      }
      
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
        toast.error('Signup failed', { description: error.message });
        throw error;
      }
      
      console.log("Signup response:", data);
      
      if (data.user) {
        toast.success('Successfully signed up!', { 
          description: 'You can now log in with your credentials.'
        });
      } else {
        // Handle email confirmation case
        toast.success('Signup successful!', { 
          description: 'Please check your email for confirmation.'
        });
      }
      return data;
    } catch (err) {
      console.error("Signup exception:", err);
      throw err;
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast.error('Logout failed', { description: error.message });
        throw error;
      }
      toast.success('Successfully logged out');
    } catch (err) {
      console.error("Logout exception:", err);
      throw err;
    }
  }
};
