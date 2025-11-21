import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DailySlotCount {
  date: string;
  slot_count: number;
}

export function useDailySlotCounts() {
  const [counts, setCounts] = useState<DailySlotCount[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDailySlotCounts = async (
    artistId: string,
    startDate: string,
    endDate: string,
    durationMinutes: number
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_daily_slot_counts', {
        p_artist_id: artistId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_duration_minutes: durationMinutes,
      });

      if (error) throw error;
      setCounts(data || []);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching daily slot counts:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los conteos de disponibilidad',
        variant: 'destructive',
      });
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  return {
    counts,
    loading,
    fetchDailySlotCounts,
  };
}
