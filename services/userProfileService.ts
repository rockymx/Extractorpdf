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
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        console.error('Multiple user_settings records found for user_id:', userId);
        console.error('This indicates a database integrity issue. Please run cleanup migration.');
      }
      console.error('Error fetching user settings:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error in getUserSettings:', err);
    return null;
  }
};

export const createUserSettings = async (userId: string, apiKey: string | null = null): Promise<UserSettings | null> => {
  try {
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
      if (error.code === '42501') {
        console.error('Authentication error: Cannot create user settings. User session may be expired.');
        return null;
      }
      console.error('Error creating user settings:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error in createUserSettings:', err);
    return null;
  }
};

export const updateUserSettings = async (userId: string, apiKey: string): Promise<UserSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        gemini_api_key: apiKey,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === '42501') {
        console.error('Authentication error: Cannot update user settings. User session may be expired.');
        return null;
      }
      console.error('Error updating user settings:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error in updateUserSettings:', err);
    return null;
  }
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

  if (Object.keys(updateData).length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_settings')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating user preferences:', error);
    return null;
  }

  if (!data) {
    const settings = await getOrCreateUserSettings(userId);
    if (!settings) {
      console.error('Failed to create user settings for userId:', userId);
      return null;
    }

    const { data: retryData, error: retryError } = await supabase
      .from('user_settings')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (retryError) {
      console.error('Error updating user preferences on retry:', retryError);
      return null;
    }

    return retryData;
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
