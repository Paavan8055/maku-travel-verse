import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import logger from "@/utils/logger";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-pink-50">
      <div className="text-center p-8">
        <h1 className="text-8xl font-bold mb-4 text-orange-600" role="heading" aria-level="1">404</h1>
        <h2 className="text-3xl font-semibold mb-2 text-gray-800">Page Not Found</h2>
        <p className="text-xl text-gray-600 mb-6">
          Oops! The page you're looking for doesn't exist.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Path: <code className="bg-gray-200 px-2 py-1 rounded">{location.pathname}</code>
        </p>
        <a 
          href="/" 
          className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors duration-200"
          aria-label="Return to homepage"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
