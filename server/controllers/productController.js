import { store } from "../store.js";
import { getVendorRating } from "./vendorReviews.js";
import { filterProductsByBuyerLocation } from "../utils/productLocation.js";
import { normalizeLegacyProduct } from "../utils/legacyData.js";
export async function getProducts(req, res) {
  try {
    const { category, search, vendorId } = req.query;
    let filtered = (Array.isArray(store.products) ? store.products : [])
      .map(normalizeLegacyProduct)
      .filter((product) => product && product.is_active && product.is_approved_by_admin);
    if (category && category !== "All") {
      filtered = filtered.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || String(p.vendor_name || "").toLowerCase().includes(q)
      );
    }
    if (vendorId) {
      filtered = filtered.filter((p) => p.vendor_id === String(vendorId));
    }
    const locationFiltered = filterProductsByBuyerLocation(filtered, req.buyer, (product) =>
      store.vendors.find((vendor) => vendor.id === product.vendor_id)
    );
    const productsWithRatings = locationFiltered.products.map((product) => {
      const rating = getVendorRating(product.vendor_id);
      const vendor = store.vendors.find((candidate) => candidate.id === product.vendor_id);
      const withLocation = vendor ? { ...product, vendor_location: { city: vendor.city || "", state: vendor.state || "", country: vendor.country || "", location: vendor.location || "" } } : product;
      return rating.review_count > 0 ? { ...withLocation, rating: rating.average_rating, reviews_count: rating.review_count } : withLocation;
    });
    res.json({
      products: productsWithRatings,
      location: {
        ...locationFiltered.location,
        buyer: req.buyer ? { city: req.buyer.city || "", state: req.buyer.state || "", country: req.buyer.country || "" } : null
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve products: " + err.message });
  }
}
export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = (Array.isArray(store.products) ? store.products : []).map(normalizeLegacyProduct).find((p) => p && (p.id === id || p.slug === id));
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    const vendor = store.vendors.find((v) => v.id === product.vendor_id);
    const vendorRating = getVendorRating(product.vendor_id);
    res.json({
      product,
      vendor: vendor ? {
        id: vendor.id,
        business_name: vendor.business_name,
        contact_person: vendor.contact_person,
        is_approved: vendor.is_approved,
        store_logo_url: vendor.store_logo_url,
        ...vendorRating
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: "Product query failed: " + err.message });
  }
}
export async function getVendorProducts(req, res) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Vendor unauthorized." });
      return;
    }
    const vendorProducts = (Array.isArray(store.products) ? store.products : [])
      .map(normalizeLegacyProduct)
      .filter((product) => product && product.vendor_id === req.vendor.id);
    res.json({ products: vendorProducts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vendor catalog: " + err.message });
  }
}
export async function createProduct(req, res) {
  try {
    const vendor = req.vendor;
    if (!vendor) {
      res.status(401).json({ error: "Vendor unauthorized." });
      return;
    }
    if (!vendor.is_approved) {
      res.status(403).json({
        error: "Forbidden: Vendor Verification Pending",
        message: "Your vendor account is pending verification by The WebNexa Platform. You cannot publish products until verification is completed."
      });
      return;
    }
    const { title, description, price, compare_at_price, inventory_count, category, images, tags } = req.body;
    if (!title || !description || price === void 0) {
      res.status(400).json({ error: "Title, description, and price are required." });
      return;
    }
    const productImages = Array.isArray(images) ? images.filter((image) => typeof image === "string" && image.trim().length > 0) : [];
    for (const image of productImages) {
      if (image.startsWith("data:")) {
        if (!/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/.test(image)) {
          res.status(400).json({ error: "Product image must be a valid JPEG, PNG, WEBP, or GIF file." });
          return;
        }
        if (image.length > 7 * 1024 * 1024) {
          res.status(413).json({ error: "Product image is too large. Please upload an image under 5 MB." });
          return;
        }
      } else if (!/^https?:\/\/\S+$/i.test(image)) {
        res.status(400).json({ error: "Product image URLs must use http or https." });
        return;
      }
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.floor(1e3 + Math.random() * 9e3);
    const newProduct = {
      id: `prod-${Date.now()}`,
      vendor_id: vendor.id,
      vendor_name: vendor.business_name,
      title: title.trim(),
      slug,
      description: description.trim(),
      price: Number(price),
      compare_at_price: compare_at_price ? Number(compare_at_price) : void 0,
      inventory_count: Number(inventory_count) || 1,
      category: category || "Hardware & Gear",
      tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      images: productImages.length > 0 ? productImages : ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80"],
      is_active: true,
      is_approved_by_admin: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.products.unshift(newProduct);
    res.status(201).json({ message: "Product published to WebNexa marketplace.", product: newProduct });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product: " + err.message });
  }
}
export async function updateProduct(req, res) {
  try {
    const vendor = req.vendor;
    const { id } = req.params;
    const product = store.products.find((p) => p.id === id);
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    if (product.vendor_id !== vendor.id) {
      res.status(403).json({ error: "Unauthorized. You can only edit your own company catalog items." });
      return;
    }
    const { title, description, price, compare_at_price, inventory_count, category, images, tags, is_active } = req.body;
    if (title) product.title = title.trim();
    if (description) product.description = description.trim();
    if (price !== void 0) product.price = Number(price);
    if (compare_at_price !== void 0) product.compare_at_price = Number(compare_at_price);
    if (inventory_count !== void 0) product.inventory_count = Number(inventory_count);
    if (category) product.category = category;
    if (Array.isArray(images)) product.images = images;
    if (Array.isArray(tags)) product.tags = tags.map((tag) => String(tag).trim()).filter(Boolean);
    if (is_active !== void 0) product.is_active = Boolean(is_active);
    product.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    res.json({ message: "Product updated.", product });
  } catch (err) {
    res.status(500).json({ error: "Update product failed: " + err.message });
  }
}
export async function deleteProduct(req, res) {
  try {
    const vendor = req.vendor;
    const { id } = req.params;
    const index = store.products.findIndex((p) => p.id === id && p.vendor_id === vendor.id);
    if (index === -1) {
      res.status(404).json({ error: "Product not found or access denied." });
      return;
    }
    const removed = store.products.splice(index, 1);
    res.json({ message: "Product deleted from marketplace.", product: removed[0] });
  } catch (err) {
    res.status(500).json({ error: "Delete product failed: " + err.message });
  }
}
