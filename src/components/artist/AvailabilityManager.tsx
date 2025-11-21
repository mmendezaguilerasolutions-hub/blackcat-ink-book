import { useState } from 'react';
import { useArtistAvailability } from '@/hooks/useArtistAvailability';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [formData, setFormData] = useState({
    weekday: 1,
    start_time: '09:00',
    end_time: '18:00',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createAvailability({
      artist_id: artistId,
      weekday: formData.weekday,
      start_time: formData.start_time,
      end_time: formData.end_time,
    });

    setOpen(false);
    setFormData({
      weekday: 1,
      start_time: '09:00',
      end_time: '18:00',
    });
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
              Define tus horarios de trabajo habituales por día de la semana
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
                    Añade un rango horario para un día específico
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="weekday">Día de la semana</Label>
                    <Select
                      value={formData.weekday.toString()}
                      onValueChange={(value) => setFormData({ ...formData, weekday: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un día" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Button type="submit">Crear</Button>
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
