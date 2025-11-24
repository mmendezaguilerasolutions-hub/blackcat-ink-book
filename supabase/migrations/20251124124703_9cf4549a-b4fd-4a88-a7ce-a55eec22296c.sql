-- Add order_index and is_visible columns to artist_public_info
ALTER TABLE public.artist_public_info
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_artist_public_info_order ON public.artist_public_info(order_index);

-- Update existing records to have sequential order_index
WITH ordered_artists AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_name) - 1 AS new_order
  FROM public.artist_public_info
)
UPDATE public.artist_public_info
SET order_index = ordered_artists.new_order
FROM ordered_artists
WHERE artist_public_info.id = ordered_artists.id;