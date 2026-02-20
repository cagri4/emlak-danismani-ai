import { useState } from 'react';
import { Star, Trash2, GripVertical } from 'lucide-react';
import { PropertyPhoto } from '../../types/photo';

interface PhotoGridProps {
  photos: PropertyPhoto[];
  onReorder: (photos: PropertyPhoto[]) => void;
  onSetCover: (photoId: string) => void;
  onDelete: (photoId: string) => void;
  isEditable?: boolean;
}

/**
 * Photo grid with drag-drop reordering and cover selection.
 *
 * Features:
 * - Responsive grid layout (2/3/4 columns)
 * - Drag-drop reordering with native HTML5 drag events
 * - Star icon to set cover photo (only one cover at a time)
 * - Delete photo with trash icon
 * - Cover badge on current cover photo
 * - Hover overlay for actions (when editable)
 */
export function PhotoGrid({
  photos,
  onReorder,
  onSetCover,
  onDelete,
  isEditable = false,
}: PhotoGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    setDraggedId(photoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, photoId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(photoId);
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetPhotoId: string) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetPhotoId) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    // Reorder photos array
    const reordered = [...photos];
    const draggedIndex = reordered.findIndex((p) => p.id === draggedId);
    const targetIndex = reordered.findIndex((p) => p.id === targetPhotoId);

    const [draggedPhoto] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedPhoto);

    // Update order property
    const updated = reordered.map((photo, index) => ({
      ...photo,
      order: index,
    }));

    onReorder(updated);
    setDraggedId(null);
    setDropTargetId(null);
  };

  const handleSetCover = (photoId: string) => {
    onSetCover(photoId);
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Henüz fotoğraf eklenmemiş</p>
        <p className="text-sm text-gray-400 mt-1">Yukarıdaki alandan fotoğraf yükleyin</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => {
        const isDragging = draggedId === photo.id;
        const isDropTarget = dropTargetId === photo.id;

        return (
          <div
            key={photo.id}
            draggable={isEditable}
            onDragStart={(e) => handleDragStart(e, photo.id)}
            onDragOver={(e) => handleDragOver(e, photo.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, photo.id)}
            className={`
              relative aspect-square rounded-lg overflow-hidden group
              transition-all duration-200
              ${isDragging ? 'opacity-50' : ''}
              ${isDropTarget ? 'ring-2 ring-blue-500' : ''}
              ${isEditable ? 'cursor-move' : ''}
            `}
          >
            {/* Photo image */}
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={`Fotoğraf ${photo.order + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Cover badge */}
            {photo.isCover && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                Kapak
              </div>
            )}

            {/* Hover overlay with actions (only if editable) */}
            {isEditable && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200">
                <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* Star icon to set as cover */}
                  <button
                    onClick={() => handleSetCover(photo.id)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Kapak fotoğrafı olarak ayarla"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        photo.isCover ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                      }`}
                    />
                  </button>

                  {/* Trash icon to delete */}
                  <button
                    onClick={() => onDelete(photo.id)}
                    className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </div>

                {/* Drag handle */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <GripVertical className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
