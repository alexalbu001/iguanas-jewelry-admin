import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import { ImageManagementModal } from '../components/images/ImageManagementModal';
import { ArrowLeftIcon, CheckIcon, PhotoIcon } from '@heroicons/react/24/outline';

export const EditProductPage: React.FC = () => {
  const { apiRequest } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [productImages, setProductImages] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'rings' as Product['category'],
    stock_quantity: '',
  });

  const categories: Product['category'][] = ['rings', 'earrings', 'bracelets', 'necklaces'];

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setIsLoadingProduct(true);
      const data = await apiRequest(`/products/${id}`);
      console.log('Fetched product for editing:', data);
      
      // Handle the actual data structure
      const productData = data.product || data;
      setProduct(productData);
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price?.toString() || '',
        category: productData.category || 'rings',
        stock_quantity: productData.stock_quantity?.toString() || '',
      });
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to fetch product');
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsLoading(true);
    setError('');

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock_quantity: parseInt(formData.stock_quantity),
      };

      console.log('Updating product:', productData);
      await apiRequest(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });

      navigate('/products');
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message || 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iguana-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-admin-900 mb-2">Product Not Found</h2>
        <p className="text-admin-600 mb-4">The product you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/products')}
          className="px-4 py-2 bg-iguana-600 text-white rounded-md hover:bg-iguana-700"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center text-iguana-600 hover:text-iguana-700 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Products
        </button>
        <h1 className="text-2xl font-bold text-admin-900">Edit Product</h1>
        <p className="text-admin-600">Update product information</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-admin-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iguana-500 focus:border-iguana-500"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-admin-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iguana-500 focus:border-iguana-500"
            placeholder="Enter product description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-admin-700 mb-2">
              Price ($) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iguana-500 focus:border-iguana-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="stock_quantity" className="block text-sm font-medium text-admin-700 mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              id="stock_quantity"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iguana-500 focus:border-iguana-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-admin-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iguana-500 focus:border-iguana-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Image Management Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-admin-700">
              Product Images
            </label>
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-iguana-500"
            >
              <PhotoIcon className="h-4 w-4 mr-2" />
              Manage Images
            </button>
          </div>
          
          {/* Image Preview */}
          {productImages && productImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {productImages.slice(0, 4).map((image, index) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.image_url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  {image.is_main && (
                    <span className="absolute top-1 left-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
              ))}
              {productImages && productImages.length > 4 && (
                <div className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-500">
                    +{productImages.length - 4} more
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <PhotoIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No images uploaded yet</p>
              <p className="text-sm">Click "Manage Images" to upload photos</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-iguana-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-iguana-600 text-white rounded-md hover:bg-iguana-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-iguana-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Update Product
              </>
            )}
          </button>
        </div>
      </form>

      {/* Image Management Modal */}
      {id && (
        <ImageManagementModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          productId={id}
          productName={product?.name || 'Product'}
          initialImages={productImages}
          onImagesChange={setProductImages}
        />
      )}
    </div>
  );
};
