import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ProductsPage } from './pages/ProductsPage';
import { CreateProductPage } from './pages/CreateProductPage';
import { EditProductPage } from './pages/EditProductPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import CreateUserPage from './pages/CreateUserPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iguana-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/new" element={<CreateProductPage />} />
                <Route path="/products/:id/edit" element={<EditProductPage />} />
                <Route path="/images" element={<div>Image Management (Coming Soon)</div>} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/new" element={<CreateUserPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
