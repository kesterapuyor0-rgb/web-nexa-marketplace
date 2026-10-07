const DEFAULT_PRODUCT = Object.freeze({
  title: "Untitled product",
  description: "",
  category: "Hardware & Gear",
  price: 0,
  inventory_count: 0,
  images: [],
  is_active: true,
  is_approved_by_admin: true
});

function safeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeLegacyProduct(product) {
  if (!product || typeof product !== "object") return null;

  const normalized = {
    ...product,
    title: safeString(product.title, DEFAULT_PRODUCT.title),
    description: safeString(product.description, DEFAULT_PRODUCT.description),
    category: safeString(product.category, DEFAULT_PRODUCT.category),
    price: safeNumber(product.price, DEFAULT_PRODUCT.price),
    inventory_count: safeNumber(product.inventory_count, DEFAULT_PRODUCT.inventory_count),
    images: Array.isArray(product.images) ? product.images.filter((image) => typeof image === "string" && image.trim()) : [...DEFAULT_PRODUCT.images],
    is_active: product.is_active !== false,
    is_approved_by_admin: product.is_approved_by_admin !== false
  };

  return normalized;
}

export function normalizeLegacyVendor(vendor) {
  if (!vendor || typeof vendor !== "object") return null;

  return {
    ...vendor,
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
