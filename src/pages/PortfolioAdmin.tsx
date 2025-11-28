import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioAdmin } from '@/hooks/usePortfolioGallery';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ArrowLeft, EyeOff, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { PortfolioImage } from '@/hooks/usePortfolioGallery';
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

// Patrón fijo de 14 posiciones del mosaico
const MOSAIC_POSITIONS = [
  { position: 0, size: 'large' as const },
  { position: 1, size: 'medium' as const },
  { position: 2, size: 'tall' as const },
  { position: 3, size: 'wide' as const },
  { position: 4, size: 'medium' as const },
  { position: 5, size: 'large' as const },
  { position: 6, size: 'medium' as const },
  { position: 7, size: 'tall' as const },
  { position: 8, size: 'wide' as const },
  { position: 9, size: 'medium' as const },
  { position: 10, size: 'medium' as const },
  { position: 11, size: 'large' as const },
  { position: 12, size: 'tall' as const },
  { position: 13, size: 'medium' as const },
];

const SIZE_LABELS = {
  large: 'Grande (2x2)',
  wide: 'Ancho (2x1)',
  tall: 'Alto (1x2)',
  medium: 'Mediano (1x1)',
};

// Componente sortable para cada fila de la tabla
interface SortableRowProps {
  position: number;
  size: 'large' | 'wide' | 'tall' | 'medium';
  image: PortfolioImage | undefined;
  onUnassign: (imageId: number) => void;
}

function SortableRow({ position, size, image, onUnassign }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: position, disabled: !image });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="font-mono font-bold">
        {image && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="cursor-grab active:cursor-grabbing h-6 w-6"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            {position}
          </div>
        )}
        {!image && position}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{SIZE_LABELS[size]}</Badge>
      </TableCell>
      <TableCell>
        {image ? (
          <div className="flex items-center gap-3">
            <img 
              src={image.image_url} 
              alt={`Posición ${position}`}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <p className="font-medium text-sm">{image.style || 'Sin estilo'}</p>
              <p className="text-xs text-muted-foreground">ID: {image.id}</p>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Vacía</span>
        )}
      </TableCell>
      <TableCell>
        {image?.artist_name || '-'}
      </TableCell>
      <TableCell>
        {image ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnassign(image.id)}
          >
            <EyeOff className="w-4 h-4 mr-1" />
            Quitar
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function PortfolioAdmin() {
  const navigate = useNavigate();
  const { images, loading, updateImage, deleteImage, reorderImages } = usePortfolioAdmin();
  const { isSuperAdmin, loading: loadingAdmin } = useSuperAdmin();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [localPositions, setLocalPositions] = useState<typeof MOSAIC_POSITIONS>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sincronizar posiciones locales
  useEffect(() => {
    setLocalPositions(MOSAIC_POSITIONS);
  }, []);

  // Crear una estructura de 14 posiciones con las imágenes asignadas
  const positionsWithImages = localPositions.map(pos => {
    const image = images.find(img => img.display_order === pos.position && img.is_active);
    return {
      ...pos,
      image
    };
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localPositions.findIndex(p => p.position === active.id);
      const newIndex = localPositions.findIndex(p => p.position === over.id);

      // Solo reordenar si ambas posiciones tienen imágenes
      const oldPos = positionsWithImages[oldIndex];
      const newPos = positionsWithImages[newIndex];

      if (oldPos.image && newPos.image) {
        // Intercambiar las imágenes entre posiciones
        try {
          await updateImage(oldPos.image.id, { display_order: newPos.position });
          await updateImage(newPos.image.id, { display_order: oldPos.position });
          toast.success('Posiciones intercambiadas');
        } catch (error) {
          console.error('Error intercambiando posiciones:', error);
          toast.error('Error al reordenar');
        }
      }
    }
  };

  const handleAssignImage = async (position: number, imageId: number) => {
    try {
      await updateImage(imageId, { 
        display_order: position,
        is_active: true 
      });
      toast.success('Imagen asignada a la posición');
    } catch (error) {
      console.error('Error asignando imagen:', error);
    }
  };

  const handleUnassignPosition = async (imageId: number) => {
    try {
      await updateImage(imageId, { 
        is_active: false 
      });
      toast.success('Imagen removida del mosaico');
    } catch (error) {
      console.error('Error removiendo imagen:', error);
    }
  };

  const confirmDelete = (id: number) => {
    setImageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (imageToDelete) {
      await deleteImage(imageToDelete);
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  if (loading || loadingAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-8 text-center">
          <p className="text-lg">No tienes permisos para acceder a esta página</p>
        </Card>
      </div>
    );
  }

  const activeInMosaic = images.filter(img => 
    img.is_active && 
    img.display_order !== null && 
    img.display_order >= 0 && 
    img.display_order < 14
  ).length;
  
  const availableImages = images.filter(img => 
    !img.is_active || 
    img.display_order === null || 
    img.display_order < 0 || 
    img.display_order >= 14
  );

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gestión del Mosaico Portfolio</h1>
          <p className="text-muted-foreground">
            El mosaico tiene 14 posiciones fijas. Arrastra para reordenar.
          </p>
        </div>
      </div>

      <div>
        
        <Card className="p-4 mb-6">
          <p className="text-sm text-muted-foreground">Posiciones ocupadas en el mosaico</p>
          <p className="text-3xl font-bold">{activeInMosaic} / 14</p>
        </Card>
      </div>

      {/* Tabla de posiciones del mosaico con drag and drop */}
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Posiciones del Mosaico</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Arrastra las filas con imágenes para intercambiar posiciones
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Posición</TableHead>
                  <TableHead className="w-32">Tamaño</TableHead>
                  <TableHead>Imagen Asignada</TableHead>
                  <TableHead>Artista</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <SortableContext
                items={localPositions.map(p => p.position)}
                strategy={verticalListSortingStrategy}
              >
                <TableBody>
                  {positionsWithImages.map(({ position, size, image }) => (
                    <SortableRow
                      key={position}
                      position={position}
                      size={size}
                      image={image}
                      onUnassign={handleUnassignPosition}
                    />
                  ))}
                </TableBody>
              </SortableContext>
            </Table>
          </DndContext>
        </div>
      </Card>

      {/* Imágenes disponibles */}
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Imágenes Disponibles ({availableImages.length})</h2>
          {availableImages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay imágenes disponibles</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {availableImages.map(img => (
                <div key={img.id} className="group relative">
                  <img 
                    src={img.image_url} 
                    alt={img.style || 'Imagen'}
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center gap-2 p-2">
                    <p className="text-white text-xs text-center">{img.artist_name}</p>
                    <p className="text-white text-xs text-center font-medium">{img.style}</p>
                    <select 
                      className="text-xs rounded px-2 py-1"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignImage(parseInt(e.target.value), img.id);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Asignar a...</option>
                      {positionsWithImages
                        .filter(p => !p.image)
                        .map(p => (
                          <option key={p.position} value={p.position}>
                            Pos {p.position} ({SIZE_LABELS[p.size]})
                          </option>
                        ))}
                    </select>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDelete(img.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La imagen será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
