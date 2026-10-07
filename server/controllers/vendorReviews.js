import { getDatabase } from "../api/_mongoAuth.js";

function summarizeReviews(reviews) {
  if (!reviews.length) return { average_rating: 0, review_count: 0 };
  const average_rating = Number((reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length).toFixed(1));
  return { average_rating, review_count: reviews.length };
}

export async function getVendorRating(vendorId) {
  const db = await getDatabase();
  const reviews = await db.collection("vendor_reviews").find({ vendor_id: String(vendorId) }).toArray();
  return summarizeReviews(reviews);
}

export async function createVendorReview(req, res) {
  try {
    const buyer = req.buyer;
    if (!buyer) {
      res.status(401).json({ error: "Buyer authentication required." });
      return;
    }
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const vendorId = typeof body.vendor_id === "string" ? body.vendor_id : "";
    const orderId = typeof body.order_id === "string" ? body.order_id : "";
    const numericRating = Number(body.rating);
    if (!vendorId || !orderId) {
      res.status(400).json({ error: "Vendor and order are required." });
      return;
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ error: "Rating must be a whole number from 1 to 5." });
      return;
    }
    const db = await getDatabase();
    const buyerId = String(buyer.id || buyer._id);
    const order = await db.collection("orders").findOne({ id: orderId, buyer_id: buyerId });
    const items = Array.isArray(order?.items) ? order.items : [];
    const vendorPurchased = items.some((item) => item?.vendor_id === vendorId) || order?.vendor_id === vendorId;
    if (!order || !vendorPurchased || !["DELIVERED", "delivered_and_completed", "ESCROW_RELEASED"].includes(order.status)) {
      res.status(403).json({ error: "Reviews are available only after a successfully delivered and completed order." });
      return;
    }
    const reviews = db.collection("vendor_reviews");
    const duplicate = await reviews.findOne({ buyer_id: buyerId, order_id: orderId, vendor_id: vendorId });
    if (duplicate) {
      res.status(409).json({ error: "You have already reviewed this vendor for this order." });
      return;
    }
    const review = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vendor_id: vendorId,
      buyer_id: buyerId,
      order_id: orderId,
      rating: numericRating,
      review_text: typeof body.review_text === "string" ? body.review_text.trim().slice(0, 2000) : "",
      photo_url: typeof body.photo_url === "string" ? body.photo_url : "",
      created_at: new Date().toISOString()
    };
    await reviews.insertOne(review);
    const vendorReviews = await reviews.find({ vendor_id: vendorId }).toArray();
    res.status(201).json({ review, rating: summarizeReviews(vendorReviews) });
  } catch (error) {
    console.error("[reviews] Failed to create vendor review", {
      message: error instanceof Error ? error.message : String(error),
      code: error?.code
    });
    res.status(503).json({ error: "Reviews are temporarily unavailable." });
  }
}

export async function listVendorReviews(req, res) {
  try {
    const db = await getDatabase();
    const vendorId = String(req.params.vendorId || "");
    const accounts = db.collection("accounts");
    const vendor = await accounts.findOne(
      { role: "vendor", $or: [{ id: vendorId }, { _id: vendorId }] },
      { projection: { password_hash: 0 } }
    );
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found." });
      return;
    }
    const [reviews, products] = await Promise.all([
      db.collection("vendor_reviews").find({ vendor_id: vendorId }).sort({ created_at: -1 }).toArray(),
      db.collection("products").find({ vendor_id: vendorId, is_active: { $ne: false }, is_approved_by_admin: { $ne: false } }).toArray()
    ]);
    const rating = summarizeReviews(reviews);
    res.json({
      vendor: {
        ...vendor,
        id: vendor.id || String(vendor._id),
        business_name: vendor.business_name || "Unnamed vendor",
        ...rating
      },
      products,
      reviews,
      rating
    });
  } catch (error) {
    console.error("[reviews] Failed to load vendor profile", {
      message: error instanceof Error ? error.message : String(error),
      code: error?.code
    });
    res.status(503).json({ error: "Vendor profile is temporarily unavailable." });
  }
}
