import { getBuyerForRequest, getDatabase } from "../_mongoAuth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const db = await getDatabase();
    const buyer = req.buyer || await getBuyerForRequest(req, db);
    if (!buyer) return res.status(401).json({ error: "Buyer authentication required." });
    const orders = await db.collection("orders").find({ buyer_id: String(buyer.id || buyer._id) }).sort({ created_at: -1 }).limit(100).toArray();
    return res.json({ orders });
  } catch (error) {
    console.error("[orders] Buyer order lookup failed", error);
    return res.status(503).json({ error: "Orders are temporarily unavailable." });
  }
}