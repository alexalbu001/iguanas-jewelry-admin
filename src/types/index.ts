export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'rings' | 'earrings' | 'bracelets' | 'necklaces';
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_main: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductDetailResponse {
  product: Product;
  images: ProductImage[];
}

export interface ProductListResponse {
  product: Product;
  primary_image_url?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token?: string;
  csrfToken?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}
