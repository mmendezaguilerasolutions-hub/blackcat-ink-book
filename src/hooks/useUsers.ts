import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserWithRoles {
  user_id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  email_confirmed_at: string | null;
  created_at: string;
  roles: string[];
}

interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  roles?: string[];
  sendInvitation?: boolean;
}

interface UpdateUserData {
  userId: string;
  email?: string;
  displayName?: string;
  roles?: string[];
  isActive?: boolean;
}

export function useUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_users_with_roles');

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los usuarios',
          variant: 'destructive',
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar usuarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('admin-create-user', {
        body: userData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Error al crear usuario');
      }

      toast({
        title: 'Éxito',
        description: response.data.message || 'Usuario creado exitosamente',
      });

      await fetchUsers();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = async (userData: UpdateUserData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('admin-update-user', {
        body: userData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Error al actualizar usuario');
      }

      toast({
        title: 'Éxito',
        description: 'Usuario actualizado exitosamente',
      });

      await fetchUsers();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (userId: string, sendResetLink: boolean = true) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('admin-reset-password', {
        body: { userId, sendResetLink },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Error al resetear contraseña');
      }

      toast({
        title: 'Éxito',
        description: response.data.message || 'Contraseña reseteada exitosamente',
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    return updateUser({ userId, isActive });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    resetPassword,
    toggleUserActive,
  };
}
