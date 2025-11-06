
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getOrCreateUserSettings, updateUserSettings, UserSettings } from '../services/userProfileService';

export type ColumnVisibility = {
  [key: string]: boolean;
};

interface SettingsContextType {
  visibleColumns: ColumnVisibility;
  setVisibleColumns: React.Dispatch<React.SetStateAction<ColumnVisibility>>;
  hideNSSIdentifier: boolean;
  setHideNSSIdentifier: React.Dispatch<React.SetStateAction<boolean>>;
  apiKey: string;
  setApiKey: (key: string) => Promise<void>;
  isLoadingSettings: boolean;
}

export const configurableColumns: { key: string; label: string }[] = [
    { key: 'diagnosticoPrincipal', label: 'Diagnóstico Principal' },
    { key: 'numeroSeguridadSocial', label: 'NSS' },
    { key: 'horaCita', label: 'Hora Cita' },
    { key: 'atencion', label: 'Inicio y Fin de Atencion' },
    { key: 'primeraVez', label: '1ra Vez' },
    { key: 'numeroRecetas', label: 'Recetas' },
    { key: 'diasIncapacidad', label: 'Días Incap.' },
    { key: 'alta', label: 'Alta' },
    { key: 'paseOtraUnidad', label: 'Pase Unidad' },
    { key: 'riesgoTrabajo', label: 'Riesgo Trab.' },
];

const defaultVisibility: ColumnVisibility = configurableColumns.reduce((acc, col) => {
    acc[col.key] = true;
    return acc;
}, {} as ColumnVisibility);

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  console.log('[DEBUG] SettingsProvider: Initializing');
  const { user } = useAuth();
  console.log('[DEBUG] SettingsProvider: User from auth:', user ? 'logged in' : 'not logged in');
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(defaultVisibility);
  const [hideNSSIdentifier, setHideNSSIdentifier] = useState<boolean>(false);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      console.log('[DEBUG] SettingsProvider: loadSettings called, user:', user ? 'present' : 'null');
      if (!user) {
        console.log('[DEBUG] SettingsProvider: No user, skipping settings load');
        setIsLoadingSettings(false);
        setSettingsLoaded(false);
        setApiKeyState('');
        return;
      }

      if (settingsLoaded) {
        console.log('[DEBUG] SettingsProvider: Settings already loaded');
        return;
      }

      console.log('[DEBUG] SettingsProvider: Loading user settings');
      setIsLoadingSettings(true);
      try {
        const settings = await getOrCreateUserSettings(user.id);
        console.log('[DEBUG] SettingsProvider: Settings loaded:', settings ? 'success' : 'null');
        if (settings?.gemini_api_key) {
          setApiKeyState(settings.gemini_api_key);
        } else {
          setApiKeyState('');
        }

        const localColumns = localStorage.getItem('pdfExtractorColumnSettings');
        if (localColumns) {
          const parsed = JSON.parse(localColumns);
          setVisibleColumns({ ...defaultVisibility, ...parsed });
        }

        const localHideNSS = localStorage.getItem('pdfExtractorHideNSSIdentifier');
        if (localHideNSS) {
          setHideNSSIdentifier(JSON.parse(localHideNSS));
        }

        setSettingsLoaded(true);
        console.log('[DEBUG] SettingsProvider: Settings loaded successfully');
      } catch (error) {
        console.error('[DEBUG] SettingsProvider: Error loading settings:', error);
      } finally {
        setIsLoadingSettings(false);
        console.log('[DEBUG] SettingsProvider: Finished loading settings');
      }
    };

    loadSettings();
  }, [user, settingsLoaded]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pdfExtractorColumnSettings', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pdfExtractorHideNSSIdentifier', JSON.stringify(hideNSSIdentifier));
    }
  }, [hideNSSIdentifier, user]);

  const setApiKey = async (key: string) => {
    if (!user) {
      return;
    }

    try {
      await updateUserSettings(user.id, key);
      setApiKeyState(key);
    } catch (error) {
      console.error('Error updating API key:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{
      visibleColumns,
      setVisibleColumns,
      hideNSSIdentifier,
      setHideNSSIdentifier,
      apiKey,
      setApiKey,
      isLoadingSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};