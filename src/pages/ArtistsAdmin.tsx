import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useArtistsAdmin, ApprovedArtist } from '@/hooks/useApprovedArtists';
import { ArrowLeft, RefreshCw, Check, X, User, Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
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

// Componente individual de artista sortable
function SortableArtistCard({ artist, onApprove, onToggleVisibility, processingId }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: artist.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="cursor-grab active:cursor-grabbing h-8 w-8"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">{artist.display_name}</CardTitle>
          </div>
          <div className="flex gap-2">
            {artist.is_avatar_approved && (
              <Badge variant="default">Aprobado</Badge>
            )}
            {!artist.is_visible && (
              <Badge variant="destructive">Oculto</Badge>
            )}
          </div>
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

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={artist.is_avatar_approved ? 'outline' : 'default'}
            size="sm"
            onClick={() => onApprove(artist.id, !artist.is_avatar_approved)}
            disabled={processingId === artist.id}
          >
            {artist.is_avatar_approved ? (
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
            variant={artist.is_visible ? 'outline' : 'default'}
            size="sm"
            onClick={() => onToggleVisibility(artist.id, !artist.is_visible)}
            disabled={processingId === artist.id}
          >
            {artist.is_visible ? (
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function ArtistsAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: checkingRole } = useSuperAdmin();
  const { artists, loading, approveAvatar, toggleVisibility, reorderArtists, refetch } = useArtistsAdmin();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [localArtists, setLocalArtists] = useState<ApprovedArtist[]>(artists);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sincronizar artists con localArtists cuando cambien
  useEffect(() => {
    setLocalArtists(artists);
  }, [artists]);

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

  const handleToggleVisibility = async (artistId: string, visible: boolean) => {
    setProcessingId(artistId);
    const result = await toggleVisibility(artistId, visible);
    
    if (result.success) {
      toast.success(visible ? 'Artista visible en landing' : 'Artista oculto de landing');
    } else {
      toast.error('Error al cambiar visibilidad');
    }
    
    setProcessingId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalArtists((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Actualizar el orden en el backend
        reorderArtists(newOrder);
        
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

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Artistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{artists.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {artists.filter((a) => a.is_avatar_approved).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Visibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {artists.filter((a) => a.is_visible).length}
              </div>
            </CardContent>
          </Card>
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localArtists.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {localArtists.map((artist) => (
                  <SortableArtistCard
                    key={artist.id}
                    artist={artist}
                    onApprove={handleApprove}
                    onToggleVisibility={handleToggleVisibility}
                    processingId={processingId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
