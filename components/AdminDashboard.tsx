import React, { useEffect, useState } from 'react';
import { adminService, AdminUser } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { TrashIcon } from './icons/TrashIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { ArrowRightOnRectangleIcon } from './icons/ArrowRightOnRectangleIcon';

export const AdminDashboard: React.FC = () => {
  const { signOut, impersonateUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('[AdminDashboard.loadUsers] Loading users...');
      setLoading(true);
      setError(null);
      const allUsers = await adminService.getAllUsers();
      console.log('[AdminDashboard.loadUsers] Users loaded:', allUsers);
      setUsers(allUsers);
    } catch (err) {
      console.error('[AdminDashboard.loadUsers] Error loading users:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'user', email: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'promover a administrador' : 'cambiar a usuario regular';

    if (!confirm(`¿Seguro que deseas ${action} a ${email}?`)) {
      return;
    }

    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Error al actualizar el rol del usuario');
      console.error(err);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean, email: string) => {
    const action = currentStatus ? 'desactivar' : 'activar';

    if (!confirm(`¿Seguro que deseas ${action} la cuenta de ${email}?`)) {
      return;
    }

    try {
      console.log(`[AdminDashboard.handleToggleStatus] Toggling status for ${email} (${userId}): ${currentStatus} -> ${!currentStatus}`);
      await adminService.toggleUserStatus(userId, currentStatus);

      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          const updated = { ...u, is_active: !currentStatus };
          console.log(`[AdminDashboard.handleToggleStatus] Updated user in state:`, updated);
          return updated;
        }
        return u;
      });

      setUsers(updatedUsers);
      console.log('[AdminDashboard.handleToggleStatus] All users after update:', updatedUsers);

      await loadUsers();
      console.log('[AdminDashboard.handleToggleStatus] Reloaded users from database');
    } catch (err) {
      console.error('[AdminDashboard.handleToggleStatus] Error updating status:', err);
      alert('Error al actualizar el estado del usuario');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleImpersonate = async (userId: string, email: string) => {
    if (!confirm(`¿Seguro que deseas iniciar sesión como ${email}?`)) {
      return;
    }

    try {
      await impersonateUser(userId, email);
    } catch (err) {
      alert('Error al iniciar sesión como usuario');
      console.error(err);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
              <p className="text-sm text-gray-400 mt-1">Gestión de usuarios del sistema</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Usuarios Registrados</h2>
              <div className="text-sm text-gray-400">
                Total: <span className="text-white font-semibold">{users.length}</span>
              </div>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border-b border-red-800">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Último Acceso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-blue-900/50 text-blue-300'
                              : 'bg-gray-800 text-gray-300'
                          }`}
                        >
                          {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-red-900/50 text-red-300'
                          }`}
                        >
                          {user.is_active ? 'Activo' : 'Desactivado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(user.last_sign_in_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active, user.email)}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                              user.is_active
                                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                            }`}
                          >
                            {user.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => handleImpersonate(user.id, user.email)}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg transition-colors bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                            title="Iniciar sesión como este usuario"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            Iniciar sesión
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-400 mb-2">Información</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Los usuarios desactivados no podrán usar la función de escaneo con IA</li>
            <li>• Los cambios se aplican inmediatamente</li>
            <li>• Los usuarios desactivados verán un mensaje con información de contacto</li>
          </ul>
        </div>
      </main>
    </div>
  );
};
