-- Reemplazar la función get_available_slots para corregir el error con generate_series
DROP FUNCTION IF EXISTS get_available_slots(uuid, date, integer);

CREATE OR REPLACE FUNCTION get_available_slots(
  p_artist_id uuid,
  p_date date,
  p_duration_minutes integer
)
RETURNS TABLE(start_time time, end_time time)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weekday INTEGER;
  v_slot_duration INTERVAL;
BEGIN
  v_weekday := EXTRACT(DOW FROM p_date);
  v_slot_duration := (p_duration_minutes || ' minutes')::INTERVAL;
  
  RETURN QUERY
  WITH availability AS (
    SELECT av.start_time, av.end_time
    FROM artist_availability av
    WHERE av.artist_id = p_artist_id
      AND av.weekday = v_weekday
  ),
  blocked AS (
    SELECT bd.start_time, bd.end_time
    FROM artist_blocked_dates bd
    WHERE bd.artist_id = p_artist_id
      AND bd.date = p_date
      AND bd.is_blocked = true
      AND bd.start_time IS NOT NULL
      AND bd.end_time IS NOT NULL
  ),
  booked AS (
    SELECT a.start_time, a.end_time
    FROM appointments a
    WHERE a.artist_id = p_artist_id
      AND a.date = p_date
      AND a.status != 'cancelled'
  ),
  time_slots AS (
    SELECT 
      (timestamp '2000-01-01' + s)::time as slot_start,
      (timestamp '2000-01-01' + s + v_slot_duration)::time as slot_end
    FROM availability av
    CROSS JOIN LATERAL generate_series(
      av.start_time::interval,
      av.end_time::interval - v_slot_duration,
      '15 minutes'::interval
    ) AS s
    WHERE (timestamp '2000-01-01' + s + v_slot_duration)::time <= av.end_time
  )
  SELECT DISTINCT ts.slot_start, ts.slot_end
  FROM time_slots ts
  WHERE NOT EXISTS (
    SELECT 1 FROM blocked b
    WHERE ts.slot_start < b.end_time
      AND ts.slot_end > b.start_time
  )
  AND NOT EXISTS (
    SELECT 1 FROM booked bk
    WHERE ts.slot_start < bk.end_time
      AND ts.slot_end > bk.start_time
  )
  ORDER BY ts.slot_start;
END;
$$;