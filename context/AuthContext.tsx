import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { adminService } from '../services/adminService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'admin' | 'user' | null;
  isActive: boolean;
  isImpersonating: boolean;
  originalAdminId: string | null;
  impersonatedUserEmail: string | null;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  impersonateUser: (targetUserId: string, targetEmail: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [originalAdminId, setOriginalAdminId] = useState<string | null>(null);
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      console.log('[AuthContext.initAuth] Starting initialization...');

      const storedAdminId = localStorage.getItem('impersonation_admin_id');
      const storedTargetId = localStorage.getItem('impersonation_target_id');
      const storedTargetEmail = localStorage.getItem('impersonation_target_email');

      console.log('[AuthContext.initAuth] LocalStorage values:', {
        storedAdminId,
        storedTargetId,
        storedTargetEmail
      });

      const isCurrentlyImpersonating = !!(storedAdminId && storedTargetEmail && storedTargetId);
      console.log('[AuthContext.initAuth] Is impersonating:', isCurrentlyImpersonating);

      if (isCurrentlyImpersonating) {
        console.log('[AuthContext.initAuth] Setting impersonation state for:', storedTargetEmail);
        setIsImpersonating(true);
        setOriginalAdminId(storedAdminId);
        setImpersonatedUserEmail(storedTargetEmail);
      }

      console.log('[AuthContext.initAuth] Getting session from Supabase...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthContext.initAuth] Session retrieved, user ID:', session?.user?.id);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (isCurrentlyImpersonating) {
          console.log('[AuthContext.initAuth] Impersonation mode: forcing role to user and skipping DB calls');
          setUserRole('user');
          setIsActive(true);
          console.log('[AuthContext.initAuth] Impersonation setup complete');
        } else {
          console.log('[AuthContext.initAuth] Normal mode: fetching user role and status from DB for:', session.user.id);
          const role = await adminService.getUserRole(session.user.id);
          console.log('[AuthContext.initAuth] Role fetched:', role);

          const status = await adminService.getUserStatus(session.user.id);
          console.log('[AuthContext.initAuth] Status fetched:', status);

          setUserRole(role);
          setIsActive(status);
        }
      } else {
        console.log('[AuthContext.initAuth] No session found');
      }

      console.log('[AuthContext.initAuth] Setting loading to false');
      setLoading(false);
      isInitializedRef.current = true;
      console.log('[AuthContext.initAuth] Initialization complete');
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext.onAuthStateChange] Auth state changed, event:', _event);

      if (!isInitializedRef.current) {
        console.log('[AuthContext.onAuthStateChange] Skipping - not yet initialized');
        return;
      }

      const storedAdminId = localStorage.getItem('impersonation_admin_id');
      const storedTargetId = localStorage.getItem('impersonation_target_id');
      const storedTargetEmail = localStorage.getItem('impersonation_target_email');
      const isCurrentlyImpersonating = !!(storedAdminId && storedTargetEmail && storedTargetId);

      console.log('[AuthContext.onAuthStateChange] Is impersonating:', isCurrentlyImpersonating);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (isCurrentlyImpersonating) {
          console.log('[AuthContext.onAuthStateChange] Impersonation mode: forcing role to user');
          setUserRole('user');
          setIsActive(true);
        } else {
          console.log('[AuthContext.onAuthStateChange] Normal mode: fetching role and status');
          const role = await adminService.getUserRole(session.user.id);
          const status = await adminService.getUserStatus(session.user.id);
          console.log('[AuthContext.onAuthStateChange] Normal session, role:', role, 'status:', status);
          setUserRole(role);
          setIsActive(status);
        }
      } else {
        console.log('[AuthContext.onAuthStateChange] No session');
        setUserRole(null);
        setIsActive(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    if (isImpersonating && originalAdminId) {
      await stopImpersonation();
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const impersonateUser = async (targetUserId: string, targetEmail: string) => {
    if (!user) {
      throw new Error('No hay sesión de administrador activa');
    }

    const currentRole = await adminService.getUserRole(user.id);
    if (currentRole !== 'admin') {
      throw new Error('Solo los administradores pueden impersonar usuarios');
    }

    const storedAdminId = localStorage.getItem('impersonation_admin_id');
    const adminIdToStore = storedAdminId || user.id;

    console.log('[impersonateUser] Starting impersonation:', {
      adminId: adminIdToStore,
      targetUserId,
      targetEmail
    });

    localStorage.setItem('impersonation_admin_id', adminIdToStore);
    localStorage.setItem('impersonation_target_id', targetUserId);
    localStorage.setItem('impersonation_target_email', targetEmail);

    await adminService.startImpersonation(adminIdToStore, targetUserId);

    console.log('[impersonateUser] Impersonation data saved to localStorage, reloading...');

    window.location.reload();
  };

  const stopImpersonation = async () => {
    const storedAdminId = localStorage.getItem('impersonation_admin_id');

    console.log('[stopImpersonation] Ending impersonation for admin:', storedAdminId);

    if (storedAdminId) {
      await adminService.endImpersonation(storedAdminId);
    }

    localStorage.removeItem('impersonation_admin_id');
    localStorage.removeItem('impersonation_target_id');
    localStorage.removeItem('impersonation_target_email');

    console.log('[stopImpersonation] Impersonation data cleared, reloading...');

    window.location.reload();
  };

  const value = React.useMemo(() => ({
    user,
    session,
    loading,
    userRole,
    isActive,
    isImpersonating,
    originalAdminId,
    impersonatedUserEmail,
    signUp,
    signIn,
    signOut,
    impersonateUser,
    stopImpersonation,
  }), [user, session, loading, userRole, isActive, isImpersonating, originalAdminId, impersonatedUserEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
