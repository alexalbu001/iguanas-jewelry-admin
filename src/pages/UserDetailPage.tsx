import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, UserRole } from '../types/user';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { apiRequest } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  });
  const [roleUpdate, setRoleUpdate] = useState<UserRole>('customer');
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUser(id);
    }
  }, [id]);

  const fetchUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest(`/admin/users/${userId}`);
      setUser(response);
      setEditForm({
        name: response.name,
        email: response.email,
      });
      setRoleUpdate(response.role);
    } catch (err) {
      setError('Failed to fetch user details');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!user || !id) return;

    try {
      const updatedUser = await apiRequest(`/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleUpdateRole = async () => {
    if (!user || !id) return;

    try {
      await apiRequest(`/admin/users/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: roleUpdate }),
      });
      setUser({ ...user, role: roleUpdate });
    } catch (err) {
      setError('Failed to update user role');
      console.error('Error updating user role:', err);
    }
  };

  const handleDeleteUser = async () => {
    if (!user || !id) return;

    try {
      await apiRequest(`/admin/users/${id}`, {
        method: 'DELETE',
      });
      navigate('/users');
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
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

  const getRoleBadgeColor = (role: UserRole) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  const getRoleIcon = (role: UserRole) => {
    return role === 'admin' ? ShieldCheckIcon : UserIcon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">User not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error || 'The user you are looking for does not exist.'}
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <nav className="flex" aria-label="Breadcrumb">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/users')}
                className="text-gray-400 hover:text-gray-500"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <span className="ml-2 text-sm text-gray-500">Users</span>
            </div>
          </nav>
          <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {user.name}
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              {user.email}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              Joined {formatDate(user.created_at)}
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={() => setDeleteDialog(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* User Info */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                User Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Basic details about this user account.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    ) : (
                      user.name
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    ) : (
                      user.email
                    )}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                    {user.id}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Google ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                    {user.googleid}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {user.role}
                      </span>
                      <select
                        value={roleUpdate}
                        onChange={(e) => setRoleUpdate(e.target.value as UserRole)}
                        className="ml-3 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                      {roleUpdate !== user.role && (
                        <button
                          onClick={handleUpdateRole}
                          className="ml-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Update
                        </button>
                      )}
                    </div>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(user.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Profile
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-16 w-16">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <RoleIcon className="h-8 w-8 text-gray-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6 space-y-3">
              {isEditing && (
                <button
                  onClick={handleUpdateUser}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
              )}
              <button
                onClick={() => navigate(`/orders?user=${user.id}`)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${user.name}? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </div>
  );
};

export default UserDetailPage;
