import { useState } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useBlockedDates } from '@/hooks/useBlockedDates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentsCalendarViewProps {
  artistId: string;
}

export function AppointmentsCalendarView({ artistId }: AppointmentsCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { appointments, loading: appointmentsLoading } = useAppointments(artistId);
  const { blockedDates, loading: blockedLoading } = useBlockedDates(artistId);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getDayData = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    const dayAppointments = appointments.filter(
      apt => apt.date === dateStr && apt.status !== 'cancelled'
    );
    
    const blocked = blockedDates.find(
      b => b.date === dateStr && b.is_blocked
    );
    
    return { appointments: dayAppointments, blocked };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (appointmentsLoading || blockedLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando calendario...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendario de Citas
            </CardTitle>
            <CardDescription>
              Vista mensual de tus citas y bloqueos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold p-2 text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {/* Días vacíos al inicio */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Días del mes */}
          {monthDays.map((day) => {
            const { appointments: dayAppointments, blocked } = getDayData(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toString()}
                className={`
                  aspect-square border rounded-lg p-1 overflow-hidden
                  ${isToday ? 'border-primary border-2' : 'border-border'}
                  ${blocked ? 'bg-destructive/10' : 'bg-card'}
                  ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}
                `}
              >
                <div className="text-xs font-semibold mb-1">
                  {format(day, 'd')}
                </div>
                
                {blocked && (
                  <div className="text-[10px] text-destructive font-medium mb-1">
                    🚫 Bloqueado
                  </div>
                )}
                
                <div className="space-y-0.5">
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <div
                      key={apt.id}
                      className={`text-[10px] px-1 py-0.5 rounded truncate ${getStatusColor(apt.status)} text-white`}
                      title={`${apt.start_time} - ${apt.client_name}`}
                    >
                      {apt.start_time} {apt.client_name}
                    </div>
                  ))}
                  
                  {dayAppointments.length > 2 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayAppointments.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive" />
            <span>Día bloqueado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-primary" />
            <span>Hoy</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
