import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useAppointments } from '@/hooks/useAppointments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppointmentDetailDialog } from './AppointmentDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import './calendar-custom.css';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface AppointmentsCalendarViewProps {
  artistId: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
}

export function AppointmentsCalendarView({ artistId }: AppointmentsCalendarViewProps) {
  const { appointments, loading, updateAppointment } = useAppointments(artistId);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Convertir appointments a eventos del calendario
  const events: CalendarEvent[] = useMemo(() => {
    return appointments
      .filter(apt => apt.status !== 'cancelled')
      .map((apt) => {
        const [startHours, startMinutes] = apt.start_time.split(':').map(Number);
        const [endHours, endMinutes] = apt.end_time.split(':').map(Number);
        
        const startDate = new Date(apt.date);
        startDate.setHours(startHours, startMinutes, 0);
        
        const endDate = new Date(apt.date);
        endDate.setHours(endHours, endMinutes, 0);

        return {
          id: apt.id,
          title: apt.client_name,
          start: startDate,
          end: endDate,
          resource: apt,
        };
      });
  }, [appointments]);

  // Manejar click en evento
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event.resource);
    setDialogOpen(true);
  }, []);

  // Manejar drag & drop
  const handleEventDrop = useCallback(
    async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      try {
        const newDate = format(start, 'yyyy-MM-dd');
        const newStartTime = format(start, 'HH:mm');
        const newEndTime = format(end, 'HH:mm');

        const { error } = await supabase
          .from('appointments')
          .update({
            date: newDate,
            start_time: newStartTime,
            end_time: newEndTime,
          })
          .eq('id', event.id);

        if (error) throw error;

        toast.success('Cita movida correctamente');
        await updateAppointment(event.id, {
          date: newDate,
          start_time: newStartTime,
          end_time: newEndTime,
        });
      } catch (error) {
        console.error('Error moving appointment:', error);
        toast.error('Error al mover la cita');
      }
    },
    [updateAppointment]
  );

  // Manejar redimensión de evento
  const handleEventResize = useCallback(
    async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      try {
        const newStartTime = format(start, 'HH:mm');
        const newEndTime = format(end, 'HH:mm');

        const { error } = await supabase
          .from('appointments')
          .update({
            start_time: newStartTime,
            end_time: newEndTime,
          })
          .eq('id', event.id);

        if (error) throw error;

        toast.success('Horario actualizado');
        await updateAppointment(event.id, {
          start_time: newStartTime,
          end_time: newEndTime,
        });
      } catch (error) {
        console.error('Error resizing appointment:', error);
        toast.error('Error al cambiar el horario');
      }
    },
    [updateAppointment]
  );

  // Personalizar el estilo de los eventos
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#3b82f6';

    if (status === 'confirmed') {
      backgroundColor = '#22c55e';
    } else if (status === 'pending') {
      backgroundColor = '#eab308';
    } else if (status === 'cancelled') {
      backgroundColor = '#ef4444';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  }, []);

  const handleUpdateAppointment = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Cita actualizada correctamente');
      await updateAppointment(id, data);
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Error al actualizar la cita');
    }
  };

  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Cita',
    noEventsInRange: 'No hay citas en este rango',
    showMore: (total: number) => `+ ${total} más`,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando calendario...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Calendario de Citas</CardTitle>
              <CardDescription>
                Vista completa con drag & drop. Arrastra las citas para cambiar fecha u hora.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                Confirmada
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                Pendiente
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="calendar-container" style={{ height: '700px' }}>
            <DnDCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              resizable
              eventPropGetter={eventStyleGetter}
              messages={messages}
              culture="es"
              min={new Date(0, 0, 0, 8, 0, 0)}
              max={new Date(0, 0, 0, 22, 0, 0)}
              step={15}
              timeslots={4}
            />
          </div>
        </CardContent>
      </Card>

      <AppointmentDetailDialog
        appointment={selectedEvent}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedEvent(null);
        }}
        onUpdate={handleUpdateAppointment}
      />
    </>
  );
}
