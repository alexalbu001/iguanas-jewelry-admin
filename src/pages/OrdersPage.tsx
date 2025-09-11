import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OrderSummary, OrderStatus, OrderFilters } from '../types/order';
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export const OrdersPage: React.FC = () => {
  const { apiRequest } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<OrderFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      let url = '/admin/orders';
      
      // Add status filter if specified
      if (filters.status) {
        url += `?status=${filters.status}`;
      }
      
      const data = await apiRequest(url);
      console.log('Fetched orders data:', data);
      
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await apiRequest(`/admin/orders/${orderId}/status?status=${newStatus}`, {
        method: 'PUT',
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
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
        return <ClockIcon className="h-4 w-4" />;
      case 'paid':
        return <CheckIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XMarkIcon className="h-4 w-4" />;
      case 'delivered':
        return <TruckIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const filteredOrders = orders.filter(order => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchTerm) ||
        order.shipping_name.toLowerCase().includes(searchTerm) ||
        order.shipping_address.email.toLowerCase().includes(searchTerm) ||
        order.shipping_address.phone.toLowerCase().includes(searchTerm) ||
        order.shipping_address.city.toLowerCase().includes(searchTerm) ||
        order.shipping_address.state.toLowerCase().includes(searchTerm) ||
        order.shipping_address.country.toLowerCase().includes(searchTerm) ||
        order.items.some(item => item.product_name.toLowerCase().includes(searchTerm))
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iguana-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error: {error}</p>
        <button
          onClick={fetchOrders}
          className="mt-4 px-4 py-2 bg-iguana-600 text-white rounded-md hover:bg-iguana-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-admin-900">Orders</h1>
          <p className="mt-2 text-sm text-admin-600">
            Manage customer orders and track their status ({orders.length} total)
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-iguana-500 focus:ring-offset-2"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as OrderStatus || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iguana-500 focus:border-iguana-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Order ID, name, or email..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iguana-500 focus:border-iguana-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Order
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Delivery Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Items
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.shipping_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.shipping_address.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.shipping_address.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.shipping_address.address_line1}
                        </div>
                        {order.shipping_address.address_line2 && (
                          <div className="text-sm text-gray-500">
                            {order.shipping_address.address_line2}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.shipping_address.country}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={item.id} className="truncate">
                              {item.quantity}x {item.product_name}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{order.items.length - 2} more...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-iguana-600 hover:text-iguana-900"
                            title="View Order"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          
                          {/* Status Update Buttons */}
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'paid')}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Paid"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}
                          
                          {order.status === 'paid' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'delivered')}
                              className="text-blue-600 hover:text-blue-900"
                              title="Mark as Delivered"
                            >
                              <TruckIcon className="h-5 w-5" />
                            </button>
                          )}
                          
                          {(order.status === 'pending' || order.status === 'paid') && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel Order"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.status || filters.search 
              ? 'Try adjusting your filters to see more orders.'
              : 'Orders will appear here when customers make purchases.'
            }
          </p>
        </div>
      )}
    </div>
  );
};
