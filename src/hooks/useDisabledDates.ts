import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DisabledDateInfo {
  date: string;
  hasAvailability: boolean;
  isBlocked: boolean;
}

export function useDisabledDates(artistId?: string) {
  const [disabledDates, setDisabledDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!artistId) {
      setDisabledDates(new Set());
      return;
    }

    const fetchDisabledDates = async () => {
      try {
        setLoading(true);
        
        // Obtener días bloqueados
        const { data: blockedDates, error: blockedError } = await supabase
          .from('artist_blocked_dates')
          .select('date, is_blocked')
          .eq('artist_id', artistId)
          .eq('is_blocked', true);

        if (blockedError) throw blockedError;

        // Obtener días de la semana con disponibilidad
        const { data: availability, error: availError } = await supabase
          .from('artist_availability')
          .select('weekday')
          .eq('artist_id', artistId);

        if (availError) throw availError;

        const availableWeekdays = new Set(
          availability?.map(a => a.weekday) || []
        );

        // Crear set de fechas bloqueadas
        const blocked = new Set<string>(
          blockedDates?.map(b => b.date) || []
        );

        // Función para verificar si una fecha debe estar deshabilitada
        const isDateDisabled = (date: Date): boolean => {
          const dateStr = date.toISOString().split('T')[0];
          
          // Fecha está explícitamente bloqueada
          if (blocked.has(dateStr)) return true;
          
          // No hay disponibilidad para ese día de la semana
          const weekday = date.getDay();
          if (!availableWeekdays.has(weekday)) return true;
          
          return false;
        };

        // Generar fechas deshabilitadas para los próximos 90 días
        const today = new Date();
        const disabled = new Set<string>();
        
        for (let i = 0; i < 90; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          
          if (isDateDisabled(date)) {
            disabled.add(date.toISOString().split('T')[0]);
          }
        }

        setDisabledDates(disabled);
      } catch (error) {
        console.error('Error fetching disabled dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisabledDates();
  }, [artistId]);

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return disabledDates.has(dateStr);
  };

  return {
    isDateDisabled,
    loading,
  };
}
