/**
 * WebNexa Multi-Vendor Marketplace - Sequelize ORM Models
 * Demonstrates strict architectural separation of `buyers`, `vendors`, and `admins`
 * with relational associations to products, orders, and escrow transactions.
 */

import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Initialize Sequelize instance (configured via environment variables)
export const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'webnexa_marketplace',
  process.env.MYSQL_USER || 'webnexa_user',
  process.env.MYSQL_PASSWORD || 'webnexa_password',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// -------------------------------------------------------------------------
// 1. ADMIN MODEL (admins table)
// -------------------------------------------------------------------------
export interface AdminAttributes {
  id: string;
  username: string;
  name: string;
  email: string;
  password_hash: string;
  privilege_level: 'SUPER_ADMIN' | 'ESCROW_OFFICER' | 'COMPLIANCE_MANAGER';
  last_login?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export class Admin extends Model<AdminAttributes, Optional<AdminAttributes, 'id' | 'privilege_level' | 'last_login'>> implements AdminAttributes {
  public id!: string;
  public username!: string;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public privilege_level!: 'SUPER_ADMIN' | 'ESCROW_OFFICER' | 'COMPLIANCE_MANAGER';
  public last_login!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Admin.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    privilege_level: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'ESCROW_OFFICER', 'COMPLIANCE_MANAGER'),
      allowNull: false,
      defaultValue: 'SUPER_ADMIN',
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'admins',
    timestamps: true,
    underscored: true,
  }
);

// -------------------------------------------------------------------------
// 2. BUYER MODEL (buyers table)
// -------------------------------------------------------------------------
export interface BuyerAttributes {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  shipping_address?: string | null;
  phone?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  postal_code?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class Buyer extends Model<BuyerAttributes, Optional<BuyerAttributes, 'id' | 'phone' | 'country'>> implements BuyerAttributes {
  public id!: string;
  public full_name!: string;
  public email!: string;
  public password_hash!: string;
  public shipping_address!: string | null;
  public phone!: string | null;
  public shipping_address_line1!: string | null;
  public shipping_address_line2!: string | null;
  public city!: string | null;
  public state!: string | null;
  public country!: string;
  public postal_code!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Buyer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    shipping_address_line1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    shipping_address_line2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Nigeria',
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'buyers',
    timestamps: true,
    underscored: true,
  }
);

// -------------------------------------------------------------------------
// 3. VENDOR MODEL (vendors table)
// -------------------------------------------------------------------------
export interface VendorAttributes {
  id: string;
  store_name?: string | null;
  business_name: string;
  contact_person: string;
  email: string;
  password_hash: string;
  phone: string;
  company_registration_no: string;
  tax_id?: string | null;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  bank_code: string;
  store_description?: string | null;
  store_logo_url?: string | null;
  is_approved: boolean;
  requested_categories?: string[] | null;
  rejection_reason?: string | null;
  approved_at?: Date | null;
  approved_by_admin_id?: string | null;
  wallet_balance: number;
  escrow_pending_balance: number;
  created_at?: Date;
  updated_at?: Date;
}

export class Vendor extends Model<VendorAttributes, Optional<VendorAttributes, 'id' | 'is_approved' | 'wallet_balance' | 'escrow_pending_balance'>> implements VendorAttributes {
  public id!: string;
  public store_name!: string | null;
  public business_name!: string;
  public contact_person!: string;
  public email!: string;
  public password_hash!: string;
  public phone!: string;
  public company_registration_no!: string;
  public tax_id!: string | null;
  public bank_name!: string;
  public bank_account_number!: string;
  public bank_account_name!: string;
  public bank_code!: string;
  public store_description!: string | null;
  public store_logo_url!: string | null;
  public is_approved!: boolean;
  public requested_categories!: string[] | null;
  public rejection_reason!: string | null;
  public approved_at!: Date | null;
  public approved_by_admin_id!: string | null;
  public wallet_balance!: number;
  public escrow_pending_balance!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Vendor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    store_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    business_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contact_person: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    company_registration_no: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    tax_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    bank_account_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    bank_account_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bank_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    store_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    store_logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    requested_categories: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_by_admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'admins',
        key: 'id',
      },
    },
    wallet_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    escrow_pending_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    sequelize,
    tableName: 'vendors',
    timestamps: true,
    underscored: true,
  }
);

