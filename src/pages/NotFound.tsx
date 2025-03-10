
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import PageTransition from "@/components/layout/PageTransition";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-dark px-4 py-6">
        <div className="cyber-panel p-8 rounded-lg max-w-md w-full text-center">
          <div className="inline-flex justify-center items-center w-16 h-16 cyber-panel rounded-full mb-4 text-cyber-red border-cyber-red">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h1 className="text-4xl font-bold mb-2 cyber-red-glow text-cyber-red">404</h1>
          <h2 className="text-xl font-semibold mb-4 text-white">MISSION FAILED: LOCATION NOT FOUND</h2>
          <p className="text-gray-400 mb-6">
            The route <span className="text-cyber-blue">{location.pathname}</span> doesn't exist in this dimension.
          </p>
          
          <Link to="/" className="block cyber-panel py-3 px-6 rounded-md text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue">
            RETURN TO BASE
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};

export default NotFound;
