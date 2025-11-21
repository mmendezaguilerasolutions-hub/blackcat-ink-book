import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PortfolioWork {
  id: string;
  artist_id: string;
  image_url: string;
  title?: string;
  description?: string;
  style: string;
  size: 'large' | 'tall' | 'wide' | 'medium';
  is_featured: boolean;
  is_approved: boolean;
  order_index: number;
  created_at: string;
  artist?: {
    display_name: string;
  };
}

export function usePortfolioWorks() {
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_works')
        .select(`
          *,
          artist:profiles!artist_id(display_name)
        `)
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorks((data || []) as PortfolioWork[]);
    } catch (error: any) {
      console.error('Error loading portfolio works:', error);
      toast.error('Error al cargar trabajos del portfolio');
      setWorks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  return { works, loading, refetch: fetchWorks };
}

export function usePortfolioAdmin() {
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllWorks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_works')
        .select(`
          *,
          artist:profiles!artist_id(display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorks((data || []) as PortfolioWork[]);
    } catch (error: any) {
      console.error('Error loading all portfolio works:', error);
      toast.error('Error al cargar trabajos');
      setWorks([]);
    } finally {
      setLoading(false);
    }
  };

  const approveWork = async (workId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('portfolio_works')
        .update({ is_approved: approved })
        .eq('id', workId);

      if (error) throw error;
      
      toast.success(approved ? 'Trabajo aprobado' : 'Aprobación removida');
      await fetchAllWorks();
    } catch (error: any) {
      console.error('Error updating work approval:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const toggleFeatured = async (workId: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('portfolio_works')
        .update({ is_featured: featured })
        .eq('id', workId);

      if (error) throw error;
      
      toast.success(featured ? 'Trabajo destacado' : 'Ya no destacado');
      await fetchAllWorks();
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      toast.error('Error al actualizar');
    }
  };

  const deleteWork = async (workId: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_works')
        .delete()
        .eq('id', workId);

      if (error) throw error;
      
      toast.success('Trabajo eliminado');
      await fetchAllWorks();
    } catch (error: any) {
      console.error('Error deleting work:', error);
      toast.error('Error al eliminar');
    }
  };

  useEffect(() => {
    fetchAllWorks();
  }, []);

  return {
    works,
    loading,
    refetch: fetchAllWorks,
    approveWork,
    toggleFeatured,
    deleteWork
  };
}