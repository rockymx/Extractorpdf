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
    console.log(`[adminService.getUserRole] Fetching role for user ${userId}`);
    const { data, error } = await supabase
      .from('user_settings')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error(`[adminService.getUserRole] Error fetching user role for ${userId}:`, error);
      return 'user';
    }

    console.log(`[adminService.getUserRole] User ${userId} role data:`, data);
    const role = (data?.role as 'admin' | 'user') || 'user';
    console.log(`[adminService.getUserRole] Returning role: ${role}`);
    return role;
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

  async startImpersonation(adminId: string, targetUserId: string): Promise<void> {
    console.log(`[adminService.startImpersonation] Admin ${adminId} starting impersonation of user ${targetUserId}`);

    const { data: activeSession, error: checkError } = await supabase
      .from('admin_impersonation_log')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) {
      console.error('[adminService.startImpersonation] Error checking active sessions:', checkError);
      throw checkError;
    }

    if (activeSession) {
      await supabase
        .from('admin_impersonation_log')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', activeSession.id);
    }

    const { error: insertError } = await supabase
      .from('admin_impersonation_log')
      .insert({
        admin_id: adminId,
        impersonated_user_id: targetUserId,
        is_active: true,
      });

    if (insertError) {
      console.error('[adminService.startImpersonation] Error creating impersonation log:', insertError);
      throw insertError;
    }

    console.log('[adminService.startImpersonation] Impersonation session started successfully');
  },

  async endImpersonation(adminId: string): Promise<void> {
    console.log(`[adminService.endImpersonation] Ending impersonation for admin ${adminId}`);

    const { error } = await supabase
      .from('admin_impersonation_log')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('admin_id', adminId)
      .eq('is_active', true);

    if (error) {
      console.error('[adminService.endImpersonation] Error ending impersonation:', error);
      throw error;
    }

    console.log('[adminService.endImpersonation] Impersonation session ended successfully');
  },

  async getActiveImpersonation(adminId: string): Promise<{ impersonated_user_id: string } | null> {
    console.log(`[adminService.getActiveImpersonation] Checking active impersonation for admin ${adminId}`);

    const { data, error } = await supabase
      .from('admin_impersonation_log')
      .select('impersonated_user_id')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[adminService.getActiveImpersonation] Error fetching active impersonation:', error);
      return null;
    }

    return data;
  },
};
