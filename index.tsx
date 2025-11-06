
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

try {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    document.body.innerHTML = '<div style="color: red; padding: 20px;">ERROR: No se encontró el elemento root en el HTML</div>';
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

} catch (error) {
  console.error('Error during initialization:', error);
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: monospace;">
      <h1>Error de Inicialización</h1>
      <p>${error instanceof Error ? error.message : 'Error desconocido'}</p>
      <p style="font-size: 12px; margin-top: 20px;">Abre la consola del navegador (F12) para más detalles</p>
    </div>
  `;
  throw error;
}