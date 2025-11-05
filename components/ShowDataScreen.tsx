
import React, { useContext } from 'react';
import { SettingsContext, configurableColumns } from '../context/SettingsContext.tsx';

interface ShowDataScreenProps {
  onNavigateBack: () => void;
}

export const ShowDataScreen: React.FC<ShowDataScreenProps> = ({ onNavigateBack }) => {
  const settings = useContext(SettingsContext);

  if (!settings) {
    throw new Error("ShowDataScreen must be used within a SettingsProvider");
  }

  const { visibleColumns, setVisibleColumns, hideNSSIdentifier, setHideNSSIdentifier } = settings;

  const handleToggle = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleNSSIdentifier = () => {
    setHideNSSIdentifier(prev => !prev);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-200">Mostrar Datos</h2>
        <button
          onClick={onNavigateBack}
          className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Volver
        </button>
      </div>
      <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-slate-300 mb-4">Columnas Visibles en la Tabla</h3>
        <p className="text-slate-400 mb-6">
          Selecciona las columnas que deseas mostrar en la tabla de registros de pacientes. Los cambios se guardan automáticamente. Las columnas "No." y "Nombre del Paciente" son fijas y siempre estarán visibles.
        </p>
        <div className="space-y-4">
          {configurableColumns.map(({ key, label }) => (
            <React.Fragment key={key}>
              <label htmlFor={`toggle-${key}`} className="flex items-center justify-between cursor-pointer p-3 bg-slate-800 rounded-lg hover:bg-slate-700/50 transition-colors">
                <span className="font-medium text-slate-200">{label}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    id={`toggle-${key}`}
                    className="sr-only peer"
                    checked={visibleColumns[key] ?? true}
                    onChange={() => handleToggle(key)}
                  />
                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                </div>
              </label>
              {key === 'numeroSeguridadSocial' && (
                <label 
                  htmlFor="toggle-nss-id" 
                  className={`flex items-center justify-between p-3 bg-slate-900/50 rounded-lg ml-8 -mt-2 mb-2 transition-opacity ${visibleColumns[key] ? 'opacity-100 cursor-pointer' : 'opacity-50 pointer-events-none'}`}
                >
                  <span className="font-medium text-slate-300">Ocultar Identificador</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="toggle-nss-id"
                      className="sr-only peer"
                      checked={hideNSSIdentifier}
                      onChange={handleToggleNSSIdentifier}
                      disabled={!visibleColumns[key]}
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </div>
                </label>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};