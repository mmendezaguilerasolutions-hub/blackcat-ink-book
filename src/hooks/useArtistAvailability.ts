import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ArtistAvailability {
  id: string;
  artist_id: string;
  weekday: number; // 0=domingo, 6=sábado
  start_time: string;
  end_time: string;
  created_at: string;
}

export function useArtistAvailability(artistId?: string) {
  const [availability, setAvailability] = useState<ArtistAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('artist_availability')
        .select('*')
        .order('weekday')
        .order('start_time');

      if (artistId) {
        query = query.eq('artist_id', artistId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la disponibilidad',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createAvailability = async (avail: Omit<ArtistAvailability, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('artist_availability')
        .insert([avail])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Disponibilidad creada exitosamente',
      });

      await fetchAvailability();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating availability:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la disponibilidad',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const updateAvailability = async (id: string, updates: Partial<ArtistAvailability>) => {
    try {
      const { error } = await supabase
        .from('artist_availability')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Disponibilidad actualizada exitosamente',
      });

      await fetchAvailability();
      return { success: true };
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la disponibilidad',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase
        .from('artist_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Disponibilidad eliminada exitosamente',
      });

      await fetchAvailability();
      return { success: true };
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la disponibilidad',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [artistId]);

  return {
    availability,
    loading,
    fetchAvailability,
    createAvailability,
    updateAvailability,
    deleteAvailability,
  };
}
