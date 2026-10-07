const DEFAULT_PRODUCT = Object.freeze({
  title: "Untitled product",
  description: "",
  category: "Hardware & Gear",
  price: 0,
  inventory_count: 0,
  images: [],
  tags: [],
  is_active: false,
  is_approved_by_admin: false
});

function safeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value, fallback = 0) {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function recordId(record) {
  if (typeof record.id === "string" && record.id.trim()) return record.id.trim();
  return record._id == null ? "" : String(record._id);
}

export function normalizeLegacyProduct(product) {
  if (!product || typeof product !== "object" || Array.isArray(product)) return null;

  const normalized = {
    ...product,
    id: recordId(product),
    title: safeString(product.title, DEFAULT_PRODUCT.title),
    description: safeString(product.description, DEFAULT_PRODUCT.description),
    category: safeString(product.category, DEFAULT_PRODUCT.category),
    price: safeNumber(product.price, DEFAULT_PRODUCT.price),
    inventory_count: safeNumber(product.inventory_count, DEFAULT_PRODUCT.inventory_count),
    images: Array.isArray(product.images) ? product.images.filter((image) => typeof image === "string" && image.trim()) : [...DEFAULT_PRODUCT.images],
    tags: Array.isArray(product.tags) ? product.tags.filter((tag) => typeof tag === "string") : [...DEFAULT_PRODUCT.tags],
    is_active: product.is_active === true,
    is_approved_by_admin: product.is_approved_by_admin === true
  };

  return normalized;
}

export function normalizeLegacyVendor(vendor) {
  if (!vendor || typeof vendor !== "object" || Array.isArray(vendor)) return null;

  return {
    ...vendor,
    id: recordId(vendor),
    business_name: safeString(vendor.business_name, "Unnamed vendor"),
    contact_person: safeString(vendor.contact_person),
    store_description: safeString(vendor.store_description),
    store_logo_url: safeString(vendor.store_logo_url),
    country: safeString(vendor.country, "Nigeria"),
    city: safeString(vendor.city),
    state: safeString(vendor.state),
    location: safeString(vendor.location),
    is_approved: vendor.is_approved === true
  };
}

export function normalizeLegacyBuyer(buyer) {
  if (!buyer || typeof buyer !== "object" || Array.isArray(buyer)) return null;

  return {
    ...buyer,
    id: recordId(buyer),
    full_name: safeString(buyer.full_name, "Buyer"),
    phone: safeString(buyer.phone),
    shipping_address_line1: safeString(buyer.shipping_address_line1),
    shipping_address_line2: safeString(buyer.shipping_address_line2),
    city: safeString(buyer.city),
    state: safeString(buyer.state),
    country: safeString(buyer.country, "Nigeria"),
    postal_code: safeString(buyer.postal_code)
  };
}

export function normalizeLegacyOrder(order) {
  if (!order || typeof order !== "object" || Array.isArray(order)) return null;

  const address = order.shipping_address;
  const shippingAddress = address && typeof address === "object" && !Array.isArray(address)
    ? address
    : typeof address === "string"
      ? { address_line1: address }
      : {};

  return {
    ...order,
    id: recordId(order),
    total_amount: safeNumber(order.total_amount),
    items: Array.isArray(order.items)
      ? order.items.filter((item) => item && typeof item === "object" && !Array.isArray(item)).map((item) => ({
          ...item,
          title: safeString(item.title, DEFAULT_PRODUCT.title),
          price: safeNumber(item.price),
          quantity: safeNumber(item.quantity, 1)
        }))
      : [],
    shipping_address: {
      ...shippingAddress,
      recipient_name: safeString(shippingAddress.recipient_name),
      phone: safeString(shippingAddress.phone),
      address_line1: safeString(shippingAddress.address_line1),
      address_line2: safeString(shippingAddress.address_line2),
      city: safeString(shippingAddress.city),
      state: safeString(shippingAddress.state),
      country: safeString(shippingAddress.country, "Nigeria")
    },
    vendor_shipments: Array.isArray(order.vendor_shipments) ? order.vendor_shipments : []
  };
}
