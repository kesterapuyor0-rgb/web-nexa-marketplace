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
    const transactions = await db.collection("wallet_transactions").find({ owner_type: "vendor", owner_id: vendorId }).sort({ created_at: -1 }).limit(50).toArray();
    return res.json({
      wallet: { owner_type: "vendor", owner_id: vendorId, currency: "NGN", balance: Number(vendor.walletBalance ?? vendor.wallet_balance ?? 0) },
      transactions
    });
  } catch (error) {
    console.error("[wallet] Vendor wallet lookup failed", { message: error.message, code: error.code });
    return res.status(503).json({ error: "Vendor wallet is temporarily unavailable." });
  }
}