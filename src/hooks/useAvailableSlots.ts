import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AvailableSlot {
  start_time: string;
  end_time: string;
}

export function useAvailableSlots() {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAvailableSlots = async (
    artistId: string,
    date: string,
    durationMinutes: number
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_artist_id: artistId,
        p_date: date,
        p_duration_minutes: durationMinutes,
      });

      if (error) throw error;
      setSlots(data || []);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los horarios disponibles',
        variant: 'destructive',
      });
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  return {
    slots,
    loading,
    fetchAvailableSlots,
  };
}
