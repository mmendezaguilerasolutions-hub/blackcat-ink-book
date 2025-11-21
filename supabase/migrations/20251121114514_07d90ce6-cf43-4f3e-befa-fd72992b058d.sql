-- Crear tabla para información pública de artistas
CREATE TABLE public.artist_public_info (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.artist_public_info ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios anónimos y autenticados puedan ver artistas activos
CREATE POLICY "Información pública de artistas visible para todos"
ON public.artist_public_info
FOR SELECT
TO authenticated, anon
USING (COALESCE(is_active, true));

-- Política para que artistas puedan actualizar su propia información pública
CREATE POLICY "Artistas pueden actualizar su información pública"
ON public.artist_public_info
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para superadmin
CREATE POLICY "Superadmin puede gestionar información pública"
ON public.artist_public_info
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Función para sincronizar automáticamente profiles -> artist_public_info
CREATE OR REPLACE FUNCTION public.sync_artist_public_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar o actualizar en artist_public_info
  INSERT INTO public.artist_public_info (id, display_name, avatar_url, is_active, updated_at)
  VALUES (NEW.id, NEW.display_name, NEW.avatar_url, NEW.is_active, now())
  ON CONFLICT (id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    is_active = EXCLUDED.is_active,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger para sincronización automática
CREATE TRIGGER sync_artist_public_info_trigger
AFTER INSERT OR UPDATE OF display_name, avatar_url, is_active ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_artist_public_info();

-- Insertar datos existentes de profiles en artist_public_info
INSERT INTO public.artist_public_info (id, display_name, avatar_url, is_active)
SELECT id, display_name, avatar_url, is_active
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- Actualizar política de profiles para restringir acceso anon
DROP POLICY IF EXISTS "Perfiles públicos para lectura" ON public.profiles;

CREATE POLICY "Perfiles públicos para lectura"
ON public.profiles
FOR SELECT
TO authenticated
USING (COALESCE(is_active, true));

-- Agregar política adicional para que cada usuario vea su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);