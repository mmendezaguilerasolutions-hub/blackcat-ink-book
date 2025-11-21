-- Crear bucket de storage para imágenes de portfolio
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true);

-- Tabla de trabajos de portfolio
CREATE TABLE public.portfolio_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  style TEXT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('large', 'tall', 'wide', 'medium')) DEFAULT 'medium',
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_portfolio_works_artist ON portfolio_works(artist_id);
CREATE INDEX idx_portfolio_works_featured ON portfolio_works(is_featured);
CREATE INDEX idx_portfolio_works_approved ON portfolio_works(is_approved);
CREATE INDEX idx_portfolio_works_order ON portfolio_works(order_index);

-- Habilitar RLS
ALTER TABLE public.portfolio_works ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Todos pueden ver trabajos aprobados
CREATE POLICY "Trabajos aprobados son públicos"
ON public.portfolio_works
FOR SELECT
TO authenticated, anon
USING (is_approved = true);

-- Artistas pueden ver sus propios trabajos
CREATE POLICY "Artistas pueden ver sus trabajos"
ON public.portfolio_works
FOR SELECT
TO authenticated
USING (artist_id = auth.uid());

-- Artistas pueden crear trabajos
CREATE POLICY "Artistas pueden crear trabajos"
ON public.portfolio_works
FOR INSERT
TO authenticated
WITH CHECK (artist_id = auth.uid());

-- Artistas pueden actualizar sus propios trabajos
CREATE POLICY "Artistas pueden actualizar sus trabajos"
ON public.portfolio_works
FOR UPDATE
TO authenticated
USING (artist_id = auth.uid())
WITH CHECK (artist_id = auth.uid());

-- Artistas pueden eliminar sus propios trabajos
CREATE POLICY "Artistas pueden eliminar sus trabajos"
ON public.portfolio_works
FOR DELETE
TO authenticated
USING (artist_id = auth.uid());

-- Superadmin puede ver todos los trabajos
CREATE POLICY "Superadmin puede ver todos los trabajos"
ON public.portfolio_works
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Superadmin puede actualizar cualquier trabajo (para aprobar/destacar)
CREATE POLICY "Superadmin puede actualizar trabajos"
ON public.portfolio_works
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Superadmin puede eliminar cualquier trabajo
CREATE POLICY "Superadmin puede eliminar trabajos"
ON public.portfolio_works
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Políticas de Storage para el bucket portfolio
-- Usuarios autenticados pueden subir archivos
CREATE POLICY "Usuarios pueden subir imágenes de portfolio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuarios pueden actualizar sus propias imágenes
CREATE POLICY "Usuarios pueden actualizar sus imágenes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuarios pueden eliminar sus propias imágenes
CREATE POLICY "Usuarios pueden eliminar sus imágenes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Todos pueden ver imágenes del portfolio (bucket público)
CREATE POLICY "Imágenes de portfolio son públicas"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'portfolio');

-- Trigger para actualizar updated_at
CREATE TRIGGER update_portfolio_works_updated_at
BEFORE UPDATE ON public.portfolio_works
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();