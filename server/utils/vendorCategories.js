const VALID_VENDOR_CATEGORIES = new Set([
  "Fresh farm products",
  "Foodstuffs and provisions",
  "Cosmetics",
  "Computing",
  "Electronics",
  "Networking & Optics",
  "Solar & Power Solutions",
  "Servers & Infrastructure",
  "Home & Office",
  "Fashion & Wearables",
  "Phones & Tablets",
  "Accessories",
  "Food & Drinks"
]);

export function normalizeVendorCategories(categories) {
  let incoming = [];
  if (Array.isArray(categories)) {
    incoming = categories;
  } else if (typeof categories === "string") {
    try {
      const parsed = JSON.parse(categories);
      incoming = Array.isArray(parsed) ? parsed : [];
    } catch {
      incoming = [];
    }
  }
  return [...new Set(incoming
    .filter((category) => typeof category === "string")
    .map((category) => category.trim())
    .filter((category) => VALID_VENDOR_CATEGORIES.has(category)))];
}
