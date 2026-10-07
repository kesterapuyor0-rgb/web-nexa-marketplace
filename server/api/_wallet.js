import { withMongoTransaction } from "./_flutterwave.js";

export async function settleFlutterwaveTransfer(db, transfer) {
  const reference = String(transfer?.reference || "");
  if (!reference) return { ignored: true };
  const status = String(transfer.status || "").toUpperCase();
  const successful = ["SUCCESSFUL", "COMPLETED"].includes(status);
  const failed = ["FAILED", "REVERSED", "CANCELLED"].includes(status);
  if (!successful && !failed) return { pending: true };

  return withMongoTransaction(db, async (session) => {
    const withdrawals = db.collection("withdrawals");
    const withdrawal = await withdrawals.findOne({ reference }, { session });
    if (!withdrawal) return { ignored: true };
    if (["completed", "failed"].includes(withdrawal.status)) return { duplicate: true, status: withdrawal.status };
    const now = new Date().toISOString();
    if (successful) {
      await withdrawals.updateOne({ reference, status: { $in: ["processing", "pending", "unknown"] } }, {
        $set: { status: "completed", provider_status: status, provider_transfer_id: String(transfer.id || ""), completed_at: now, updated_at: now }
      }, { session });
      await db.collection("wallet_transactions").updateOne({ reference }, {
        $set: { status: "completed", provider_transfer_id: String(transfer.id || ""), updated_at: now }
      }, { session });
      return { completed: true };
    }

    await db.collection("accounts").updateOne({ role: "vendor", id: withdrawal.vendor_id }, {
      $inc: { walletBalance: withdrawal.amount, wallet_balance: withdrawal.amount },
      $set: { updated_at: now }
    }, { session });
    await withdrawals.updateOne({ reference, status: { $in: ["processing", "pending", "unknown"] } }, {
      $set: { status: "failed", provider_status: status, failure_message: transfer.complete_message || "Flutterwave transfer failed.", updated_at: now }
    }, { session });
    await db.collection("wallet_transactions").updateOne({ reference }, {
      $set: { status: "failed", provider_status: status, updated_at: now }
    }, { session });
    const refundReference = `REFUND_${reference}`;
    await db.collection("wallet_transactions").updateOne({ reference: refundReference }, {
      $setOnInsert: {
        reference: refundReference,
        owner_type: "vendor",
        owner_id: withdrawal.vendor_id,
        type: "withdrawal_refund",
        direction: "credit",
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        provider: "internal",
        status: "completed",
        withdrawal_reference: reference,
        created_at: now
      }
    }, { upsert: true, session });
    return { refunded: true };
  });
}