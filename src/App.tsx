import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { GameProvider } from "@/context/GameContext";
import { AuthProvider } from "@/context/AuthContext";
import { lazy, Suspense, useState, useEffect, Component, ErrorInfo } from "react";

// Eager load the main page for better initial load
import Index from "./pages/Index";
import Navbar from "./components/layout/Navbar";

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
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white">
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
  <div className="min-h-screen flex items-center justify-center bg-black text-white">
    <div className="cyber-panel p-4 rounded-lg border border-cyber-blue animate-pulse">
      <div className="w-24 h-6 bg-cyber-blue/20 rounded-md"></div>
    </div>
  </div>
);

// Basic fallback component for when the app fails to load
const AppFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-black text-white">
    <div className="cyber-panel p-6 border border-cyber-blue max-w-lg">
      <h2 className="text-xl font-bold text-cyber-blue mb-4">Loading Application...</h2>
      <p>If this message persists, please refresh the page.</p>
    </div>
  </div>
);

// Lazy load less frequently accessed pages
const Timer = lazy(() => import("./pages/Timer"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Profile = lazy(() => import("./pages/Profile"));
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
            <Route path="/profile" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Profile />
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

const App = () => (
  <ErrorBoundary fallback={<AppFallback />}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <GameProvider>
            <Toaster />
            <Sonner theme="dark" closeButton position="bottom-center" />
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </GameProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
