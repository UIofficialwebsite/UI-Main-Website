import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { trackOnce } from '@/utils/analytics';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const checkAdminStatus = async (currentUser: User | null) => {
    if (!currentUser?.id || !currentUser?.email) {
      setIsAdmin(false); setIsSuperAdmin(false); setUserRole(null); return;
    }

    // Source of truth: anyone whose email is in `admin_users` is an admin.
    // We check via the SECURITY DEFINER RPC first (which bypasses RLS),
    // then fall back to a direct query in case the RPC is missing on a
    // dev environment but RLS still lets the user see their own row.
    const email = currentUser.email.toLowerCase();

    let admin = false;
    let superAdmin = false;
    let rpcOk = false;

    try {
      const { data: rpcAdmin, error } = await supabase.rpc('is_current_user_admin');
      if (!error) {
        rpcOk = true;
        if (rpcAdmin) admin = true;
      }
    } catch (err) {
      console.warn('useAuth: is_current_user_admin RPC unavailable:', err);
    }

    // Only fall back to a direct admin_users read if the RPC was UNAVAILABLE
    // (not merely returned false) — a redundant query on every login otherwise.
    if (!admin && !rpcOk) {
      try {
        const { data: adminRow } = await supabase
          .from('admin_users')
          .select('is_super_admin')
          .ilike('email', email)
          .maybeSingle();
        if (adminRow) {
          admin = true;
          superAdmin = !!adminRow.is_super_admin;
        }
      } catch (err) {
        console.warn('useAuth: admin_users direct lookup failed:', err);
      }
    }

    if (admin && !superAdmin) {
      try {
        const { data: rpcSuper } = await supabase.rpc('is_super_admin', { user_email: email });
        if (rpcSuper) superAdmin = true;
      } catch (err) {
        // Fall back to direct query for super-admin flag.
        const { data: row } = await supabase
          .from('admin_users')
          .select('is_super_admin')
          .ilike('email', email)
          .maybeSingle();
        if (row?.is_super_admin) superAdmin = true;
      }
    }

    setIsAdmin(admin);
    setIsSuperAdmin(superAdmin);

    if (admin) {
      setUserRole(superAdmin ? 'super_admin' : 'admin');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();
      setUserRole(profile?.role || 'student');
    } catch {
      setUserRole('student');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // Clear all auth state immediately
      setUser(null); 
      setSession(null); 
      setIsAdmin(false); 
      setUserRole(null);
      
      // REMOVED: window.location.href = '/'; 
      // This line was causing a race condition where the page reloaded 
      // before the local storage token was fully cleared, causing auto-relogin.
      // Navigation is now handled by the component calling signOut (e.g., NavBar).
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Listen for changes (e.g., after Google Login completes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // GA4: fire login / sign_up only on a genuine sign-in (not reload or token
      // refresh). New vs returning inferred from account age; once per session.
      if (_event === 'SIGNED_IN' && session?.user) {
        const createdAt = session.user.created_at ? new Date(session.user.created_at).getTime() : 0;
        const isNew = createdAt > 0 && Date.now() - createdAt < 120000; // < 2 min old
        const method = session.user.app_metadata?.provider || 'unknown';
        trackOnce(`auth:${session.user.id}`, isNew ? 'sign_up' : 'login', { method });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) checkAdminStatus(user);
  }, [user, isLoading]);

  return (
    <AuthContext.Provider value={{ 
      user, session, isLoading, isAdmin, isSuperAdmin, userRole, signOut, 
      checkAdminStatus: () => checkAdminStatus(user) 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
