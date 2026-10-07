import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface BuyerRecord {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
}

export interface VendorRecord {
  id: string;
  business_name: string;
  contact_person: string;
  email: string;
  password_hash: string;
  phone: string;
  company_registration_no: string;
  tax_id: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  bank_code: string;
  store_description: string;
  store_logo_url: string;
  is_approved: boolean;
  rejection_reason?: string | null;
  approved_at?: string | null;
  approved_by_admin_id?: string | null;
  wallet_balance: number;
  escrow_pending_balance: number;
  created_at: string;
  updated_at: string;
  business_category?: 'GENERAL' | 'RESTAURANT_FOOD';
  restaurant_business_type?: string;
  operating_hours?: string;
  delivery_radius_km?: number;
  preparation_time_mins?: number;
  hygiene_badges?: string[];
}

export interface RestaurantRecord {
  id: string;
  vendor_id: string;
  business_name: string;
  cuisine_type: string;
  opening_hours: string;
  delivery_radius_km: number;
  preparation_time_mins: number;
  hygiene_badges: string[];
  category?: string;
  rating?: number;
  reviews_count?: number;
  delivery_fee?: number;
  banner_url?: string;
  logo_url?: string;
}

export interface MenuItemRecord {
  id: string;
  restaurant_id: string;
  item_name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  addons: { id: string; addon_name: string; extra_price: number }[];
  prep_time_mins?: number;
}

export interface FoodOrderRecord {
  id: string;
  buyer_id: string;
  restaurant_id: string;
  total_amount: number;
  delivery_address: string;
  delivery_phone?: string;
  delivery_notes?: string;
  scheduled_for?: string | null;
  preparation_status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY';
  delivery_status: 'PENDING' | 'OUT_FOR_DELIVERY' | 'DELIVERED_AND_CONFIRMED';
  created_at: string;
  updated_at: string;
}

