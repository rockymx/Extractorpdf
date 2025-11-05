
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { OptionsScreen } from './components/OptionsScreen.tsx';
import { FileUpload } from './components/FileUpload.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { ReportDetailsView } from './components/ReportDetailsView.tsx';
import { PatientRecordsTable } from './components/PatientRecordsTable.tsx';
import { ArrowDownTrayIcon } from './components/icons/ArrowDownTrayIcon.tsx';
import { extractTextFromPdf, exportToExcel, formatAtencion } from './utils/fileUtils.ts';
import { extractDataWithGemini } from './services/geminiService.ts';
import { getHistory, saveExtraction } from './utils/storageUtils.ts';
import type { ExtractionResult, StoredExtraction } from './types.ts';
import { ConfigurationScreen } from './components/ConfigurationScreen.tsx';
import { ShowDataScreen } from './components/ShowDataScreen.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { HistoryScreen } from './components/HistoryScreen.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';

export type CurrentPage = 'main' | 'config' | 'showData' | 'history' | 'login';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<CurrentPage>('main');
  const [workflow, setWorkflow] = useState<'excel' | 'database' | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileProcess = useCallback(async (file: File) => {
    setPdfFile(file);
    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const textContent = await extractTextFromPdf(file);
      if (!textContent.trim()) {
        throw new Error("Could not extract text from the PDF. The file might be empty or image-based without OCR text layer.");
      }
      
      const data = await extractDataWithGemini(textContent);
      
      const newExtraction: StoredExtraction = {
        id: new Date().toISOString(),
        fileName: file.name,
        extractionDate: new Date().toLocaleString(),
        data: data,
      };
      saveExtraction(newExtraction);
      setExtractedData(data);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setWorkflow(null);
    setPdfFile(null);
    setExtractedData(null);
    setError(null);
    setIsLoading(false);
    setCurrentPage('main');
  };
  
  const handleExport = () => {
    if (extractedData?.patientRecords && pdfFile) {
        const fileName = pdfFile.name.replace(/\.pdf$/i, '') + '_pacientes.xlsx';
        const dataForExport = extractedData.patientRecords.map(record => ({
            'No.': record.noProgresivo,
            'Nombre del Paciente': record.nombreDerechohabiente,
            'Diagnóstico Principal': record.diagnosticoPrincipal,
            'NSS': record.numeroSeguridadSocial,
            'Hora Cita': record.horaCita,
            'Inicio y Fin de Atencion': formatAtencion(record.inicioAtencion, record.finAtencion),
            '1ra Vez': record.primeraVez,
            'Recetas': record.numeroRecetas,
            'Días Incap.': record.diasIncapacidad,
            'Alta': record.alta,
            'Pase Unidad': record.paseOtraUnidad,
            'Riesgo Trab.': record.riesgoTrabajo,
        }));
        exportToExcel(dataForExport, fileName);
    }
  };
  
  const navigateTo = (page: CurrentPage) => {
      // If navigating away from the main workflow, reset it
      if (page !== 'main' && currentPage === 'main') {
          // Keep workflow state if just navigating between config/history/etc.
          // Reset only when starting a new workflow page from another page.
      }
      if (page === 'main' && currentPage !== 'main') {
        handleReset();
      }
      setCurrentPage(page);
  };

  const renderMainContent = () => {
    if (!workflow) {
      return (
        <div className="w-full">
            <OptionsScreen onSelectWorkflow={setWorkflow} />
        </div>
      );
    }

    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-300">
                {pdfFile?.name ? `Resultados para: ${pdfFile.name}` : (workflow === 'excel' ? 'Exportar a Excel' : 'Base de datos en la App')}
            </h2>
            <button
                onClick={handleReset}
                className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Empezar de nuevo
            </button>
        </div>

        {!pdfFile && <FileUpload onFileSelect={handleFileProcess} />}

        {isLoading && <LoadingSpinner />}
        
        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg my-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {extractedData && (
          <div className="mt-8">
            {workflow === 'excel' && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        <ArrowDownTrayIcon />
                        Exportar Pacientes a Excel
                    </button>
                </div>
            )}
            <ReportDetailsView details={extractedData.reportDetails} />
            <PatientRecordsTable records={extractedData.patientRecords} />
          </div>
        )}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onNavigateBack={() => {}} />;
  }

  return (
    <SettingsProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        <Header onNavigate={navigateTo} />
        <main className="flex-grow flex flex-col items-center justify-center">
          {currentPage === 'main' && renderMainContent()}
          {currentPage === 'config' && <ConfigurationScreen onNavigateBack={() => navigateTo('main')} />}
          {currentPage === 'showData' && <ShowDataScreen onNavigateBack={() => navigateTo('main')} />}
          {currentPage === 'history' && <HistoryScreen onNavigateBack={() => navigateTo('main')} />}
          {currentPage === 'login' && <LoginScreen onNavigateBack={() => navigateTo('main')} />}
        </main>
      </div>
    </SettingsProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;