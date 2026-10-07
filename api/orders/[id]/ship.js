import { getAccountForRequest, getDatabase } from "../../_mongoAuth.js";
import { withMongoTransaction } from "../../_flutterwave.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const db = await getDatabase();
    const vendor = req.vendor || await getAccountForRequest(req, db, "vendor");
    if (!vendor) return res.status(401).json({ error: "Vendor authentication required." });
    if (vendor.is_approved === false) return res.status(403).json({ error: "Vendor account is not approved." });
    const id = String(req.query?.id || req.params?.id || "");
    const carrierName = String(req.body?.carrier_name || "").trim();
    const trackingNumber = String(req.body?.tracking_number || "").trim();
    if (!carrierName || !trackingNumber) return res.status(400).json({ error: "Carrier and tracking number are required." });
    const order = await withMongoTransaction(db, async (session) => {
      const orders = db.collection("orders");
      const current = await orders.findOne({ id }, { session });
      if (!current) return null;
      const vendorId = String(vendor.id || vendor._id);
      if (!current.vendor_splits?.some((split) => split.vendor_id === vendorId)) {
        const error = new Error("Order is not assigned to this vendor.");
        error.statusCode = 403;
        throw error;
      }
      if (current.escrow_status !== "paid_in_escrow" || !["HELD_IN_ESCROW", "SHIPPED"].includes(current.status)) {
        const error = new Error("Only paid escrow orders may be shipped.");
        error.statusCode = 409;
        throw error;
      }
      const shipments = current.vendor_shipments || [];
      const nextShipments = [
        ...shipments.filter((shipment) => shipment.vendor_id !== vendorId),
        { vendor_id: vendorId, carrier_name: carrierName, tracking_number: trackingNumber, shipped_at: new Date().toISOString() }
      ];
      const allShipped = current.vendor_splits.every((split) => nextShipments.some((shipment) => shipment.vendor_id === split.vendor_id));
      const now = new Date().toISOString();
      await orders.updateOne({ id, escrow_status: "paid_in_escrow" }, {
        $set: {
          vendor_shipments: nextShipments,
          status: allShipped ? "SHIPPED" : "HELD_IN_ESCROW",
          carrier_name: allShipped ? nextShipments.map((shipment) => shipment.carrier_name).join(", ") : carrierName,
          tracking_number: allShipped ? nextShipments.map((shipment) => shipment.tracking_number).join(", ") : trackingNumber,
          shipped_at: allShipped ? now : current.shipped_at || null,
          updated_at: now
        }
      }, { session });
      return { ...current, vendor_shipments: nextShipments, status: allShipped ? "SHIPPED" : "HELD_IN_ESCROW" };
    });
    if (!order) return res.status(404).json({ error: "Order not found." });
    return res.json({ message: "Shipment details saved.", order });
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: error.message || "Unable to update shipment." });
  }
}