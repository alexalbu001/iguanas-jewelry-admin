import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ImageUpload } from './ImageUpload';
import { ImageGallery } from './ImageGallery';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

interface ImageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  initialImages?: ProductImage[];
  onImagesChange?: (images: ProductImage[]) => void;
}

export const ImageManagementModal: React.FC<ImageManagementModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  initialImages = [],
  onImagesChange,
}) => {
  const { apiRequest } = useAuth();
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');

  // Load images when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      loadImages();
    }
  }, [isOpen, productId]);

  const loadImages = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const imagesData = await apiRequest(`/admin/products/${productId}/images`);
      const safeImagesData = Array.isArray(imagesData) ? imagesData : [];
      setImages(safeImagesData);
      onImagesChange?.(safeImagesData);
    } catch (error) {
      console.error('Error loading images:', error);
      setError('Failed to load images');
      // Set empty array on error to prevent null issues
      setImages([]);
      onImagesChange?.([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (newImage: ProductImage) => {
    const updatedImages = [...(images || []), newImage];
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
    setActiveTab('gallery'); // Switch to gallery to show the new image
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleImagesChange = (updatedImages: ProductImage[]) => {
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Images
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {productName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gallery'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gallery ({images.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload Images
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  type="button"
                  onClick={loadImages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              {activeTab === 'gallery' ? (
                <ImageGallery
                  productId={productId}
                  images={images}
                  onImagesChange={handleImagesChange}
                  onError={handleError}
                />
              ) : (
                <ImageUpload
                  productId={productId}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  currentImageCount={images?.length || 0}
                  maxFiles={10}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {images.length} image{images.length !== 1 ? 's' : ''} uploaded
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageManagementModal;