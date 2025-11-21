-- Corregir search_path en funciones para seguridad

CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE artist_id = NEW.artist_id
      AND date = NEW.date
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status != 'cancelled'
      AND (
        (start_time < NEW.end_time AND end_time > NEW.start_time)
      )
  ) THEN
    RAISE EXCEPTION 'Este horario se solapa con otra cita existente';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION get_available_slots(
  p_artist_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER
)
RETURNS TABLE(
  start_time TIME,
  end_time TIME
) 
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
      generate_series(
        av.start_time,
        av.end_time - v_slot_duration,
        '15 minutes'::INTERVAL
      )::TIME as slot_start,
      (generate_series(
        av.start_time,
        av.end_time - v_slot_duration,
        '15 minutes'::INTERVAL
      ) + v_slot_duration)::TIME as slot_end
    FROM availability av
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;