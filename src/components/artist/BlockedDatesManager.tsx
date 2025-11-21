import { useState } from 'react';
import { useBlockedDates } from '@/hooks/useBlockedDates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BlockedDatesManagerProps {
  artistId: string;
}

export function BlockedDatesManager({ artistId }: BlockedDatesManagerProps) {
  const { blockedDates, loading, createBlockedDate, deleteBlockedDate } = useBlockedDates(artistId);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    is_blocked: true,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createBlockedDate({
      artist_id: artistId,
      date: formData.date,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      is_blocked: formData.is_blocked,
      reason: formData.reason || null,
    });

    setOpen(false);
    setFormData({
      date: '',
      start_time: '',
      end_time: '',
      is_blocked: true,
      reason: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este bloqueo?')) {
      await deleteBlockedDate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bloqueos y Disponibilidad Especial</CardTitle>
            <CardDescription>
              Gestiona vacaciones, días festivos o amplía tu horario en días específicos
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Bloqueo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Nuevo Bloqueo/Disponibilidad</DialogTitle>
                  <DialogDescription>
                    Añade un día bloqueado o con horario especial
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_blocked"
              checked={formData.is_blocked}
              onCheckedChange={(checked) => setFormData({ ...formData, is_blocked: checked })}
            />
            <Label htmlFor="is_blocked" className="cursor-pointer">
              {formData.is_blocked ? 'Día/Horas bloqueadas (no disponible)' : 'Horario especial (disponible)'}
            </Label>
          </div>

          {formData.is_blocked && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Deja las horas en blanco para bloquear el día completo, o especifica un rango horario para bloquear solo esas horas.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Hora inicio (opcional)</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Hora fin (opcional)</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {!formData.is_blocked && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Hora inicio</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required={!formData.is_blocked}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Hora fin</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required={!formData.is_blocked}
                />
              </div>
            </div>
          )}

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo (opcional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Ej: Vacaciones, Formación, Evento especial..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={3}
                    />
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
          <p className="text-center text-muted-foreground">Cargando bloqueos...</p>
        ) : blockedDates.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No hay bloqueos o disponibilidad especial configurada
          </p>
        ) : (
          <div className="space-y-3">
            {blockedDates.map((blocked) => (
              <div
                key={blocked.id}
                className={`border rounded-lg p-4 ${
                  blocked.is_blocked 
                    ? 'bg-destructive/5 border-destructive/20' 
                    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-semibold">
                        {format(new Date(blocked.date), 'dd MMMM yyyy', { locale: es })}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        blocked.is_blocked
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      }`}>
                        {blocked.is_blocked ? 'Bloqueado' : 'Disponible'}
                      </span>
                    </div>
                    
                    {!blocked.is_blocked && blocked.start_time && blocked.end_time && (
                      <p className="text-sm text-muted-foreground">
                        Horario especial: {blocked.start_time} - {blocked.end_time}
                      </p>
                    )}
                    
                    {blocked.is_blocked && blocked.start_time && blocked.end_time && (
                      <p className="text-sm text-muted-foreground">
                        Horas bloqueadas: {blocked.start_time} - {blocked.end_time}
                      </p>
                    )}
                    
                    {blocked.reason && (
                      <p className="text-sm text-muted-foreground">
                        {blocked.reason}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(blocked.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
