import React from 'react';
import { useAuth } from '../context/AuthContext';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, impersonatedUserEmail, stopImpersonation } = useAuth();

  if (!isImpersonating || !impersonatedUserEmail) {
    return null;
  }

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation();
    } catch (err) {
      console.error('Error al detener impersonación:', err);
      alert('Error al regresar a la cuenta de administrador');
    }
  };

  return (
    <div className="bg-yellow-600 border-b-2 border-yellow-700 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-800 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-yellow-200">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              Modo de Impersonación Activo
            </p>
            <p className="text-yellow-100 text-xs">
              Sesión iniciada como: <span className="font-medium">{impersonatedUserEmail}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleStopImpersonation}
          className="bg-white hover:bg-yellow-50 text-yellow-900 font-semibold px-4 py-2 rounded-lg transition-colors shadow-md text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Volver a Administrador
        </button>
      </div>
    </div>
  );
};
