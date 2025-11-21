import { useState } from 'react';
import { useArtistAvailability } from '@/hooks/useArtistAvailability';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AvailabilityManagerProps {
  artistId: string;
}

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export function AvailabilityManager({ artistId }: AvailabilityManagerProps) {
  const { availability, loading, createAvailability, deleteAvailability } = useArtistAvailability(artistId);
  const [open, setOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '18:00',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear disponibilidad para cada día seleccionado
    for (const weekday of selectedDays) {
      await createAvailability({
        artist_id: artistId,
        weekday,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });
    }

    setOpen(false);
    setSelectedDays([1]);
    setFormData({
      start_time: '09:00',
      end_time: '18:00',
    });
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta disponibilidad?')) {
      await deleteAvailability(id);
    }
  };

  const groupedAvailability = WEEKDAYS.map((day) => ({
    ...day,
    slots: availability.filter((a) => a.weekday === day.value),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mi Disponibilidad</CardTitle>
            <CardDescription>
              Define tus horarios. Puedes añadir múltiples rangos por día para crear pausas (ej: 9:00-13:00 y 15:00-19:00)
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Horario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Nuevo Horario</DialogTitle>
                  <DialogDescription>
                    Añade rangos horarios para uno o varios días. Puedes crear pausas añadiendo múltiples rangos separados para el mismo día.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Días de la semana (selecciona varios)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {WEEKDAYS.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={selectedDays.includes(day.value)}
                            onCheckedChange={() => toggleDay(day.value)}
                          />
                          <Label
                            htmlFor={`day-${day.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedDays.length === 0 && (
                      <p className="text-sm text-destructive">Selecciona al menos un día</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Hora inicio</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Hora fin</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={selectedDays.length === 0}>
                    Crear para {selectedDays.length} día{selectedDays.length !== 1 ? 's' : ''}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Cargando disponibilidad...</p>
        ) : (
          <div className="space-y-4">
            {groupedAvailability.map((day) => (
              <div key={day.value} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{day.label}</h3>
                {day.slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin horarios definidos</p>
                ) : (
                  <div className="space-y-2">
                    {day.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between bg-muted rounded p-2"
                      >
                        <span className="text-sm">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(slot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
