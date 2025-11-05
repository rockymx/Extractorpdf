
import React, { useState, useCallback } from 'react';
import { DocumentArrowUpIcon } from './icons/DocumentArrowUpIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type === 'application/pdf') {
        onFileSelect(files[0]);
      } else {
        alert('Por favor, sube solo archivos PDF.');
      }
    }
  }, [onFileSelect]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        onFileSelect(files[0]);
    }
  };

  return (
    <div 
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-300 ${isDragging ? 'border-sky-500 bg-sky-900/20' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
        <input type="file" id="file-upload" className="hidden" accept=".pdf" onChange={handleFileChange} />
        <label htmlFor="file-upload" className="cursor-pointer">
            <DocumentArrowUpIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-xl font-semibold text-slate-300">Arrastra y suelta tu archivo PDF aquí</p>
            <p className="text-slate-500 mt-2">o haz clic para seleccionar un archivo</p>
        </label>
    </div>
  );
};
