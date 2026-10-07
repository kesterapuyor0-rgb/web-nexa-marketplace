import { store } from "../store.js";
import { normalizeLegacyOrder } from "../utils/legacyData.js";
export async function getBuyerOrders(req, res) {
  try {
    const buyer = req.buyer;
    if (!buyer) {
      res.status(401).json({ error: "Buyer unauthorized." });
      return;
    }
    const orders = (Array.isArray(store.orders) ? store.orders : [])
      .map(normalizeLegacyOrder)
      .filter((order) => order && order.buyer_id === buyer.id);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve buyer orders: " + err.message });
  }
}
export async function getVendorOrders(req, res) {
  try {
    const vendor = req.vendor;
    if (!vendor) {
      res.status(401).json({ error: "Vendor unauthorized." });
      return;
    }
    const orders = (Array.isArray(store.orders) ? store.orders : [])
      .map(normalizeLegacyOrder)
      .filter((order) => order && (
        order.vendor_id === vendor.id || order.items.some((item) => item.vendor_id === vendor.id)
      ));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve vendor orders: " + err.message });
  }
}
