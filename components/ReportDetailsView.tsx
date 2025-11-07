
import React from 'react';
import type { ReportDetails, PatientRecord } from '../types.ts';
import { UserCircleIcon } from './icons/UserCircleIcon.tsx';
import { BuildingLibraryIcon } from './icons/BuildingLibraryIcon.tsx';
import { ClockIcon } from './icons/ClockIcon.tsx';
import { calculateConsultationHours } from '../utils/fileUtils.ts';

interface ReportDetailsViewProps {
  details: ReportDetails;
  fileName?: string;
  patientRecords?: PatientRecord[];
}

const DetailItem: React.FC<{ label: string; value: string; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div className="flex items-center gap-2">
    {children}
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-100">{value || '-'}</p>
    </div>
  </div>
);

export const ReportDetailsView: React.FC<ReportDetailsViewProps> = ({ details, fileName, patientRecords }) => {
  const consultationHours = patientRecords ? calculateConsultationHours(patientRecords) : '-';

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
        <h3 className="text-base font-bold text-slate-200">
          {fileName ? `Documento: ${fileName}` : 'Detalles del Reporte'}
        </h3>
        <span className="text-sm font-semibold text-slate-300">{details.fecha}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <DetailItem label="Nombre del Médico" value={details.nombreMedico}>
            <UserCircleIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />
        </DetailItem>
        <DetailItem label="Unidad Médica" value={details.unidadMedica}>
            <BuildingLibraryIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />
        </DetailItem>
        <DetailItem label="Matrícula Titular" value={details.titular}>
            <span className="font-bold text-lg text-sky-400 w-6 h-6 flex items-center justify-center flex-shrink-0">#</span>
        </DetailItem>
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl text-sky-400">{details.turno}</span>
        </div>
        <DetailItem label="Horas de Consulta" value={consultationHours}>
            <ClockIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />
        </DetailItem>
      </div>
    </div>
  );
};