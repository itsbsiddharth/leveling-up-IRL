// Firebase Authentication Providers
import { 
  signInWithPopup,
  signInWithEmailLink,
  isSignInWithEmailLink,
  signOut
} from 'firebase/auth';
import { 
  auth, 
  googleProvider, 
  sendSignInLinkToEmail 
} from './firebase';

// Google Sign In function
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Email Passwordless Sign In

// Send sign-in link to email
export const sendSignInLink = async (email) => {
  try {
    // Store the email locally so you don't need to ask the user for it again
    // if they open the link on the same device
    window.localStorage.setItem('emailForSignIn', email);
    
    // Configure sign-in options
    const actionCodeSettings = {
      // URL you want to redirect back to after sign-in
      url: window.location.origin,
      // This must be true
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    return true;
  } catch (error) {
    console.error("Error sending sign-in link to email:", error);
    throw error;
  }
};

// Complete sign-in with email link
export const completeSignInWithEmailLink = async (email = null) => {
  try {
    // Confirm the link is a sign-in with email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Get the email if not provided
      email = email || window.localStorage.getItem('emailForSignIn');
      
      if (!email) {
        // If missing email, prompt user for it
        throw new Error("Email is required to complete sign-in");
      }
      
      // Sign in user
      const result = await signInWithEmailLink(auth, email, window.location.href);
      
      // Clear email from storage
      window.localStorage.removeItem('emailForSignIn');
      
      return result.user;
    } else {
      return null; // Not a sign-in link
    }
  } catch (error) {
    console.error("Error completing sign-in with email link:", error);
    throw error;
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
