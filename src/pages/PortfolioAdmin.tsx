import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioAdmin } from '@/hooks/usePortfolioWorks';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { ArrowLeft, Check, X, Star, StarOff, Trash2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PortfolioAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: checkingRole } = useSuperAdmin();
  const { works, loading, approveWork, toggleFeatured, deleteWork, refetch } = usePortfolioAdmin();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<string | null>(null);

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

  const handleDeleteClick = (workId: string) => {
    setWorkToDelete(workId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (workToDelete) {
      await deleteWork(workToDelete);
      setDeleteDialogOpen(false);
      setWorkToDelete(null);
    }
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
              <h1 className="text-3xl font-bold">Gestión de Portfolio</h1>
              <p className="text-muted-foreground mt-1">
                Administra los trabajos mostrados en la landing
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

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Trabajos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{works.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {works.filter((w) => w.is_approved).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Destacados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {works.filter((w) => w.is_featured).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {loading && works.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando trabajos...</p>
            </div>
          </div>
        ) : works.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No hay trabajos en el portfolio todavía
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {works.map((work) => (
              <Card key={work.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={work.image_url}
                    alt={work.title || work.style}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    {work.is_approved && (
                      <Badge variant="default" className="bg-green-600">
                        Aprobado
                      </Badge>
                    )}
                    {work.is_featured && (
                      <Badge variant="default" className="bg-yellow-600">
                        Destacado
                      </Badge>
                    )}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{work.style}</CardTitle>
                  <CardDescription>
                    por {work.artist?.display_name || 'Desconocido'}
                  </CardDescription>
                  {work.title && (
                    <p className="text-sm text-muted-foreground mt-1">{work.title}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{work.size}</Badge>
                    <span>•</span>
                    <span>{new Date(work.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant={work.is_approved ? 'outline' : 'default'}
                      size="sm"
                      className="flex-1"
                      onClick={() => approveWork(work.id, !work.is_approved)}
                    >
                      {work.is_approved ? (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Aprobar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFeatured(work.id, !work.is_featured)}
                    >
                      {work.is_featured ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(work.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El trabajo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
