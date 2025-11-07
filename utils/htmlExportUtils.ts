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
  { key: 'atencion', label: 'Inicio y Fin de Atención' },
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

function generateReportDetailsSection(details: ReportDetails, consultationHours: string): string {
  return `
    <div class="report-details">
      <h2>Detalles del Reporte</h2>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Médico:</span>
          <span class="detail-value">${details.nombreMedico || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fecha:</span>
          <span class="detail-value">${details.fecha || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Titular:</span>
          <span class="detail-value">${details.titular || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Unidad Médica:</span>
          <span class="detail-value">${details.unidadMedica || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Consultorio:</span>
          <span class="detail-value">${details.consultorio || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Turno:</span>
          <span class="detail-value">${details.turno || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Horas de Consulta:</span>
          <span class="detail-value">${consultationHours}</span>
        </div>
      </div>
    </div>
  `;
}

function generateStatisticsSection(records: PatientRecord[]): string {
  const totalPatients = records.length;
  const primeraVezCount = records.filter(r => r.primeraVez && r.primeraVez.toLowerCase() === 'si').length;
  const recetasCount = records.reduce((sum, r) => {
    const num = parseInt(r.numeroRecetas || '0');
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  const incapacidadesCount = records.filter(r => r.diasIncapacidad && parseInt(r.diasIncapacidad) > 0).length;

  return `
    <div class="statistics">
      <h2>Resumen Estadístico</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalPatients}</div>
          <div class="stat-label">Total de Pacientes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${primeraVezCount}</div>
          <div class="stat-label">Primera Vez</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${recetasCount}</div>
          <div class="stat-label">Total Recetas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${incapacidadesCount}</div>
          <div class="stat-label">Incapacidades</div>
        </div>
      </div>
    </div>
  `;
}

function generatePatientTable(
  records: PatientRecord[],
  visibleColumns: Record<string, boolean>,
  hideNSSIdentifier: boolean
): string {
  const filteredColumns = columnDefinitions.filter(col =>
    col.mandatory || visibleColumns[col.key]
  );

  const headerRow = filteredColumns.map(col =>
    `<th>${col.label}</th>`
  ).join('');

  const dataRows = records.map((record, index) => {
    const cells = filteredColumns.map(col => {
      const content = getCellContent(record, col.key, hideNSSIdentifier);
      return `<td>${content}</td>`;
    }).join('');

    const rowClass = index % 2 === 0 ? 'even' : 'odd';
    return `<tr class="${rowClass}">${cells}</tr>`;
  }).join('');

  return `
    <div class="table-container">
      <h2>Registros de Pacientes</h2>
      <table>
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
      </table>
    </div>
  `;
}

export function generateHTMLReport(
  data: ExtractionResult,
  options: ExportOptions
): string {
  const { fileName, extractionDate, visibleColumns, hideNSSIdentifier } = options;
  const currentDate = new Date().toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const consultationHours = calculateConsultationHours(data.patientRecords);

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
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #e2e8f0;
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }

    header h1 {
      font-size: 2em;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .header-info {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 15px;
      flex-wrap: wrap;
    }

    .header-info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95em;
    }

    .content {
      padding: 30px;
    }

    h2 {
      color: #0ea5e9;
      font-size: 1.5em;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #334155;
    }

    .report-details {
      background: #334155;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .detail-item {
      display: flex;
      gap: 10px;
      padding: 10px;
      background: #1e293b;
      border-radius: 6px;
    }

    .detail-label {
      font-weight: 600;
      color: #94a3b8;
      min-width: 120px;
    }

    .detail-value {
      color: #e2e8f0;
      font-weight: 500;
    }

    .statistics {
      background: #334155;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 15px;
    }

    .stat-card {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }

    .stat-value {
      font-size: 2.5em;
      font-weight: 700;
      color: white;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 0.9em;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }

    .table-container {
      margin-bottom: 30px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #334155;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 15px;
    }

    thead {
      background: #0ea5e9;
    }

    thead th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: white;
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tbody tr.even {
      background: #334155;
    }

    tbody tr.odd {
      background: #2d3b4e;
    }

    tbody tr:hover {
      background: #3e4f66;
    }

    tbody td {
      padding: 12px 15px;
      color: #e2e8f0;
      border-bottom: 1px solid #1e293b;
      font-size: 0.9em;
    }

    footer {
      background: #0f172a;
      padding: 20px 30px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.9em;
      border-top: 2px solid #334155;
    }

    .footer-info {
      margin-top: 10px;
      display: flex;
      justify-content: center;
      gap: 30px;
      flex-wrap: wrap;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
      }

      header {
        background: #0ea5e9;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .stat-card {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }

    @media (max-width: 768px) {
      .container {
        border-radius: 0;
      }

      .content {
        padding: 20px;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      table {
        font-size: 0.85em;
      }

      thead th, tbody td {
        padding: 10px 8px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📋 Reporte de Extracción de Datos Médicos</h1>
      <div class="header-info">
        <div class="header-info-item">
          <span>📄</span>
          <span><strong>Archivo:</strong> ${fileName}</span>
        </div>
        <div class="header-info-item">
          <span>📅</span>
          <span><strong>Fecha de Extracción:</strong> ${extractionDate}</span>
        </div>
      </div>
    </header>

    <div class="content">
      ${generateReportDetailsSection(data.reportDetails, consultationHours)}
      ${generateStatisticsSection(data.patientRecords)}
      ${generatePatientTable(data.patientRecords, visibleColumns, hideNSSIdentifier)}
    </div>

    <footer>
      <strong>PDF Data Extractor Pro</strong>
      <div class="footer-info">
        <span>Generado: ${currentDate}</span>
        <span>Total de registros: ${data.patientRecords.length}</span>
      </div>
      <p style="margin-top: 10px; font-size: 0.85em;">
        Este reporte fue generado automáticamente. Por favor, verifique la precisión de los datos.
      </p>
    </footer>
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
