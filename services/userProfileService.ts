import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColumnPreferences {
  [key: string]: boolean;
}

export interface PrivacySettings {
  hideNSSIdentifier?: boolean;
}

export interface UserSettings {
  id: string;
  user_id: string;
  gemini_api_key: string | null;
  column_preferences: ColumnPreferences | null;
  privacy_settings: PrivacySettings | null;
  theme_preference: string | null;
  created_at: string;
  updated_at: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

export const createUserProfile = async (userId: string, profileData: Partial<UserProfile> = {}): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      full_name: profileData.full_name || null,
      display_name: profileData.display_name || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return await getUserProfile(userId);
    }
    console.error('Error creating user profile:', error);
    return null;
  }

  return data;
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      full_name: profileData.full_name,
      display_name: profileData.display_name,
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return data;
};

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }

  return data;
};

export const createUserSettings = async (userId: string, apiKey: string | null = null): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      gemini_api_key: apiKey,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return await getUserSettings(userId);
    }
    console.error('Error creating user settings:', error);
    return null;
  }

  return data;
};

export const updateUserSettings = async (userId: string, apiKey: string): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .update({
      gemini_api_key: apiKey,
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user settings:', error);
    return null;
  }

  return data;
};

export const updateUserPreferences = async (
  userId: string,
  columnPreferences?: ColumnPreferences,
  privacySettings?: PrivacySettings
): Promise<UserSettings | null> => {
  const updateData: any = {};

  if (columnPreferences !== undefined) {
    updateData.column_preferences = columnPreferences;
  }

  if (privacySettings !== undefined) {
    updateData.privacy_settings = privacySettings;
  }

  const { data, error } = await supabase
    .from('user_settings')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user preferences:', error);
    return null;
  }

  return data;
};

export const getOrCreateUserProfile = async (userId: string): Promise<UserProfile | null> => {
  let profile = await getUserProfile(userId);

  if (!profile) {
    profile = await createUserProfile(userId);
  }

  return profile;
};

export const getOrCreateUserSettings = async (userId: string): Promise<UserSettings | null> => {
  let settings = await getUserSettings(userId);

  if (!settings) {
    settings = await createUserSettings(userId);
  }

  return settings;
};
