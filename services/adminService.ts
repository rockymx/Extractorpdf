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
    const { data, error } = await supabase.rpc('get_all_users_admin');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return (data || []).map(user => ({
      id: user.id,
      email: user.email || 'No email',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: (user.role as 'admin' | 'user') || 'user',
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

  async updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<void> {
    const { error } = await supabase
      .from('user_settings')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },
};
