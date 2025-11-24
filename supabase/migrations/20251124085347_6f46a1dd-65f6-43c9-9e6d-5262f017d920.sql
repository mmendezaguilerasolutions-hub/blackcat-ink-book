-- Agregar campo de aprobación de avatar a artist_public_info
ALTER TABLE public.artist_public_info
ADD COLUMN IF NOT EXISTS is_avatar_approved boolean DEFAULT false;

-- Crear bucket para avatares si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para el bucket de avatares
-- Los artistas pueden subir sus propios avatares
CREATE POLICY "Artistas pueden subir su avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los artistas pueden actualizar su propio avatar
CREATE POLICY "Artistas pueden actualizar su avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los artistas pueden eliminar su propio avatar
CREATE POLICY "Artistas pueden eliminar su avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Todos pueden ver los avatares (bucket público)
CREATE POLICY "Avatares son públicamente visibles"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Actualizar la función de sincronización para incluir aprobación de avatar
CREATE OR REPLACE FUNCTION public.sync_artist_public_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insertar o actualizar en artist_public_info
  -- Preservar is_avatar_approved al actualizar
  INSERT INTO public.artist_public_info (id, display_name, avatar_url, is_active, is_avatar_approved, updated_at)
  VALUES (NEW.id, NEW.display_name, NEW.avatar_url, NEW.is_active, false, now())
  ON CONFLICT (id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    is_active = EXCLUDED.is_active,
    updated_at = now();
    -- No actualizamos is_avatar_approved aquí, solo el superadmin puede hacerlo
  
  RETURN NEW;
END;
$function$;