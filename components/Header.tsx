
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm p-4 shadow-lg sticky top-0 z-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
          PDF Data Extractor Pro
        </h1>
        <p className="text-slate-400">Extrae datos de tablas de tus PDFs con IA</p>
      </div>
    </header>
  );
};