// -------------------------------------------------------------------------
// 4. PRODUCT MODEL (products table)
// -------------------------------------------------------------------------
export interface ProductAttributes {
  id: string;
  vendor_id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  compare_at_price?: number | null;
  inventory_count: number;
  category: string;
  images: string[];
  is_active: boolean;
  is_approved_by_admin: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Product extends Model<ProductAttributes, Optional<ProductAttributes, 'id' | 'inventory_count' | 'is_active' | 'is_approved_by_admin'>> implements ProductAttributes {
  public id!: string;
  public vendor_id!: string;
  public title!: string;
  public slug!: string;
  public description!: string;
  public price!: number;
  public stock_quantity!: number;
  public compare_at_price!: number | null;
  public inventory_count!: number;
  public category!: string;
  public images!: string[];
  public is_active!: boolean;
  public is_approved_by_admin!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vendor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    compare_at_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    inventory_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_approved_by_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true,
  }
);

// -------------------------------------------------------------------------
// 5. ORDER MODEL (orders table)
// -------------------------------------------------------------------------
export interface OrderAttributes {
  id: string;
  order_number: string;
  buyer_id: string;
  vendor_id: string;
  total_amount: number;
  escrow_fee: number;
  vendor_payout_amount: number;
  currency: string;
  status: 'PENDING_PAYMENT' | 'HELD_IN_ESCROW' | 'SHIPPED' | 'DELIVERED' | 'delivered_and_completed' | 'ESCROW_RELEASED' | 'REFUNDED' | 'DISPUTED';
  shipping_address: Record<string, any>;
  carrier_name?: string | null;
  tracking_number?: string | null;
  shipped_at?: Date | null;
  delivered_at?: Date | null;
  escrow_released_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export class Order extends Model<OrderAttributes, Optional<OrderAttributes, 'id' | 'escrow_fee' | 'currency' | 'status'>> implements OrderAttributes {
  public id!: string;
  public order_number!: string;
  public buyer_id!: string;
  public vendor_id!: string;
  public total_amount!: number;
  public escrow_fee!: number;
  public vendor_payout_amount!: number;
  public currency!: string;
  public status!: 'PENDING_PAYMENT' | 'HELD_IN_ESCROW' | 'SHIPPED' | 'DELIVERED' | 'delivered_and_completed' | 'ESCROW_RELEASED' | 'REFUNDED' | 'DISPUTED';
  public shipping_address!: Record<string, any>;
  public carrier_name!: string | null;
  public tracking_number!: string | null;
  public shipped_at!: Date | null;
  public delivered_at!: Date | null;
  public escrow_released_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'buyers',
        key: 'id',
      },
    },
    vendor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    escrow_fee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    vendor_payout_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'NGN',
    },
    status: {
      type: DataTypes.ENUM('PENDING_PAYMENT', 'HELD_IN_ESCROW', 'SHIPPED', 'DELIVERED', 'delivered_and_completed', 'ESCROW_RELEASED', 'REFUNDED', 'DISPUTED'),
      allowNull: false,
      defaultValue: 'PENDING_PAYMENT',
    },
    shipping_address: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    carrier_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    escrow_released_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    underscored: true,
  }
);

// -------------------------------------------------------------------------
// 6. ORDER ITEM MODEL (order_items table)
// -------------------------------------------------------------------------
export interface OrderItemAttributes {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export class OrderItem extends Model<OrderItemAttributes, Optional<OrderItemAttributes, 'id'>> implements OrderItemAttributes {
  public id!: string;
  public order_id!: string;
  public product_id!: string;
  public title!: string;
  public price!: number;
  public quantity!: number;
  public subtotal!: number;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: false,
    underscored: true,
  }
);

// -------------------------------------------------------------------------
// 7. ESCROW TRANSACTION MODEL (escrow_transactions table)
// -------------------------------------------------------------------------
export interface EscrowTransactionAttributes {
  id: string;
  order_id: string;
  buyer_id: string;
  vendor_id: string;
  paystack_reference: string;
  paystack_channel?: string | null;
  amount: number;
  currency: string;
  status: 'held' | 'released' | 'refunded';
  escrow_status: 'HOLDING' | 'RELEASED_TO_VENDOR' | 'REFUNDED_TO_BUYER' | 'DISPUTED';
  released_by_admin_id?: string | null;
  released_at?: Date | null;
  paystack_metadata?: Record<string, any> | null;
  created_at?: Date;
  updated_at?: Date;
}

