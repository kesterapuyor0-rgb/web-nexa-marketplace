import { randomUUID } from "node:crypto";
import { flutterwaveRequest, toNaira, withMongoTransaction } from "./_flutterwave.js";

export async function finalizeFlutterwavePayment(db, intent, transactionId) {
  if (!intent || !transactionId) throw new Error("Payment intent or Flutterwave transaction ID is missing.");
  const transaction = await flutterwaveRequest(`/transactions/${encodeURIComponent(transactionId)}/verify`);
  const verifiedAmount = toNaira(transaction.amount);
  if (
    transaction.status !== "successful" ||
    transaction.tx_ref !== intent.tx_ref ||
    String(transaction.currency).toUpperCase() !== intent.currency ||
    Math.abs(verifiedAmount - intent.amount) > 0.01
  ) {
    const error = new Error("Flutterwave transaction does not match the expected order payment.");
    error.statusCode = 409;
    throw error;
  }

  return withMongoTransaction(db, async (session) => {
    const orders = db.collection("orders");
    const intents = db.collection("payment_intents");
    const existingOrder = await orders.findOne({ payment_reference: intent.tx_ref }, { session });
    if (existingOrder) return existingOrder;
    const currentIntent = await intents.findOne({ tx_ref: intent.tx_ref }, { session });
    if (!currentIntent || !["pending", "verified"].includes(currentIntent.status)) {
      const error = new Error("Payment intent is no longer available for order creation.");
      error.statusCode = 409;
      throw error;
    }

    const now = new Date().toISOString();
    const id = `ord-${randomUUID()}`;
    const order = {
      id,
      order_number: `WN-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      buyer_id: currentIntent.buyer_id,
      buyer_name: currentIntent.buyer_name,
      buyer_email: currentIntent.buyer_email,
      vendor_id: currentIntent.vendor_splits.length === 1 ? currentIntent.vendor_splits[0].vendor_id : "MULTI_VENDOR",
      vendor_name: currentIntent.vendor_splits.map((split) => split.vendor_name).join(", "),
      total_amount: currentIntent.amount,
      item_subtotal: currentIntent.item_subtotal,
      escrow_fee: currentIntent.escrow_fee,
      vendor_payout_amount: toNaira((currentIntent.vendor_splits || []).reduce((sum, split) => sum + Number(split.payout_amount ?? split.amount), 0)),
      currency: currentIntent.currency,
      status: "HELD_IN_ESCROW",
      escrow_status: "paid_in_escrow",
      escrow_history: ["pending", "paid_in_escrow"],
      payment_provider: "flutterwave",
      payment_reference: currentIntent.tx_ref,
      flutterwave_transaction_id: String(transaction.id),
      shipping_address: currentIntent.shipping_address,
      items: currentIntent.items.map((item) => ({ ...item, order_id: id })),
      vendor_splits: currentIntent.vendor_splits,
      carrier_name: null,
      tracking_number: null,
      shipped_at: null,
      delivered_at: null,
      escrow_released_at: null,
      created_at: now,
      updated_at: now
    };

    await orders.insertOne(order, { session });
    await intents.updateOne(
      { tx_ref: currentIntent.tx_ref, status: { $in: ["pending", "verified"] } },
      { $set: { status: "paid", order_id: id, transaction_id: String(transaction.id), paid_at: now, updated_at: now } },
      { session }
    );
    await db.collection("processed_payment_events").updateOne(
      { event_key: `charge.completed:${String(transaction.id)}` },
      { $setOnInsert: { event_key: `charge.completed:${String(transaction.id)}`, tx_ref: currentIntent.tx_ref, order_id: id, processed_at: now } },
      { upsert: true, session }
    );
    return order;
  });
}