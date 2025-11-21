-- Eliminar la política existente para recrearla con ambos roles
DROP POLICY IF EXISTS "Perfiles públicos para lectura" ON public.profiles;

-- Crear nueva política que permite lectura a authenticated y anon
-- Solo muestra perfiles activos (is_active = true o NULL)
CREATE POLICY "Perfiles públicos para lectura"
ON public.profiles
FOR SELECT
TO authenticated, anon
USING (COALESCE(is_active, true));