import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  signInWithGoogle, 
  sendSignInLink, 
  completeSignInWithEmailLink, 
  signOutUser 
} from '../googleAuth';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  signInWithGoogleAuth: () => Promise<void>;
  sendPasswordlessEmail: (email: string) => Promise<void>;
  completePasswordlessSignIn: (email?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUsername: (newName: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  firebaseUser: null,
  signInWithGoogleAuth: async () => {},
  sendPasswordlessEmail: async () => {},
  completePasswordlessSignIn: async () => {},
  logout: async () => {},
  updateUsername: async () => {},
  isLoading: false,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up Firebase auth state observer
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoading(false);
      
      if (user) {
        // Map Firebase user to our User interface
        setFirebaseUser(user);
        setCurrentUser({
          id: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
        setFirebaseUser(null);
      }
    });

    // Check if the current URL contains a sign-in link
    if (window.location.href.includes('apiKey=')) {
      completePasswordlessSignIn();
    }

    // Clean up the observer on unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      // The auth state observer will update the currentUser
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordlessEmail = async (email: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await sendSignInLink(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send sign-in link');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completePasswordlessSignIn = async (email?: string) => {
    if (!email && !window.location.href.includes('apiKey=')) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      await completeSignInWithEmailLink(email);
      // The auth state observer will update the currentUser
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete sign-in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    
    try {
      await signOutUser();
      // The auth state observer will update the currentUser
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
      throw err;
    }
  };

  const updateUsername = async (newName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!firebaseUser) {
        throw new Error('No user is signed in');
      }
      
      await updateProfile(firebaseUser, { displayName: newName });
      
      // Update the current user state
      setCurrentUser(prev => prev ? { ...prev, name: newName } : null);
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update username';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      firebaseUser,
      signInWithGoogleAuth, 
      sendPasswordlessEmail, 
      completePasswordlessSignIn, 
      logout, 
      updateUsername,
      isLoading, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
