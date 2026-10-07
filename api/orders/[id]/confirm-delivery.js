import { getBuyerForRequest, getDatabase } from "../../_mongoAuth.js";
import { withMongoTransaction } from "../../_flutterwave.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const db = await getDatabase();
    const buyer = req.buyer || await getBuyerForRequest(req, db);
    if (!buyer) return res.status(401).json({ error: "Buyer authentication required." });
    const id = String(req.query?.id || req.params?.id || "");
    const buyerId = String(buyer.id || buyer._id);
    const result = await withMongoTransaction(db, async (session) => {
      const orders = db.collection("orders");
      const order = await orders.findOne({ id, buyer_id: buyerId }, { session });
      if (!order) return { notFound: true };
      if (order.escrow_status === "released") return { order, alreadyReleased: true };
      if (order.status !== "SHIPPED" || order.escrow_status !== "paid_in_escrow") {
        const error = new Error("Confirm receipt only after every vendor has shipped this paid order.");
        error.statusCode = 409;
        throw error;
      }
      const now = new Date().toISOString();
      const wallets = db.collection("wallet_transactions");
      const accounts = db.collection("accounts");
      for (const split of order.vendor_splits || []) {
        const vendorId = String(split.vendor_id);
        const amount = Number(split.payout_amount ?? split.amount);
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("Order vendor payout is invalid.");
        const reference = `ESCROW_RELEASE_${order.id}_${vendorId}`;
        const existing = await wallets.findOne({ reference }, { session });
        if (existing) continue;
        const vendor = await accounts.findOne({ role: "vendor", $or: [{ id: vendorId }, { _id: vendorId }] }, { session });
        if (!vendor) throw new Error(`Vendor account ${vendorId} is unavailable for settlement.`);
        await accounts.updateOne({ _id: vendor._id, role: "vendor" }, {
          $inc: { walletBalance: amount, wallet_balance: amount },
          $set: { updated_at: now }
        }, { session });
        await wallets.insertOne({
          reference,
          owner_type: "vendor",
          owner_id: vendorId,
          type: "escrow_release",
          direction: "credit",
          amount,
          currency: order.currency || "NGN",
          provider: "internal",
          status: "completed",
          order_id: order.id,
          created_at: now
        }, { session });
      }
      const updatedOrder = {
        ...order,
        status: "delivered_and_completed",
        escrow_status: "released",
        escrow_history: [...(order.escrow_history || ["pending", "paid_in_escrow"]), "delivered_confirmed", "released"],
        delivered_at: now,
        escrow_released_at: now,
        updated_at: now
      };
      await orders.updateOne({ id, buyer_id: buyerId, escrow_status: "paid_in_escrow" }, {
        $set: {
          status: updatedOrder.status,
          escrow_status: updatedOrder.escrow_status,
          escrow_history: updatedOrder.escrow_history,
          delivered_at: now,
          escrow_released_at: now,
          updated_at: now
        }
      }, { session });
      return { order: updatedOrder, alreadyReleased: false };
    });
    if (result.notFound) return res.status(404).json({ error: "Order not found." });
    return res.json({
      message: result.alreadyReleased ? "Vendor payout was already released." : "Receipt confirmed and vendor wallet credited.",
      order: result.order,
      autoReleased: true
    });
  } catch (error) {
    console.error("[escrow] Buyer delivery confirmation failed", { message: error.message, code: error.code });
    return res.status(error.statusCode || 503).json({ error: error.message || "Unable to confirm delivery." });
  }
}