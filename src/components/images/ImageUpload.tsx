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

// Environment detection - you can also get this from config
const isProduction = process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENV === 'production';

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

  /**
   * Local storage upload (for development)
   * Uses the existing backend memory upload via POST endpoint
   */
  const uploadFileLocal = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    const newUpload: UploadProgress = {
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploads(prev => [...prev, newUpload]);

    try {
      // Step 1: Generate upload URL (your existing POST endpoint)
      const uploadResponse = await apiRequest(`/admin/products/${productId}/images/generate-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const { uploadUrl, imageKey } = uploadResponse;

      // Step 2: Upload file to local storage via backend
      const uploadPromise = new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploads(prev => 
              prev.map(upload => 
                upload.file === file 
                  ? { ...upload, progress }
                  : upload
              )
            );
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      await uploadPromise;

      // Step 3: Confirm upload (same for both local and S3)
      const confirmResponse = await apiRequest(`/admin/products/${productId}/images/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageKey,
          isMain: (currentImageCount || 0) === 0,
        }),
      });

      // Update upload status
      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'success', progress: 100, imageKey }
            : upload
        )
      );

      onUploadComplete(confirmResponse);

      // Clean up completed upload after 3 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => upload.file !== file));
      }, 3000);

    } catch (error) {
      console.error('Local upload error:', error);
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

  /**
   * S3 upload (for production)
   * Uses presigned URLs for direct S3 upload
   */
  const uploadFileS3 = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    const newUpload: UploadProgress = {
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploads(prev => [...prev, newUpload]);

    try {
      // Step 1: Get presigned upload URL from your API
      const imageType = (currentImageCount || 0) === 0 ? 'main' : 'gallery';
      const uploadUrlResponse = await apiRequest(
        `/admin/products/${productId}/images/generate-upload-url?content_type=${encodeURIComponent(file.type)}&product_id=${productId}&type=${imageType}`,
        { method: 'GET' }
      );

      const { upload_url, key: imageKey } = uploadUrlResponse;
      if (!upload_url || !imageKey) {
        throw new Error('Failed to get upload URL from server');
      }

      // Step 2: Upload file directly to S3
      const uploadPromise = new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploads(prev => 
              prev.map(upload => 
                upload.file === file 
                  ? { ...upload, progress }
                  : upload
              )
            );
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('S3 upload failed - network error'));
        };

        xhr.ontimeout = () => {
          reject(new Error('S3 upload failed - timeout'));
        };

        // Configure the request for S3
        xhr.open('PUT', upload_url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.timeout = 120000; // 2 minutes timeout
        
        // Send the file
        xhr.send(file);
      });

      await uploadPromise;

      // Step 3: Confirm upload with your backend (same as local)
      const confirmResponse = await apiRequest(`/admin/products/${productId}/images/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageKey,
          isMain: (currentImageCount || 0) === 0,
        }),
      });

      // Update upload status to success
      setUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'success', progress: 100, imageKey }
            : upload
        )
      );

      onUploadComplete(confirmResponse);

      // Clean up completed upload after 3 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => upload.file !== file));
      }, 3000);

    } catch (error) {
      console.error('S3 upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Update upload status to error
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

  // Main upload function that chooses the right implementation
  const uploadFile = async (file: File) => {
    if (isProduction) {
      console.log('Using S3 upload for production environment');
      await uploadFileS3(file);
    } else {
      console.log('Using local storage upload for development environment');
      await uploadFileLocal(file);
    }
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the maximum
    if (uploads.length + fileArray.length + (currentImageCount || 0) > maxFiles) {
      onUploadError(`Cannot upload more than ${maxFiles} images per product`);
      return;
    }

    // Upload files sequentially to avoid overwhelming the server
    for (const file of fileArray) {
      await uploadFile(file);
      // Small delay between uploads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }, [uploads.length, currentImageCount, maxFiles]);

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
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  }, [handleFiles]);

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== file));
  };

  const retryUpload = (file: File) => {
    // Remove the failed upload and try again
    setUploads(prev => prev.filter(upload => upload.file !== file));
    uploadFile(file);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + 'MB';
  };

  return (
    <div className="space-y-4">
      {/* Environment indicator (only shown in development) */}
      {!isProduction && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Development Mode:</strong> Using local storage upload. 
                Images will be stored on the backend server.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-iguana-400 bg-iguana-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {acceptedTypes.join(', ')} up to {formatFileSize(maxSizeBytes)}
          </p>
          <p className="text-xs text-gray-500">
            Maximum {maxFiles} images per product
          </p>
          {isProduction && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Direct upload to cloud storage
            </p>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Upload Progress {isProduction ? '(S3)' : '(Local)'}
          </h4>
          {uploads.map((upload, index) => (
            <div key={`${upload.file.name}-${index}`} className="bg-white border rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {upload.file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ({formatFileSize(upload.file.size)})
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {upload.status === 'uploading' && (
                    <LoadingSpinner size="sm" />
                  )}
                  {upload.status === 'success' && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  )}
                  
                  <button
                    onClick={() => removeUpload(upload.file)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-iguana-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}

              {/* Error Message */}
              {upload.status === 'error' && upload.error && (
                <div className="mt-2">
                  <p className="text-xs text-red-600">{upload.error}</p>
                  <button
                    onClick={() => retryUpload(upload.file)}
                    className="text-xs text-iguana-600 hover:text-iguana-800 mt-1"
                  >
                    Retry upload
                  </button>
                </div>
              )}

              {/* Success Message */}
              {upload.status === 'success' && (
                <p className="text-xs text-green-600 mt-2">
                  Upload completed successfully! 
                  {isProduction ? ' (Stored in S3)' : ' (Stored locally)'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;