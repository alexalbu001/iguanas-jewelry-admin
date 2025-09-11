import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  CloudArrowUpIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface ImageUploadProps {
  productId: string;
  onUploadComplete: (image: any) => void;
  onUploadError: (error: string) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeBytes?: number;
  currentImageCount?: number;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  imageKey?: string;
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const ImageUpload: React.FC<ImageUploadProps> = ({
  productId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  currentImageCount = 0,
}) => {
  const { apiRequest } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Allowed types: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxSizeBytes) {
      return `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum size of ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`;
    }
    
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    const uploadId = Math.random().toString(36).substr(2, 9);
    const newUpload: UploadProgress = {
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploads(prev => [...prev, newUpload]);

    try {
      // Step 1: Generate upload URL
      const uploadResponse = await apiRequest(`/admin/products/${productId}/images/generate-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const { uploadUrl, imageKey } = uploadResponse;

      // Step 2: Upload file to storage
      const uploadProgress = (progressEvent: ProgressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploads(prev => 
          prev.map(upload => 
            upload.file === file 
              ? { ...upload, progress }
              : upload
          )
        );
      };

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', uploadProgress);

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

      await uploadPromise;

      // Step 3: Confirm upload
      const confirmResponse = await apiRequest(`/admin/products/${productId}/images/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageKey,
          isMain: (currentImageCount || 0) === 0, // Set as main if this is the first image
        }),
      });

      const confirmedImage = confirmResponse;

      // Update upload status
      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'success', imageKey }
            : upload
        )
      );

      onUploadComplete(confirmedImage);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'error', error: errorMessage }
            : upload
        )
      );
      
      onUploadError(errorMessage);
    }
  };

  const handleFiles = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - uploads.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    filesToUpload.forEach(uploadFile);
  }, [uploads.length, maxFiles, productId, onUploadComplete, onUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== file));
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + 'MB';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            <button
              type="button"
              className="font-medium text-blue-600 hover:text-blue-500"
              onClick={() => fileInputRef.current?.click()}
            >
              Click to upload
            </button>
            {' '}or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {acceptedTypes.join(', ')} up to {formatFileSize(maxSizeBytes)}
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
          {uploads.map((upload, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {upload.status === 'uploading' && <LoadingSpinner size="sm" />}
                {upload.status === 'success' && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
                {upload.status === 'error' && (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </p>
                
                {upload.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{upload.progress}%</p>
                  </div>
                )}
                
                {upload.status === 'error' && upload.error && (
                  <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => removeUpload(upload.file)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;