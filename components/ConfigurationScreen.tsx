
import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext, configurableColumns } from '../context/SettingsContext';

interface ConfigurationScreenProps {
  onNavigateBack: () => void;
}

export const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({ onNavigateBack }) => {
  const settingsContext = useContext(SettingsContext);
  const [localApiKey, setLocalApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settingsContext?.apiKey) {
      setLocalApiKey(settingsContext.apiKey);
    }
  }, [settingsContext?.apiKey]);

  const handleSave = async () => {
    if (!localApiKey.trim() || !settingsContext) {
      return;
    }

    setSaving(true);
    try {
      await settingsContext.setApiKey(localApiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving API key:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!settingsContext) {
      return;
    }

    setSaving(true);
    try {
      await settingsContext.setApiKey('');
      setLocalApiKey('');
      setSaved(false);
    } catch (error) {
      console.error('Error clearing API key:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-200">Configuración</h2>
        <button
          onClick={onNavigateBack}
          className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Volver
        </button>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Google Gemini API Key</h3>
          <p className="text-slate-400 text-sm mb-4">
            Ingresa tu API key de Google Gemini para usar la funcionalidad de extracción de datos.
            Puedes obtener una clave gratuita en{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Google AI Studio
            </a>
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!localApiKey.trim() || saving}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleClear}
                disabled={saving}
                className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>

            {saved && (
              <div className="bg-green-600/20 border border-green-600/50 text-green-400 px-4 py-2 rounded-lg">
                ✓ API Key guardada correctamente
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <h4 className="text-lg font-semibold text-slate-200 mb-2">Nota de Seguridad</h4>
          <p className="text-slate-400 text-sm">
            Tu API key se guarda de forma segura en Supabase y está vinculada a tu cuenta. Solo tú puedes acceder a ella y nunca se envía a ningún servidor excepto a Google Gemini para procesar tus PDFs.
          </p>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Columnas Visibles</h3>
          <p className="text-slate-400 text-sm mb-4">
            Selecciona qué columnas deseas ver en la tabla de pacientes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {configurableColumns.map((col) => (
              <div key={col.key} className="relative group">
                <label className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-700/30 hover:bg-slate-700/50 transition-colors ${col.inDevelopment ? 'opacity-60' : ''}`}>
                  <input
                    type="checkbox"
                    checked={settingsContext?.visibleColumns[col.key] || false}
                    onChange={(e) => {
                      if (settingsContext) {
                        settingsContext.setVisibleColumns(prev => ({
                          ...prev,
                          [col.key]: e.target.checked
                        }));
                      }
                    }}
                    disabled={col.inDevelopment}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-slate-200">{col.label}</span>
                  {col.inDevelopment && (
                    <span className="ml-auto text-xs text-amber-400">⚠️ En desarrollo</span>
                  )}
                </label>
                {col.inDevelopment && (
                  <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 border border-amber-500/50 rounded-lg shadow-xl z-10">
                    <p className="text-sm text-amber-300">
                      ⚠️ Esta columna está en desarrollo. La extracción de datos para este campo aún no está optimizada y puede contener errores.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Privacidad NSS</h3>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={settingsContext?.hideNSSIdentifier || false}
              onChange={(e) => {
                if (settingsContext) {
                  settingsContext.setHideNSSIdentifier(e.target.checked);
                }
              }}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <div>
              <span className="text-slate-200">Ocultar últimos dígitos del NSS</span>
              <p className="text-slate-400 text-sm mt-1">
                Muestra solo los primeros 10 dígitos del Número de Seguridad Social para mayor privacidad
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
