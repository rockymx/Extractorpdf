
import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getOrCreateUserSettings, updateUserSettings, updateUserPreferences, UserSettings } from '../services/userProfileService';
import { validateSession } from '../utils/authUtils';

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

export const configurableColumns: { key: string; label: string; inDevelopment?: boolean }[] = [
    { key: 'diagnosticoPrincipal', label: 'Diagnóstico Principal' },
    { key: 'numeroSeguridadSocial', label: 'NSS' },
    { key: 'horaCita', label: 'Hora Cita' },
    { key: 'atencion', label: 'Inicio y Fin de Atencion' },
    { key: 'primeraVez', label: '1ra Vez' },
    { key: 'numeroRecetas', label: 'Recetas', inDevelopment: true },
    { key: 'diasIncapacidad', label: 'Días Incap.', inDevelopment: true },
    { key: 'alta', label: 'Alta', inDevelopment: true },
    { key: 'paseOtraUnidad', label: 'Pase Unidad', inDevelopment: true },
    { key: 'riesgoTrabajo', label: 'Riesgo Trab.', inDevelopment: true },
];

const defaultVisibility: ColumnVisibility = configurableColumns.reduce((acc, col) => {
    acc[col.key] = !col.inDevelopment;
    return acc;
}, {} as ColumnVisibility);

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { user, session } = useAuth();
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(defaultVisibility);
  const [hideNSSIdentifier, setHideNSSIdentifier] = useState<boolean>(false);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const isSavingRef = useRef<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoadingSettings(false);
        setUserId(null);
        setApiKeyState('');
        setVisibleColumns(defaultVisibility);
        setHideNSSIdentifier(false);
        isInitialLoadRef.current = true;
        return;
      }

      if (userId === user.id) {
        return;
      }

      setUserId(user.id);
      setIsLoadingSettings(true);
      isInitialLoadRef.current = true;
      try {
        const settings = await getOrCreateUserSettings(user.id);

        if (settings?.gemini_api_key) {
          setApiKeyState(settings.gemini_api_key);
        } else {
          setApiKeyState('');
        }

        if (settings?.column_preferences) {
          setVisibleColumns({ ...defaultVisibility, ...settings.column_preferences });
        } else {
          setVisibleColumns(defaultVisibility);
        }

        if (settings?.privacy_settings) {
          setHideNSSIdentifier(settings.privacy_settings.hideNSSIdentifier ?? false);
        } else {
          setHideNSSIdentifier(false);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoadingSettings(false);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    loadSettings();
  }, [user, userId]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || userId !== user.id || isInitialLoadRef.current || isSavingRef.current) {
      return;
    }

    const validation = validateSession(user, session);
    if (!validation.isValid) {
      console.warn(`Session validation failed: ${validation.reason}. Skipping preferences save.`);
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) {
        return;
      }

      const revalidation = validateSession(user, session);
      if (!revalidation.isValid) {
        console.warn(`Session validation failed before save: ${revalidation.reason}`);
        return;
      }

      isSavingRef.current = true;
      try {
        await updateUserPreferences(user.id, visibleColumns, { hideNSSIdentifier });
      } catch (error) {
        console.error('Error saving user preferences:', error);
      } finally {
        isSavingRef.current = false;
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [visibleColumns, hideNSSIdentifier, user, session, userId]);

  const setApiKey = async (key: string) => {
    const validation = validateSession(user, session);
    if (!validation.isValid) {
      console.warn(`Cannot update API key: ${validation.reason}`);
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