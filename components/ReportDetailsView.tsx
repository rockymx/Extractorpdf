
import React from 'react';
import type { ReportDetails } from '../types.ts';
import { UserCircleIcon } from './icons/UserCircleIcon.tsx';
import { CalendarIcon } from './icons/CalendarIcon.tsx';
import { BuildingLibraryIcon } from './icons/BuildingLibraryIcon.tsx';

interface ReportDetailsViewProps {
  details: ReportDetails;
  fileName?: string;
}

const DetailItem: React.FC<{ label: string; value: string; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div className="flex items-start gap-3">
    {children}
    <div>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-100">{value || '-'}</p>
    </div>
  </div>
);

export const ReportDetailsView: React.FC<ReportDetailsViewProps> = ({ details, fileName }) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-2xl font-bold text-slate-200 mb-6 border-b border-slate-700 pb-3">
        {fileName ? `Documento: ${fileName}` : 'Detalles del Reporte'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <DetailItem label="Nombre del Médico" value={details.nombreMedico}>
            <UserCircleIcon className="w-8 h-8 text-sky-400 flex-shrink-0" />
        </DetailItem>
        <DetailItem label="Fecha" value={details.fecha}>
            <CalendarIcon className="w-8 h-8 text-sky-400 flex-shrink-0" />
        </DetailItem>
        <DetailItem label="Unidad Médica" value={details.unidadMedica}>
            <BuildingLibraryIcon className="w-8 h-8 text-sky-400 flex-shrink-0" />
        </DetailItem>
        <DetailItem label="Matrícula Titular" value={details.titular}>
            <span className="font-bold text-2xl text-sky-400 w-8 h-8 flex items-center justify-center flex-shrink-0">#</span>
        </DetailItem>
        <DetailItem label="Consultorio" value={details.consultorio}>
             <span className="font-bold text-xl text-sky-400 w-8 h-8 flex items-center justify-center flex-shrink-0">¶</span>
        </DetailItem>
        <DetailItem label="Turno" value={details.turno}>
             <span className="font-bold text-2xl text-sky-400 w-8 h-8 flex items-center justify-center flex-shrink-0">{details.turno}</span>
        </DetailItem>
      </div>
    </div>
  );
};