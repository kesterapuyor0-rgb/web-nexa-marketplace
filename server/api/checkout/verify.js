import { getBuyerForRequest, getDatabase } from "../_mongoAuth.js";
import { finalizeFlutterwavePayment } from "../_orderPayments.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const db = await getDatabase();
    const buyer = req.buyer || await getBuyerForRequest(req, db);
    if (!buyer) return res.status(401).json({ error: "Buyer authentication required." });
    const txRef = String(req.query?.tx_ref || req.query?.reference || "");
    const transactionId = String(req.query?.transaction_id || "");
    if (!txRef || !transactionId) return res.status(400).json({ error: "Flutterwave transaction reference and ID are required." });
    const intent = await db.collection("payment_intents").findOne({ tx_ref: txRef, buyer_id: String(buyer.id || buyer._id) });
    if (!intent) return res.status(404).json({ error: "Checkout payment was not found for this buyer." });
    const order = await finalizeFlutterwavePayment(db, intent, transactionId);
    return res.status(200).json({ message: "Payment verified and held in escrow.", order });
  } catch (error) {
    console.error("[flutterwave] Redirect verification failed", {
      name: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? error.message : String(error),
      code: error?.code
    });
    return res.status(error.statusCode || 502).json({ error: error.message || "Flutterwave payment verification failed." });
  }
}