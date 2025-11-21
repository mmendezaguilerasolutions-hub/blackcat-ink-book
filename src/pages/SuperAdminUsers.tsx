import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/admin/UserTable';
import { UserForm } from '@/components/admin/UserForm';
import { useUsers, UserWithRoles } from '@/hooks/useUsers';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { ArrowLeft, UserPlus, RefreshCw } from 'lucide-react';

export default function SuperAdminUsers() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: checkingRole } = useSuperAdmin();
  const { users, loading, createUser, updateUser, resetPassword, toggleUserActive, fetchUsers } = useUsers();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            No tienes permisos para acceder a esta página
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleEditUser = (user: UserWithRoles) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingUser) {
      return await updateUser(data);
    } else {
      return await createUser(data);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
              <p className="text-muted-foreground mt-1">
                Administra todos los usuarios del sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleCreateUser}>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          </div>
        ) : (
          <UserTable
            users={users}
            onEdit={handleEditUser}
            onToggleActive={toggleUserActive}
            onResetPassword={resetPassword}
          />
        )}

        <UserForm
          open={formOpen}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          editUser={editingUser}
        />
      </div>
    </div>
  );
}
