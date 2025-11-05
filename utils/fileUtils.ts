
import type { ProcessedTable } from '../types';

// These are global variables exposed by the scripts in index.html
declare const pdfjsLib: any;
declare const XLSX: any;

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
 * Exports an array of processed tables to a single Excel file, with each table on a separate sheet.
 * @param tables The array of ProcessedTable objects to export.
 * @param fileName The name of the Excel file to be downloaded.
 */
export const exportToExcel = (tables: ProcessedTable[], fileName: string) => {
    const wb = XLSX.utils.book_new();
    
    tables.forEach((table, index) => {
        if (table.data.length > 0) {
            // Sanitize sheet name to be compliant with Excel's rules (e.g., <= 31 chars, no invalid chars)
            const sheetName = table.name.replace(/[\\/*?[\]:]/g, '').substring(0, 31) || `Sheet ${index + 1}`;
            const ws = XLSX.utils.json_to_sheet(table.data);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
    });

    XLSX.writeFile(wb, fileName);
};
