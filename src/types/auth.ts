
import { Session, User, WeakPassword } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email: string;
}

// Expanded to include the dev mode response shape
export interface AuthLoginResult {
  user: User | null | {
    id: string;
    email: string;
    user_metadata: {
      name: string;
    };
  };
  session: Session | null | {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
    token_type: string;
    user: {
      id: string;
      email: string;
    };
  };
  weakPassword?: WeakPassword | null;
}

// Expanded to include the dev mode response shape
export interface AuthSignupResult {
  user: User | null | {
    id: string;
    email: string;
    user_metadata: {
      name: string;
    };
  };
  session: Session | null | {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
    token_type: string;
    user: {
      id: string;
      email: string;
    };
  };
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
