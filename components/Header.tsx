
import React, { useState, useEffect, useRef } from 'react';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon.tsx';
import type { CurrentPage } from '../App.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
    onNavigate: (page: CurrentPage) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigate = (page: CurrentPage) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm p-4 shadow-lg sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div>
            <a href="#" onClick={() => handleNavigate('main')} className="cursor-pointer">
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                Datos de mi Consulta
              </h1>
              <p className="text-slate-400">Extrae datos de tablas de tus PDFs con IA</p>
            </a>
        </div>
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-slate-700 transition-colors"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                aria-label="Abrir menú de configuración"
            >
                <Cog6ToothIcon className="w-6 h-6 text-slate-300" />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-md shadow-lg py-1 z-20 border border-slate-700">
                    {user && (
                      <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-700">
                        {user.email}
                      </div>
                    )}
                    <button
                        onClick={() => handleNavigate('history')}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                    >
                        Historial
                    </button>
                    <div className="border-t border-slate-700 my-1"></div>
                    <button
                        onClick={() => handleNavigate('config')}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                    >
                        Configuración
                    </button>
                    <button
                        onClick={() => handleNavigate('showData')}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                    >
                        Mostrar Datos
                    </button>
                    <div className="border-t border-slate-700 my-1"></div>
                    <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};