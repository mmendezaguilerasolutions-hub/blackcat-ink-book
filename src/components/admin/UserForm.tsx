import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { UserWithRoles } from '@/hooks/useUsers';

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  displayName: z.string().optional(),
  roles: z.array(z.string()).min(1, 'Selecciona al menos un rol'),
  sendInvitation: z.boolean(),
});

const updateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  displayName: z.string().min(1, 'El nombre es obligatorio'),
  roles: z.array(z.string()).min(1, 'Selecciona al menos un rol'),
  isActive: z.boolean(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<{ success: boolean }>;
  editUser?: UserWithRoles | null;
}

const availableRoles = ['superadmin', 'admin', 'staff', 'user'];

export function UserForm({ open, onClose, onSubmit, editUser }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!editUser;

  const form = useForm<CreateUserFormValues | UpdateUserFormValues>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: isEditing
      ? {
          email: editUser.email,
          displayName: editUser.display_name,
          roles: editUser.roles || [],
          isActive: editUser.is_active,
        }
      : {
          email: '',
          password: '',
          displayName: '',
          roles: ['user'],
          sendInvitation: true,
        },
  });

  // Actualizar el formulario cuando cambia editUser o se abre el diálogo
  useEffect(() => {
    if (open) {
      if (isEditing && editUser) {
        form.reset({
          email: editUser.email,
          displayName: editUser.display_name,
          roles: editUser.roles || [],
          isActive: editUser.is_active,
        });
      } else {
        form.reset({
          email: '',
          password: '',
          displayName: '',
          roles: ['user'],
          sendInvitation: true,
        });
      }
    }
  }, [open, isEditing, editUser, form]);

  const handleSubmit = async (data: CreateUserFormValues | UpdateUserFormValues) => {
    setLoading(true);
    try {
      const submitData = isEditing
        ? { ...data, userId: editUser.user_id }
        : data;

      const result = await onSubmit(submitData);
      
      if (result.success) {
        form.reset();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica la información del usuario'
              : 'Completa el formulario para crear un nuevo usuario'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>
                      Mínimo 8 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre para Mostrar {!isEditing && '(Opcional)'}</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormDescription>
                    {!isEditing && 'Si no se especifica, se usará el email'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roles"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Roles</FormLabel>
                    <FormDescription>
                      Selecciona los roles para este usuario
                    </FormDescription>
                  </div>
                  {availableRoles.map((role) => (
                    <FormField
                      key={role}
                      control={form.control}
                      name="roles"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={role}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, role])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {role}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="sendInvitation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enviar Invitación</FormLabel>
                      <FormDescription>
                        Enviar email de invitación al usuario
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {isEditing && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Usuario Activo</FormLabel>
                      <FormDescription>
                        El usuario puede iniciar sesión
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
