
import { Session, User, WeakPassword } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email: string;
}

export interface AuthLoginResult {
  user: User | null;
  session: Session | null;
  weakPassword?: WeakPassword | null;
}

export interface AuthSignupResult {
  user: User | null;
  session: Session | null;
}

export interface AuthContextType {
  currentUser: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<AuthLoginResult>;
  signup: (email: string, password: string, username?: string) => Promise<AuthSignupResult>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
