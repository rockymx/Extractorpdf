import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getVisibleColumns, saveVisibleColumns, getHideNSSIdentifier, saveHideNSSIdentifier } from '../utils/storageUtils';

export type ColumnVisibility = {
  [key: string]: boolean;
};

interface SettingsContextType {
  visibleColumns: ColumnVisibility;
  setVisibleColumns: React.Dispatch<React.SetStateAction<ColumnVisibility>>;
  hideNSSIdentifier: boolean;
  setHideNSSIdentifier: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(() => {
    const savedSettings = getVisibleColumns();
    return savedSettings ? { ...defaultVisibility, ...savedSettings } : defaultVisibility;
  });
  
  const [hideNSSIdentifier, setHideNSSIdentifier] = useState<boolean>(() => {
    return getHideNSSIdentifier();
  });

  useEffect(() => {
    saveVisibleColumns(visibleColumns);
  }, [visibleColumns]);

  useEffect(() => {
    saveHideNSSIdentifier(hideNSSIdentifier);
  }, [hideNSSIdentifier]);

  return (
    <SettingsContext.Provider value={{ visibleColumns, setVisibleColumns, hideNSSIdentifier, setHideNSSIdentifier }}>
      {children}
    </SettingsContext.Provider>
  );
};