export interface AdminRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  privilege_level: 'SUPER_ADMIN' | 'ESCROW_OFFICER' | 'COMPLIANCE_MANAGER';
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductRecord {
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

export interface VendorReviewRecord {
  id: string;
  vendor_id: string;
  buyer_id: string;
  order_id: string;
  rating: number;
  review_text?: string;
  photo_url?: string;
  created_at: string;
}

export interface ChatMessageRecord {
  id: string;
  sender_id: string;
  sender_role: 'buyer' | 'vendor';
  recipient_id: string;
  recipient_role: 'buyer' | 'vendor';
  body: string;
  created_at: string;
}

export interface SocialPostRecord {
  id: string;
  author_id: string;
  author_role: 'buyer' | 'vendor';
  handle: string;
  body: string;
  media_url?: string;
  product_id?: string;
  likes_count: number;
  created_at: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  vendor_id: string;
  vendor_name: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  image: string;
}

export interface OrderRecord {
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
  status: 'PENDING_PAYMENT' | 'payment_verified_pending_admin_approval' | 'HELD_IN_ESCROW' | 'SHIPPED' | 'DELIVERED' | 'delivered_and_completed' | 'ESCROW_RELEASED' | 'REFUNDED' | 'DISPUTED';
  shipping_address: {
    recipient_name: string;
    phone: string;
    address_line1: string;
    city: string;
    state: string;
    country: string;
  };
  items: OrderItemRecord[];
  carrier_name?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  escrow_released_at?: string | null;
  paystack_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface EscrowTransactionRecord {
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

export type WalletOwnerType = 'buyer' | 'vendor' | 'admin';
export type WalletTransactionStatus = 'pending' | 'completed' | 'failed';
export interface WalletRecord {
  id: string;
  owner_type: WalletOwnerType;
  owner_id: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
}
export interface WalletTransactionRecord {
  id: string;
  wallet_id: string;
  owner_type: WalletOwnerType;
  owner_id: string;
  type: 'deposit' | 'payment' | 'payout' | 'refund' | 'fee' | 'adjustment';
  direction: 'credit' | 'debit';
  amount: number;
  currency: string;
  provider: 'paystack' | 'nowpayments' | 'internal';
  provider_reference?: string;
  status: WalletTransactionStatus;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Pre-hashed default password: "Password123!"
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);

class MarketplaceStore {
  public vendorReviews: VendorReviewRecord[] = [];
  public chatMessages: ChatMessageRecord[] = [];
  public socialPosts: SocialPostRecord[] = [];
  public restaurants: RestaurantRecord[] = [];
  public menuItems: MenuItemRecord[] = [];
  public foodOrders: FoodOrderRecord[] = [];

  constructor() {
    const restaurantSeeds = [
      ['restaurant-seed-1', 'Harmony Culinary House', 'African Cuisine', 'Nigerian & West African', 4.8, 142, 1800, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=85'],
      ['restaurant-seed-2', 'Apex Gourmet Kitchen', 'Fine Dining', 'Contemporary African', 4.9, 98, 2500, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85'],
      ['restaurant-seed-3', 'Urban Bistro & Drinks', 'Drinks & Desserts', 'Cocktails & Desserts', 4.7, 216, 1500, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=85'],
      ['restaurant-seed-4', 'Naija Fire Grill', 'Fast Food', 'Grills & Street Food', 4.6, 187, 1200, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=85'],
      ['restaurant-seed-5', 'Green Bowl Lagos', 'Vegetarian', 'Plant-Based Kitchen', 4.8, 76, 1000, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=85'],
      ['restaurant-seed-6', 'The Pepper Table', 'African Cuisine', 'Modern Nigerian', 4.5, 64, 2000, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1200&q=85'],
      ['restaurant-seed-7', 'Sweet Crumb Atelier', 'Drinks & Desserts', 'Bakery & Coffee', 4.9, 301, 1300, 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200&q=85'],
    ] as const;
    restaurantSeeds.forEach(([id, business_name, category, cuisine_type, rating, reviews_count, delivery_fee, banner_url], index) => {
      this.restaurants.push({
        id, vendor_id: `vendor-food-seed-${index + 1}`, business_name, cuisine_type,
        opening_hours: '08:00 - 22:00', delivery_radius_km: 12, preparation_time_mins: 20 + index * 3,
        hygiene_badges: ['Verified Kitchen'], category, rating, reviews_count, delivery_fee, banner_url,
        logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(business_name)}&background=6d28d9&color=fff`,
      });
      const dishes: Array<[string, string, number, string, string]> = [
        ['Chef Signature Bowl', 'Slow-cooked seasonal ingredients, fragrant grains, and the chef’s house sauce.', 6800 + index * 300, 'Main Course', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=85'],
        ['Smoky Suya Platter', 'Charcoal-grilled skewers with caramelised onions, fresh slaw, and pepper relish.', 5200 + index * 250, 'Main Course', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=85'],
        ['Signature Cooler', 'A chilled house blend with citrus, herbs, and a bright tropical finish.', 2400 + index * 100, 'Drinks', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=85'],
      ];
      dishes.forEach(([item_name, description, price, itemCategory, image_url], dishIndex) => this.menuItems.push({
        id: `${id}-menu-${dishIndex + 1}`, restaurant_id: id, item_name, description, price: Number(price),
        category: itemCategory, image_url, is_available: true, prep_time_mins: 15 + dishIndex * 5,
        addons: [
          { id: `${id}-addon-${dishIndex}-1`, addon_name: 'Extra protein', extra_price: 1200 },
          { id: `${id}-addon-${dishIndex}-2`, addon_name: 'Fresh juice', extra_price: 900 },
        ],
      }));
    });
    this.loadPersistedAuthRecords();
    this.ensureWallets();
  }

  private authPersistencePath(): string {
    return process.env.WEBNEXA_AUTH_DATA_FILE || path.join(process.cwd(), '.data', 'auth-records.json');
  }

  private loadPersistedAuthRecords(): void {
    const filePath = this.authPersistencePath();
    try {
      if (!fs.existsSync(filePath)) return;
      const saved = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<{
        buyers: BuyerRecord[];
        vendors: VendorRecord[];
        admins: AdminRecord[];
      }>;
      if (Array.isArray(saved.buyers)) this.buyers = saved.buyers;
      if (Array.isArray(saved.vendors)) this.vendors = saved.vendors;
      if (Array.isArray(saved.admins)) this.admins = saved.admins;
    } catch (error) {
      console.error('Unable to load persisted authentication records:', error);
    }
  }

  public persistAuthRecords(): void {
    const filePath = this.authPersistencePath();
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const temporaryPath = `${filePath}.tmp`;
      fs.writeFileSync(temporaryPath, JSON.stringify({
        buyers: this.buyers,
        vendors: this.vendors,
        admins: this.admins,
      }, null, 2), 'utf8');
      fs.renameSync(temporaryPath, filePath);
    } catch (error) {
      console.error('Unable to persist authentication records:', error);
      throw new Error('Account was created in memory but could not be saved for future logins.');
    }
  }

  public wallets: WalletRecord[] = [];
  public walletTransactions: WalletTransactionRecord[] = [];

  private ensureWallets(): void {
    const owners: Array<[WalletOwnerType, string]> = [];
    this.buyers.forEach((item) => owners.push(['buyer', item.id]));
    this.vendors.forEach((item) => owners.push(['vendor', item.id]));
    this.admins.forEach((item) => owners.push(['admin', item.id]));
    owners.forEach(([owner_type, owner_id]) => {
      if (!this.wallets.some((wallet) => wallet.owner_type === owner_type && wallet.owner_id === owner_id)) {
        const id = `wallet-${owner_type}-${owner_id}`;
        const legacyBalance = owner_type === 'vendor'
          ? this.vendors.find((vendor) => vendor.id === owner_id)?.wallet_balance || 0
          : 0;
        this.wallets.push({ id, owner_type, owner_id, currency: 'NGN', balance: legacyBalance, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }
    });
  }

  public buyers: BuyerRecord[] = [
    {
      id: 'buyer-001',
      full_name: 'Amara Nwosu',
      email: 'buyer@webnexa.dev',
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: '+2348123456789',
      shipping_address_line1: '14 Admiralty Way, Lekki Phase 1',
      shipping_address_line2: 'Suite 4B',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
      postal_code: '105102',
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'buyer-002',
      full_name: 'David Oladipo',
      email: 'david@example.com',
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: '+2348039991122',
      shipping_address_line1: 'Plot 22 Gana Street, Maitama',
      city: 'Abuja',
      state: 'FCT',
      country: 'Nigeria',
      postal_code: '900271',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public vendors: VendorRecord[] = [
    {
      id: 'vendor-001',
      business_name: 'Apex Precision Electronics',
      contact_person: 'Emeka Okafor',
      email: 'vendor@webnexa.dev',
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: '+2348021112233',
      company_registration_no: 'RC-1849204',
      tax_id: 'TIN-90823412',
      bank_name: 'Zenith Bank PLC',
      bank_account_number: '2084930192',
      bank_account_name: 'Apex Precision Technologies Ltd',
      bank_code: '057',
      store_description: 'Authorized distributor of military-grade smart tech, server hardware, and titanium cyber accessories.',
      store_logo_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80',
      is_approved: true,
      rejection_reason: null,
      approved_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      approved_by_admin_id: 'admin-001',
      wallet_balance: 450000,
      escrow_pending_balance: 185000,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'vendor-002',
      business_name: 'Kester Dynamics Workstations',
      contact_person: 'Tunde Adeleke',
      email: 'tunde@kesterdynamics.ng',
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: '+2348187765544',
      company_registration_no: 'RC-2049182',
      tax_id: 'TIN-10923847',
      bank_name: 'Guaranty Trust Bank (GTBank)',
      bank_account_number: '0129384756',
      bank_account_name: 'Kester Dynamics Ltd',
      bank_code: '058',
      store_description: 'High performance enterprise dev rigs, ergonomic mechanical engineering gear, and AI edge clusters.',
      store_logo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
      is_approved: true,
      rejection_reason: null,
      approved_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      approved_by_admin_id: 'admin-001',
      wallet_balance: 820000,
      escrow_pending_balance: 320000,
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'vendor-003',
      business_name: 'Vanguard Solar & Power Systems',
      contact_person: 'Fatima Bello',
      email: 'pending@vanguardsolar.ng',
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: '+2348093329901',
      company_registration_no: 'RC-3920194',
      tax_id: 'TIN-59382019',
      bank_name: 'Access Bank PLC',
      bank_account_number: '0693827104',
      bank_account_name: 'Vanguard Solar Systems',
      bank_code: '044',
      store_description: 'Pure sine wave hybrid inverters, LiFePO4 rack batteries, and smart microgrid power solutions for tech hubs.',
      store_logo_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&q=80',
      is_approved: false, // PENDING ONBOARDING FOR ADMIN TO REVIEW & APPROVE!
      rejection_reason: null,
      approved_at: null,
      approved_by_admin_id: null,
      wallet_balance: 0,
      escrow_pending_balance: 0,
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public admins: AdminRecord[] = [
    {
      id: 'admin-001',
      name: 'Kester Apuyor',
      email: 'admin@webnexa.dev',
      password_hash: DEFAULT_PASSWORD_HASH,
      privilege_level: 'SUPER_ADMIN',
      last_login: new Date().toISOString(),
      created_at: '2026-09-13T00:00:00.000Z',
      updated_at: new Date().toISOString(),
    },
    {
      id: 'admin-002',
      name: 'Escrow Compliance Lead',
      email: 'escrow@webnexa.dev',
      password_hash: DEFAULT_PASSWORD_HASH,
      privilege_level: 'ESCROW_OFFICER',
      last_login: new Date(Date.now() - 3600000 * 24).toISOString(),
      created_at: '2026-09-13T00:00:00.000Z',
      updated_at: new Date().toISOString(),
    },
  ];

  public autoReleaseEscrow: boolean = false;

  public products: ProductRecord[] = [
    {
      id: 'prod-001',
      vendor_id: 'vendor-001',
      vendor_name: 'Apex Precision Electronics',
      brand: 'Apex Pro',
      title: 'WebNexa TitanCore Pro Cyber Deck R2 (32GB RAM, 1TB NVMe)',
      slug: 'webnexa-titancore-pro-cyber-deck-r2',
      description: 'Handcrafted titanium slate chassis with integrated mechanical ortholinear switches, dual hot-swap NVMe bays, and quantum-safe cryptographic hardware module.',
      price: 185000,
      compare_at_price: 245000,
      discount_percent: 24,
      rating: 4.9,
      reviews_count: 128,
      items_sold_count: 340,
      is_official_store: true,
      inventory_count: 14,
      category: 'Computing',
      images: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
        'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80'
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-002',
      vendor_id: 'vendor-001',
      vendor_name: 'Apex Precision Electronics',
      brand: 'Apex Audio',
      title: 'Apex Obsidian ANC Studio Wireless Headphones (Beryllium Drivers)',
      slug: 'apex-obsidian-anc-studio-headphones',
      description: 'Beryllium acoustic drivers wrapped in dark slate anodized aluminum with 48-hour continuous battery life, active noise cancellation, and multi-point Bluetooth 5.4.',
      price: 68000,
      compare_at_price: 89000,
      discount_percent: 23,
      rating: 4.8,
      reviews_count: 215,
      items_sold_count: 520,
      is_official_store: true,
      inventory_count: 28,
      category: 'Electronics',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-003',
      vendor_id: 'vendor-002',
      vendor_name: 'Kester Dynamics Workstations',
      brand: 'Kester Dynamics',
      title: 'Kester Dynamics Quad-Monitor Floating Mount with 100W PD Routing',
      slug: 'kester-dynamics-quad-monitor-mount',
      description: 'Gas-spring counterbalanced quad-arm articulating mount constructed from brushed carbon steel with integrated 100W USB-PD cable routing and desk clamp.',
      price: 115000,
      compare_at_price: 145000,
      discount_percent: 20,
      rating: 4.7,
      reviews_count: 89,
      items_sold_count: 190,
      is_official_store: true,
      inventory_count: 9,
      category: 'Home & Office',
      images: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80'
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-004',
      vendor_id: 'vendor-002',
      vendor_name: 'Kester Dynamics Workstations',
      brand: 'NeuralEdge',
      title: 'NeuralEdge AI Developer Server Box (64GB ECC, 2TB Gen4 NVMe)',
      slug: 'neuraledge-developer-server-box',
      description: 'Compact 10GbE edge computing node designed for localized LLM inference, Docker microservices clustering, and zero-downtime hot backup in a rugged metal shell.',
      price: 320000,
      compare_at_price: 399000,
      discount_percent: 19,
      rating: 5.0,
      reviews_count: 42,
      items_sold_count: 75,
      is_official_store: true,
      inventory_count: 5,
      category: 'Computing',
      images: [
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80'
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-005',
      vendor_id: 'vendor-001',
      vendor_name: 'Apex Precision Electronics',
      brand: 'Apex Keyboards',
      title: 'WebNexa Metallic Slate Custom Mechanical Keyboard (Gasket Mount)',
      slug: 'webnexa-metallic-slate-keyboard',
      description: 'Gasket-mounted CNC machined aluminium keyboard with hot-swappable tactile switches, solid brass weight bar, RGB backlighting, and custom PBT keycaps.',
      price: 75000,
      compare_at_price: 98000,
      discount_percent: 23,
      rating: 4.9,
      reviews_count: 312,
      items_sold_count: 680,
      is_official_store: true,
      inventory_count: 22,
      category: 'Accessories',
      images: [
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80',
        'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80'
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-006',
      vendor_id: 'vendor-001',
      vendor_name: 'Apex Precision Electronics',
      brand: 'VoltPro',
      title: 'VoltPro 5KVA Hybrid Pure Sine Wave Inverter + 10kWh LiFePO4 Rack',
      slug: 'voltpro-5kva-hybrid-inverter',
      description: 'Industrial-grade dual MPPT hybrid solar inverter with smart WiFi telemetry, 98% conversion efficiency, and 10-year lifespan lithium iron phosphate cell chemistry.',
      price: 450000,
      compare_at_price: 560000,
      discount_percent: 20,
      rating: 4.9,
      reviews_count: 67,
      items_sold_count: 140,
      is_official_store: false,
      inventory_count: 8,
      category: 'Power & Solar',
      images: [
        'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&q=80',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80'
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-007',
      vendor_id: 'vendor-002',
      vendor_name: 'Kester Dynamics Workstations',
      brand: 'SlateEdge',
      title: 'SlateEdge Ultra-Slim 5G OLED Workstation Tablet 13.3" (16GB/512GB)',
      slug: 'slateedge-ultra-slim-5g-tablet',
      description: 'High-luminance 120Hz 3K OLED anti-glare display with active stylus pen support, dual SIM 5G LTE connectivity, and all-day 11,000mAh battery for field engineers.',
      price: 210000,
      compare_at_price: 275000,
      discount_percent: 23,
      rating: 4.8,
      reviews_count: 94,
      items_sold_count: 210,
      is_official_store: true,
      inventory_count: 17,
      category: 'Phones & Tablets',
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
        'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&q=80'
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-008',
      vendor_id: 'vendor-001',
      vendor_name: 'Apex Precision Electronics',
      brand: 'ChronoTech',
      title: 'ChronoTech Slate Titanium Smartwatch with Biometric Heart ECG',
      slug: 'chronotech-slate-titanium-smartwatch',
      description: 'Aerospace grade titanium body with sapphire crystal touch screen, built-in GPS, blood oxygen & ECG sensors, IP68 water resistance to 50 meters.',
      price: 52000,
      compare_at_price: 75000,
      discount_percent: 30,
      rating: 4.7,
      reviews_count: 178,
      items_sold_count: 480,
      is_official_store: true,
      inventory_count: 35,
      category: 'Fashion & Wearables',
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  public orders: OrderRecord[] = [
    {
      id: 'ord-1001',
      order_number: 'WN-2026-9021',
      buyer_id: 'buyer-001',
      buyer_name: 'Amara Nwosu',
      buyer_email: 'buyer@webnexa.dev',
      vendor_id: 'vendor-001',
      vendor_name: 'Apex Precision Electronics',
      total_amount: 185000,
      escrow_fee: 3700,
      vendor_payout_amount: 181300,
      currency: 'NGN',
      status: 'HELD_IN_ESCROW',
      shipping_address: {
        recipient_name: 'Amara Nwosu',
        phone: '+2348123456789',
        address_line1: '14 Admiralty Way, Lekki Phase 1',
        city: 'Lagos',
        state: 'Lagos State',
        country: 'Nigeria',
      },
      items: [
        {
          id: 'item-01',
          order_id: 'ord-1001',
          product_id: 'prod-001',
          vendor_id: 'vendor-001',
          vendor_name: 'Apex Precision Electronics',
          title: 'WebNexa TitanCore Pro Cyber Deck R2',
          price: 185000,
          quantity: 1,
          subtotal: 185000,
          image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
        },
      ],
      carrier_name: null,
      tracking_number: null,
      shipped_at: null,
      delivered_at: null,
      escrow_released_at: null,
      paystack_reference: 'PSTK_ESCROW_9021_DEMO',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 'ord-1002',
      order_number: 'WN-2026-8840',
      buyer_id: 'buyer-001',
      buyer_name: 'Amara Nwosu',
      buyer_email: 'buyer@webnexa.dev',
      vendor_id: 'vendor-002',
      vendor_name: 'Kester Dynamics Workstations',
      total_amount: 115000,
      escrow_fee: 2300,
      vendor_payout_amount: 112700,
      currency: 'NGN',
      status: 'SHIPPED',
      shipping_address: {
        recipient_name: 'Amara Nwosu',
        phone: '+2348123456789',
        address_line1: '14 Admiralty Way, Lekki Phase 1',
        city: 'Lagos',
        state: 'Lagos State',
        country: 'Nigeria',
      },
      items: [
        {
          id: 'item-02',
          order_id: 'ord-1002',
          product_id: 'prod-003',
          vendor_id: 'vendor-002',
          vendor_name: 'Kester Dynamics Workstations',
          title: 'Kester Dynamics Quad-Monitor Floating Mount',
          price: 115000,
          quantity: 1,
          subtotal: 115000,
          image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
        },
      ],
      carrier_name: 'DHL Express Nigeria',
      tracking_number: 'DHL-NG-88934291',
      shipped_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      delivered_at: null,
      escrow_released_at: null,
      paystack_reference: 'PSTK_ESCROW_8840_DEMO',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'ord-1003',
      order_number: 'WN-2026-7731',
      buyer_id: 'buyer-002',
      buyer_name: 'David Oladipo',
      buyer_email: 'david@example.com',
      vendor_id: 'vendor-001',
      vendor_name: 'Apex Precision Electronics',
      total_amount: 68000,
      escrow_fee: 1360,
      vendor_payout_amount: 66640,
      currency: 'NGN',
      status: 'ESCROW_RELEASED',
      shipping_address: {
        recipient_name: 'David Oladipo',
        phone: '+2348039991122',
        address_line1: 'Plot 22 Gana Street, Maitama',
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
      },
      items: [
        {
          id: 'item-03',
          order_id: 'ord-1003',
          product_id: 'prod-002',
          vendor_id: 'vendor-001',
          vendor_name: 'Apex Precision Electronics',
          title: 'Apex Obsidian ANC Studio Headphones',
          price: 68000,
          quantity: 1,
          subtotal: 68000,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        },
      ],
      carrier_name: 'GIG Logistics',
      tracking_number: 'GIGL-ABJ-192837',
      shipped_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      delivered_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      escrow_released_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      paystack_reference: 'PSTK_ESCROW_7731_COMPLETED',
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  public escrowTransactions: EscrowTransactionRecord[] = [
    {
      id: 'esc-001',
      order_id: 'ord-1001',
      order_number: 'WN-2026-9021',
      buyer_id: 'buyer-001',
      buyer_name: 'Amara Nwosu',
      vendor_id: 'vendor-001',
      vendor_name: 'Apex Precision Electronics',
      paystack_reference: 'PSTK_ESCROW_9021_DEMO',
      paystack_channel: 'card',
      amount: 185000,
      currency: 'NGN',
      escrow_status: 'HOLDING',
      released_by_admin_id: null,
      released_by_admin_name: null,
      released_at: null,
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 'esc-002',
      order_id: 'ord-1002',
      order_number: 'WN-2026-8840',
      buyer_id: 'buyer-001',
      buyer_name: 'Amara Nwosu',
      vendor_id: 'vendor-002',
      vendor_name: 'Kester Dynamics Workstations',
      paystack_reference: 'PSTK_ESCROW_8840_DEMO',
      paystack_channel: 'paystack_transfer',
      amount: 115000,
      currency: 'NGN',
      escrow_status: 'HOLDING',
      released_by_admin_id: null,
      released_by_admin_name: null,
      released_at: null,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'esc-003',
      order_id: 'ord-1003',
      order_number: 'WN-2026-7731',
      buyer_id: 'buyer-002',
      buyer_name: 'David Oladipo',
      vendor_id: 'vendor-001',
      vendor_name: 'Apex Precision Electronics',
      paystack_reference: 'PSTK_ESCROW_7731_COMPLETED',
      paystack_channel: 'card',
      amount: 68000,
      currency: 'NGN',
      escrow_status: 'RELEASED_TO_VENDOR',
      released_by_admin_id: 'admin-001',
      released_by_admin_name: 'Kester Apuyor',
      released_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
}

export const store = new MarketplaceStore();
