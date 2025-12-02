import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';

const AboutAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSuperAdmin, loading: loadingRole } = useSuperAdmin();
  const [currentImage, setCurrentImage] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loadingRole && !isSuperAdmin) {
      navigate('/dashboard');
      return;
    }
    if (isSuperAdmin) {
      loadCurrentImage();
    }
  }, [isSuperAdmin, loadingRole, navigate]);

  const loadCurrentImage = async () => {
    try {
      const { data, error } = await supabase
        .from('about_settings')
        .select('image_url')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCurrentImage(data.image_url);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      toast.error('Error al cargar la imagen actual');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setUploading(true);

    try {
      // Subir a storage
      const fileExt = file.name.split('.').pop();
      const fileName = `about-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('portfolio-gallery')
        .getPublicUrl(filePath);

      // Actualizar o insertar en la tabla
      const { error: updateError } = await supabase
        .from('about_settings')
        .upsert({
          image_url: urlData.publicUrl,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setCurrentImage(urlData.publicUrl);
      toast.success('Imagen actualizada correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  if (loadingRole || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-4xl font-black">Gestionar About</h1>
              <p className="text-muted-foreground">
                Cambia la imagen de la sección About
              </p>
            </div>
          </div>

          {/* Current Image */}
          <Card>
            <CardHeader>
              <CardTitle>Imagen Actual</CardTitle>
              <CardDescription>
                Esta es la imagen que se muestra en la sección About
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[400px] rounded-lg overflow-hidden bg-muted">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt="About section"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No hay imagen configurada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload New Image */}
          <Card>
            <CardHeader>
              <CardTitle>Subir Nueva Imagen</CardTitle>
              <CardDescription>
                Selecciona una imagen para reemplazar la actual (máx. 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    type="button"
                    disabled={uploading}
                    className="w-full"
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar Imagen
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-muted-foreground">
                  Formatos aceptados: JPG, PNG, WEBP. Tamaño máximo: 5MB
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutAdmin;
