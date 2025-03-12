
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Save, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AuthForm = () => {
  const { login, signup, isLoading: authLoading } = useAuth();
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Form submission:", isSigningUp ? "signup" : "login", email, password);
      
      if (isSigningUp) {
        // During development, simplify signup and show more details
        const result = await signup(email, password, name || email.split('@')[0]);
        console.log("Signup result (detailed):", result);
        
        if (result.user) {
          toast.success('Account created successfully!', {
            description: `Welcome ${result.user.email || 'new user'}!`
          });
        }
      } else {
        // During development, simplify login and show more details
        const result = await login(email, password);
        console.log("Login result (detailed):", result);
        
        if (result.user) {
          toast.success('Logged in successfully!', {
            description: `Welcome back ${result.user.email || 'user'}!`
          });
        }
      }
      
      // Clear form fields on success
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      console.error('Authentication error (detailed):', err);
      setError(err.message || 'An error occurred during authentication');
      
      // Show more detailed toast errors during development
      toast.error(isSigningUp ? 'Signup failed' : 'Login failed', {
        description: `Error: ${err.message}. Check console for details.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSigningUp(!isSigningUp);
    setError(null);
  };

  // For development, add some test credentials
  const fillTestCredentials = () => {
    setEmail('test@example.com');
    setPassword('password123');
    if (isSigningUp) {
      setName('TestUser');
    }
  };

  return (
    <div className="cyber-panel p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">
        {isSigningUp ? 'Create Account' : 'Sign In'}
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleAuth} className="space-y-4">
        {isSigningUp && (
          <div>
            <label htmlFor="name" className="block text-sm text-gray-400 mb-1">
              Username
            </label>
            <div className="relative">
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 pl-10 bg-black/30 border border-gray-700 rounded-md text-white"
                placeholder="Your Username"
              />
              <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
            </div>
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 pl-10 bg-black/30 border border-gray-700 rounded-md text-white"
              placeholder="your.email@example.com"
            />
            <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 bg-black/30 border border-gray-700 rounded-md text-white"
            placeholder="••••••••"
            minLength={6}
          />
          <p className="mt-1 text-xs text-gray-500">
            {isSigningUp && "Password must be at least 6 characters"}
          </p>
        </div>
        
        {/* Dev helper buttons */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={fillTestCredentials}
            className="text-xs text-cyber-blue hover:underline"
          >
            Fill test credentials
          </button>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || authLoading || !email || !password}
          className="w-full cyber-panel py-3 px-4 rounded-md flex items-center justify-center space-x-2 text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{isSigningUp ? 'Creating Account...' : 'Signing In...'}</span>
            </>
          ) : isSigningUp ? (
            <>
              <UserPlus className="w-5 h-5" />
              <span>Create Account</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button 
          onClick={toggleAuthMode}
          className="text-sm text-cyber-blue hover:underline"
        >
          {isSigningUp 
            ? 'Already have an account? Sign In' 
            : 'Need an account? Create one'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
