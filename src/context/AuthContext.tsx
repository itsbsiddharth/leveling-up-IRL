import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth, storage } from '../firebase';
import { 
  signInWithGoogle, 
  sendSignInLink, 
  completeSignInWithEmailLink, 
  signOutUser 
} from '../googleAuth';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { syncUserData, getUserData, updateLeaderboardEntry } from '../firebase/userService';

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
  updateProfilePicture: (file: File) => { promise: Promise<string>, cancel: () => void };
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
  updateProfilePicture: () => ({ promise: Promise.resolve(''), cancel: () => {} }),
  isLoading: false,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUploadTask, setActiveUploadTask] = useState<UploadTask | null>(null);

  useEffect(() => {
    // Set up Firebase auth state observer
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      
      try {
        if (user) {
          // Map Firebase user to our User interface
          setFirebaseUser(user);
          setCurrentUser({
            id: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });
          
          console.log('User authenticated:', user.uid, user.displayName);
          
          // Sync user data with Firestore
          const syncedData = await syncUserData({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });
          
          console.log('User data synced with Firestore');
          
          // Force an update to the leaderboard entry to ensure the user appears
          try {
            // Get the full user data
            const userData = await getUserData();
            if (userData) {
              console.log('Ensuring user appears in leaderboard...');
              await updateLeaderboardEntry(userData);
              console.log('User added to leaderboard successfully');
            } else {
              console.warn('Could not get user data for leaderboard sync');
            }
          } catch (leaderboardError) {
            console.error('Error adding user to leaderboard:', leaderboardError);
            // Don't throw the error to avoid blocking the auth flow
          }
        } else {
          setCurrentUser(null);
          setFirebaseUser(null);
        }
      } catch (err) {
        console.error("Error during auth state change:", err);
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        setIsLoading(false);
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
    setError(null);
    setIsLoading(true);
    
    try {
      // Get email from localStorage if not provided
      const emailForSignIn = email || localStorage.getItem('emailForSignIn');
      
      if (!emailForSignIn) {
        throw new Error('No email found for sign-in');
      }
      
      await completeSignInWithEmailLink(emailForSignIn);
      
      // Clear email from storage
      localStorage.removeItem('emailForSignIn');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete sign-in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      await signOutUser();
      // The auth state observer will update the currentUser
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUsername = async (newName: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      if (!firebaseUser) {
        throw new Error('No user is signed in');
      }
      
      await updateProfile(firebaseUser, { displayName: newName });
      
      // Update the current user state
      setCurrentUser(prev => prev ? { ...prev, name: newName } : null);
      
      // Sync with Firestore
      await syncUserData({ displayName: newName });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update username');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfilePicture = (file: File) => {
    // Cancel any existing upload
    if (activeUploadTask) {
      activeUploadTask.cancel();
      setActiveUploadTask(null);
    }
    
    setError(null);
    
    // Create a promise that can be awaited
    const uploadPromise = new Promise<string>((resolve, reject) => {
      if (!firebaseUser) {
        reject(new Error('No user is signed in'));
        return;
      }
      
      // Create a reference to the user's profile picture in Firebase Storage with timestamp for uniqueness
      const timestamp = new Date().getTime();
      const storageRef = ref(storage, `profile-pictures/${firebaseUser.uid}_${timestamp}`);
      
      // Add metadata to the file
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploadedBy': firebaseUser.uid,
          'uploadedAt': new Date().toISOString()
        }
      };
      
      // Create the upload task
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      setActiveUploadTask(uploadTask);
      
      // Listen for state changes
      uploadTask.on('state_changed', 
        // Progress observer
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
        // Error observer
        (error) => {
          console.error('Error in profile picture upload:', error);
          setError(error.message || 'Failed to upload profile picture');
          reject(error);
        },
        // Completion observer
        async () => {
          try {
            // Get the download URL
            const photoURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update the user's profile in Firebase Auth
            await updateProfile(firebaseUser, { photoURL });
            
            // Update the current user state
            setCurrentUser(prev => prev ? { ...prev, photoURL } : null);
            
            // Sync with Firestore
            await syncUserData({ photoURL });
            
            // Add cache-busting parameter to URL
            const cacheBustedURL = `${photoURL}?t=${Date.now()}`;
            
            // Clear the active upload task
            setActiveUploadTask(null);
            
            // Resolve the promise with the URL
            resolve(cacheBustedURL);
          } catch (error) {
            console.error('Error finalizing profile picture update:', error);
            setError(error instanceof Error ? error.message : 'Failed to update profile picture');
            reject(error);
          }
        }
      );
    });
    
    // Return both the promise and a cancel function
    return {
      promise: uploadPromise,
      cancel: () => {
        if (activeUploadTask) {
          activeUploadTask.cancel();
          setActiveUploadTask(null);
        }
      }
    };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        signInWithGoogleAuth,
        sendPasswordlessEmail,
        completePasswordlessSignIn,
        logout,
        updateUsername,
        updateProfilePicture,
        isLoading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
