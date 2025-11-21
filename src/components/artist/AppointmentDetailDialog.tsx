import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, User, Mail, Phone, Edit } from 'lucide-react';

import { AppointmentWithService } from '@/hooks/useAppointments';

interface AppointmentDetailDialogProps {
  appointment: AppointmentWithService | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<AppointmentWithService>) => Promise<void>;
}

export function AppointmentDetailDialog({
  appointment,
  open,
  onClose,
  onUpdate,
}: AppointmentDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: appointment?.status || 'pending',
    notes: appointment?.notes || '',
  });

  if (!appointment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(appointment.id, formData);
      setIsEditing(false);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalles de la Cita</DialogTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
          <DialogDescription>
            Información completa de la cita programada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cliente */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Cliente
            </div>
            <div className="pl-6 space-y-2 text-sm">
              <p className="font-medium">{appointment.client_name}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3" />
                {appointment.client_email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {appointment.client_phone}
              </div>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Fecha
            </div>
            <div className="pl-6 text-sm">
              {format(new Date(appointment.date), "EEEE, d 'de' MMMM 'de' yyyy", {
                locale: es,
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Horario
            </div>
            <div className="pl-6 text-sm">
              {appointment.start_time} - {appointment.end_time}
            </div>
          </div>

          {/* Servicio */}
          {appointment.artist_services && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Servicio</div>
              <div className="pl-6 text-sm">{appointment.artist_services.name}</div>
            </div>
          )}

          {/* Estado */}
          <div className="space-y-3">
            <Label htmlFor="status">Estado</Label>
            {isEditing ? (
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={getStatusColor(appointment.status)}>
                {getStatusLabel(appointment.status)}
              </Badge>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-3">
            <Label htmlFor="notes">Notas</Label>
            {isEditing ? (
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                placeholder="Añade notas sobre la cita..."
              />
            ) : (
              <p className="text-sm text-muted-foreground pl-6">
                {appointment.notes || 'Sin notas'}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    status: appointment.status,
                    notes: appointment.notes || '',
                  });
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
