import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useArtistsAdmin } from '@/hooks/useApprovedArtists';
import { ArrowLeft, RefreshCw, Check, X, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ArtistsAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: checkingRole } = useSuperAdmin();
  const { artists, loading, approveAvatar, refetch } = useArtistsAdmin();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">
            No tienes permisos para acceder a esta página
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleApprove = async (artistId: string, approved: boolean) => {
    setProcessingId(artistId);
    const result = await approveAvatar(artistId, approved);
    
    if (result.success) {
      toast.success(approved ? 'Avatar aprobado' : 'Avatar rechazado');
    } else {
      toast.error('Error al procesar avatar');
    }
    
    setProcessingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Avatares</h1>
              <p className="text-muted-foreground mt-1">
                Aprueba o rechaza los avatares de los artistas
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading && artists.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando artistas...</p>
            </div>
          </div>
        ) : artists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay artistas con avatares
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artists.map((artist) => (
              <Card key={artist.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{artist.display_name}</CardTitle>
                    {artist.is_avatar_approved ? (
                      <Badge variant="default">Aprobado</Badge>
                    ) : (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={artist.avatar_url} alt={artist.display_name} />
                      <AvatarFallback>
                        <User className="h-16 w-16" />
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex gap-2">
                    {!artist.is_avatar_approved ? (
                      <Button
                        className="flex-1"
                        onClick={() => handleApprove(artist.id, true)}
                        disabled={processingId === artist.id}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                    ) : (
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => handleApprove(artist.id, false)}
                        disabled={processingId === artist.id}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
