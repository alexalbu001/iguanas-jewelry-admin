import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  Bars3Icon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_main: boolean;
  display_order: number;
  content_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

interface ImageGalleryProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  onError: (error: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  productId,
  images,
  onImagesChange,
  onError,
}) => {
  const { apiRequest } = useAuth();
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderImages, setReorderImages] = useState<ProductImage[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; image: ProductImage | null }>({
    isOpen: false,
    image: null,
  });

  const handleSetPrimary = async (imageId: string) => {
    try {
      await apiRequest(`/admin/products/${productId}/images/${imageId}`, {
        method: 'PUT',
      });

      // Update local state
      const updatedImages = images.map(img => ({
        ...img,
        is_main: img.id === imageId,
      }));
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('Error setting primary image:', error);
      onError('Failed to set primary image');
    }
  };

  const handleDelete = async (imageId: string) => {
    setIsDeleting(imageId);
    try {
      await apiRequest(`/admin/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      });

      // Update local state
      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('Error deleting image:', error);
      onError('Failed to delete image');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStartReorder = () => {
    setReorderImages([...images]);
    setIsReordering(true);
  };

  const handleCancelReorder = () => {
    setReorderImages([]);
    setIsReordering(false);
  };

  const handleSaveReorder = async () => {
    try {
      const imageOrder = reorderImages.map(img => img.id);
      await apiRequest(`/admin/products/${productId}/images/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageOrder),
      });

      // Update local state with new order
      const updatedImages = reorderImages.map((img, index) => ({
        ...img,
        display_order: index + 1,
      }));
      onImagesChange(updatedImages);
      setIsReordering(false);
    } catch (error) {
      console.error('Error reordering images:', error);
      onError('Failed to reorder images');
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...reorderImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setReorderImages(newImages);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    return (bytes / 1024 / 1024).toFixed(2) + 'MB';
  };

  const displayImages = isReordering ? reorderImages : images;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Product Images ({images.length})
        </h3>
        <div className="flex space-x-2">
          {!isReordering && images.length > 1 && (
            <button
              type="button"
              onClick={handleStartReorder}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Bars3Icon className="h-4 w-4 mr-2" />
              Reorder
            </button>
          )}
          {isReordering && (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleSaveReorder}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Order
              </button>
              <button
                type="button"
                onClick={handleCancelReorder}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Grid */}
      {displayImages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No images uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayImages.map((image, index) => (
            <div
              key={image.id}
              className={`relative group bg-gray-100 rounded-lg overflow-hidden ${
                isReordering ? 'cursor-move' : ''
              }`}
              draggable={isReordering}
              onDragStart={(e) => {
                if (isReordering) {
                  e.dataTransfer.setData('text/plain', index.toString());
                }
              }}
              onDragOver={(e) => {
                if (isReordering) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => {
                if (isReordering) {
                  e.preventDefault();
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  moveImage(fromIndex, index);
                }
              }}
            >
              {/* Image */}
              <div className="aspect-square relative">
                <img
                  src={image.image_url}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Primary Badge */}
                {image.is_main && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <StarIconSolid className="h-3 w-3 mr-1" />
                      Primary
                    </span>
                  </div>
                )}

                {/* Loading Overlay */}
                {isDeleting === image.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                )}

                {/* Actions Overlay */}
                {!isReordering && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                        title="View full size"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {!image.is_main && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(image.id)}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                          title="Set as primary"
                        >
                          <StarIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, image })}
                        className="p-2 bg-white rounded-full text-red-700 hover:bg-red-100"
                        title="Delete image"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Info */}
              <div className="p-2 text-xs text-gray-600">
                <p className="truncate">{image.content_type}</p>
                {image.file_size && (
                  <p>{formatFileSize(image.file_size)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-full p-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-4 -right-4 p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <img
                src={selectedImage.image_url}
                alt="Product image preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, image: null })}
        onConfirm={() => {
          if (deleteConfirm.image) {
            handleDelete(deleteConfirm.image.id);
            setDeleteConfirm({ isOpen: false, image: null });
          }
        }}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </div>
  );
};

export default ImageGallery;