
import type { PatientRecord } from '../types.ts';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import { utils, writeFile } from 'xlsx';

console.log('[DEBUG] fileUtils: Module loaded');
console.log('[DEBUG] fileUtils: PDF.js version:', version);

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
console.log('[DEBUG] fileUtils: PDF.js worker configured');

/**
 * Extracts all text content from a given PDF file.
 * @param file The PDF file object.
 * @returns A promise that resolves with the full text content of the PDF.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
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
        return `${start}-${end} T ${Math.round(diff)}min`;
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
 * Exports an array of objects to an Excel file.
 * @param data The array of objects to export.
 * @param fileName The name of the Excel file to be downloaded.
 */
export const exportToExcel = (data: any[], fileName: string) => {
    if (data.length === 0) {
        alert("No data to export.");
        return;
    }
    const wb = utils.book_new();
    const sheetName = 'Registros de Pacientes';
    const ws = utils.json_to_sheet(data);
    utils.book_append_sheet(wb, ws, sheetName);
    writeFile(wb, fileName);
};