export class EscrowTransaction extends Model<EscrowTransactionAttributes, Optional<EscrowTransactionAttributes, 'id' | 'currency' | 'escrow_status'>> implements EscrowTransactionAttributes {
  public id!: string;
  public order_id!: string;
  public buyer_id!: string;
  public vendor_id!: string;
  public paystack_reference!: string;
  public paystack_channel!: string | null;
  public amount!: number;
  public currency!: string;
  public status!: 'held' | 'released' | 'refunded';
  public escrow_status!: 'HOLDING' | 'RELEASED_TO_VENDOR' | 'REFUNDED_TO_BUYER' | 'DISPUTED';
  public released_by_admin_id!: string | null;
  public released_at!: Date | null;
  public paystack_metadata!: Record<string, any> | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EscrowTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'buyers',
        key: 'id',
      },
    },
    vendor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    paystack_reference: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    paystack_channel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'card',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'NGN',
    },
    status: {
      type: DataTypes.ENUM('held', 'released', 'refunded'),
      allowNull: false,
      defaultValue: 'held',
    },
    escrow_status: {
      type: DataTypes.ENUM('HOLDING', 'RELEASED_TO_VENDOR', 'REFUNDED_TO_BUYER', 'DISPUTED'),
      allowNull: false,
      defaultValue: 'HOLDING',
    },
    released_by_admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'admins',
        key: 'id',
      },
    },
    released_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paystack_metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'escrow_transactions',
    timestamps: true,
    underscored: true,
  }
);

export interface VendorReviewAttributes {
  id: string;
  vendor_id: string;
  buyer_id: string;
  order_id: string;
  rating: number;
  review_text?: string | null;
  photo_url?: string | null;
  created_at?: Date;
}

export class VendorReview extends Model<VendorReviewAttributes, Optional<VendorReviewAttributes, 'id'>> implements VendorReviewAttributes {
  public id!: string;
  public vendor_id!: string;
  public buyer_id!: string;
  public order_id!: string;
  public rating!: number;
  public review_text!: string | null;
  public photo_url!: string | null;
  public readonly created_at!: Date;
}

VendorReview.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    vendor_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'vendors', key: 'id' } },
    buyer_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'buyers', key: 'id' } },
    order_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
    rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 5 } },
    review_text: { type: DataTypes.TEXT, allowNull: true },
    photo_url: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'vendor_reviews', timestamps: false, underscored: true }
);

// -------------------------------------------------------------------------
// MODEL ASSOCIATIONS (Strict Foreign Key Mappings)
// -------------------------------------------------------------------------

// Admin <-> Vendor (Verification)
Admin.hasMany(Vendor, { foreignKey: 'approved_by_admin_id', as: 'approved_vendors' });
Vendor.belongsTo(Admin, { foreignKey: 'approved_by_admin_id', as: 'approver' });

// Vendor <-> Product (Multi-vendor catalog)
Vendor.hasMany(Product, { foreignKey: 'vendor_id', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// Buyer <-> Order
Buyer.hasMany(Order, { foreignKey: 'buyer_id', as: 'orders' });
Order.belongsTo(Buyer, { foreignKey: 'buyer_id', as: 'buyer' });

// Vendor <-> Order
Vendor.hasMany(Order, { foreignKey: 'vendor_id', as: 'vendor_orders' });
Order.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product <-> OrderItem
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order <-> EscrowTransaction
Order.hasOne(EscrowTransaction, { foreignKey: 'order_id', as: 'escrow' });
EscrowTransaction.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Escrow <-> Buyer & Vendor & Admin
Buyer.hasMany(EscrowTransaction, { foreignKey: 'buyer_id', as: 'escrow_transactions' });
EscrowTransaction.belongsTo(Buyer, { foreignKey: 'buyer_id', as: 'buyer' });

Vendor.hasMany(EscrowTransaction, { foreignKey: 'vendor_id', as: 'vendor_escrows' });
EscrowTransaction.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

Admin.hasMany(EscrowTransaction, { foreignKey: 'released_by_admin_id', as: 'released_escrows' });
EscrowTransaction.belongsTo(Admin, { foreignKey: 'released_by_admin_id', as: 'releasing_admin' });

Vendor.hasMany(VendorReview, { foreignKey: 'vendor_id', as: 'reviews' });
VendorReview.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Buyer.hasMany(VendorReview, { foreignKey: 'buyer_id', as: 'vendor_reviews' });
VendorReview.belongsTo(Buyer, { foreignKey: 'buyer_id', as: 'buyer' });
Order.hasMany(VendorReview, { foreignKey: 'order_id', as: 'vendor_reviews' });
VendorReview.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
