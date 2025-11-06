
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log('[DEBUG] index.tsx: Script started loading');

try {
  console.log('[DEBUG] index.tsx: Looking for root element');
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('[DEBUG] index.tsx: Root element not found!');
    throw new Error("Could not find root element to mount to");
  }

  console.log('[DEBUG] index.tsx: Root element found, creating React root');
  const root = ReactDOM.createRoot(rootElement);

  console.log('[DEBUG] index.tsx: Rendering App component');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log('[DEBUG] index.tsx: App rendered successfully');
} catch (error) {
  console.error('[DEBUG] index.tsx: Error during initialization:', error);
  throw error;
}