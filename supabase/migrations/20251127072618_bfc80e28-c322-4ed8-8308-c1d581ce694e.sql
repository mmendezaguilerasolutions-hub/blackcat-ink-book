-- =====================================================
-- CONFIGURAR SUPABASE STORAGE
-- =====================================================

-- Crear bucket portfolio-gallery si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-gallery',
  'portfolio-gallery',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- =====================================================
-- POLÍTICAS DE STORAGE
-- =====================================================

-- Política para lectura pública
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-gallery');

-- Política para escritura de artistas (sus propias imágenes)
DROP POLICY IF EXISTS "Artists can upload their images" ON storage.objects;
CREATE POLICY "Artists can upload their images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-gallery'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR (
      artist_can_manage_portfolio(auth.uid())
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

-- Política para actualización de artistas
DROP POLICY IF EXISTS "Artists can update their images" ON storage.objects;
CREATE POLICY "Artists can update their images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio-gallery'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR (
      artist_can_manage_portfolio(auth.uid())
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

-- Política para eliminación de artistas (sus propias imágenes)
DROP POLICY IF EXISTS "Artists can delete their images" ON storage.objects;
CREATE POLICY "Artists can delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-gallery'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR (
      artist_can_manage_portfolio(auth.uid())
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);