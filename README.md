# Iguanas Jewelry Admin Panel

A modern admin interface for managing the Iguanas Jewelry e-commerce platform.

## 🚀 Features

- **Dashboard**: Overview of products, orders, users, and revenue
- **Product Management**: Create, edit, delete, and manage jewelry products
- **Image Management**: Upload and organize product images
- **Order Management**: View and manage customer orders
- **User Management**: Manage user accounts and roles
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Heroicons** for icons
- **Headless UI** for accessible components

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env file
REACT_APP_API_URL=http://localhost:8080/api/v1
REACT_APP_ADMIN_URL=http://localhost:3001
```

3. Start the development server:
```bash
npm start
```

The admin panel will be available at `http://localhost:3001`

## 🌐 Deployment Options

### Option 1: Subdomain (Recommended)
- **Admin URL**: `admin.iguanas-jewelry.com`
- **Customer URL**: `iguanas-jewelry.com`
- **API URL**: `api.iguanas-jewelry.com`

### Option 2: Path-based
- **Admin URL**: `iguanas-jewelry.com/admin`
- **Customer URL**: `iguanas-jewelry.com`

## 🔧 Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_ADMIN_URL`: Admin panel URL

### API Integration
The admin panel integrates with your existing Go backend API:
- Products: `/api/v1/products`
- Admin Products: `/api/v1/admin/products`
- Orders: `/api/v1/admin/orders`
- Users: `/api/v1/admin/users`

## 📱 Pages

- **Dashboard** (`/`): Overview and quick actions
- **Products** (`/products`): Product management
- **Images** (`/images`): Image management (coming soon)
- **Orders** (`/orders`): Order management (coming soon)
- **Users** (`/users`): User management (coming soon)

## 🔐 Authentication

The admin panel uses JWT tokens for authentication. Admin users must be authenticated to access any admin functionality.

## 🎨 Styling

The admin panel uses a custom color scheme:
- **Primary**: Iguanas green (`#22c55e`)
- **Admin**: Professional grays and blues
- **Responsive**: Mobile-first design

## 🚀 Next Steps

1. **Image Management**: Complete the image upload and management interface
2. **Order Management**: Build order status management
3. **User Management**: Add user role management
4. **Product Forms**: Create product creation/editing forms
5. **Analytics**: Add sales analytics and reporting

## 📝 Development

To add new features:
1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update routing in `src/App.tsx`
4. Add API methods in `src/services/api.ts`