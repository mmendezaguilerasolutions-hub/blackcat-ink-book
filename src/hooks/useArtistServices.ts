import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ArtistService {
  id: string;
  artist_id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useArtistServices(artistId?: string) {
  const [services, setServices] = useState<ArtistService[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('artist_services')
        .select('*')
        .order('name');

      if (artistId) {
        query = query.eq('artist_id', artistId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los servicios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createService = async (service: Omit<ArtistService, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('artist_services')
        .insert([service])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Servicio creado exitosamente',
      });

      await fetchServices();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el servicio',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const updateService = async (id: string, updates: Partial<ArtistService>) => {
    try {
      const { error } = await supabase
        .from('artist_services')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Servicio actualizado exitosamente',
      });

      await fetchServices();
      return { success: true };
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el servicio',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('artist_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Servicio eliminado exitosamente',
      });

      await fetchServices();
      return { success: true };
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el servicio',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  useEffect(() => {
    fetchServices();
  }, [artistId]);

  return {
    services,
    loading,
    fetchServices,
    createService,
    updateService,
    deleteService,
  };
}
