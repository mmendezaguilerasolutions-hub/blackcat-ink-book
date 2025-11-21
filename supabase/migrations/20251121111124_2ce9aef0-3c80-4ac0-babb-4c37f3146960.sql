-- Mejorar get_available_slots para manejar múltiples rangos horarios (pausas) y bloqueos por horas
DROP FUNCTION IF EXISTS public.get_available_slots(uuid, date, integer);

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_artist_id uuid,
  p_date date,
  p_duration_minutes integer
)
RETURNS TABLE(start_time time, end_time time, available_count integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_weekday INTEGER;
  v_slot_duration INTERVAL;
BEGIN
  v_weekday := EXTRACT(DOW FROM p_date);
  v_slot_duration := (p_duration_minutes || ' minutes')::INTERVAL;
  
  RETURN QUERY
  WITH availability AS (
    -- Obtener todos los rangos de disponibilidad para ese día (permite pausas)
    SELECT av.start_time, av.end_time
    FROM artist_availability av
    WHERE av.artist_id = p_artist_id
      AND av.weekday = v_weekday
  ),
  blocked AS (
    -- Obtener bloqueos (días completos o rangos horarios específicos)
    SELECT 
      COALESCE(bd.start_time, '00:00:00'::time) as start_time,
      COALESCE(bd.end_time, '23:59:59'::time) as end_time
    FROM artist_blocked_dates bd
    WHERE bd.artist_id = p_artist_id
      AND bd.date = p_date
      AND bd.is_blocked = true
  ),
  booked AS (
    SELECT a.start_time, a.end_time
    FROM appointments a
    WHERE a.artist_id = p_artist_id
      AND a.date = p_date
      AND a.status != 'cancelled'
  ),
  time_slots AS (
    -- Generar slots para cada rango de disponibilidad
    SELECT 
      s::time as slot_start,
      (s + v_slot_duration)::time as slot_end
    FROM availability av
    CROSS JOIN LATERAL generate_series(
      (timestamp '2000-01-01' + av.start_time)::timestamp,
      (timestamp '2000-01-01' + av.end_time - v_slot_duration)::timestamp,
      v_slot_duration
    ) AS s
    WHERE (s + v_slot_duration)::time <= av.end_time
  )
  SELECT DISTINCT 
    ts.slot_start, 
    ts.slot_end,
    1 as available_count
  FROM time_slots ts
  WHERE NOT EXISTS (
    -- Verificar que no esté bloqueado
    SELECT 1 FROM blocked b
    WHERE ts.slot_start < b.end_time
      AND ts.slot_end > b.start_time
  )
  AND NOT EXISTS (
    -- Verificar que no esté reservado
    SELECT 1 FROM booked bk
    WHERE ts.slot_start < bk.end_time
      AND ts.slot_end > bk.start_time
  )
  ORDER BY ts.slot_start;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots(uuid, date, integer) TO anon, authenticated;

-- Crear función para contar slots disponibles por día (para el calendario con colores)
CREATE OR REPLACE FUNCTION public.get_daily_slot_counts(
  p_artist_id uuid,
  p_start_date date,
  p_end_date date,
  p_duration_minutes integer
)
RETURNS TABLE(date date, slot_count integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date as check_date
  )
  SELECT 
    ds.check_date,
    COALESCE(COUNT(slots.start_time), 0)::integer as slot_count
  FROM date_series ds
  LEFT JOIN LATERAL (
    SELECT * FROM get_available_slots(p_artist_id, ds.check_date, p_duration_minutes)
  ) slots ON true
  GROUP BY ds.check_date
  ORDER BY ds.check_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_slot_counts(uuid, date, date, integer) TO anon, authenticated;