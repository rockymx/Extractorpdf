import React from 'react';

interface LoginScreenProps {
  onNavigateBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateBack }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-100 p-4">
      <div className="w-full max-w-sm p-8 space-y-8 bg-slate-800 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700">
        <div>
          <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
            Bienvenido
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Inicia sesión para extraer tus datos
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onNavigateBack(); }}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Usuario</label>
              <input
                id="email-address"
                name="email"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-slate-700 bg-slate-900 placeholder-slate-500 text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Usuario (cualquier valor)"
                defaultValue="demo@user.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-slate-700 bg-slate-900 placeholder-slate-500 text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Contraseña (cualquier valor)"
                defaultValue="password"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-all duration-300 transform hover:scale-105"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};