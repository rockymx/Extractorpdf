
// The raw structure returned by the Gemini API based on our schema
export interface TableFromAI {
  tableName: string;
  headers: string[];
  rows: string[][];
}

// The processed, more usable structure for rendering
export interface ProcessedTable {
  name: string;
  data: Record<string, string>[];
}
