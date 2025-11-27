-- =====================================================
-- MIGRACIÓN: Sistema de Portfolio Completo
-- Basado en PDR versión 2.0
-- =====================================================

-- =====================================================
-- 1. CREAR TABLA portfolio_gallery
-- =====================================================
CREATE TABLE IF NOT EXISTS public.portfolio_gallery (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_url TEXT NOT NULL,
  artist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  style TEXT,
  size TEXT DEFAULT 'medium' CHECK (size IN ('large', 'wide', 'tall', 'medium')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para portfolio_gallery
CREATE INDEX IF NOT EXISTS idx_portfolio_gallery_artist_id ON public.portfolio_gallery(artist_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_gallery_display_order ON public.portfolio_gallery(display_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_gallery_is_active ON public.portfolio_gallery(is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_gallery_created_at ON public.portfolio_gallery(created_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_gallery_created_by ON public.portfolio_gallery(created_by);

-- =====================================================
-- 2. CREAR TABLA artist_permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.artist_permissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_artist_feature UNIQUE (artist_id, feature_name)
);

-- Índices para artist_permissions
CREATE INDEX IF NOT EXISTS idx_artist_permissions_artist_id ON public.artist_permissions(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_permissions_feature ON public.artist_permissions(feature_name);

-- =====================================================
-- 3. TRIGGER para updated_at en portfolio_gallery
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_portfolio_updated_at()
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

CREATE TRIGGER portfolio_gallery_updated_at
  BEFORE UPDATE ON public.portfolio_gallery
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_portfolio_updated_at();

-- =====================================================
-- 4. TRIGGER para updated_at en artist_permissions
-- =====================================================
CREATE TRIGGER artist_permissions_updated_at
  BEFORE UPDATE ON public.artist_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_portfolio_updated_at();

-- =====================================================
-- 5. FUNCIÓN: artist_can_manage_portfolio
-- =====================================================
CREATE OR REPLACE FUNCTION public.artist_can_manage_portfolio(artist_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  user_artist_id UUID;
  has_permission BOOLEAN;
BEGIN
  -- Verificar si el usuario es superadmin o admin
  IF has_role(current_user_id, 'superadmin'::app_role) OR has_role(current_user_id, 'admin'::app_role) THEN
    RETURN TRUE;
  END IF;

  -- Verificar si el usuario es el artista y tiene el permiso
  IF current_user_id = artist_id_param THEN
    SELECT COALESCE(ap.is_enabled, FALSE) INTO has_permission
    FROM public.artist_permissions ap
    WHERE ap.artist_id = artist_id_param
      AND ap.feature_name = 'manage_portfolio'
    LIMIT 1;

    RETURN COALESCE(has_permission, FALSE);
  END IF;

  RETURN FALSE;
END;
$$;

-- =====================================================
-- 6. FUNCIÓN: get_portfolio_gallery
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_portfolio_gallery(
  filter_artist_id UUID DEFAULT NULL,
  filter_style TEXT DEFAULT NULL,
  search_text TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id BIGINT,
  image_url TEXT,
  artist_id UUID,
  artist_name TEXT,
  style TEXT,
  size TEXT,
  display_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  is_admin BOOLEAN := has_role(current_user_id, 'admin'::app_role) OR has_role(current_user_id, 'superadmin'::app_role);
  user_artist_id UUID := current_user_id;
BEGIN
  RETURN QUERY
  SELECT
    pg.id,
    pg.image_url,
    pg.artist_id,
    p.display_name AS artist_name,
    pg.style,
    pg.size,
    pg.display_order,
    pg.is_active,
    pg.created_at
  FROM public.portfolio_gallery pg
    LEFT JOIN public.profiles p ON p.id = pg.artist_id
  WHERE
    -- Filtro de activas/inactivas
    (include_inactive = TRUE OR pg.is_active = TRUE)
    -- Si es admin, puede ver todas
    -- Si es artista, solo puede ver sus propias imágenes inactivas
    AND (
      is_admin
      OR (pg.is_active = TRUE)
      OR (current_user_id IS NOT NULL AND pg.artist_id = user_artist_id)
    )
    -- Filtros
    AND (filter_artist_id IS NULL OR pg.artist_id = filter_artist_id)
    AND (filter_style IS NULL OR pg.style ILIKE '%' || filter_style || '%')
    AND (
      search_text IS NULL
      OR p.display_name ILIKE '%' || search_text || '%'
      OR pg.style ILIKE '%' || search_text || '%'
    )
  ORDER BY pg.display_order ASC, pg.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- =====================================================
-- 7. FUNCIÓN: update_portfolio_order
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_portfolio_order(
  image_orders JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  current_user_id UUID := auth.uid();
BEGIN
  -- Verificar permisos
  IF NOT (
    has_role(current_user_id, 'admin'::app_role)
    OR has_role(current_user_id, 'superadmin'::app_role)
  ) THEN
    RAISE EXCEPTION 'No autorizado para reordenar portfolio';
  END IF;

  -- Actualizar orden
  FOR item IN SELECT * FROM jsonb_array_elements(image_orders)
  LOOP
    UPDATE public.portfolio_gallery
    SET display_order = (item->>'display_order')::INTEGER,
        updated_at = NOW()
    WHERE id = (item->>'id')::BIGINT;
  END LOOP;
END;
$$;

-- =====================================================
-- 8. POLÍTICAS RLS para portfolio_gallery
-- =====================================================
ALTER TABLE public.portfolio_gallery ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver imágenes activas
DROP POLICY IF EXISTS "Portfolio gallery viewable by all" ON public.portfolio_gallery;
CREATE POLICY "Portfolio gallery viewable by all" 
ON public.portfolio_gallery
FOR SELECT 
USING (is_active = TRUE);

-- Artistas pueden ver sus propias imágenes (activas e inactivas)
DROP POLICY IF EXISTS "Artists can view their own images" ON public.portfolio_gallery;
CREATE POLICY "Artists can view their own images" 
ON public.portfolio_gallery
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND artist_id = auth.uid()
);

-- Artistas pueden gestionar sus propias imágenes (si tienen permiso)
DROP POLICY IF EXISTS "Artists can manage their own images" ON public.portfolio_gallery;
CREATE POLICY "Artists can manage their own images" 
ON public.portfolio_gallery
FOR ALL 
USING (
  auth.uid() IS NOT NULL
  AND artist_id = auth.uid()
  AND artist_can_manage_portfolio(auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND artist_id = auth.uid()
  AND artist_can_manage_portfolio(auth.uid())
);

-- Admins y superadmins pueden gestionar todas las imágenes
DROP POLICY IF EXISTS "Admins can manage all portfolio images" ON public.portfolio_gallery;
CREATE POLICY "Admins can manage all portfolio images" 
ON public.portfolio_gallery
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- =====================================================
-- 9. POLÍTICAS RLS para artist_permissions
-- =====================================================
ALTER TABLE public.artist_permissions ENABLE ROW LEVEL SECURITY;

-- Artistas pueden ver sus propios permisos
DROP POLICY IF EXISTS "Artists can view their own permissions" ON public.artist_permissions;
CREATE POLICY "Artists can view their own permissions" 
ON public.artist_permissions
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND artist_id = auth.uid()
);

-- Solo superadmins pueden gestionar permisos
DROP POLICY IF EXISTS "Superadmins can manage permissions" ON public.artist_permissions;
CREATE POLICY "Superadmins can manage permissions" 
ON public.artist_permissions
FOR ALL 
USING (
  has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- =====================================================
-- 10. MIGRAR DATOS de portfolio_works a portfolio_gallery
-- =====================================================
INSERT INTO public.portfolio_gallery (
  image_url,
  artist_id,
  style,
  size,
  display_order,
  is_active,
  created_at,
  updated_at,
  created_by
)
SELECT 
  pw.image_url,
  pw.artist_id,
  pw.style,
  pw.size,
  pw.order_index,
  pw.is_approved AND pw.is_visible_in_landing,
  pw.created_at,
  pw.updated_at,
  pw.artist_id
FROM public.portfolio_works pw
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. INICIALIZAR PERMISOS para artistas existentes
-- =====================================================
INSERT INTO public.artist_permissions (artist_id, feature_name, is_enabled)
SELECT DISTINCT p.id, 'manage_portfolio', TRUE
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role IN ('admin', 'staff')
ON CONFLICT (artist_id, feature_name) DO NOTHING;