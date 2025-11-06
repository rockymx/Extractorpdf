
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { Header } from './components/Header.tsx';
import { OptionsScreen } from './components/OptionsScreen.tsx';
import { FileUpload } from './components/FileUpload.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { ReportDetailsView } from './components/ReportDetailsView.tsx';
import { PatientRecordsTable } from './components/PatientRecordsTable.tsx';
import { ArrowDownTrayIcon } from './components/icons/ArrowDownTrayIcon.tsx';
import { extractTextFromPdf, exportToExcel, formatAtencion } from './utils/fileUtils.ts';
import { generateHTMLReport, downloadHTMLReport } from './utils/htmlExportUtils.ts';
import { extractDataWithGemini } from './services/geminiService.ts';
import { getHistory, saveExtraction } from './utils/storageUtils.ts';
import type { ExtractionResult, StoredExtraction } from './types.ts';
import { ConfigurationScreen } from './components/ConfigurationScreen.tsx';
import { ShowDataScreen } from './components/ShowDataScreen.tsx';
import { SettingsProvider, SettingsContext } from './context/SettingsContext.tsx';
import { HistoryScreen } from './components/HistoryScreen.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { saveExtractionToHistory } from './services/extractionHistoryService.ts';

export type CurrentPage = 'main' | 'config' | 'showData' | 'history' | 'login';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const settingsContext = useContext(SettingsContext);
  const [currentPage, setCurrentPage] = useState<CurrentPage>('main');
  const [workflow, setWorkflow] = useState<'excel' | 'database' | null>('database');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileProcess = useCallback(async (file: File) => {
    if (!settingsContext?.apiKey || settingsContext.apiKey.trim() === '') {
      setError('Por favor, configura tu API Key de Gemini en la sección de Configuración.');
      return;
    }

    setPdfFile(file);
    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const textContent = await extractTextFromPdf(file);
      if (!textContent.trim()) {
        throw new Error("Could not extract text from the PDF. The file might be empty or image-based without OCR text layer.");
      }

      const data = await extractDataWithGemini(textContent, settingsContext.apiKey);

      if (user) {
        await saveExtractionToHistory(user.id, file.name, data);
      } else {
        const newExtraction: StoredExtraction = {
          id: new Date().toISOString(),
          fileName: file.name,
          extractionDate: new Date().toLocaleString(),
          data: data,
        };
        saveExtraction(newExtraction);
      }

      setExtractedData(data);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [user, settingsContext?.apiKey]);

  const handleReset = () => {
    setWorkflow('database');
    setPdfFile(null);
    setExtractedData(null);
    setError(null);
    setIsLoading(false);
    setCurrentPage('main');
  };
  
  const handleExport = () => {
    if (extractedData?.patientRecords && pdfFile) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const dateStr = `${day}${month}${year}`;

        const baseFileName = pdfFile.name.replace(/\.pdf$/i, '');
        const fileName = `${baseFileName}_${dateStr}.xlsx`;

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

  const handleExportHTML = () => {
    if (extractedData && pdfFile && settingsContext) {
      const htmlContent = generateHTMLReport(extractedData, {
        fileName: pdfFile.name,
        extractionDate: new Date().toLocaleString(),
        visibleColumns: settingsContext.visibleColumns,
        hideNSSIdentifier: settingsContext.hideNSSIdentifier
      });
      downloadHTMLReport(htmlContent, pdfFile.name);
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
      <div className="w-full max-w-[1600px] mx-auto px-4 py-8">
        {!pdfFile && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-300">
                {workflow === 'excel' ? 'Exportar a Excel' : 'Base de datos en la App'}
              </h2>
              <button
                onClick={handleReset}
                className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Empezar de nuevo
              </button>
            </div>
            <FileUpload onFileSelect={handleFileProcess} />
          </>
        )}

        {pdfFile && (
          <div className="flex justify-end mb-6">
            <button
              onClick={handleReset}
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Empezar de nuevo
            </button>
          </div>
        )}

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
                <div className="flex justify-end gap-3 mb-4">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        <ArrowDownTrayIcon />
                        Exportar a Excel
                    </button>
                    <button
                        onClick={handleExportHTML}
                        className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        <ArrowDownTrayIcon />
                        Exportar a HTML
                    </button>
                </div>
            )}
            <ReportDetailsView details={extractedData.reportDetails} fileName={pdfFile?.name} />
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

  if (settingsContext?.isLoadingSettings) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner message="Cargando configuración..." />
      </div>
    );
  }

  return (
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
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;