
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
  const { user } = useAuth();
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(defaultVisibility);
  const [hideNSSIdentifier, setHideNSSIdentifier] = useState<boolean>(false);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoadingSettings(false);
        setSettingsLoaded(false);
        return;
      }

      if (settingsLoaded) {
        return;
      }

      setIsLoadingSettings(true);
      try {
        const settings = await getOrCreateUserSettings(user.id);
        if (settings?.gemini_api_key) {
          setApiKeyState(settings.gemini_api_key);
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
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoadingSettings(false);
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