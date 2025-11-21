import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import { UserWithRoles } from '@/hooks/useUsers';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserTableProps {
  users: UserWithRoles[];
  onEdit: (user: UserWithRoles) => void;
  onToggleActive: (userId: string, isActive: boolean) => void;
  onResetPassword: (userId: string) => void;
}

export function UserTable({ users, onEdit, onToggleActive, onResetPassword }: UserTableProps) {
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    action: 'toggle' | 'reset';
    currentState?: boolean;
  } | null>(null);

  const getEmailStatusIcon = (confirmedAt: string | null) => {
    if (confirmedAt) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getEmailStatusText = (confirmedAt: string | null) => {
    if (confirmedAt) {
      return 'Verificado';
    }
    return 'Pendiente';
  };

  const handleToggleActive = (userId: string, currentState: boolean) => {
    setConfirmAction({ userId, action: 'toggle', currentState });
  };

  const handleResetPassword = (userId: string) => {
    setConfirmAction({ userId, action: 'reset' });
  };

  const handleConfirm = () => {
    if (!confirmAction) return;

    if (confirmAction.action === 'toggle') {
      onToggleActive(confirmAction.userId, !confirmAction.currentState);
    } else if (confirmAction.action === 'reset') {
      onResetPassword(confirmAction.userId);
    }

    setConfirmAction(null);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Estado Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.display_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEmailStatusIcon(user.email_confirmed_at)}
                      <span className="text-sm">
                        {getEmailStatusText(user.email_confirmed_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={() => handleToggleActive(user.user_id, user.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user.user_id)}>
                          Resetear Contraseña
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'toggle' 
                ? confirmAction.currentState ? 'Desactivar Usuario' : 'Activar Usuario'
                : 'Resetear Contraseña'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'toggle' 
                ? confirmAction.currentState 
                  ? '¿Estás seguro de que quieres desactivar este usuario? No podrá iniciar sesión hasta que lo reactives.'
                  : '¿Estás seguro de que quieres activar este usuario?'
                : '¿Estás seguro de que quieres resetear la contraseña de este usuario? Se enviará un email con instrucciones.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
