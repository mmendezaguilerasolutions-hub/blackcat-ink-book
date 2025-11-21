-- Agregar campo para controlar visibilidad en landing independiente de aprobación
ALTER TABLE portfolio_works 
ADD COLUMN IF NOT EXISTS is_visible_in_landing boolean DEFAULT true;

-- Comentario explicativo
COMMENT ON COLUMN portfolio_works.is_visible_in_landing IS 'Controla si el trabajo se muestra en la landing page. Un trabajo puede estar aprobado pero oculto de la landing.';