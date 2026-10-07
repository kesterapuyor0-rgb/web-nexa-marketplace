import { getAccountForRequest, getDatabase } from "../_mongoAuth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const db = await getDatabase();
    const vendor = req.vendor || await getAccountForRequest(req, db, "vendor");
    if (!vendor) return res.status(401).json({ error: "Vendor authentication required." });
    const vendorId = String(vendor.id || vendor._id);
    const orders = await db.collection("orders").find({
      $or: [{ vendor_id: vendorId }, { "vendor_splits.vendor_id": vendorId }]
    }).sort({ created_at: -1 }).limit(100).toArray();
    return res.json({
      orders: orders.map((order) => ({
        ...order,
        items: (order.items || []).filter((item) => String(item.vendor_id || order.vendor_id) === vendorId),
        vendor_shipments: (order.vendor_shipments || []).filter((shipment) => shipment.vendor_id === vendorId)
      }))
    });
  } catch (error) {
    console.error("[orders] Vendor order lookup failed", { message: error.message, code: error.code });
    return res.status(503).json({ error: "Vendor orders are temporarily unavailable." });
  }
}