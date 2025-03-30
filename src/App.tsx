import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { GameProvider } from "@/context/GameContext";
import { AuthProvider } from "@/context/AuthContext";
import { PopupProvider, usePopup } from "@/context/PopupContext";
import { GamePopups } from "@/components/popups/GamePopups";
import { lazy, Suspense, useState, useEffect, Component, ErrorInfo } from "react";
import { setPopupContextRef } from "@/utils/popupUtils";
import MusicPlayer from "@/components/ui/MusicPlayer";

// Background wallpaper feature: The app uses a global background image specified in index.css
// To change the background, place a new image in the public/images/ folder named 'background.jpg'

// Eager load the main page for better initial load
import Index from "./pages/Index";
import Navbar from "./components/layout/Navbar";

// Add imports for debugging utilities
import { checkLeaderboardData, addTestLeaderboardEntries } from '@/utils/testUtils';
import { getGlobalLeaderboard } from './firebase/leaderboardService';

// Background wallpaper component
const BackgroundWallpaper = () => (
  <div className="fixed inset-0 z-[-1] app-wallpaper" />
);

// Error boundary component to catch rendering errors
class ErrorBoundary extends Component<
  { children: React.ReactNode, fallback?: React.ReactNode },
  { hasError: boolean, error: Error | null }
> {
  constructor(props: { children: React.ReactNode, fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
          <div className="cyber-panel p-6 border border-cyber-red max-w-lg w-full">
            <h2 className="text-xl font-bold text-cyber-red mb-4">Something went wrong</h2>
            <p className="mb-4">The application encountered an error:</p>
            <div className="bg-black/50 p-4 rounded-md overflow-auto mb-4">
              <pre className="text-xs text-gray-300">{this.state.error?.toString()}</pre>
            </div>
            <button 
              className="cyber-panel border border-cyber-blue py-2 px-4 text-cyber-blue"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom loading component for better UX
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center text-white">
    <div className="cyber-panel p-4 rounded-lg border border-cyber-blue animate-pulse">
      <div className="w-24 h-6 bg-cyber-blue/20 rounded-md"></div>
    </div>
  </div>
);

// Basic fallback component for when the app fails to load
const AppFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-white">
    <div className="cyber-panel p-6 border border-cyber-blue max-w-lg">
      <h2 className="text-xl font-bold text-cyber-blue mb-4">Loading Application...</h2>
      <p>If this message persists, please refresh the page.</p>
    </div>
  </div>
);

// Lazy load other pages to improve initial page load
const Profile = lazy(() => import("./pages/Profile"));
const Timer = lazy(() => import("./pages/Timer"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Quests = lazy(() => import("./pages/Quests"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create a memory-optimized query client with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (garbage collection time)
      retry: 1, // Reduce retry attempts
    },
  },
});

// Simple component to guarantee Navbar is rendered
const NavbarWrapper = () => {
  return <Navbar />;
};

// AnimatePresence wrapper component with performance optimizations
const AnimatedRoutes = () => {
  const location = useLocation();
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  // Disable animations on initial load for faster initial render
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
    }
  }, [isInitialMount]);
  
  return (
    <>
      <ErrorBoundary>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <ErrorBoundary>
                <Index />
              </ErrorBoundary>
            } />
            <Route path="/profile" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Profile />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/timer" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Timer />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/achievements" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Achievements />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/quests" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Quests />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="*" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              </ErrorBoundary>
            } />
          </Routes>
        </AnimatePresence>
      </ErrorBoundary>
      
      {/* Render Navbar separately to ensure it's always visible */}
      <ErrorBoundary>
        <NavbarWrapper />
      </ErrorBoundary>
    </>
  );
};

// Initialize popup context for global access
const PopupInitializer = ({ children }: { children: React.ReactNode }) => {
  const popupContext = usePopup();
  
  useEffect(() => {
    // Set the popup context reference for global access
    setPopupContextRef(popupContext);
  }, [popupContext]);
  
  return <>{children}</>;
};

const App = () => {
  // Add debugging tools to window object (development only)
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore - Add to window for debugging
    window.debugTools = {
      checkLeaderboardData,
      addTestLeaderboardEntries,
      getGlobalLeaderboard
    };
    console.log('Debug tools available in console. Try: window.debugTools.checkLeaderboardData()');
  }

  return (
    <ErrorBoundary fallback={<AppFallback />}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <GameProvider>
              <PopupProvider>
                <PopupInitializer>
                  <BackgroundWallpaper />
                  <Toaster />
                  <GamePopups />
                  <BrowserRouter>
                    <AnimatedRoutes />
                    <MusicPlayer />
                  </BrowserRouter>
                </PopupInitializer>
              </PopupProvider>
            </GameProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
