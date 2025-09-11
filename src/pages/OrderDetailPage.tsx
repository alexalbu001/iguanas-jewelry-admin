import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OrderSummary, OrderStatus } from '../types/order';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest(`/orders/${id}`);
      console.log('Fetched order data:', data);
      setOrder(data);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to fetch order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    try {
      setIsUpdating(true);
      await apiRequest(`/admin/orders/${order.id}/status?status=${newStatus}`, {
        method: 'PUT',
      });
      
      setOrder({ ...order, status: newStatus });
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      case 'paid':
        return <CheckIcon className="h-5 w-5" />;
      case 'cancelled':
        return <XMarkIcon className="h-5 w-5" />;
      case 'delivered':
        return <TruckIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iguana-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-admin-900 mb-2">
          {error ? 'Error Loading Order' : 'Order Not Found'}
        </h2>
        <p className="text-admin-600 mb-4">
          {error || 'The order you\'re looking for doesn\'t exist.'}
        </p>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-iguana-600 text-white rounded-md hover:bg-iguana-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-iguana-600 hover:text-iguana-700 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Orders
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-admin-900">
              Order #{order.id.slice(-8)}
            </h1>
            <p className="text-admin-600">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-2 capitalize">{order.status}</span>
            </span>
            
            {/* Status Update Buttons */}
            {order.status === 'pending' && (
              <button
                onClick={() => handleStatusUpdate('paid')}
                disabled={isUpdating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Mark as Paid
              </button>
            )}
            
            {order.status === 'paid' && (
              <button
                onClick={() => handleStatusUpdate('delivered')}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <TruckIcon className="h-4 w-4 mr-2" />
                Mark as Delivered
              </button>
            )}
            
            {(order.status === 'pending' || order.status === 'paid') && (
              <button
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-16 w-16">
                      <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        Product ID: {item.product_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        Price: {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                      <p className="text-sm text-gray-500">
                        = {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-900">{order.shipping_name}</span>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-900">{order.shipping_address.email}</span>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-900">{order.shipping_address.phone}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Shipping Address</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="text-sm text-gray-900">
                  <p>{order.shipping_name}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p>{order.shipping_address.address_line2}</p>
                  )}
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID</span>
                <span className="font-mono text-gray-900">#{order.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Placed</span>
                <span className="text-gray-900">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Updated</span>
                <span className="text-gray-900">{formatDate(order.created_at)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
