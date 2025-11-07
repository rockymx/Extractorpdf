import { supabase } from './supabaseClient';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: 'admin' | 'user';
}

export const adminService = {
  async getAllUsers(): Promise<AdminUser[]> {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    const userIds = authUsers.users.map(u => u.id);

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, role')
      .in('user_id', userIds);

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
    }

    const settingsMap = new Map(
      settings?.map(s => [s.user_id, s.role as 'admin' | 'user']) || []
    );

    return authUsers.users.map(user => ({
      id: user.id,
      email: user.email || 'No email',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
      role: settingsMap.get(user.id) || 'user',
    }));
  },

  async getUserRole(userId: string): Promise<'admin' | 'user'> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }

    return (data?.role as 'admin' | 'user') || 'user';
  },

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
};
