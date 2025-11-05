
import React from 'react';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon.tsx';
import { TableCellsIcon } from './icons/TableCellsIcon.tsx';

interface OptionsScreenProps {
  onSelectWorkflow: (workflow: 'excel' | 'database') => void;
}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({ onSelectWorkflow }) => {
  return (
    <div className="text-center p-8">
      <h2 className="text-4xl font-bold mb-4 text-slate-200">Bienvenido</h2>
      <p className="text-xl mb-10 text-slate-400">¿Cómo te gustaría gestionar los datos extraídos?</p>
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        <button
          onClick={() => onSelectWorkflow('excel')}
          className="group flex flex-col items-center justify-center p-8 bg-slate-800 border-2 border-slate-700 rounded-xl hover:bg-sky-900/50 hover:border-sky-500 transition-all duration-300 transform hover:-translate-y-1"
        >
          <ArrowDownTrayIcon className="w-16 h-16 mb-4 text-sky-400 transition-transform group-hover:scale-110" />
          <span className="text-2xl font-semibold text-slate-100">Exportar a Excel</span>
          <p className="text-slate-400 mt-2 max-w-xs">Extrae los datos y descárgalos directamente en un archivo .xlsx.</p>
        </button>
        <button
          onClick={() => onSelectWorkflow('database')}
          className="group flex flex-col items-center justify-center p-8 bg-slate-800 border-2 border-slate-700 rounded-xl hover:bg-emerald-900/50 hover:border-emerald-500 transition-all duration-300 transform hover:-translate-y-1"
        >
          <TableCellsIcon className="w-16 h-16 mb-4 text-emerald-400 transition-transform group-hover:scale-110" />
          <span className="text-2xl font-semibold text-slate-100">Ver en la App</span>
          <p className="text-slate-400 mt-2 max-w-xs">Visualiza y gestiona los datos en una tabla interactiva dentro de la aplicación.</p>
        </button>
      </div>
    </div>
  );
};