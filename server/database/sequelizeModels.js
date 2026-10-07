import { DataTypes, Model, Sequelize } from "sequelize";
export const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || "webnexa_marketplace",
  process.env.MYSQL_USER || "webnexa_user",
  process.env.MYSQL_PASSWORD || "webnexa_password",
  {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT) || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 3e4,
      idle: 1e4
    }
  }
);
export class Admin extends Model {
  id;
  username;
  name;
  email;
  password_hash;
  privilege_level;
  last_login;
  created_at;
  updated_at;
}
Admin.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    privilege_level: {
      type: DataTypes.ENUM("SUPER_ADMIN", "ESCROW_OFFICER", "COMPLIANCE_MANAGER"),
      allowNull: false,
      defaultValue: "SUPER_ADMIN"
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "admins",
    timestamps: true,
    underscored: true
  }
);
export class Buyer extends Model {
  id;
  full_name;
  email;
  password_hash;
  shipping_address;
  phone;
  shipping_address_line1;
  shipping_address_line2;
  city;
  state;
  country;
  postal_code;
  created_at;
  updated_at;
}
Buyer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    shipping_address_line1: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    shipping_address_line2: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Nigeria"
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "buyers",
    timestamps: true,
    underscored: true
  }
);
export class Vendor extends Model {
  id;
  store_name;
  business_name;
  contact_person;
  email;
  password_hash;
  phone;
  company_registration_no;
  tax_id;
  bank_name;
  bank_account_number;
  bank_account_name;
  bank_code;
  store_description;
  store_logo_url;
  is_approved;
  requested_categories;
  rejection_reason;
  approved_at;
  approved_by_admin_id;
  wallet_balance;
  escrow_pending_balance;
  created_at;
  updated_at;
}
Vendor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    store_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    business_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contact_person: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    company_registration_no: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    tax_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    bank_account_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    bank_account_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    bank_code: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    store_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    store_logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    requested_categories: {
      type: DataTypes.JSON,
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approved_by_admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "admins",
        key: "id"
      }
    },
    wallet_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    escrow_pending_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: "vendors",
    timestamps: true,
    underscored: true
  }
);
export class Product extends Model {
  id;
  vendor_id;
  title;
  slug;
  description;
  price;
  stock_quantity;
  compare_at_price;
  inventory_count;
  category;
  images;
  is_active;
  is_approved_by_admin;
  created_at;
  updated_at;
}
Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    vendor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "vendors",
        key: "id"
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    compare_at_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    inventory_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_approved_by_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: "products",
    timestamps: true,
    underscored: true
  }
);
export class Order extends Model {
  id;
  order_number;
  buyer_id;
  vendor_id;
  total_amount;
  escrow_fee;
  vendor_payout_amount;
  currency;
  status;
  shipping_address;
  carrier_name;
  tracking_number;
  shipped_at;
  delivered_at;
  escrow_released_at;
  created_at;
  updated_at;
}
Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "buyers",
        key: "id"
      }
    },
    vendor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "vendors",
        key: "id"
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    escrow_fee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    vendor_payout_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "NGN"
    },
    status: {
      type: DataTypes.ENUM("PENDING_PAYMENT", "HELD_IN_ESCROW", "SHIPPED", "DELIVERED", "delivered_and_completed", "ESCROW_RELEASED", "REFUNDED", "DISPUTED"),
      allowNull: false,
      defaultValue: "PENDING_PAYMENT"
    },
    shipping_address: {
      type: DataTypes.JSON,
      allowNull: false
    },
    carrier_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    escrow_released_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
    underscored: true
  }
);
export class OrderItem extends Model {
  id;
  order_id;
  product_id;
  title;
  price;
  quantity;
  subtotal;
}
OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "orders",
        key: "id"
      }
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "products",
        key: "id"
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "order_items",
    timestamps: false,
    underscored: true
  }
);
export class EscrowTransaction extends Model {
  id;
  order_id;
  buyer_id;
  vendor_id;
  paystack_reference;
  paystack_channel;
  amount;
  currency;
  status;
  escrow_status;
  released_by_admin_id;
  released_at;
  paystack_metadata;
  created_at;
  updated_at;
}
EscrowTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "orders",
        key: "id"
      }
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "buyers",
        key: "id"
      }
    },
    vendor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "vendors",
        key: "id"
      }
    },
    paystack_reference: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    paystack_channel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "card"
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "NGN"
    },
    status: {
      type: DataTypes.ENUM("held", "released", "refunded"),
      allowNull: false,
      defaultValue: "held"
    },
    escrow_status: {
      type: DataTypes.ENUM("HOLDING", "RELEASED_TO_VENDOR", "REFUNDED_TO_BUYER", "DISPUTED"),
      allowNull: false,
      defaultValue: "HOLDING"
    },
    released_by_admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "admins",
        key: "id"
      }
    },
    released_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paystack_metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "escrow_transactions",
    timestamps: true,
    underscored: true
  }
);
export class VendorReview extends Model {
  id;
  vendor_id;
  buyer_id;
  order_id;
  rating;
  review_text;
  photo_url;
  created_at;
}
VendorReview.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    vendor_id: { type: DataTypes.UUID, allowNull: false, references: { model: "vendors", key: "id" } },
    buyer_id: { type: DataTypes.UUID, allowNull: false, references: { model: "buyers", key: "id" } },
    order_id: { type: DataTypes.UUID, allowNull: false, references: { model: "orders", key: "id" } },
    rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 5 } },
    review_text: { type: DataTypes.TEXT, allowNull: true },
    photo_url: { type: DataTypes.TEXT, allowNull: true }
  },
  { sequelize, tableName: "vendor_reviews", timestamps: false, underscored: true }
);
Admin.hasMany(Vendor, { foreignKey: "approved_by_admin_id", as: "approved_vendors" });
Vendor.belongsTo(Admin, { foreignKey: "approved_by_admin_id", as: "approver" });
Vendor.hasMany(Product, { foreignKey: "vendor_id", as: "products", onDelete: "CASCADE" });
Product.belongsTo(Vendor, { foreignKey: "vendor_id", as: "vendor" });
Buyer.hasMany(Order, { foreignKey: "buyer_id", as: "orders" });
Order.belongsTo(Buyer, { foreignKey: "buyer_id", as: "buyer" });
Vendor.hasMany(Order, { foreignKey: "vendor_id", as: "vendor_orders" });
Order.belongsTo(Vendor, { foreignKey: "vendor_id", as: "vendor" });
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });
Product.hasMany(OrderItem, { foreignKey: "product_id", as: "order_items" });
OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });
Order.hasOne(EscrowTransaction, { foreignKey: "order_id", as: "escrow" });
EscrowTransaction.belongsTo(Order, { foreignKey: "order_id", as: "order" });
Buyer.hasMany(EscrowTransaction, { foreignKey: "buyer_id", as: "escrow_transactions" });
EscrowTransaction.belongsTo(Buyer, { foreignKey: "buyer_id", as: "buyer" });
Vendor.hasMany(EscrowTransaction, { foreignKey: "vendor_id", as: "vendor_escrows" });
EscrowTransaction.belongsTo(Vendor, { foreignKey: "vendor_id", as: "vendor" });
Admin.hasMany(EscrowTransaction, { foreignKey: "released_by_admin_id", as: "released_escrows" });
EscrowTransaction.belongsTo(Admin, { foreignKey: "released_by_admin_id", as: "releasing_admin" });
Vendor.hasMany(VendorReview, { foreignKey: "vendor_id", as: "reviews" });
VendorReview.belongsTo(Vendor, { foreignKey: "vendor_id", as: "vendor" });
Buyer.hasMany(VendorReview, { foreignKey: "buyer_id", as: "vendor_reviews" });
VendorReview.belongsTo(Buyer, { foreignKey: "buyer_id", as: "buyer" });
Order.hasMany(VendorReview, { foreignKey: "order_id", as: "vendor_reviews" });
VendorReview.belongsTo(Order, { foreignKey: "order_id", as: "order" });
