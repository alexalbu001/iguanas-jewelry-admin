import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductListResponse } from '../types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CubeIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

export const ProductsPage: React.FC = () => {
  const { apiRequest, isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState<ProductListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    } else {
      console.log('User not authenticated, skipping product fetch');
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/products');
      
      // Handle the actual data structure - products are returned directly, not wrapped
      const validProducts = Array.isArray(data) 
        ? data.filter(item => {
            // Check if item has the expected product properties directly
            return item && item.id && item.name;
          }).map(item => ({
            // Transform to expected ProductListResponse format
            product: item,
            primary_image_url: item.primary_image_url || null
          }))
        : [];
      
      setProducts(validProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiRequest(`/admin/products/${id}`, { method: 'DELETE' });
        setProducts(products.filter(p => p.product.id !== id));
      } catch (err: any) {
        console.error('Delete product error:', err);
        setError(err.message || 'Failed to delete product');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iguana-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-admin-900">Products</h1>
          <p className="mt-2 text-sm text-admin-600">
            Manage your jewelry products and inventory
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/products/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-iguana-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-iguana-700 focus:outline-none focus:ring-2 focus:ring-iguana-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Stock
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((productResponse) => {
                    // Safety check to prevent undefined errors
                    if (!productResponse || !productResponse.product) {
                      console.warn('Invalid product response:', productResponse);
                      return null;
                    }
                    
                    const product = productResponse.product;
                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {productResponse.primary_image_url ? (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover"
                                  src={productResponse.primary_image_url}
                                  alt={product.name || 'Product image'}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">No Image</span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name || 'Unknown Product'}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-iguana-100 text-iguana-800 capitalize">
                            {product.category || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(product.price || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.stock_quantity || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/products/${product.id}`}
                              className="text-iguana-600 hover:text-iguana-900"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/products/${product.id}/edit`}
                              className="text-iguana-600 hover:text-iguana-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {products.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new product.
          </p>
          <div className="mt-6">
            <Link
              to="/products/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-iguana-600 hover:bg-iguana-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Product
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
