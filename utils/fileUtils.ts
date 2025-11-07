
import type { PatientRecord } from '../types.ts';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Configure PDF.js to use built-in worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
}

/**
 * Extracts all text content from a given PDF file.
 * @param file The PDF file object.
 * @returns A promise that resolves with the full text content of the PDF.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText;
};

/**
 * Formats start and end times into a combined string with duration.
 * e.g., "15:47-15:55 T 8min"
 * @param start The start time string (HH:MM).
 * @param end The end time string (HH:MM).
 * @returns A formatted string.
 */
export const formatAtencion = (start: string, end: string): string => {
  if (start && end && /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end)) {
    try {
      const [startHours, startMinutes] = start.split(':').map(Number);
      const [endHours, endMinutes] = end.split(':').map(Number);

      const startDate = new Date();
      startDate.setHours(startHours, startMinutes, 0, 0);

      const endDate = new Date();
      endDate.setHours(endHours, endMinutes, 0, 0);

      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      const diff = (endDate.getTime() - startDate.getTime()) / 60000;

      if (!isNaN(diff)) {
        return `${start}-${end}  (${Math.round(diff)}min)`;
      }
    } catch (e) {
      // Fallback to default return if parsing fails
    }
  }
  // Default return for any case that isn't two valid times, or if calculation fails
  const parts = [start, end].filter(Boolean);
  return parts.join('-');
};


/**
 * Calculates the total consultation time span from the earliest start to the latest end time.
 * @param records Array of patient records.
 * @returns A formatted string showing the time span (e.g., "8h 30min") or "-" if no valid data.
 */
export const calculateConsultationHours = (records: PatientRecord[]): string => {
  if (!records || records.length === 0) {
    return '-';
  }

  const validTimes: { start: Date; end: Date }[] = [];

  for (const record of records) {
    const { inicioAtencion, finAtencion } = record;

    if (!inicioAtencion || !finAtencion ||
        !/^\d{2}:\d{2}$/.test(inicioAtencion) ||
        !/^\d{2}:\d{2}$/.test(finAtencion)) {
      continue;
    }

    try {
      const [startHours, startMinutes] = inicioAtencion.split(':').map(Number);
      const [endHours, endMinutes] = finAtencion.split(':').map(Number);

      const startDate = new Date();
      startDate.setHours(startHours, startMinutes, 0, 0);

      const endDate = new Date();
      endDate.setHours(endHours, endMinutes, 0, 0);

      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      validTimes.push({ start: startDate, end: endDate });
    } catch (e) {
      continue;
    }
  }

  if (validTimes.length === 0) {
    return '-';
  }

  const earliestStart = validTimes.reduce((min, curr) =>
    curr.start < min ? curr.start : min, validTimes[0].start);

  const latestEnd = validTimes.reduce((max, curr) =>
    curr.end > max ? curr.end : max, validTimes[0].end);

  const diffMs = latestEnd.getTime() - earliestStart.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0 && minutes === 0) {
    return '-';
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
};

/**
 * Exports an array of objects to an Excel file.
 * @param data The array of objects to export.
 * @param fileName The name of the Excel file to be downloaded.
 */
export const exportToExcel = (data: any[], fileName: string) => {
    if (data.length === 0) {
        alert("No data to export.");
        return;
    }
    const wb = XLSX.utils.book_new();
    const sheetName = 'Registros de Pacientes';
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
};