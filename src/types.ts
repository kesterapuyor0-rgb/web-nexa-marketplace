export type UserRole = 'buyer' | 'vendor' | 'admin' | null;

export interface BuyerProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
}

export interface VendorProfile {
  id: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  company_registration_no: string;
  tax_id?: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  bank_code: string;
  store_description?: string;
  store_logo_url?: string;
  is_approved: boolean;
  rejection_reason?: string | null;
  approved_at?: string | null;
  approved_by_admin_id?: string | null;
  wallet_balance: number;
  escrow_pending_balance: number;
  average_rating?: number;
  review_count?: number;
  business_category?: 'GENERAL' | 'RESTAURANT_FOOD';
  restaurant_business_type?: string;
  operating_hours?: string;
  delivery_radius_km?: number;
  preparation_time_mins?: number;
  hygiene_badges?: string[];
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  privilege_level: 'SUPER_ADMIN' | 'ESCROW_OFFICER' | 'COMPLIANCE_MANAGER';
  last_login?: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  vendor_name: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  inventory_count: number;
  category: string;
  images: string[];
  is_active: boolean;
  is_approved_by_admin: boolean;
  rating?: number;
  reviews_count?: number;
  discount_percent?: number;
  is_official_store?: boolean;
  items_sold_count?: number;
  brand?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface VendorReview {
  id: string;
  vendor_id: string;
  buyer_id: string;
  order_id: string;
  rating: number;
  review_text?: string;
  photo_url?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected?: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  vendor_id?: string;
  vendor_name?: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  image: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'HELD_IN_ESCROW'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'delivered_and_completed'
  | 'ESCROW_RELEASED'
  | 'REFUNDED'
  | 'DISPUTED';

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  vendor_id: string;
  vendor_name: string;
  total_amount: number;
  escrow_fee: number;
  vendor_payout_amount: number;
  currency: string;
  status: OrderStatus;
  shipping_address: {
    recipient_name: string;
    phone: string;
    address_line1: string;
    city: string;
    state: string;
    country: string;
  };
  items: OrderItem[];
  carrier_name?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  escrow_released_at?: string | null;
  paystack_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface EscrowTransaction {
  id: string;
  order_id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  vendor_id: string;
  vendor_name: string;
  paystack_reference: string;
  paystack_channel: string;
  amount: number;
  currency: string;
  escrow_status: 'HOLDING' | 'RELEASED_TO_VENDOR' | 'REFUNDED_TO_BUYER' | 'DISPUTED';
  released_by_admin_id?: string | null;
  released_by_admin_name?: string | null;
  released_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalGmv: number;
  totalEscrowHeld: number;
  totalEscrowReleased: number;
  totalBuyers: number;
  totalVendors: number;
  approvedVendors: number;
  pendingVendors: number;
  rejectedVendors: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
}
