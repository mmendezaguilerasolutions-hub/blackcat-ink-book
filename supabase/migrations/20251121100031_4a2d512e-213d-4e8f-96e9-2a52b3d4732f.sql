-- Arreglar warning de seguridad: Function Search Path Mutable
-- Actualizar función handle_updated_at para tener search_path fijo

CREATE OR REPLACE FUNCTION public.handle_updated_at()
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