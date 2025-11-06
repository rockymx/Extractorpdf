
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

console.log('[DEBUG] index.tsx: Script started loading');

// Add a visual indicator immediately
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 18px; text-align: center;';
loadingIndicator.innerHTML = '<p>Cargando aplicación...</p><p style="font-size: 12px; margin-top: 10px;">Si ves este mensaje por más de 5 segundos, revisa la consola (F12)</p>';
document.body.appendChild(loadingIndicator);

try {
  console.log('[DEBUG] index.tsx: Looking for root element');
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('[DEBUG] index.tsx: Root element not found!');
    document.body.innerHTML = '<div style="color: red; padding: 20px;">ERROR: No se encontró el elemento root en el HTML</div>';
    throw new Error("Could not find root element to mount to");
  }

  console.log('[DEBUG] index.tsx: Root element found, creating React root');
  const root = ReactDOM.createRoot(rootElement);

  console.log('[DEBUG] index.tsx: Rendering App component');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  console.log('[DEBUG] index.tsx: App rendered successfully');

  // Remove loading indicator after render
  setTimeout(() => {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      indicator.remove();
    }
  }, 1000);

} catch (error) {
  console.error('[DEBUG] index.tsx: Error during initialization:', error);
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: monospace;">
      <h1>Error de Inicialización</h1>
      <p>${error instanceof Error ? error.message : 'Error desconocido'}</p>
      <p style="font-size: 12px; margin-top: 20px;">Abre la consola del navegador (F12) para más detalles</p>
    </div>
  `;
  throw error;
}