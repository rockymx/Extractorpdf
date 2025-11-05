
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { OptionsScreen } from './components/OptionsScreen';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ArrowDownTrayIcon } from './components/icons/ArrowDownTrayIcon';
import { extractTextFromPdf, exportToExcel } from './utils/fileUtils';
import { extractDataWithGemini } from './services/geminiService';
import type { ProcessedTable } from './types';

type Workflow = 'excel' | 'database' | null;

const App: React.FC = () => {
  const [workflow, setWorkflow] = useState<Workflow>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ProcessedTable[] | null>(null);
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
  };
  
  const handleExport = () => {
    if (extractedData && pdfFile) {
        const fileName = pdfFile.name.replace(/\.pdf$/i, '') + '_extracted_data.xlsx';
        exportToExcel(extractedData, fileName);
    }
  };

  const renderContent = () => {
    if (!workflow) {
      return <OptionsScreen onSelectWorkflow={setWorkflow} />;
    }

    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
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
                        Exportar a Excel
                    </button>
                </div>
            )}
            {extractedData.map((table, index) => (
                <DataTable key={index} table={table} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
