import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    const initAuth = async () => {
      const storedAdminId = localStorage.getItem('impersonation_admin_id');
      const storedTargetId = localStorage.getItem('impersonation_target_id');
      const storedTargetEmail = localStorage.getItem('impersonation_target_email');
      const isCurrentlyImpersonating = !!(storedAdminId && storedTargetEmail && storedTargetId);

      if (isCurrentlyImpersonating) {
        console.log('[AuthContext] Impersonation detected:', storedTargetEmail);
        setIsImpersonating(true);
        setOriginalAdminId(storedAdminId);
        setImpersonatedUserEmail(storedTargetEmail);
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (isCurrentlyImpersonating) {
          console.log('[AuthContext] Setting role to user due to impersonation');
          setUserRole('user');
          const status = await adminService.getUserStatus(storedTargetId!);
          console.log('[AuthContext] Target user status:', status);
          setIsActive(status);
        } else {
          const role = await adminService.getUserRole(session.user.id);
          const status = await adminService.getUserStatus(session.user.id);
          console.log('[AuthContext] Normal session, role:', role);
          setUserRole(role);
          setIsActive(status);
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const storedAdminId = localStorage.getItem('impersonation_admin_id');
      const storedTargetId = localStorage.getItem('impersonation_target_id');
      const storedTargetEmail = localStorage.getItem('impersonation_target_email');
      const isCurrentlyImpersonating = !!(storedAdminId && storedTargetEmail && storedTargetId);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (isCurrentlyImpersonating) {
          console.log('[AuthContext.onAuthStateChange] Impersonation active, setting role to user');
          setUserRole('user');
          const status = await adminService.getUserStatus(storedTargetId!);
          console.log('[AuthContext.onAuthStateChange] Target user status:', status);
          setIsActive(status);
        } else {
          const role = await adminService.getUserRole(session.user.id);
          const status = await adminService.getUserStatus(session.user.id);
          console.log('[AuthContext.onAuthStateChange] Normal session, role:', role);
          setUserRole(role);
          setIsActive(status);
        }
      } else {
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
