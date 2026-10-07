import { randomUUID } from "node:crypto";
import { getDatabase } from "../api/_mongoAuth.js";
import { getVendorRating } from "./vendorReviews.js";
import { normalizeLegacyProduct } from "../utils/legacyData.js";
import { mongoIdFilters } from "../utils/mongoId.js";

function sendDatabaseError(res, operation, error) {
  console.error(`[products] ${operation} failed`, {
    message: error instanceof Error ? error.message : String(error),
    code: error?.code
  });
  res.status(503).json({ error: "Product data is temporarily unavailable. Please try again." });
}

function validateImages(images) {
  const productImages = Array.isArray(images)
    ? images.filter((image) => typeof image === "string" && image.trim())
    : [];
  for (const image of productImages) {
    if (image.startsWith("data:")) {
      if (!/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/.test(image)) {
        return { error: "Product image must be a valid JPEG, PNG, WEBP, or GIF file." };
      }
      if (image.length > 7 * 1024 * 1024) {
        return { status: 413, error: "Product image is too large. Please upload an image under 5 MB." };
      }
    } else if (!/^https?:\/\/\S+$/i.test(image)) {
      return { error: "Product image URLs must use http or https." };
    }
  }
  return { images: productImages };
}

function productQuery(id, vendorId) {
  const idFilter = { $or: [...mongoIdFilters(id), { slug: id }] };
  return vendorId ? { $and: [idFilter, { vendor_id: vendorId }] } : idFilter;
}

export async function getProducts(req, res) {
  try {
    const db = await getDatabase();
    const products = await db.collection("products")
      .find({ is_active: { $ne: false }, is_approved_by_admin: { $ne: false } })
      .sort({ created_at: -1 })
      .limit(500)
      .toArray();
    res.json({ products: products.map(normalizeLegacyProduct).filter(Boolean) });
  } catch (error) {
    sendDatabaseError(res, "Catalog query", error);
  }
}

export async function getProductById(req, res) {
  try {
    const db = await getDatabase();
    const rawProduct = await db.collection("products").findOne(productQuery(String(req.params.id || "")));
    const product = normalizeLegacyProduct(rawProduct);
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    const vendor = await db.collection("accounts").findOne(
      { role: "vendor", $or: mongoIdFilters(product.vendor_id) },
      { projection: { password_hash: 0 } }
    );
    res.json({
      product,
      vendor: vendor ? {
        id: vendor.id || String(vendor._id),
        business_name: vendor.business_name || "Unnamed vendor",
        contact_person: vendor.contact_person || "",
        is_approved: vendor.is_approved === true,
        store_logo_url: vendor.store_logo_url || "",
        ...await getVendorRating(product.vendor_id)
      } : null
    });
  } catch (error) {
    sendDatabaseError(res, "Product query", error);
  }
}

export async function getVendorProducts(req, res) {
  try {
    const db = await getDatabase();
    const vendorId = String(req.vendor.id || req.vendor._id);
    const products = await db.collection("products").find({ vendor_id: vendorId }).sort({ created_at: -1 }).toArray();
    res.json({ products: products.map(normalizeLegacyProduct).filter(Boolean) });
  } catch (error) {
    sendDatabaseError(res, "Vendor catalog query", error);
  }
}

