
import type { StoredExtraction } from '../types.ts';
import type { ColumnVisibility } from '../context/SettingsContext.tsx';

const HISTORY_STORAGE_KEY = 'pdfExtractorHistory';
const COLUMN_SETTINGS_KEY = 'pdfExtractorColumnSettings';
const HIDE_NSS_ID_SETTINGS_KEY = 'pdfExtractorHideNSSIdentifier';


export const getHistory = (): StoredExtraction[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (historyJson) {
      // Sort by date descending (newest first)
      const history = JSON.parse(historyJson) as StoredExtraction[];
      return history.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
    }
    return [];
  } catch (error) {
    console.error("Failed to parse history from localStorage", error);
    return [];
  }
};

export const saveExtraction = (extraction: StoredExtraction): void => {
  const history = getHistory();
  // Prepend new extraction to keep the list sorted by newest first
  const newHistory = [extraction, ...history.filter(item => item.id !== extraction.id)];
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
};

export const deleteExtraction = (id: string): void => {
  const history = getHistory();
  const newHistory = history.filter(item => item.id !== id);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
};

export const clearHistory = (): void => {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
};

// Functions for column visibility settings
export const getVisibleColumns = (): ColumnVisibility | null => {
  try {
    const settingsJson = localStorage.getItem(COLUMN_SETTINGS_KEY);
    return settingsJson ? JSON.parse(settingsJson) : null;
  } catch (error) {
    console.error("Failed to parse column settings from localStorage", error);
    return null;
  }
};

export const saveVisibleColumns = (settings: ColumnVisibility): void => {
  try {
    localStorage.setItem(COLUMN_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save column settings to localStorage", error);
  }
};

// Functions for hiding NSS identifier
export const getHideNSSIdentifier = (): boolean => {
  try {
    const settingsJson = localStorage.getItem(HIDE_NSS_ID_SETTINGS_KEY);
    // Defaults to false if not set
    return settingsJson ? JSON.parse(settingsJson) : false;
  } catch (error) {
    console.error("Failed to parse NSS identifier setting from localStorage", error);
    return false;
  }
};

export const saveHideNSSIdentifier = (value: boolean): void => {
  try {
    localStorage.setItem(HIDE_NSS_ID_SETTINGS_KEY, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save NSS identifier setting to localStorage", error);
  }
};