import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("Password123!", 10);
class MarketplaceStore {
  vendorReviews = [];
  chatMessages = [];
  socialPosts = [];
  restaurants = [];
  menuItems = [];
  foodOrders = [];
  constructor() {
    const restaurantSeeds = [
      ["restaurant-seed-1", "Harmony Culinary House", "African Cuisine", "Nigerian & West African", 4.8, 142, 1800, "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=85"],
      ["restaurant-seed-2", "Apex Gourmet Kitchen", "Fine Dining", "Contemporary African", 4.9, 98, 2500, "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85"],
      ["restaurant-seed-3", "Urban Bistro & Drinks", "Drinks & Desserts", "Cocktails & Desserts", 4.7, 216, 1500, "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=85"],
      ["restaurant-seed-4", "Naija Fire Grill", "Fast Food", "Grills & Street Food", 4.6, 187, 1200, "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=85"],
      ["restaurant-seed-5", "Green Bowl Lagos", "Vegetarian", "Plant-Based Kitchen", 4.8, 76, 1e3, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=85"],
      ["restaurant-seed-6", "The Pepper Table", "African Cuisine", "Modern Nigerian", 4.5, 64, 2e3, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1200&q=85"],
      ["restaurant-seed-7", "Sweet Crumb Atelier", "Drinks & Desserts", "Bakery & Coffee", 4.9, 301, 1300, "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200&q=85"]
    ];
    restaurantSeeds.forEach(([id, business_name, category, cuisine_type, rating, reviews_count, delivery_fee, banner_url], index) => {
      this.restaurants.push({
        id,
        vendor_id: `vendor-food-seed-${index + 1}`,
        business_name,
        cuisine_type,
        opening_hours: "08:00 - 22:00",
        delivery_radius_km: 12,
        preparation_time_mins: 20 + index * 3,
        hygiene_badges: ["Verified Kitchen"],
        category,
        rating,
        reviews_count,
        delivery_fee,
        banner_url,
        logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(business_name)}&background=6d28d9&color=fff`
      });
      const dishes = [
        ["Chef Signature Bowl", "Slow-cooked seasonal ingredients, fragrant grains, and the chef\u2019s house sauce.", 6800 + index * 300, "Main Course", "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=85"],
        ["Smoky Suya Platter", "Charcoal-grilled skewers with caramelised onions, fresh slaw, and pepper relish.", 5200 + index * 250, "Main Course", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=85"],
        ["Signature Cooler", "A chilled house blend with citrus, herbs, and a bright tropical finish.", 2400 + index * 100, "Drinks", "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=85"]
      ];
      dishes.forEach(([item_name, description, price, itemCategory, image_url], dishIndex) => this.menuItems.push({
        id: `${id}-menu-${dishIndex + 1}`,
        restaurant_id: id,
        item_name,
        description,
        price: Number(price),
        category: itemCategory,
        image_url,
        is_available: true,
        prep_time_mins: 15 + dishIndex * 5,
        addons: [
          { id: `${id}-addon-${dishIndex}-1`, addon_name: "Extra protein", extra_price: 1200 },
          { id: `${id}-addon-${dishIndex}-2`, addon_name: "Fresh juice", extra_price: 900 }
        ]
      }));
    });
    this.loadPersistedAuthRecords();
    this.ensureWallets();
  }
  authPersistencePath() {
    return process.env.WEBNEXA_AUTH_DATA_FILE || path.join(process.cwd(), ".data", "auth-records.json");
  }
  loadPersistedAuthRecords() {
    const filePath = this.authPersistencePath();
    try {
      if (!fs.existsSync(filePath)) return;
      const saved = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (Array.isArray(saved.buyers)) this.buyers = saved.buyers;
      if (Array.isArray(saved.vendors)) {
        this.vendors = saved.vendors.map((vendor) => {
          const seedVendor = this.vendors.find((seed) => seed.id === vendor.id);
          return {
            ...seedVendor,
            ...vendor,
            city: vendor.city || seedVendor?.city || "",
            state: vendor.state || seedVendor?.state || "",
            country: vendor.country || seedVendor?.country || "Nigeria"
          };
        });
      }
      if (Array.isArray(saved.admins)) this.admins = saved.admins;
    } catch (error) {
      console.error("Unable to load persisted authentication records:", error);
    }
  }
  persistAuthRecords() {
    const filePath = this.authPersistencePath();
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const temporaryPath = `${filePath}.tmp`;
      fs.writeFileSync(temporaryPath, JSON.stringify({
        buyers: this.buyers,
        vendors: this.vendors,
        admins: this.admins
      }, null, 2), "utf8");
      fs.renameSync(temporaryPath, filePath);
    } catch (error) {
      console.error("Unable to persist authentication records:", error);
      throw new Error("Account was created in memory but could not be saved for future logins.");
    }
  }
  wallets = [];
  walletTransactions = [];
  ensureWallets() {
    const owners = [];
    this.buyers.forEach((item) => owners.push(["buyer", item.id]));
    this.vendors.forEach((item) => owners.push(["vendor", item.id]));
    this.admins.forEach((item) => owners.push(["admin", item.id]));
    owners.forEach(([owner_type, owner_id]) => {
      if (!this.wallets.some((wallet) => wallet.owner_type === owner_type && wallet.owner_id === owner_id)) {
        const id = `wallet-${owner_type}-${owner_id}`;
        const legacyBalance = owner_type === "vendor" ? this.vendors.find((vendor) => vendor.id === owner_id)?.wallet_balance || 0 : 0;
        this.wallets.push({ id, owner_type, owner_id, currency: "NGN", balance: legacyBalance, created_at: (/* @__PURE__ */ new Date()).toISOString(), updated_at: (/* @__PURE__ */ new Date()).toISOString() });
      }
    });
  }
  buyers = [
    {
      id: "buyer-001",
      full_name: "Amara Nwosu",
      email: "buyer@webnexa.dev",
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: "+2348123456789",
      shipping_address_line1: "14 Admiralty Way, Lekki Phase 1",
      shipping_address_line2: "Suite 4B",
      city: "Lagos",
      state: "Lagos State",
      country: "Nigeria",
      postal_code: "105102",
      created_at: new Date(Date.now() - 864e5 * 12).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "buyer-002",
      full_name: "David Oladipo",
      email: "david@example.com",
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: "+2348039991122",
      shipping_address_line1: "Plot 22 Gana Street, Maitama",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      postal_code: "900271",
      created_at: new Date(Date.now() - 864e5 * 5).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  vendors = [
    {
      id: "vendor-001",
      business_name: "Apex Precision Electronics",
      contact_person: "Emeka Okafor",
      email: "vendor@webnexa.dev",
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: "+2348021112233",
      city: "Lagos",
      state: "Lagos State",
      country: "Nigeria",
      company_registration_no: "RC-1849204",
      tax_id: "TIN-90823412",
      bank_name: "Zenith Bank PLC",
      bank_account_number: "2084930192",
      bank_account_name: "Apex Precision Technologies Ltd",
      bank_code: "057",
      store_description: "Authorized distributor of military-grade smart tech, server hardware, and titanium cyber accessories.",
      store_logo_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
      is_approved: true,
      rejection_reason: null,
      approved_at: new Date(Date.now() - 864e5 * 20).toISOString(),
      approved_by_admin_id: "admin-001",
      wallet_balance: 45e4,
      escrow_pending_balance: 185e3,
      created_at: new Date(Date.now() - 864e5 * 30).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "vendor-002",
      business_name: "Kester Dynamics Workstations",
      contact_person: "Tunde Adeleke",
      email: "tunde@kesterdynamics.ng",
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: "+2348187765544",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      company_registration_no: "RC-2049182",
      tax_id: "TIN-10923847",
      bank_name: "Guaranty Trust Bank (GTBank)",
      bank_account_number: "0129384756",
      bank_account_name: "Kester Dynamics Ltd",
      bank_code: "058",
      store_description: "High performance enterprise dev rigs, ergonomic mechanical engineering gear, and AI edge clusters.",
      store_logo_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80",
      is_approved: true,
      rejection_reason: null,
      approved_at: new Date(Date.now() - 864e5 * 10).toISOString(),
      approved_by_admin_id: "admin-001",
      wallet_balance: 82e4,
      escrow_pending_balance: 32e4,
      created_at: new Date(Date.now() - 864e5 * 15).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "vendor-003",
      business_name: "Vanguard Solar & Power Systems",
      contact_person: "Fatima Bello",
      email: "pending@vanguardsolar.ng",
      password_hash: DEFAULT_PASSWORD_HASH,
      phone: "+2348093329901",
      city: "Kano",
      state: "Kano State",
      country: "Nigeria",
      company_registration_no: "RC-3920194",
      tax_id: "TIN-59382019",
      bank_name: "Access Bank PLC",
      bank_account_number: "0693827104",
      bank_account_name: "Vanguard Solar Systems",
      bank_code: "044",
      store_description: "Pure sine wave hybrid inverters, LiFePO4 rack batteries, and smart microgrid power solutions for tech hubs.",
      store_logo_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&q=80",
      is_approved: false,
      // PENDING ONBOARDING FOR ADMIN TO REVIEW & APPROVE!
      rejection_reason: null,
      approved_at: null,
      approved_by_admin_id: null,
      wallet_balance: 0,
      escrow_pending_balance: 0,
      created_at: new Date(Date.now() - 36e5 * 8).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  admins = [
    {
      id: "admin-001",
      name: "Kester Apuyor",
      email: "admin@webnexa.dev",
      password_hash: DEFAULT_PASSWORD_HASH,
      privilege_level: "SUPER_ADMIN",
      last_login: (/* @__PURE__ */ new Date()).toISOString(),
      created_at: "2026-09-13T00:00:00.000Z",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "admin-002",
      name: "Escrow Compliance Lead",
      email: "escrow@webnexa.dev",
      password_hash: DEFAULT_PASSWORD_HASH,
      privilege_level: "ESCROW_OFFICER",
      last_login: new Date(Date.now() - 36e5 * 24).toISOString(),
      created_at: "2026-09-13T00:00:00.000Z",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  autoReleaseEscrow = false;
  products = [
    {
      id: "prod-001",
      vendor_id: "vendor-001",
      vendor_name: "Apex Precision Electronics",
      brand: "Apex Pro",
      title: "WebNexa TitanCore Pro Cyber Deck R2 (32GB RAM, 1TB NVMe)",
      slug: "webnexa-titancore-pro-cyber-deck-r2",
      description: "Handcrafted titanium slate chassis with integrated mechanical ortholinear switches, dual hot-swap NVMe bays, and quantum-safe cryptographic hardware module.",
      price: 185e3,
      compare_at_price: 245e3,
      discount_percent: 24,
      rating: 4.9,
      reviews_count: 128,
      items_sold_count: 340,
      is_official_store: true,
      inventory_count: 14,
      category: "Computing",
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
        "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80"
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 864e5 * 18).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod-002",
      vendor_id: "vendor-001",
      vendor_name: "Apex Precision Electronics",
      brand: "Apex Audio",
      title: "Apex Obsidian ANC Studio Wireless Headphones (Beryllium Drivers)",
      slug: "apex-obsidian-anc-studio-headphones",
      description: "Beryllium acoustic drivers wrapped in dark slate anodized aluminum with 48-hour continuous battery life, active noise cancellation, and multi-point Bluetooth 5.4.",
      price: 68e3,
      compare_at_price: 89e3,
      discount_percent: 23,
      rating: 4.8,
      reviews_count: 215,
      items_sold_count: 520,
      is_official_store: true,
      inventory_count: 28,
      category: "Electronics",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80"
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 864e5 * 12).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod-003",
      vendor_id: "vendor-002",
      vendor_name: "Kester Dynamics Workstations",
      brand: "Kester Dynamics",
      title: "Kester Dynamics Quad-Monitor Floating Mount with 100W PD Routing",
      slug: "kester-dynamics-quad-monitor-mount",
      description: "Gas-spring counterbalanced quad-arm articulating mount constructed from brushed carbon steel with integrated 100W USB-PD cable routing and desk clamp.",
      price: 115e3,
      compare_at_price: 145e3,
      discount_percent: 20,
      rating: 4.7,
      reviews_count: 89,
      items_sold_count: 190,
      is_official_store: true,
      inventory_count: 9,
      category: "Home & Office",
      images: [
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80"
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 864e5 * 8).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod-004",
      vendor_id: "vendor-002",
      vendor_name: "Kester Dynamics Workstations",
      brand: "NeuralEdge",
      title: "NeuralEdge AI Developer Server Box (64GB ECC, 2TB Gen4 NVMe)",
      slug: "neuraledge-developer-server-box",
      description: "Compact 10GbE edge computing node designed for localized LLM inference, Docker microservices clustering, and zero-downtime hot backup in a rugged metal shell.",
      price: 32e4,
      compare_at_price: 399e3,
      discount_percent: 19,
      rating: 5,
      reviews_count: 42,
      items_sold_count: 75,
      is_official_store: true,
      inventory_count: 5,
      category: "Computing",
      images: [
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80"
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 864e5 * 4).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod-005",
      vendor_id: "vendor-001",
      vendor_name: "Apex Precision Electronics",
      brand: "Apex Keyboards",
      title: "WebNexa Metallic Slate Custom Mechanical Keyboard (Gasket Mount)",
      slug: "webnexa-metallic-slate-keyboard",
      description: "Gasket-mounted CNC machined aluminium keyboard with hot-swappable tactile switches, solid brass weight bar, RGB backlighting, and custom PBT keycaps.",
      price: 75e3,
      compare_at_price: 98e3,
      discount_percent: 23,
      rating: 4.9,
      reviews_count: 312,
      items_sold_count: 680,
      is_official_store: true,
      inventory_count: 22,
      category: "Accessories",
      images: [
        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80",
        "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80"
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 864e5 * 2).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod-006",
      vendor_id: "vendor-001",
      vendor_name: "Apex Precision Electronics",
      brand: "VoltPro",
      title: "VoltPro 5KVA Hybrid Pure Sine Wave Inverter + 10kWh LiFePO4 Rack",
      slug: "voltpro-5kva-hybrid-inverter",
      description: "Industrial-grade dual MPPT hybrid solar inverter with smart WiFi telemetry, 98% conversion efficiency, and 10-year lifespan lithium iron phosphate cell chemistry.",
      price: 45e4,
      compare_at_price: 56e4,
      discount_percent: 20,
      rating: 4.9,
      reviews_count: 67,
      items_sold_count: 140,
      is_official_store: false,
      inventory_count: 8,
      category: "Power & Solar",
      images: [
        "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&q=80",
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80"
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 864e5 * 5).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod-007",
      vendor_id: "vendor-002",
      vendor_name: "Kester Dynamics Workstations",
      brand: "SlateEdge",
      title: 'SlateEdge Ultra-Slim 5G OLED Workstation Tablet 13.3" (16GB/512GB)',
      slug: "slateedge-ultra-slim-5g-tablet",
      description: "High-luminance 120Hz 3K OLED anti-glare display with active stylus pen support, dual SIM 5G LTE connectivity, and all-day 11,000mAh battery for field engineers.",
      price: 21e4,
      compare_at_price: 275e3,
      discount_percent: 23,
      rating: 4.8,
      reviews_count: 94,
      items_sold_count: 210,
      is_official_store: true,
      inventory_count: 17,
      category: "Phones & Tablets",
      images: [
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
        "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&q=80"
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 864e5 * 3).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod-008",
      vendor_id: "vendor-001",
      vendor_name: "Apex Precision Electronics",
      brand: "ChronoTech",
      title: "ChronoTech Slate Titanium Smartwatch with Biometric Heart ECG",
      slug: "chronotech-slate-titanium-smartwatch",
      description: "Aerospace grade titanium body with sapphire crystal touch screen, built-in GPS, blood oxygen & ECG sensors, IP68 water resistance to 50 meters.",
      price: 52e3,
      compare_at_price: 75e3,
      discount_percent: 30,
      rating: 4.7,
      reviews_count: 178,
      items_sold_count: 480,
      is_official_store: true,
      inventory_count: 35,
      category: "Fashion & Wearables",
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80"
      ],
      is_active: true,
      is_approved_by_admin: true,
      created_at: new Date(Date.now() - 864e5 * 1).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  orders = [
    {
      id: "ord-1001",
      order_number: "WN-2026-9021",
      buyer_id: "buyer-001",
      buyer_name: "Amara Nwosu",
      buyer_email: "buyer@webnexa.dev",
      vendor_id: "vendor-001",
      vendor_name: "Apex Precision Electronics",
      total_amount: 185e3,
      escrow_fee: 3700,
      vendor_payout_amount: 181300,
      currency: "NGN",
      status: "HELD_IN_ESCROW",
      shipping_address: {
        recipient_name: "Amara Nwosu",
        phone: "+2348123456789",
        address_line1: "14 Admiralty Way, Lekki Phase 1",
        city: "Lagos",
        state: "Lagos State",
        country: "Nigeria"
      },
      items: [
        {
          id: "item-01",
          order_id: "ord-1001",
          product_id: "prod-001",
          vendor_id: "vendor-001",
          vendor_name: "Apex Precision Electronics",
          title: "WebNexa TitanCore Pro Cyber Deck R2",
          price: 185e3,
          quantity: 1,
          subtotal: 185e3,
          image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80"
        }
      ],
      carrier_name: null,
      tracking_number: null,
      shipped_at: null,
      delivered_at: null,
      escrow_released_at: null,
      paystack_reference: "PSTK_ESCROW_9021_DEMO",
      created_at: new Date(Date.now() - 36e5 * 18).toISOString(),
      updated_at: new Date(Date.now() - 36e5 * 18).toISOString()
    },
    {
      id: "ord-1002",
      order_number: "WN-2026-8840",
      buyer_id: "buyer-001",
      buyer_name: "Amara Nwosu",
      buyer_email: "buyer@webnexa.dev",
      vendor_id: "vendor-002",
      vendor_name: "Kester Dynamics Workstations",
      total_amount: 115e3,
      escrow_fee: 2300,
      vendor_payout_amount: 112700,
      currency: "NGN",
      status: "SHIPPED",
      shipping_address: {
        recipient_name: "Amara Nwosu",
        phone: "+2348123456789",
        address_line1: "14 Admiralty Way, Lekki Phase 1",
        city: "Lagos",
        state: "Lagos State",
        country: "Nigeria"
      },
      items: [
        {
          id: "item-02",
          order_id: "ord-1002",
          product_id: "prod-003",
          vendor_id: "vendor-002",
          vendor_name: "Kester Dynamics Workstations",
          title: "Kester Dynamics Quad-Monitor Floating Mount",
          price: 115e3,
          quantity: 1,
          subtotal: 115e3,
          image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80"
        }
      ],
      carrier_name: "DHL Express Nigeria",
      tracking_number: "DHL-NG-88934291",
      shipped_at: new Date(Date.now() - 36e5 * 8).toISOString(),
      delivered_at: null,
      escrow_released_at: null,
      paystack_reference: "PSTK_ESCROW_8840_DEMO",
      created_at: new Date(Date.now() - 864e5 * 2).toISOString(),
      updated_at: new Date(Date.now() - 36e5 * 8).toISOString()
    },
    {
      id: "ord-1003",
      order_number: "WN-2026-7731",
      buyer_id: "buyer-002",
      buyer_name: "David Oladipo",
      buyer_email: "david@example.com",
      vendor_id: "vendor-001",
      vendor_name: "Apex Precision Electronics",
      total_amount: 68e3,
      escrow_fee: 1360,
      vendor_payout_amount: 66640,
      currency: "NGN",
      status: "ESCROW_RELEASED",
      shipping_address: {
        recipient_name: "David Oladipo",
        phone: "+2348039991122",
        address_line1: "Plot 22 Gana Street, Maitama",
        city: "Abuja",
        state: "FCT",
        country: "Nigeria"
      },
      items: [
        {
          id: "item-03",
          order_id: "ord-1003",
          product_id: "prod-002",
          vendor_id: "vendor-001",
          vendor_name: "Apex Precision Electronics",
          title: "Apex Obsidian ANC Studio Headphones",
          price: 68e3,
          quantity: 1,
          subtotal: 68e3,
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
        }
      ],
      carrier_name: "GIG Logistics",
      tracking_number: "GIGL-ABJ-192837",
      shipped_at: new Date(Date.now() - 864e5 * 5).toISOString(),
      delivered_at: new Date(Date.now() - 864e5 * 3).toISOString(),
      escrow_released_at: new Date(Date.now() - 864e5 * 2).toISOString(),
      paystack_reference: "PSTK_ESCROW_7731_COMPLETED",
      created_at: new Date(Date.now() - 864e5 * 6).toISOString(),
      updated_at: new Date(Date.now() - 864e5 * 2).toISOString()
    }
  ];
  escrowTransactions = [
    {
      id: "esc-001",
      order_id: "ord-1001",
      order_number: "WN-2026-9021",
      buyer_id: "buyer-001",
      buyer_name: "Amara Nwosu",
      vendor_id: "vendor-001",
      vendor_name: "Apex Precision Electronics",
      paystack_reference: "PSTK_ESCROW_9021_DEMO",
      paystack_channel: "card",
      amount: 185e3,
      currency: "NGN",
      escrow_status: "HOLDING",
      released_by_admin_id: null,
      released_by_admin_name: null,
      released_at: null,
      created_at: new Date(Date.now() - 36e5 * 18).toISOString(),
      updated_at: new Date(Date.now() - 36e5 * 18).toISOString()
    },
    {
      id: "esc-002",
      order_id: "ord-1002",
      order_number: "WN-2026-8840",
      buyer_id: "buyer-001",
      buyer_name: "Amara Nwosu",
      vendor_id: "vendor-002",
      vendor_name: "Kester Dynamics Workstations",
      paystack_reference: "PSTK_ESCROW_8840_DEMO",
      paystack_channel: "paystack_transfer",
      amount: 115e3,
      currency: "NGN",
      escrow_status: "HOLDING",
      released_by_admin_id: null,
      released_by_admin_name: null,
      released_at: null,
      created_at: new Date(Date.now() - 864e5 * 2).toISOString(),
      updated_at: new Date(Date.now() - 36e5 * 8).toISOString()
    },
    {
      id: "esc-003",
      order_id: "ord-1003",
      order_number: "WN-2026-7731",
      buyer_id: "buyer-002",
      buyer_name: "David Oladipo",
      vendor_id: "vendor-001",
      vendor_name: "Apex Precision Electronics",
      paystack_reference: "PSTK_ESCROW_7731_COMPLETED",
      paystack_channel: "card",
      amount: 68e3,
      currency: "NGN",
      escrow_status: "RELEASED_TO_VENDOR",
      released_by_admin_id: "admin-001",
      released_by_admin_name: "Kester Apuyor",
      released_at: new Date(Date.now() - 864e5 * 2).toISOString(),
      created_at: new Date(Date.now() - 864e5 * 6).toISOString(),
      updated_at: new Date(Date.now() - 864e5 * 2).toISOString()
    }
  ];
}
export const store = new MarketplaceStore();
