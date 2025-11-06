
import React, { useContext, useState } from 'react';
import type { PatientRecord } from '../types.ts';
import { formatAtencion } from '../utils/fileUtils.ts';
import { SettingsContext } from '../context/SettingsContext.tsx';

interface PatientRecordsTableProps {
  records: PatientRecord[];
}

const allHeaders: { key: keyof PatientRecord | 'atencion'; label: string }[] = [
  { key: 'noProgresivo', label: 'No.' },
  { key: 'nombreDerechohabiente', label: 'Nombre del Paciente' },
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

// Columns that are always visible and not configurable
const mandatoryColumns: string[] = ['noProgresivo', 'nombreDerechohabiente'];

export const PatientRecordsTable: React.FC<PatientRecordsTableProps> = ({ records }) => {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const settings = useContext(SettingsContext);
  
  if (!settings) {
    throw new Error("PatientRecordsTable must be used within a SettingsProvider");
  }

  const { visibleColumns, hideNSSIdentifier } = settings;

  if (!records || records.length === 0) {
    return (
      <div className="bg-slate-800 p-4 rounded-lg my-4 text-slate-400">
        <h3 className="text-xl font-bold text-slate-200 mb-2">Registros de Pacientes</h3>
        <p>No se encontraron registros de pacientes en este documento.</p>
      </div>
    );
  }
  
  const filteredHeaders = allHeaders.filter(header => 
    mandatoryColumns.includes(header.key) || visibleColumns[header.key]
  );

  return (
    <div className="my-8 bg-slate-800/50 rounded-xl shadow-lg overflow-hidden">
      <h3 className="text-xl font-bold text-slate-200 p-4 bg-slate-700/50">Registros de Pacientes</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-200 uppercase bg-slate-700">
            <tr>
              {filteredHeaders.map((header) => (
                <th key={header.key} scope="col" className="px-4 py-3">
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.noProgresivo}
                onClick={() => setSelectedRowId(prevId => (prevId === record.noProgresivo ? null : record.noProgresivo))}
                className={`
                  border-b border-slate-700 cursor-pointer transition-colors duration-150
                  ${selectedRowId === record.noProgresivo
                    ? 'bg-sky-500/30 hover:bg-sky-500/40'
                    : 'odd:bg-slate-800 even:bg-slate-700/50 hover:bg-slate-600/50'
                  }
                `}
              >
                {filteredHeaders.map((header) => {
                  let cellContent: React.ReactNode;

                  if (header.key === 'atencion') {
                    cellContent = formatAtencion(record.inicioAtencion, record.finAtencion);
                  } else if (header.key === 'numeroSeguridadSocial') {
                    let nss = record.numeroSeguridadSocial || '';
                    if (hideNSSIdentifier) {
                      nss = nss.split('-')[0];
                    }
                    cellContent = nss;
                  } else {
                    cellContent = record[header.key as keyof PatientRecord];
                  }

                  return (
                    <td key={`${record.noProgresivo}-${header.key}`} className="px-4 py-3 whitespace-nowrap">
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};