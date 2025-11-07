import type { ExtractionResult, PatientRecord, ReportDetails } from '../types';
import { calculateConsultationHours } from './fileUtils';

interface ExportOptions {
  fileName: string;
  extractionDate: string;
  visibleColumns: Record<string, boolean>;
  hideNSSIdentifier: boolean;
}

const columnDefinitions: { key: keyof PatientRecord | 'atencion'; label: string; mandatory?: boolean }[] = [
  { key: 'noProgresivo', label: 'No.', mandatory: true },
  { key: 'nombreDerechohabiente', label: 'Nombre del Paciente', mandatory: true },
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

function formatAtencion(inicio: string, fin: string): string {
  if (!inicio && !fin) return '';
  if (!inicio) return fin;
  if (!fin) return inicio;
  return `${inicio} - ${fin}`;
}

function getCellContent(
  record: PatientRecord,
  key: keyof PatientRecord | 'atencion',
  hideNSSIdentifier: boolean
): string {
  if (key === 'atencion') {
    return formatAtencion(record.inicioAtencion, record.finAtencion);
  }

  if (key === 'numeroSeguridadSocial') {
    let nss = record.numeroSeguridadSocial || '';
    if (hideNSSIdentifier && nss) {
      nss = nss.split('-')[0];
    }
    return nss;
  }

  return record[key as keyof PatientRecord] || '';
}

const userIconSVG = `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

const buildingIconSVG = `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>`;

const clockIconSVG = `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

export function generateHTMLReport(
  data: ExtractionResult,
  options: ExportOptions
): string {
  const { fileName, extractionDate, visibleColumns, hideNSSIdentifier } = options;
  const details = data.reportDetails;
  const consultationHours = calculateConsultationHours(data.patientRecords);

  const filteredColumns = columnDefinitions.filter(col =>
    col.mandatory || visibleColumns[col.key]
  );

  const tableHeaders = filteredColumns.map(col =>
    `<th scope="col">${col.label}</th>`
  ).join('');

  const tableRows = data.patientRecords.map((record, index) => {
    const cells = filteredColumns.map(col => {
      const content = getCellContent(record, col.key, hideNSSIdentifier);
      return `<td>${content}</td>`;
    }).join('');

    const rowClass = index % 2 === 0 ? 'row-odd' : 'row-even';
    return `<tr class="${rowClass}">${cells}</tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Médico - ${fileName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0f172a;
      color: #e2e8f0;
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 16px;
    }

    .report-header {
      background-color: rgba(30, 41, 59, 0.5);
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #334155;
    }

    .header-title {
      font-size: 16px;
      font-weight: 700;
      color: #cbd5e1;
    }

    .header-date {
      font-size: 14px;
      font-weight: 600;
      color: #cbd5e1;
    }

    .details-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon {
      width: 24px;
      height: 24px;
      color: #38bdf8;
      flex-shrink: 0;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 12px;
      font-weight: 500;
      color: #94a3b8;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
    }

    .badge-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .badge-icon {
      font-size: 20px;
      font-weight: 700;
      color: #38bdf8;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .badge-value {
      font-size: 20px;
      font-weight: 700;
      color: #38bdf8;
    }

    .table-section {
      margin: 32px 0;
      background-color: rgba(30, 41, 59, 0.5);
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .table-header {
      font-size: 20px;
      font-weight: 700;
      color: #cbd5e1;
      padding: 16px;
      background-color: rgba(51, 65, 85, 0.5);
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      text-align: left;
      color: #cbd5e1;
    }

    thead {
      font-size: 12px;
      color: #cbd5e1;
      text-transform: uppercase;
      background-color: #334155;
    }

    thead th {
      padding: 12px 16px;
      font-weight: 600;
    }

    tbody tr {
      border-bottom: 1px solid #334155;
      cursor: pointer;
      transition: background-color 150ms;
    }

    tbody tr.row-odd {
      background-color: #1e293b;
    }

    tbody tr.row-even {
      background-color: rgba(51, 65, 85, 0.5);
    }

    tbody tr:hover {
      background-color: rgba(51, 65, 85, 0.5);
    }

    tbody td {
      padding: 12px 16px;
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      body {
        padding: 10px;
      }

      .container {
        padding: 0 8px;
      }

      .report-header {
        padding: 12px;
      }

      .header-top {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .details-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .table-header {
        font-size: 18px;
        padding: 12px;
      }

      table {
        font-size: 12px;
      }

      thead th,
      tbody td {
        padding: 8px 12px;
      }
    }

    @media print {
      body {
        background-color: white;
        color: black;
        padding: 0;
      }

      .report-header,
      .table-section {
        box-shadow: none;
      }

      tbody tr:hover {
        background-color: inherit;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="report-header">
      <div class="header-top">
        <h3 class="header-title">Documento: ${fileName}</h3>
        <span class="header-date">${details.fecha || extractionDate}</span>
      </div>
      <div class="details-row">
        <div class="detail-item">
          ${userIconSVG}
          <div class="detail-content">
            <p class="detail-label">Nombre del Médico</p>
            <p class="detail-value">${details.nombreMedico || '-'}</p>
          </div>
        </div>
        <div class="detail-item">
          ${buildingIconSVG}
          <div class="detail-content">
            <p class="detail-label">Unidad Médica</p>
            <p class="detail-value">${details.unidadMedica || '-'}</p>
          </div>
        </div>
        <div class="detail-item">
          <div class="badge-icon">#</div>
          <div class="detail-content">
            <p class="detail-label">Matrícula Titular</p>
            <p class="detail-value">${details.titular || '-'}</p>
          </div>
        </div>
        <div class="badge-item">
          <span class="badge-value">${details.turno || '-'}</span>
        </div>
        <div class="detail-item">
          ${clockIconSVG}
          <div class="detail-content">
            <p class="detail-label">Horas de Consulta</p>
            <p class="detail-value">${consultationHours}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="table-section">
      <h3 class="table-header">Registros de Pacientes</h3>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              ${tableHeaders}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadHTMLReport(htmlContent: string, fileName: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.replace('.pdf', '')}_reporte.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
