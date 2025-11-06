
import React, { useState, useEffect, useMemo } from 'react';
import type { StoredExtraction } from '../types.ts';
import { ReportDetailsView } from './ReportDetailsView.tsx';
import { PatientRecordsTable } from './PatientRecordsTable.tsx';
import { exportToExcel, formatAtencion } from '../utils/fileUtils.ts';
import { generateHTMLReport, downloadHTMLReport } from '../utils/htmlExportUtils.ts';
import { SettingsContext } from '../context/SettingsContext.tsx';
import { ClockIcon } from './icons/ClockIcon.tsx';
import { EyeIcon } from './icons/EyeIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon.tsx';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  getExtractionHistory,
  deleteExtractionFromHistory,
  migrateLocalStorageToSupabase,
  type ExtractionHistoryRecord
} from '../services/extractionHistoryService.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface HistoryScreenProps {
  onNavigateBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigateBack }) => {
  const { user } = useAuth();
  const settings = React.useContext(SettingsContext);
  const [history, setHistory] = useState<ExtractionHistoryRecord[]>([]);
  const [selectedExtraction, setSelectedExtraction] = useState<ExtractionHistoryRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (migrated) {
        return;
      }

      setLoading(true);
      try {
        await migrateLocalStorageToSupabase(user.id);
        const data = await getExtractionHistory(user.id);
        setHistory(data);
        setMigrated(true);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user, migrated]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta entrada del historial?')) {
      return;
    }

    setDeleting(id);
    try {
      const success = await deleteExtractionFromHistory(id);
      if (success && user) {
        const updatedHistory = await getExtractionHistory(user.id);
        setHistory(updatedHistory);
      }
    } catch (error) {
      console.error('Error deleting extraction:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar todo el historial? Esta acción no se puede deshacer.') || !user) {
      return;
    }

    setLoading(true);
    try {
      await Promise.all(history.map(item => deleteExtractionFromHistory(item.id)));
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportExcel = () => {
    if (selectedExtraction) {
        const { data, file_name } = selectedExtraction;
        const exportFileName = file_name.replace(/\.pdf$/i, '') + '_pacientes.xlsx';
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

  const handleExportHTML = () => {
    if (selectedExtraction && settings) {
      const { data, file_name, extraction_date } = selectedExtraction;
      const htmlContent = generateHTMLReport(data, {
        fileName: file_name,
        extractionDate: new Date(extraction_date).toLocaleString(),
        visibleColumns: settings.visibleColumns,
        hideNSSIdentifier: settings.hideNSSIdentifier
      });
      downloadHTMLReport(htmlContent, file_name);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item =>
      item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <LoadingSpinner message="Cargando historial..." />
      </div>
    );
  }

  if (selectedExtraction) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-end gap-3 mb-6">
            <button
                onClick={() => setSelectedExtraction(null)}
                className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Volver a la lista
            </button>
            <button
                onClick={handleExportHTML}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <ArrowDownTrayIcon />
                Exportar a HTML
            </button>
            <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <ArrowDownTrayIcon />
                Exportar a Excel
            </button>
        </div>
        <ReportDetailsView details={selectedExtraction.data.reportDetails} fileName={selectedExtraction.file_name} />
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
                <p className="font-semibold text-sky-400">{item.file_name}</p>
                <p className="text-sm text-slate-400">
                  Extraído el: {new Date(item.extraction_date).toLocaleString()}
                </p>
                </div>
                <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                <button
                    onClick={() => setSelectedExtraction(item)}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg transition-colors"
                    aria-label={`Ver extracción de ${item.file_name}`}
                    disabled={deleting === item.id}
                >
                    <EyeIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Ver</span>
                </button>
                <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 px-3 rounded-lg transition-colors"
                    aria-label={`Eliminar extracción de ${item.file_name}`}
                    disabled={deleting === item.id}
                >
                    <TrashIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">{deleting === item.id ? 'Eliminando...' : 'Eliminar'}</span>
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