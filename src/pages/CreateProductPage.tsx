import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import { ImageManagementModal } from '../components/images/ImageManagementModal';
import { ArrowLeftIcon, CheckIcon, PhotoIcon } from '@heroicons/react/24/outline';

export const CreateProductPage: React.FC = () => {
  const { apiRequest } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      console.log('Creating product:', productData);
      const response = await apiRequest('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });

      const createdProduct = await response.json();
      setCreatedProductId(createdProduct.id);
      setShowImageModal(true);
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-admin-900">Create New Product</h1>
        <p className="text-admin-600">Add a new product to your inventory</p>
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
                Creating...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Create Product
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Message */}
      {createdProductId && !showImageModal && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Product Created Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your product has been created. You can now add images or continue editing.</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                  >
                    <PhotoIcon className="h-4 w-4 inline mr-1" />
                    Add Images
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/products')}
                    className="ml-3 bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                  >
                    View All Products
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {createdProductId && (
        <ImageManagementModal
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false);
            navigate('/products');
          }}
          productId={createdProductId}
          productName={formData.name || 'Product'}
          initialImages={productImages}
          onImagesChange={setProductImages}
        />
      )}
    </div>
  );
};
