import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PortfolioImage {
  id: number;
  image_url: string;
  artist_id: string | null;
  artist_name?: string;
  style: string | null;
  size: 'large' | 'wide' | 'tall' | 'medium';
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface PortfolioFilters {
  artist_id?: string | null;
  style?: string | null;
  search_text?: string | null;
}

// Hook para usuarios públicos
export function usePortfolioGallery(filters?: PortfolioFilters) {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_portfolio_gallery', {
        filter_artist_id: filters?.artist_id || null,
        filter_style: filters?.style || null,
        search_text: filters?.search_text || null,
        limit_count: 50,
        offset_count: 0,
        include_inactive: false
      });

      if (error) throw error;
      setImages((data || []) as PortfolioImage[]);
    } catch (error: any) {
      console.error('Error loading portfolio:', error);
      toast.error('Error al cargar el portfolio');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [filters?.artist_id, filters?.style, filters?.search_text]);

  return { images, loading, refetch: fetchImages };
}

// Hook para artistas (gestión propia)
export function useMyPortfolio() {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyImages = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase.rpc('get_portfolio_gallery', {
        filter_artist_id: user.id,
        filter_style: null,
        search_text: null,
        limit_count: 100,
        offset_count: 0,
        include_inactive: true
      });

      if (error) throw error;
      setImages((data || []) as PortfolioImage[]);
    } catch (error: any) {
      console.error('Error loading my portfolio:', error);
      toast.error('Error al cargar tus imágenes');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, metadata: {
    style: string;
    size: 'large' | 'wide' | 'tall' | 'medium';
    display_order?: number;
    is_active?: boolean;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Validar imagen
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Formato no válido. Use JPG, PNG o WebP.');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('Imagen demasiado grande. Máximo 10MB.');
      }

      // Upload a Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `original/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-gallery')
        .getPublicUrl(filePath);

      // Guardar en BD
      const { error: dbError } = await supabase
        .from('portfolio_gallery')
        .insert({
          image_url: publicUrl,
          artist_id: user.id,
          style: metadata.style,
          size: metadata.size,
          display_order: metadata.display_order || 0,
          is_active: metadata.is_active !== undefined ? metadata.is_active : true,
          created_by: user.id
        });

      if (dbError) throw dbError;

      toast.success('Imagen subida correctamente');
      await fetchMyImages();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Error al subir imagen');
      throw error;
    }
  };

  const updateImage = async (
    imageId: number, 
    updates: Partial<Pick<PortfolioImage, 'style' | 'size' | 'display_order' | 'is_active'>>
  ) => {
    try {
      const { error } = await supabase
        .from('portfolio_gallery')
        .update(updates)
        .eq('id', imageId);

      if (error) throw error;

      toast.success('Imagen actualizada');
      await fetchMyImages();
    } catch (error: any) {
      console.error('Error updating image:', error);
      toast.error('Error al actualizar imagen');
      throw error;
    }
  };

  const deleteImage = async (imageId: number) => {
    try {
      const { error } = await supabase
        .from('portfolio_gallery')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast.success('Imagen eliminada');
      await fetchMyImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error('Error al eliminar imagen');
      throw error;
    }
  };

  useEffect(() => {
    fetchMyImages();
  }, []);

  return {
    images,
    loading,
    refetch: fetchMyImages,
    uploadImage,
    updateImage,
    deleteImage
  };
}

// Hook para admins (gestión completa)
export function usePortfolioAdmin() {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllImages = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_portfolio_gallery', {
        filter_artist_id: null,
        filter_style: null,
        search_text: null,
        limit_count: 200,
        offset_count: 0,
        include_inactive: true
      });

      if (error) throw error;
      setImages((data || []) as PortfolioImage[]);
    } catch (error: any) {
      console.error('Error loading all images:', error);
      toast.error('Error al cargar imágenes');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const reorderImages = async (reorderedImages: PortfolioImage[]) => {
    try {
      const imageOrders = reorderedImages.map((img, index) => ({
        id: img.id,
        display_order: index
      }));

      const { error } = await supabase.rpc('update_portfolio_order', {
        image_orders: imageOrders as any
      });

      if (error) throw error;

      toast.success('Orden actualizado');
      await fetchAllImages();
    } catch (error: any) {
      console.error('Error reordering images:', error);
      toast.error('Error al reordenar');
      throw error;
    }
  };

  const updateImage = async (
    imageId: number, 
    updates: Partial<Omit<PortfolioImage, 'id' | 'created_at' | 'artist_name'>>
  ) => {
    try {
      const { error } = await supabase
        .from('portfolio_gallery')
        .update(updates)
        .eq('id', imageId);

      if (error) throw error;

      toast.success('Imagen actualizada');
      await fetchAllImages();
    } catch (error: any) {
      console.error('Error updating image:', error);
      toast.error('Error al actualizar imagen');
      throw error;
    }
  };

  const deleteImage = async (imageId: number) => {
    try {
      const { error } = await supabase
        .from('portfolio_gallery')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast.success('Imagen eliminada');
      await fetchAllImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error('Error al eliminar imagen');
      throw error;
    }
  };

  useEffect(() => {
    fetchAllImages();
  }, []);

  return {
    images,
    loading,
    refetch: fetchAllImages,
    reorderImages,
    updateImage,
    deleteImage
  };
}
