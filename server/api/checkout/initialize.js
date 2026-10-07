import { getBuyerForRequest, getDatabase } from "../_mongoAuth.js";
import { flutterwaveRequest, toNaira } from "../_flutterwave.js";
import { randomUUID } from "node:crypto";
import { mongoIdFilters } from "../../utils/mongoId.js";

function appUrl(req) {
  return (process.env.FRONTEND_URL || process.env.APP_URL || `https://${req.headers.host}`).replace(/\/$/, "");
}

function productSnapshot(product, vendor) {
  return {
    id: String(product.id || product._id),
    vendor_id: String(product.vendor_id || vendor?.id || ""),
    vendor_name: product.vendor_name || vendor?.business_name || "Verified vendor",
    title: product.title,
    price: toNaira(product.price),
    image: product.images?.[0] || "",
    inventory_count: Number(product.inventory_count ?? product.stock_quantity ?? 0)
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const db = await getDatabase();
    const buyer = await getBuyerForRequest(req, db);
    if (!buyer) return res.status(401).json({ error: "Buyer authentication required." });
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ error: "Choose between 1 and 50 items to check out." });
    }

    const requestedIds = [...new Set(items.map((item) => String(item.productId || "")).filter(Boolean))];
    const storedProducts = requestedIds.length ? await db.collection("products").find({
      $or: [{ id: { $in: requestedIds } }, { _id: { $in: requestedIds } }],
      is_active: { $ne: false },
      is_approved_by_admin: { $ne: false }
    }).toArray() : [];
    const products = storedProducts;
    const vendorIds = [...new Set(products.map((product) => String(product.vendor_id || "")).filter(Boolean))];
    const storedVendors = vendorIds.length ? await db.collection("accounts").find({
      role: "vendor",
      $or: vendorIds.flatMap(mongoIdFilters)
    }).project({ id: 1, business_name: 1, is_approved: 1 }).toArray() : [];
    const vendors = new Map(storedVendors.map((vendor) => [String(vendor.id || vendor._id), vendor]));
    const productMap = new Map(products.map((product) => [String(product.id || product._id), product]));
    const orderItems = [];

    for (const requested of items) {
      const product = productMap.get(String(requested.productId || ""));
      const quantity = Number(requested.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({ error: "A selected product is unavailable or has an invalid quantity." });
      }
      const vendor = vendors.get(String(product.vendor_id || "")) || product.vendor;
      if (!product.vendor_id || vendor?.is_approved === false) {
        return res.status(409).json({ error: `${product.vendor_name || "This vendor"} is not approved to sell yet.` });
      }
      const snapshot = productSnapshot(product, vendor);
      if (!Number.isFinite(snapshot.price) || snapshot.price <= 0 || (snapshot.inventory_count > 0 && quantity > snapshot.inventory_count)) {
        return res.status(409).json({ error: `${snapshot.title} is unavailable in the requested quantity.` });
      }
      const existing = orderItems.find((line) => line.product_id === snapshot.id && line.vendor_id === snapshot.vendor_id);
      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = toNaira(existing.price * existing.quantity);
      } else {
        orderItems.push({
          id: `item-${randomUUID()}`,
          product_id: snapshot.id,
          vendor_id: snapshot.vendor_id,
          vendor_name: snapshot.vendor_name,
          title: snapshot.title,
          price: snapshot.price,
          quantity,
          subtotal: toNaira(snapshot.price * quantity),
          image: snapshot.image
        });
      }
    }

    const itemSubtotal = toNaira(orderItems.reduce((sum, item) => sum + item.subtotal, 0));
    const escrowFee = toNaira(itemSubtotal * 0.02);
    const totalAmount = toNaira(itemSubtotal + escrowFee);
    const paymentReference = `WN_FLW_${randomUUID()}`;
    const now = new Date().toISOString();
    const splits = [...new Set(orderItems.map((item) => item.vendor_id))].map((vendorId) => {
      const vendorItems = orderItems.filter((item) => item.vendor_id === vendorId);
      const amount = toNaira(vendorItems.reduce((sum, item) => sum + item.subtotal, 0));
      return {
        vendor_id: vendorId,
        vendor_name: vendorItems[0].vendor_name,
        amount,
        payout_amount: toNaira(amount - Math.round(amount * 0.02))
      };
    });
    const paymentIntent = {
      tx_ref: paymentReference,
      buyer_id: String(buyer.id || buyer._id),
      buyer_name: buyer.full_name,
      buyer_email: buyer.email,
      currency: "NGN",
      item_subtotal: itemSubtotal,
      escrow_fee: escrowFee,
      amount: totalAmount,
      items: orderItems,
      vendor_splits: splits,
      shipping_address: req.body.shipping_address || {
        recipient_name: buyer.full_name,
        phone: buyer.phone || "",
        address_line1: buyer.shipping_address_line1 || "",
        city: buyer.city || "",
        state: buyer.state || "",
        country: buyer.country || "Nigeria"
      },
      status: "pending",
      created_at: now,
      updated_at: now
    };
    await db.collection("payment_intents").insertOne(paymentIntent);

    try {
      const payment = await flutterwaveRequest("/payments", {
        method: "POST",
        body: {
          tx_ref: paymentReference,
          amount: totalAmount,
          currency: "NGN",
          redirect_url: `${appUrl(req)}/checkout/verify`,
          customer: {
            email: buyer.email,
            name: buyer.full_name,
            phonenumber: buyer.phone || undefined
          },
          customizations: {
            title: "WebNexa Marketplace",
            description: `Protected order with ${orderItems.length} line item(s)`
          },
          meta: { buyer_id: paymentIntent.buyer_id }
        }
      });
      if (!payment?.link) throw new Error("Flutterwave did not return a checkout link.");
      await db.collection("payment_intents").updateOne(
        { tx_ref: paymentReference, status: "pending" },
        { $set: { checkout_url: payment.link, updated_at: new Date().toISOString() } }
      );
      return res.status(201).json({
        tx_ref: paymentReference,
        amount: totalAmount,
        currency: "NGN",
        checkout_url: payment.link
      });
    } catch (error) {
      await db.collection("payment_intents").updateOne(
        { tx_ref: paymentReference, status: "pending" },
        { $set: { status: "initialization_failed", failure_reason: error.message, updated_at: new Date().toISOString() } }
      );
      throw error;
    }
  } catch (error) {
    console.error("[flutterwave] Checkout initialization failed", {
      name: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? error.message : String(error),
      code: error?.code
    });
    return res.status(error.statusCode || 502).json({ error: error.message || "Unable to initialize Flutterwave checkout." });
  }
}