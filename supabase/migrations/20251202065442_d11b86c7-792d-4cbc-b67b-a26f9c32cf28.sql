-- Crear tabla para configuracion del About
CREATE TABLE public.about_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.about_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Publico puede ver la configuracion
CREATE POLICY "About settings publicos"
ON public.about_settings
FOR SELECT
USING (true);

-- Policy: Superadmin puede gestionar
CREATE POLICY "Superadmin gestiona about"
ON public.about_settings
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Insertar configuracion inicial
INSERT INTO public.about_settings (image_url) VALUES
('https://images.unsplash.com/photo-1606902965551-dce093cda6e7?w=800&q=80');