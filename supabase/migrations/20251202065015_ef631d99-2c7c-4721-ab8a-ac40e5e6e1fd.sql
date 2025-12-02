-- Crear tabla para reseñas de clientes
CREATE TABLE public.client_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Público puede ver reseñas activas
CREATE POLICY "Reviews activas publicas"
ON public.client_reviews
FOR SELECT
USING (is_active = true);

-- Policy: Superadmin puede gestionar todas las reseñas
CREATE POLICY "Superadmin gestiona reviews"
ON public.client_reviews
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Insertar algunas reseñas de ejemplo
INSERT INTO public.client_reviews (client_name, review_text, rating, is_active) VALUES
('Maria Garcia', 'Excelente servicio, muy profesionales y atentos. El resultado supero mis expectativas.', 5, true),
('Carlos Rodriguez', 'Increible trabajo, totalmente recomendado. La atencion al detalle es impresionante.', 5, true),
('Ana Lopez', 'Muy contenta con el resultado. El equipo es muy amable y profesional.', 5, true);