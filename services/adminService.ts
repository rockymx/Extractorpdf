import { supabase } from './supabaseClient';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
}

export const adminService = {
  async getAllUsers(): Promise<AdminUser[]> {
    console.log('[adminService.getAllUsers] Fetching all users...');
    const { data, error } = await supabase.rpc('get_all_users_admin');

    if (error) {
      console.error('[adminService.getAllUsers] Error fetching users:', error);
      throw error;
    }

    console.log('[adminService.getAllUsers] Raw data from RPC:', data);

    const mappedUsers = (data || []).map(user => {
      const mappedUser = {
        id: user.id,
        email: user.email || 'No email',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        role: (user.role as 'admin' | 'user') || 'user',
        is_active: user.is_active !== undefined ? user.is_active : true,
      };
      console.log(`[adminService.getAllUsers] Mapped user ${user.email}: is_active=${mappedUser.is_active} (raw: ${user.is_active})`);
      return mappedUser;
    });

    return mappedUsers;
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

  async toggleUserStatus(userId: string, currentStatus: boolean): Promise<void> {
    const newStatus = !currentStatus;
    console.log(`[adminService.toggleUserStatus] Toggling status for user ${userId}: ${currentStatus} -> ${newStatus}`);

    const { data, error } = await supabase
      .from('user_settings')
      .update({ is_active: newStatus })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('[adminService.toggleUserStatus] Error toggling user status:', error);
      throw error;
    }

    console.log('[adminService.toggleUserStatus] Update result:', data);
  },

  async getUserStatus(userId: string): Promise<boolean> {
    console.log(`[adminService.getUserStatus] Fetching status for user ${userId}`);
    const { data, error } = await supabase
      .from('user_settings')
      .select('is_active')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[adminService.getUserStatus] Error fetching user status:', error);
      return true;
    }

    console.log(`[adminService.getUserStatus] User ${userId} status:`, data);
    return data?.is_active ?? true;
  },
};
