-- Tabla de servicios del artista
CREATE TABLE artist_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de disponibilidad recurrente (horario habitual del artista)
CREATE TABLE artist_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6), -- 0=domingo, 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Tabla de bloqueos y disponibilidad especial
CREATE TABLE artist_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_blocked BOOLEAN DEFAULT TRUE, -- true = bloqueado, false = disponibilidad ampliada
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_special_time CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time)
);

-- Tabla de citas
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES artist_services(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_appointment_time CHECK (end_time > start_time)
);

-- Índices para optimizar consultas
CREATE INDEX idx_artist_services_artist ON artist_services(artist_id);
CREATE INDEX idx_artist_availability_artist ON artist_availability(artist_id);
CREATE INDEX idx_artist_availability_weekday ON artist_availability(weekday);
CREATE INDEX idx_artist_blocked_dates_artist_date ON artist_blocked_dates(artist_id, date);
CREATE INDEX idx_appointments_artist_date ON appointments(artist_id, date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- RLS Policies para artist_services
ALTER TABLE artist_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artistas pueden ver sus propios servicios"
ON artist_services FOR SELECT
TO authenticated
USING (artist_id = auth.uid());

CREATE POLICY "Artistas pueden crear sus propios servicios"
ON artist_services FOR INSERT
TO authenticated
WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artistas pueden actualizar sus propios servicios"
ON artist_services FOR UPDATE
TO authenticated
USING (artist_id = auth.uid())
WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artistas pueden eliminar sus propios servicios"
ON artist_services FOR DELETE
TO authenticated
USING (artist_id = auth.uid());

CREATE POLICY "Público puede ver servicios activos"
ON artist_services FOR SELECT
TO anon
USING (is_active = true);

-- RLS Policies para artist_availability
ALTER TABLE artist_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artistas pueden gestionar su disponibilidad"
ON artist_availability FOR ALL
TO authenticated
USING (artist_id = auth.uid())
WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Público puede ver disponibilidad"
ON artist_availability FOR SELECT
TO anon
USING (true);

-- RLS Policies para artist_blocked_dates
ALTER TABLE artist_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artistas pueden gestionar sus bloqueos"
ON artist_blocked_dates FOR ALL
TO authenticated
USING (artist_id = auth.uid())
WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Público puede ver bloqueos"
ON artist_blocked_dates FOR SELECT
TO anon
USING (true);

-- RLS Policies para appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artistas pueden ver sus propias citas"
ON appointments FOR SELECT
TO authenticated
USING (artist_id = auth.uid());

CREATE POLICY "Artistas pueden actualizar sus propias citas"
ON appointments FOR UPDATE
TO authenticated
USING (artist_id = auth.uid())
WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Superadmin puede ver todas las citas"
ON appointments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Público puede crear citas"
ON appointments FOR INSERT
TO anon
WITH CHECK (true);

-- Función para verificar solapamiento de citas
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_appointment_overlap
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION check_appointment_overlap();

-- Función para calcular huecos disponibles
CREATE OR REPLACE FUNCTION get_available_slots(
  p_artist_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER
)
RETURNS TABLE(
  start_time TIME,
  end_time TIME
) AS $$
DECLARE
  v_weekday INTEGER;
  v_slot_duration INTERVAL;
BEGIN
  -- Obtener día de la semana (0=domingo, 6=sábado)
  v_weekday := EXTRACT(DOW FROM p_date);
  v_slot_duration := (p_duration_minutes || ' minutes')::INTERVAL;
  
  RETURN QUERY
  WITH availability AS (
    -- Obtener disponibilidad base del artista para ese día
    SELECT av.start_time, av.end_time
    FROM artist_availability av
    WHERE av.artist_id = p_artist_id
      AND av.weekday = v_weekday
  ),
  blocked AS (
    -- Obtener bloqueos para esa fecha
    SELECT bd.start_time, bd.end_time
    FROM artist_blocked_dates bd
    WHERE bd.artist_id = p_artist_id
      AND bd.date = p_date
      AND bd.is_blocked = true
  ),
  booked AS (
    -- Obtener citas existentes
    SELECT a.start_time, a.end_time
    FROM appointments a
    WHERE a.artist_id = p_artist_id
      AND a.date = p_date
      AND a.status != 'cancelled'
  ),
  time_slots AS (
    -- Generar slots de 15 minutos dentro de la disponibilidad
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
    -- Excluir slots que se solapan con bloqueos
    SELECT 1 FROM blocked b
    WHERE ts.slot_start < b.end_time
      AND ts.slot_end > b.start_time
  )
  AND NOT EXISTS (
    -- Excluir slots que se solapan con citas
    SELECT 1 FROM booked bk
    WHERE ts.slot_start < bk.end_time
      AND ts.slot_end > bk.start_time
  )
  ORDER BY ts.slot_start;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_artist_services_updated_at
BEFORE UPDATE ON artist_services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();