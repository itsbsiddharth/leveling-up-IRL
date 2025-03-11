
import { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email: string;
}

export interface AuthContextType {
  currentUser: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
