import { getDatabase } from "../../_mongoAuth.js";
import { webhookIsAuthentic } from "../../_flutterwave.js";
import { finalizeFlutterwavePayment } from "../../_orderPayments.js";
import { settleFlutterwaveTransfer } from "../../_wallet.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  if (!webhookIsAuthentic(req)) return res.status(401).end();

  try {
    const event = req.body;
    if (event?.event === "charge.completed" && event.data?.status === "successful") {
      const txRef = String(event.data.tx_ref || "");
      const transactionId = String(event.data.id || "");
      if (!txRef || !transactionId) return res.status(400).end();
      const db = await getDatabase();
      const intent = await db.collection("payment_intents").findOne({ tx_ref: txRef });
      if (intent) await finalizeFlutterwavePayment(db, intent, transactionId);
    }
    if (event?.event === "transfer.completed") {
      const db = await getDatabase();
      await settleFlutterwaveTransfer(db, event.data || {});
    }
    return res.status(200).end();
  } catch (error) {
    console.error("[flutterwave] Webhook processing failed", {
      name: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? error.message : String(error),
      code: error?.code
    });
    return res.status(500).end();
  }
}