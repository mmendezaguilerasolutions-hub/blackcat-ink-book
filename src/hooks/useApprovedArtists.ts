import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ApprovedArtist {
  id: string;
  display_name: string;
  avatar_url: string;
  is_avatar_approved: boolean;
  is_visible: boolean;
  order_index: number;
}

export function useApprovedArtists() {
  const [artists, setArtists] = useState<ApprovedArtist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('artist_public_info')
        .select('id, display_name, avatar_url, is_avatar_approved, is_visible, order_index')
        .eq('is_active', true)
        .eq('is_avatar_approved', true)
        .eq('is_visible', true)
        .not('avatar_url', 'is', null)
        .order('order_index', { ascending: true })
        .order('display_name');

      if (error) throw error;
      setArtists((data || []) as ApprovedArtist[]);
    } catch (error) {
      console.error('Error fetching approved artists:', error);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  return { artists, loading, refetch: fetchArtists };
}

export function useArtistsAdmin() {
  const [artists, setArtists] = useState<ApprovedArtist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllArtists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('artist_public_info')
        .select('id, display_name, avatar_url, is_avatar_approved, is_visible, order_index')
        .eq('is_active', true)
        .not('avatar_url', 'is', null)
        .order('order_index', { ascending: true })
        .order('display_name');

      if (error) throw error;
      setArtists((data || []) as ApprovedArtist[]);
    } catch (error) {
      console.error('Error fetching artists:', error);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllArtists();
  }, []);

  const approveAvatar = async (artistId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('artist_public_info')
        .update({ is_avatar_approved: approved })
        .eq('id', artistId);

      if (error) throw error;
      
      await fetchAllArtists();
      return { success: true };
    } catch (error: any) {
      console.error('Error approving avatar:', error);
      return { success: false, error };
    }
  };

  const toggleVisibility = async (artistId: string, visible: boolean) => {
    try {
      const { error } = await supabase
        .from('artist_public_info')
        .update({ is_visible: visible })
        .eq('id', artistId);

      if (error) throw error;
      
      await fetchAllArtists();
      return { success: true };
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      return { success: false, error };
    }
  };

  const reorderArtists = async (reorderedArtists: ApprovedArtist[]) => {
    try {
      // Actualizar el order_index de cada artista
      const updates = reorderedArtists.map((artist, index) => 
        supabase
          .from('artist_public_info')
          .update({ order_index: index })
          .eq('id', artist.id)
      );

      await Promise.all(updates);
      await fetchAllArtists();
      return { success: true };
    } catch (error: any) {
      console.error('Error reordering artists:', error);
      return { success: false, error };
    }
  };

  return { artists, loading, approveAvatar, toggleVisibility, reorderArtists, refetch: fetchAllArtists };
}
