import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

const NotFound = () => {
  usePageSEO(SEO_TITLES.NOT_FOUND);
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Attempted to access: <code className="bg-gray-200 px-2 py-1 rounded">{location.pathname}</code>
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/">
            <Button className="w-full bg-royal hover:bg-royal-dark text-white flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()} 
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Popular pages:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/about" className="text-royal hover:underline text-sm">About</Link>
            <Link to="/courses" className="text-royal hover:underline text-sm">Courses</Link>
            <Link to="/career" className="text-royal hover:underline text-sm">Career</Link>
            <Link to="/faq" className="text-royal hover:underline text-sm">FAQ</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
