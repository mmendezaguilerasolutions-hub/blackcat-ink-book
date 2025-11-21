import { useAppointments } from '@/hooks/useAppointments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentsCalendarProps {
  artistId: string;
}

export function AppointmentsCalendar({ artistId }: AppointmentsCalendarProps) {
  const { appointments, loading, confirmAppointment, cancelAppointment } = useAppointments(artistId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary', label: string }> = {
      pending: { variant: 'secondary', label: 'Pendiente' },
      confirmed: { variant: 'default', label: 'Confirmada' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
    };
    
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Mis Citas
        </CardTitle>
        <CardDescription>
          Gestiona tus citas programadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Cargando citas...</p>
        ) : appointments.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No tienes citas programadas
          </p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{appointment.client_name}</h4>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {appointment.artist_services.name}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {format(new Date(appointment.date), 'dd MMMM yyyy', { locale: es })}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {appointment.start_time} - {appointment.end_time}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Email:</span> {appointment.client_email}
                  </p>
                  <p>
                    <span className="font-medium">Teléfono:</span> {appointment.client_phone}
                  </p>
                  {appointment.notes && (
                    <p>
                      <span className="font-medium">Notas:</span> {appointment.notes}
                    </p>
                  )}
                </div>

                {appointment.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => confirmAppointment(appointment.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => cancelAppointment(appointment.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
