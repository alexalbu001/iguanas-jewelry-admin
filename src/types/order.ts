export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface OrderSummary {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  shipping_name: string;
  shipping_address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    email: string;
    phone: string;
  };
  created_at: string;
  items: OrderItemSummary[];
}

export interface OrderItemSummary {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderItemWithProduct extends OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    primary_image_url?: string;
  };
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'delivered';

export interface OrderStatusUpdate {
  status: OrderStatus;
}

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
