
import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractionResult, PatientRecord } from '../types.ts';

const getApiKey = (providedApiKey?: string): string => {
  if (providedApiKey) {
    return providedApiKey;
  }

  const processEnvKey = (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : undefined;
  const importMetaKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;

  const apiKey = processEnvKey || importMetaKey;

  if (!apiKey) {
    throw new Error("API Key no configurada. Por favor, configúrala en la sección de Configuración.");
  }

  return apiKey;
};

let ai: GoogleGenAI | null = null;

const getAI = (providedApiKey?: string): GoogleGenAI => {
  const currentApiKey = getApiKey(providedApiKey);

  if (!ai || (ai as any)._apiKey !== currentApiKey) {
    ai = new GoogleGenAI({ apiKey: currentApiKey });
    (ai as any)._apiKey = currentApiKey;
  }

  return ai;
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    reportDetails: {
      type: Type.OBJECT,
      description: "Datos generales del encabezado del informe.",
      properties: {
        nombreMedico: { type: Type.STRING, description: "Nombre completo del médico, usualmente encontrado junto a 'NOMBRE DEL MÉDICO(A) NO FAMILIAR'." },
        fecha: { type: Type.STRING, description: "Fecha del informe en formato DD/MM/AAAA, combinando los campos D, M, A." },
        titular: { type: Type.STRING, description: "Número de matrícula del titular, encontrado en 'MATRICULA DEL PRESTADOR DE LA ATENCIÓN'." },
        unidadMedica: { type: Type.STRING, description: "Nombre de la unidad médica, usualmente en la parte superior." },
        consultorio: { type: Type.STRING, description: "Nombre del consultorio." },
        turno: { type: Type.STRING, description: "Turno de la consulta (M/V)." }
      },
      required: ["nombreMedico", "fecha", "titular", "unidadMedica", "consultorio", "turno"]
    },
    patientRecords: {
      type: Type.ARRAY,
      description: "Una lista de todos los registros de pacientes encontrados en el documento.",
      items: {
        type: Type.OBJECT,
        properties: {
          noProgresivo: { type: Type.STRING, description: "Número progresivo que identifica la fila del paciente." },
          nombreDerechohabiente: { type: Type.STRING, description: "Nombre completo del paciente." },
          numeroSeguridadSocial: { type: Type.STRING, description: "Número de seguridad social del paciente." },
          agregadoMedico: { type: Type.STRING, description: "Valores concatenados de las sub-columnas bajo 'AGREGADO MÉDICO'." },
          horaCita: { type: Type.STRING, description: "Hora de la cita programada." },
          inicioAtencion: { type: Type.STRING, description: "Hora en que inició la atención." },
          finAtencion: { type: Type.STRING, description: "Hora en que finalizó la atención." },
          primeraVez: { type: Type.STRING, description: "Indica si es la primera vez del paciente ('SI' o 'NO')." },
          diagnosticoPrincipal: { type: Type.STRING, description: "El texto descriptivo del diagnóstico principal que se encuentra junto a la etiqueta 'DIAGNÓSTICO PRINCIPAL'." },
          numeroRecetas: { type: Type.STRING, description: "Número de recetas emitidas (columna 7)." },
          alta: { type: Type.STRING, description: "Si la columna 'ALTA' está marcada con 'X', el valor es 'X', si no, vacío." },
          diasIncapacidad: { type: Type.STRING, description: "Número de días de incapacidad otorgados." },
          riesgoTrabajo: { type: Type.STRING, description: "Código del riesgo de trabajo." },
          paseOtraUnidad: { type: Type.STRING, description: "Si la columna 'PASE A OTRA UNIDAD' está marcada con 'X', el valor es 'X', si no, vacío." }
        },
        required: ["noProgresivo", "nombreDerechohabiente", "numeroSeguridadSocial", "agregadoMedico", "horaCita", "inicioAtencion", "finAtencion", "primeraVez", "diagnosticoPrincipal", "numeroRecetas", "alta", "diasIncapacidad", "riesgoTrabajo", "paseOtraUnidad"]
      }
    }
  },
  required: ["reportDetails", "patientRecords"]
};

