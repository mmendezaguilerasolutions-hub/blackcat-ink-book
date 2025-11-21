import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Trash2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { usePortfolioWorks, type PortfolioWork } from '@/hooks/usePortfolioWorks';

interface MyPortfolioProps {
  artistId: string;
}

export function MyPortfolio({ artistId }: MyPortfolioProps) {
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    style: '',
    size: 'medium' as 'large' | 'tall' | 'wide' | 'medium'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMyWorks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_works')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorks((data || []) as PortfolioWork[]);
    } catch (error: any) {
      console.error('Error loading works:', error);
      toast.error('Error al cargar trabajos');
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadMyWorks();
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Selecciona una imagen');
      return;
    }

    if (!formData.style) {
      toast.error('Ingresa el estilo del tatuaje');
      return;
    }

    setUploading(true);

    try {
      // 1. Subir imagen a Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${artistId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);

      // 3. Crear registro en BD
      const { error: insertError } = await supabase
        .from('portfolio_works')
        .insert({
          artist_id: artistId,
          image_url: publicUrl,
          title: formData.title || null,
          description: formData.description || null,
          style: formData.style,
          size: formData.size,
          is_approved: false,
          is_featured: false
        });

      if (insertError) throw insertError;

      toast.success('Trabajo subido correctamente. Pendiente de aprobación.');
      
      // Resetear formulario
      setFormData({ title: '', description: '', style: '', size: 'medium' });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Recargar trabajos
      loadMyWorks();
    } catch (error: any) {
      console.error('Error uploading work:', error);
      toast.error('Error al subir trabajo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (workId: string, imageUrl: string) => {
    if (!confirm('¿Estás seguro de eliminar este trabajo?')) return;

    try {
      // 1. Eliminar de BD
      const { error: deleteError } = await supabase
        .from('portfolio_works')
        .delete()
        .eq('id', workId);

      if (deleteError) throw deleteError;

      // 2. Eliminar imagen de Storage
      const filePath = imageUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('portfolio').remove([filePath]);

      toast.success('Trabajo eliminado');
      loadMyWorks();
    } catch (error: any) {
      console.error('Error deleting work:', error);
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Subida */}
      <Card>
        <CardHeader>
          <CardTitle>Subir Nuevo Trabajo</CardTitle>
          <CardDescription>
            Los trabajos serán revisados por el administrador antes de mostrarse públicamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de Imagen */}
            <div className="space-y-2">
              <Label>Imagen *</Label>
              <div className="flex gap-4">
                {previewUrl ? (
                  <div className="relative w-32 h-32">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {!previewUrl && (
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Imagen
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Máximo 5MB. Formatos: JPG, PNG, WebP
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style">Estilo *</Label>
                <Input
                  id="style"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  placeholder="ej: Realismo, Traditional, Japonés"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Tamaño en Mosaico *</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value: any) => setFormData({ ...formData, size: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medium">Mediano (1x1)</SelectItem>
                    <SelectItem value="large">Grande (2x2)</SelectItem>
                    <SelectItem value="tall">Alto (1x2)</SelectItem>
                    <SelectItem value="wide">Ancho (2x1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nombre del diseño"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles sobre el trabajo..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Trabajo
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mis Trabajos */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Trabajos</CardTitle>
          <CardDescription>
            Total: {works.length} trabajos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aún no has subido trabajos
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {works.map((work) => (
                <div key={work.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={work.image_url}
                      alt={work.title || work.style}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{work.style}</p>
                      <div className="flex gap-1">
                        {work.is_approved ? (
                          <Badge variant="default" className="text-xs">Aprobado</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                        )}
                        {work.is_featured && (
                          <Badge variant="default" className="text-xs bg-yellow-600">★</Badge>
                        )}
                      </div>
                    </div>
                    {work.title && (
                      <p className="text-xs text-muted-foreground">{work.title}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleDelete(work.id, work.image_url)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}