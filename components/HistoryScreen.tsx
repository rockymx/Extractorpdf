
import React, { useState, useEffect, useMemo } from 'react';
import type { StoredExtraction } from '../types.ts';
import { getHistory, deleteExtraction, clearHistory } from '../utils/storageUtils.ts';
import { ReportDetailsView } from './ReportDetailsView.tsx';
import { PatientRecordsTable } from './PatientRecordsTable.tsx';
import { exportToExcel, formatAtencion } from '../utils/fileUtils.ts';
import { ClockIcon } from './icons/ClockIcon.tsx';
import { EyeIcon } from './icons/EyeIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon.tsx';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon.tsx';

interface HistoryScreenProps {
  onNavigateBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigateBack }) => {
  const [history, setHistory] = useState<StoredExtraction[]>([]);
  const [selectedExtraction, setSelectedExtraction] = useState<StoredExtraction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta entrada del historial?')) {
      deleteExtraction(id);
      setHistory(getHistory());
    }
  };

  const handleClear = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todo el historial? Esta acción no se puede deshacer.')) {
      clearHistory();
      setHistory([]);
    }
  };
  
  const handleExport = () => {
    if (selectedExtraction) {
        const { data, fileName } = selectedExtraction;
        const exportFileName = fileName.replace(/\.pdf$/i, '') + '_pacientes.xlsx';
        const dataForExport = data.patientRecords.map(record => ({
            'No.': record.noProgresivo,
            'Nombre del Paciente': record.nombreDerechohabiente,
            'Diagnóstico Principal': record.diagnosticoPrincipal,
            'NSS': record.numeroSeguridadSocial,
            'Hora Cita': record.horaCita,
            'Inicio y Fin de Atencion': formatAtencion(record.inicioAtencion, record.finAtencion),
            '1ra Vez': record.primeraVez,
            'Recetas': record.numeroRecetas,
            'Días Incap.': record.diasIncapacidad,
            'Alta': record.alta,
            'Pase Unidad': record.paseOtraUnidad,
            'Riesgo Trab.': record.riesgoTrabajo,
        }));
        exportToExcel(dataForExport, exportFileName);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => 
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  if (selectedExtraction) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-300">
            Resultados para: {selectedExtraction.fileName}
          </h2>
          <button
            onClick={() => setSelectedExtraction(null)}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Volver a la lista
          </button>
        </div>
        <div className="flex justify-end mb-4">
            <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <ArrowDownTrayIcon />
                Exportar Pacientes a Excel
            </button>
        </div>
        <ReportDetailsView details={selectedExtraction.data.reportDetails} />
        <PatientRecordsTable records={selectedExtraction.data.patientRecords} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-2 border-slate-700 pb-3 gap-4">
        <h2 className="text-3xl font-bold text-slate-200 flex items-center gap-3">
          <ClockIcon className="w-8 h-8 text-slate-400" />
          Historial de Extracciones
        </h2>
        {history.length > 0 && (
            <button
                onClick={handleClear}
                className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm self-end sm:self-center"
            >
                Limpiar Historial
            </button>
        )}
      </div>
      
      {history.length > 0 ? (
        <>
        <div className="mb-6 relative">
            <input
                type="text"
                placeholder="Buscar por nombre de archivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-sky-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <ul className="space-y-3">
            {filteredHistory.map((item) => (
            <li
                key={item.id}
                className="bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex-grow">
                <p className="font-semibold text-sky-400">{item.fileName}</p>
                <p className="text-sm text-slate-400">Extraído el: {item.extractionDate}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                <button
                    onClick={() => setSelectedExtraction(item)}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg transition-colors"
                    aria-label={`Ver extracción de ${item.fileName}`}
                >
                    <EyeIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Ver</span>
                </button>
                <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-3 rounded-lg transition-colors"
                    aria-label={`Eliminar extracción de ${item.fileName}`}
                >
                    <TrashIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Eliminar</span>
                </button>
                </div>
            </li>
            ))}
        </ul>
        {filteredHistory.length === 0 && (
            <p className="text-center text-slate-400 mt-8">No se encontraron resultados para "{searchTerm}".</p>
        )}
        </>
      ) : (
        <div className="text-center py-12">
            <p className="text-slate-400 text-lg">El historial de extracciones está vacío.</p>
            <button onClick={onNavigateBack} className="mt-4 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Realizar una nueva extracción
            </button>
        </div>
      )}
    </div>
  );
};