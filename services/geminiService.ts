
import { GoogleGenAI, Type } from "@google/genai";
import type { TableFromAI, ProcessedTable } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    tables: {
      type: Type.ARRAY,
      description: "An array of all tables found in the document text.",
      items: {
        type: Type.OBJECT,
        properties: {
          tableName: { 
            type: Type.STRING, 
            description: "A descriptive name for the table, inferred from surrounding text (e.g., 'Summary of Results', 'Product List')." 
          },
          headers: { 
            type: Type.ARRAY, 
            description: "An array of strings representing the column headers.",
            items: { type: Type.STRING } 
          },
          rows: {
            type: Type.ARRAY,
            description: "An array of rows, where each row is an array of strings representing the cell values in that row.",
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        },
        required: ["tableName", "headers", "rows"]
      }
    }
  }
};

const transformAiData = (aiTables: TableFromAI[]): ProcessedTable[] => {
  return aiTables.map(table => {
    const data = table.rows.map(row => {
      const rowObject: Record<string, string> = {};
      table.headers.forEach((header, index) => {
        // Use a clean version of header as key
        const key = header.trim() || `column_${index + 1}`;
        rowObject[key] = row[index] || '';
      });
      return rowObject;
    }).filter(row => Object.values(row).some(val => val.trim() !== '')); // Filter out empty rows
    
    return {
      name: table.tableName,
      data: data
    };
  });
};


export const extractDataWithGemini = async (pdfText: string): Promise<ProcessedTable[]> => {
  try {
    const prompt = `You are an expert data extraction assistant. Analyze the following text content extracted from a PDF file. Your task is to identify all tables within the text and convert them into a structured JSON format. Pay close attention to column headers and row data. Disregard any non-tabular text. The output must be a valid JSON object that adheres to the provided schema.

Text content:
---
${pdfText}
---`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);

    if (!parsedJson.tables || !Array.isArray(parsedJson.tables)) {
      throw new Error("AI response did not contain a 'tables' array.");
    }

    return transformAiData(parsedJson.tables);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to extract data using the AI model. The PDF might be too complex or the format unsupported.");
  }
};
