import React, { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface OptimizedAuthWrapperProps {
  children: ReactNode;
  showInstantLogin?: boolean;
}

const OptimizedAuthWrapper: React.FC<OptimizedAuthWrapperProps> = ({ 
  children, 
  showInstantLogin = true 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (mounted) {
          setIsAuthenticated(!!data.session);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth error:", error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Set loading to false immediately if showInstantLogin is true
    if (showInstantLogin) {
      setIsLoading(false);
      setIsAuthenticated(false);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [showInstantLogin]);

  if (isLoading && !showInstantLogin) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-royal" />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Login Required</CardTitle>
          <CardDescription>
            You need to be logged in to access this content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            This content is only available to authenticated users.
            Please login or create an account to continue.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full bg-royal hover:bg-royal-dark"
            onClick={() => {
              // Preserve the full URL (incl. query like ?open=…&t=…) under the
              // key Auth.tsx actually reads, so shared deep links survive login.
              localStorage.setItem('auth_return_url', window.location.pathname + window.location.search);
              window.location.href = '/auth';
            }}
          >
            Log In or Sign Up
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // --- THIS IS THE FIX ---
  // We must return a single valid element, not a fragment.
  // A div is the safest choice.
  return <div>{children}</div>;
};

export default OptimizedAuthWrapper;
