import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioAdmin } from '@/hooks/usePortfolioWorks';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { ArrowLeft, Check, X, Star, StarOff, Trash2, RefreshCw, Eye, EyeOff, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// Componente individual de trabajo sortable
function SortableWorkCard({ work, onApprove, onToggleFeatured, onToggleVisibility, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: work.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden">
      <div className="relative aspect-square">
        <img
          src={work.image_url}
          alt={work.title || work.style}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab active:cursor-grabbing bg-background/80 hover:bg-background/90"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-2">
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
          {!work.is_visible_in_landing && (
            <Badge variant="default" className="bg-red-600">
              Oculto
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
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant={work.is_approved ? 'outline' : 'default'}
            size="sm"
            onClick={() => onApprove(work.id, !work.is_approved)}
          >
            {work.is_approved ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Rechazar
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Aprobar
              </>
            )}
          </Button>
          <Button
            variant={work.is_visible_in_landing ? 'outline' : 'default'}
            size="sm"
            onClick={() => onToggleVisibility(work.id, !work.is_visible_in_landing)}
          >
            {work.is_visible_in_landing ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Ocultar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Mostrar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleFeatured(work.id, !work.is_featured)}
          >
            {work.is_featured ? (
              <>
                <StarOff className="h-4 w-4 mr-1" />
                Normal
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-1" />
                Destacar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(work.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive mr-1" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PortfolioAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: checkingRole } = useSuperAdmin();
  const { works, loading, approveWork, toggleFeatured, deleteWork, toggleVisibility, reorderWorks, refetch } = usePortfolioAdmin();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<string | null>(null);
  const [localWorks, setLocalWorks] = useState(works);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sincronizar works con localWorks cuando cambien
  useEffect(() => {
    setLocalWorks(works);
  }, [works]);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalWorks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Actualizar el orden en el backend
        reorderWorks(newOrder);
        
        return newOrder;
      });
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localWorks.map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {localWorks.map((work) => (
                  <SortableWorkCard
                    key={work.id}
                    work={work}
                    onApprove={approveWork}
                    onToggleFeatured={toggleFeatured}
                    onToggleVisibility={toggleVisibility}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
