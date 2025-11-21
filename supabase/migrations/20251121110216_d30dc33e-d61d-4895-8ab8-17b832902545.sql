-- Update get_available_slots to generate non-overlapping slots
DROP FUNCTION IF EXISTS public.get_available_slots(uuid, date, integer);

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_artist_id uuid,
  p_date date,
  p_duration_minutes integer
)
RETURNS TABLE(start_time time, end_time time)
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

-- Grant explicit permissions
GRANT EXECUTE ON FUNCTION public.get_available_slots(uuid, date, integer) TO anon, authenticated;