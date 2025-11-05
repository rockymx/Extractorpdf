
import React from 'react';

interface ConfigurationScreenProps {
  onNavigateBack: () => void;
}

export const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({ onNavigateBack }) => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-200">Configuración</h2>
        <button
          onClick={onNavigateBack}
          className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Volver
        </button>
      </div>
      <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg">
        <p className="text-slate-400">
          Esta es la página de configuración. Próximamente habrá más opciones disponibles aquí.
        </p>
      </div>
    </div>
  );
};
