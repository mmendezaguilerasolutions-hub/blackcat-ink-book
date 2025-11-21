import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Appointment {
  id: string;
  artist_id: string;
  service_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithService extends Appointment {
  artist_services: {
    name: string;
    duration_minutes: number;
  };
}

export function useAppointments(artistId?: string) {
  const [appointments, setAppointments] = useState<AppointmentWithService[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('appointments')
        .select(`
          *,
          artist_services (
            name,
            duration_minutes
          )
        `)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

      if (artistId) {
        query = query.eq('artist_id', artistId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las citas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...appointment, status: 'pending' }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Cita creada exitosamente',
      });

      await fetchAppointments();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la cita',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Cita actualizada exitosamente',
      });

      await fetchAppointments();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la cita',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const cancelAppointment = async (id: string) => {
    return updateAppointment(id, { status: 'cancelled' });
  };

  const confirmAppointment = async (id: string) => {
    return updateAppointment(id, { status: 'confirmed' });
  };

  useEffect(() => {
    fetchAppointments();
  }, [artistId]);

  return {
    appointments,
    loading,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    confirmAppointment,
  };
}
