import { getBuyerForRequest, getDatabase } from "./_mongoAuth.js";
import { filterProductsByBuyerLocation } from "../../server/utils/productLocation.js";
import { normalizeLegacyBuyer, normalizeLegacyProduct } from "../../server/utils/legacyData.js";
import { mongoIdFilters } from "../../server/utils/mongoId.js";

function normalizeProduct(product, vendor) {
  const normalizedProduct = normalizeLegacyProduct(product);
  if (!normalizedProduct) return null;
  const { _id, vendor: embeddedVendor, vendor_location, location, ...fields } = normalizedProduct;
  const resolvedVendor = vendor || embeddedVendor;
  return {
    ...fields,
    id: fields.id || String(_id || ""),
    vendor_id: String(fields.vendor_id || resolvedVendor?.id || ""),
    vendor_name: fields.vendor_name || resolvedVendor?.business_name || "Verified vendor",
    vendor_location: resolvedVendor ? {
      city: resolvedVendor.city || vendor_location?.city || location?.city || "",
      state: resolvedVendor.state || vendor_location?.state || location?.state || "",
      country: resolvedVendor.country || vendor_location?.country || location?.country || "",
      location: resolvedVendor.location || vendor_location?.location || (typeof location === "string" ? location : location?.location) || ""
    } : vendor_location || location || null
  };
}

function filterCatalog(products, query) {
  const category = String(query.category || "").trim().toLowerCase();
  const search = String(query.search || "").trim().toLowerCase();
  return products.filter((product) => {
    const matchesCategory = !category || category === "all" || String(product.category || "").toLowerCase().includes(category);
    const searchable = [product.title, product.description, product.vendor_name, product.category, product.brand, ...(product.tags || [])].filter(Boolean).join(" ").toLowerCase();
    return matchesCategory && (!search || searchable.includes(search));
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const db = await getDatabase();
    const buyer = normalizeLegacyBuyer(await getBuyerForRequest(req, db));
    const storedProducts = await db.collection("products").find({
      is_active: { $ne: false },
      is_approved_by_admin: { $ne: false }
    }).sort({ created_at: -1 }).limit(500).toArray();

    const vendorIds = [...new Set(storedProducts.map((product) => String(product.vendor_id || "")).filter(Boolean))];
    const vendorAccounts = vendorIds.length ? await db.collection("accounts").find({
      role: "vendor",
      $or: vendorIds.flatMap(mongoIdFilters)
    }).project({ id: 1, business_name: 1, city: 1, state: 1, country: 1, location: 1, is_approved: 1 }).toArray() : [];
    const vendors = new Map(vendorAccounts.map((vendor) => [String(vendor.id || vendor._id), vendor]));
    const products = storedProducts.flatMap((product) => {
      const vendor = vendors.get(String(product.vendor_id || "")) || product.vendor;
      if (!product.vendor_id || vendor?.is_approved === false) return [];
      const normalizedProduct = normalizeProduct(product, vendor);
      return normalizedProduct ? [normalizedProduct] : [];
    });

    const locationFiltered = filterProductsByBuyerLocation(products, buyer, (product) =>
      vendors.get(String(product.vendor_id)) || product.vendor || product.vendor_location
    );
    const filteredProducts = filterCatalog(locationFiltered.products, req.query || {});
    return res.status(200).json({
      products: filteredProducts,
      location: {
        ...locationFiltered.location,
        buyer: buyer ? { city: buyer.city || "", state: buyer.state || "", country: buyer.country || "" } : null
      },
      source: "database"
    });
  } catch (error) {
    console.error("[products] Catalog query failed", {
      name: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? error.message : String(error),
      code: error?.code
    });
    return res.status(503).json({ error: "The product catalog is temporarily unavailable." });
  }
}