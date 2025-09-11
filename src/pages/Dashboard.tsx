import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  CubeIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}

export const Dashboard: React.FC = () => {
  const { apiRequest } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, orders, users] = await Promise.all([
          apiRequest('/products'),
          apiRequest('/admin/orders'),
          apiRequest('/admin/users'),
        ]);

        const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total_amount, 0);

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalUsers: users.length,
          totalRevenue,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [apiRequest]);

  const statCards = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: CubeIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iguana-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-admin-900">Dashboard</h1>
        <p className="mt-1 text-sm text-admin-600">
          Overview of your jewelry store management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute ${card.color} rounded-md p-3`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {card.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-admin-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-6 w-6 text-iguana-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Add New Product
                    </dt>
                    <dd className="text-sm text-gray-900">
                      Create a new jewelry product
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/products/new" className="font-medium text-iguana-600 hover:text-iguana-500">
                  Go to Products
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingBagIcon className="h-6 w-6 text-iguana-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      View Orders
                    </dt>
                    <dd className="text-sm text-gray-900">
                      Manage customer orders
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/orders" className="font-medium text-iguana-600 hover:text-iguana-500">
                  Go to Orders
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-iguana-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Manage Users
                    </dt>
                    <dd className="text-sm text-gray-900">
                      View and manage user accounts
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/users" className="font-medium text-iguana-600 hover:text-iguana-500">
                  Go to Users
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
