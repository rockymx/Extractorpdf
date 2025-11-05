// Section 1: General report data
export interface ReportDetails {
  nombreMedico: string;
  fecha: string;
  titular: string;
  unidadMedica: string;
  consultorio: string;
  turno: string;
}

// Section 2: A single patient record
export interface PatientRecord {
  noProgresivo: string;
  nombreDerechohabiente: string;
  numeroSeguridadSocial: string;
  agregadoMedico: string;
  horaCita: string;
  inicioAtencion: string;
  finAtencion: string;
  primeraVez: string;
  diagnosticoPrincipal: string;
  numeroRecetas: string;
  alta: string;
  diasIncapacidad: string;
  riesgoTrabajo: string;
  paseOtraUnidad: string;
}

// The complete, structured result from Gemini
export interface ExtractionResult {
  reportDetails: ReportDetails;
  patientRecords: PatientRecord[];
}


// A single extraction record saved in localStorage
export interface StoredExtraction {
  id: string;
  fileName: string;
  extractionDate: string;
  data: ExtractionResult;
}