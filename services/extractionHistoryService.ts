import { supabase } from './supabaseClient';
import type { ExtractionResult } from '../types';

export interface ExtractionHistoryRecord {
  id: string;
  user_id: string;
  file_name: string;
  extraction_date: string;
  data: ExtractionResult;
  created_at: string;
}

export const getExtractionHistory = async (userId: string): Promise<ExtractionHistoryRecord[]> => {
  const { data, error } = await supabase
    .from('extraction_history')
    .select('*')
    .eq('user_id', userId)
    .order('extraction_date', { ascending: false });

  if (error) {
    console.error('Error fetching extraction history:', error);
    return [];
  }

  return data || [];
};

export const saveExtractionToHistory = async (
  userId: string,
  fileName: string,
  extractionData: ExtractionResult
): Promise<ExtractionHistoryRecord | null> => {
  const { data, error } = await supabase
    .from('extraction_history')
    .insert({
      user_id: userId,
      file_name: fileName,
      extraction_date: new Date().toISOString(),
      data: extractionData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving extraction to history:', error);
    return null;
  }

  return data;
};

export const deleteExtractionFromHistory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('extraction_history')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting extraction from history:', error);
    return false;
  }

  return true;
};

export const getExtractionById = async (id: string): Promise<ExtractionHistoryRecord | null> => {
  const { data, error } = await supabase
    .from('extraction_history')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching extraction by id:', error);
    return null;
  }

  return data;
};

export const migrateLocalStorageToSupabase = async (userId: string): Promise<void> => {
  try {
    const localHistory = localStorage.getItem('pdfExtractorHistory');
    if (!localHistory) {
      return;
    }

    const parsedHistory = JSON.parse(localHistory);
    if (!Array.isArray(parsedHistory) || parsedHistory.length === 0) {
      localStorage.removeItem('pdfExtractorHistory');
      return;
    }

    const existingHistory = await getExtractionHistory(userId);
    if (existingHistory.length > 0) {
      localStorage.removeItem('pdfExtractorHistory');
      return;
    }

    const migratedRecords = parsedHistory.map((record: any) => ({
      user_id: userId,
      file_name: record.fileName,
      extraction_date: new Date(record.id).toISOString(),
      data: record.data,
    }));

    const { error } = await supabase
      .from('extraction_history')
      .insert(migratedRecords);

    if (error) {
      console.error('Error migrating history to Supabase:', error);
      return;
    }

    console.log(`Successfully migrated ${migratedRecords.length} records to Supabase`);
    localStorage.removeItem('pdfExtractorHistory');
  } catch (error) {
    console.error('Error during migration:', error);
  }
};
