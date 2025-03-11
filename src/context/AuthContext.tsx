
import React, { createContext, useContext, useState } from 'react';
import { authService } from '@/services/authService';
import { useAuthState } from '@/hooks/useAuthState';
import { AuthContextType } from '@/types/auth';
import { toast } from 'sonner';

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
  const { 
    currentUser, 
    setCurrentUser,
    session, 
    isLoading, 
    error, 
    setError 
  } = useAuthState();

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await authService.login(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      toast.error('Failed to login', {
        description: err.message
      });
      throw err;
    }
  };

  const signup = async (email: string, password: string, username?: string) => {
    setError(null);
    try {
      await authService.signup(email, password, username);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message);
      toast.error('Failed to sign up', {
        description: err.message
      });
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err: any) {
      console.error('Logout error:', err);
      toast.error('Failed to log out', {
        description: err.message
      });
      throw err;
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