export async function createProduct(req, res) {
  try {
    const vendor = req.vendor;
    if (!vendor) {
      res.status(401).json({ error: "Vendor unauthorized." });
      return;
    }
    if (vendor.is_approved !== true) {
      res.status(403).json({
        error: "Forbidden: Vendor Verification Pending",
        message: "Your vendor account is pending verification by The WebNexa Platform. You cannot publish products until verification is completed."
      });
      return;
    }
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const { title, description, price, compare_at_price, inventory_count, category, images, tags } = body;
    if (typeof title !== "string" || !title.trim() || typeof description !== "string" || !description.trim() || price === undefined) {
      res.status(400).json({ error: "Title, description, and price are required." });
      return;
    }
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      res.status(400).json({ error: "Price must be a valid non-negative number." });
      return;
    }
    const validatedImages = validateImages(images);
    if (validatedImages.error) {
      res.status(validatedImages.status || 400).json({ error: validatedImages.error });
      return;
    }
    const now = new Date().toISOString();
    const cleanTitle = title.trim();
    const id = `prod-${randomUUID()}`;
    const product = {
      id,
      vendor_id: String(vendor.id || vendor._id),
      vendor_name: vendor.business_name || "Unnamed vendor",
      title: cleanTitle,
      slug: `${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${randomUUID().slice(0, 8)}`,
      description: description.trim(),
      price: numericPrice,
      ...(compare_at_price !== undefined && Number.isFinite(Number(compare_at_price)) ? { compare_at_price: Number(compare_at_price) } : {}),
      inventory_count: Number.isFinite(Number(inventory_count)) ? Number(inventory_count) : 1,
      category: typeof category === "string" && category.trim() ? category.trim() : "Hardware & Gear",
      tags: Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean) : [],
      images: validatedImages.images.length ? validatedImages.images : ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80"],
      is_active: true,
      is_approved_by_admin: true,
      created_at: now,
      updated_at: now
    };
    await (await getDatabase()).collection("products").insertOne(product);
    res.status(201).json({ message: "Product published to WebNexa marketplace.", product });
  } catch (error) {
    sendDatabaseError(res, "Product creation", error);
  }
}

export async function updateProduct(req, res) {
  try {
    const vendor = req.vendor;
    if (!vendor) {
      res.status(401).json({ error: "Vendor unauthorized." });
      return;
    }
    const db = await getDatabase();
    const vendorId = String(vendor.id || vendor._id);
    const query = productQuery(String(req.params.id || ""), vendorId);
    const existing = await db.collection("products").findOne(query);
    if (!existing) {
      const anyProduct = await db.collection("products").findOne(productQuery(String(req.params.id || "")));
      res.status(anyProduct ? 403 : 404).json({ error: anyProduct ? "Unauthorized. You can only edit your own company catalog items." : "Product not found." });
      return;
    }
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const updates = {};
    if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
    if (typeof body.description === "string" && body.description.trim()) updates.description = body.description.trim();
    for (const field of ["price", "compare_at_price", "inventory_count"]) {
      if (body[field] !== undefined) {
        const value = Number(body[field]);
        if (!Number.isFinite(value) || value < 0) {
          res.status(400).json({ error: `${field} must be a valid non-negative number.` });
          return;
        }
        updates[field] = value;
      }
    }
    if (typeof body.category === "string" && body.category.trim()) updates.category = body.category.trim();
    if (Array.isArray(body.images)) {
      const validatedImages = validateImages(body.images);
      if (validatedImages.error) {
        res.status(validatedImages.status || 400).json({ error: validatedImages.error });
        return;
      }
      updates.images = validatedImages.images;
    }
    if (Array.isArray(body.tags)) updates.tags = body.tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean);
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (updates.title) updates.slug = `${updates.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${randomUUID().slice(0, 8)}`;
    updates.updated_at = new Date().toISOString();
    const result = await db.collection("products").findOneAndUpdate(query, { $set: updates }, { returnDocument: "after" });
    const product = result?.value || result;
    res.json({ message: "Product updated.", product: normalizeLegacyProduct(product) });
  } catch (error) {
    sendDatabaseError(res, "Product update", error);
  }
}

export async function deleteProduct(req, res) {
  try {
    const vendor = req.vendor;
    if (!vendor) {
      res.status(401).json({ error: "Vendor unauthorized." });
      return;
    }
    const db = await getDatabase();
    const vendorId = String(vendor.id || vendor._id);
    const query = productQuery(String(req.params.id || ""), vendorId);
    const product = await db.collection("products").findOne(query);
    if (!product) {
      res.status(404).json({ error: "Product not found or access denied." });
      return;
    }
    await db.collection("products").deleteOne({ _id: product._id });
    res.json({ message: "Product deleted from marketplace.", product: normalizeLegacyProduct(product) });
  } catch (error) {
    sendDatabaseError(res, "Product deletion", error);
  }
}
