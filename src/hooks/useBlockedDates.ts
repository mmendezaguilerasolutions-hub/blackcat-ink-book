import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BlockedDate {
  id: string;
  artist_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_blocked: boolean;
  reason: string | null;
  created_at: string;
}

export function useBlockedDates(artistId?: string) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('artist_blocked_dates')
        .select('*')
        .order('date', { ascending: false });

      if (artistId) {
        query = query.eq('artist_id', artistId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBlockedDates(data || []);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los bloqueos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createBlockedDate = async (blockedDate: Omit<BlockedDate, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('artist_blocked_dates')
        .insert([blockedDate])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Bloqueo creado exitosamente',
      });

      await fetchBlockedDates();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating blocked date:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el bloqueo',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deleteBlockedDate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('artist_blocked_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Bloqueo eliminado exitosamente',
      });

      await fetchBlockedDates();
      return { success: true };
    } catch (error) {
      console.error('Error deleting blocked date:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el bloqueo',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  useEffect(() => {
    fetchBlockedDates();
  }, [artistId]);

  return {
    blockedDates,
    loading,
    fetchBlockedDates,
    createBlockedDate,
    deleteBlockedDate,
  };
}