export const extractDataWithGemini = async (pdfText: string, apiKey?: string): Promise<ExtractionResult> => {
  try {
    const prompt = `You are a specialized data extraction AI for medical consultation reports from IMSS Mexico. Your task is to analyze the provided text from a PDF and extract specific information into a structured JSON format. Follow the instructions precisely.

**Extraction Rules:**

1.  **Report Details (Header Information):**
    *   **nombreMedico**: Find the label "NOMBRE DEL MÉDICO(A) NO FAMILIAR" and extract the full name. For "MERAZ RICO ROGELIO", the result is "MERAZ RICO ROGELIO".
    *   **fecha**: Find the "FECHA" section with D, M, A labels. Combine them into a single "DD/MM/AAAA" string. For "03 11 2025", the result is "03/11/2025".
    *   **titular**: Find "MATRICULA DEL PRESTADOR DE LA ATENCIÓN" and get the number under "TITULAR". For "98023992", the result is "98023992".
    *   **unidadMedica**: Find the label "UNIDAD MÉDICA (tipo y número)" and extract its value. For "HGS 9 PTO. PEÑASCO", the result is "HGS 9 PTO. PEÑASCO".
    *   **consultorio**: Find the "CONSULTORIO" label and extract its value. For "Trauma_Orto", the result is "Trauma_Orto".
    *   **turno**: Find the "TURNO: M/V" label and extract the value (e.g., 'V').

2.  **Patient Records (Rows of Data):**
    *   Iterate through each row identified by a "No. PROGRESIVO" number (1, 2, 3, etc.).
    *   For each patient row, extract the following fields:
        *   **noProgresivo**: The number in the "No. PROGRESIVO" column.
        *   **nombreDerechohabiente**: The patient's full name from the "NOMBRE DEL DERECHOHABIENTE" column.
        *   **numeroSeguridadSocial**: The number below the patient's name, from the "NÚMERO DE SEGURIDAD SOCIAL" column.
        *   **agregadoMedico**: This is a critical field. The "AGREGADO MÉDICO" header spans several small, unlabeled sub-columns. You must read across the patient's row and concatenate all values (numbers and letters) from these sub-columns into a single string, separated by spaces. For example, for "No. Progresivo 1", the values are '6', 'F', '1', '5', '0', 'P', 'E'. The correct output for this field must be "6 F 1 5 0 P E".
        *   **horaCita**: The time from the "HORA CITA" column for that patient.
        *   **inicioAtencion**: The time from the "INICIO ATENCIÓN" column.
        *   **finAtencion**: The time from the "FIN ATENCIÓN" column.
        *   **primeraVez**: Extract the text value from column "1" labeled as "1ra. VEZ (SI/NO)".

            PROCESS:
            1. Locate the patient's row by 'nombreDerechohabiente'
            2. Find column "1" (located after "HORA CITA", before column "2")
            3. Read ONLY the text written in that cell: it will be "SI" or "NO"
            4. DO NOT confuse with column "3" (PASE A ESPECIALIDAD) which contains X marks
            5. Ignore any symbols, marks or X - only read plain text

            RULES:
            - If the text says "SI" → return "SI"
            - If the text says "NO" → return "NO"
            - If empty → return "NO"

            WARNING: X marks belong to column 3 (PASE A ESPECIALIDAD), NOT this column.

            Examples:
            - HERNANDEZ ALCARAZ GLORIA: text "SI" in column 1 → "SI"
            - RAMIREZ ARISPE MARIA ISELA: text "SI" in column 1 → "SI" (the visible X is in column 3, not here)
            - CANEDO FLORES RAQUEL: text "SI" in column 1 → "SI"
        *   **diagnosticoPrincipal**: Locate the text labeled "DIAGNÓSTICO PRINCIPAL" within the patient's section. Extract the full text that follows this label. For patient #1, the value is "Gonartrosis, no especificada". For patient #3, the value is "Fractura de los huesos de otro(s) dedo(s) del pie".
        *   **numeroRecetas**: The number from the "NÚMERO DE RECETAS" column (column 5 in the grid with many columns). For row 1, the value is '0'.
        *   **alta**: Check the "ALTA" column (column 4 in the grid with many columns). If it's marked with an 'X', the value is 'X'. Otherwise, return an empty string.
        *   **diasIncapacidad**: Extract the number from the "DÍAS DE INCAPACIDAD" column (column 6 in the grid with many columns). If empty, return an empty string.
        *   **riesgoTrabajo**: Extract the number from the "RIESGO DE TRABAJO" column (column 9 in the grid with many columns). If empty, return an empty string.
        *   **paseOtraUnidad**: Check the "PASE A OTRA UNIDAD" column (column 3 in the grid with many columns). If it's marked with an 'X', the value is 'X'. Otherwise, return an empty string.

**Output Format:**
The output MUST be a valid JSON object adhering strictly to the provided schema. Do not include any text or explanations outside the JSON object. All fields must be strings. If a value is not present, provide an empty string "".

**PDF Text Content:**
---
${pdfText}
---`;
    
    const response = await getAI(apiKey).models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    let jsonString = response.text?.trim() ?? '';
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    if (!jsonString) {
      throw new Error("AI returned an empty response.");
    }
    
    const parsedJson: ExtractionResult = JSON.parse(jsonString);

    if (!parsedJson.reportDetails || !parsedJson.patientRecords) {
      throw new Error("AI response did not contain the required 'reportDetails' or 'patientRecords' fields.");
    }

    // Clean up NSS field by removing all whitespace
    parsedJson.patientRecords.forEach((record: PatientRecord) => {
      if (record.numeroSeguridadSocial) {
        record.numeroSeguridadSocial = record.numeroSeguridadSocial.replace(/\s/g, '');
      }
    });

    return parsedJson;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('JSON'))) {
        throw new Error("AI returned invalid JSON. Please check the PDF content or try again.");
    }
    throw new Error("Failed to extract data using the AI model. The PDF might be too complex or the format unsupported.");
  }
};