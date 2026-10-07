import { randomUUID } from "node:crypto";
import { getAccountForRequest, getDatabase } from "../../_mongoAuth.js";
import { flutterwaveRequest, toNaira, withMongoTransaction } from "../../_flutterwave.js";
import { settleFlutterwaveTransfer } from "../../_wallet.js";

function sameAccountName(left, right) {
  const normalize = (value) => String(value || "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  return normalize(left) !== "" && normalize(left) === normalize(right);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let withdrawal;
  try {
    const db = await getDatabase();
    const vendor = req.vendor || await getAccountForRequest(req, db, "vendor");
    if (!vendor) return res.status(401).json({ error: "Vendor authentication required." });
    const amount = toNaira(req.body?.amount);
    const accountBank = String(req.body?.account_bank || vendor.bank_code || "").trim();
    const accountNumber = String(req.body?.account_number || vendor.bank_account_number || "").trim();
    const submittedName = String(req.body?.account_name || vendor.bank_account_name || "").trim();
    if (!amount || amount < 100) return res.status(400).json({ error: "Enter a withdrawal amount of at least ₦100." });
    if (!accountBank || !accountNumber || !submittedName) {
      return res.status(400).json({ error: "Bank code, account number, and account name are required." });
    }

    const resolvedAccount = await flutterwaveRequest("/accounts/resolve", {
      method: "POST",
      body: { account_bank: accountBank, account_number: accountNumber }
    });
    if (!sameAccountName(submittedName, resolvedAccount.account_name)) {
      return res.status(409).json({ error: "Account name does not match the bank's verified account holder.", resolved_account_name: resolvedAccount.account_name });
    }

    const reference = `WN_FLW_WD_${randomUUID()}`;
    const vendorId = String(vendor.id || vendor._id);
    const now = new Date().toISOString();
    withdrawal = await withMongoTransaction(db, async (session) => {
      const accounts = db.collection("accounts");
      const currentVendor = await accounts.findOne({ role: "vendor", $or: [{ id: vendorId }, { _id: vendorId }] }, { session });
      if (!currentVendor) {
        const error = new Error("Vendor account was not found.");
        error.statusCode = 404;
        throw error;
      }
      const balance = toNaira(currentVendor.walletBalance ?? currentVendor.wallet_balance ?? 0);
      if (balance < amount) {
        const error = new Error("Insufficient wallet balance.");
        error.statusCode = 409;
        throw error;
      }
      const result = await accounts.updateOne({ _id: currentVendor._id }, {
        $set: {
          walletBalance: toNaira(balance - amount),
          wallet_balance: toNaira(balance - amount),
          bank_code: accountBank,
          bank_account_number: accountNumber,
          bank_account_name: resolvedAccount.account_name,
          updated_at: now
        }
      }, { session });
      if (!result.matchedCount) throw new Error("Unable to reserve vendor funds.");
      const withdrawalRecord = {
        reference,
        vendor_id: vendorId,
        amount,
        currency: "NGN",
        account_bank: accountBank,
        account_number: accountNumber,
        account_name: resolvedAccount.account_name,
        status: "processing",
        created_at: now,
        updated_at: now
      };
      await db.collection("withdrawals").insertOne(withdrawalRecord, { session });
      await db.collection("wallet_transactions").insertOne({
        reference,
        owner_type: "vendor",
        owner_id: vendorId,
        type: "withdrawal",
        direction: "debit",
        amount,
        currency: "NGN",
        provider: "flutterwave",
        status: "pending",
        description: "Vendor bank withdrawal",
        created_at: now
      }, { session });
      return withdrawalRecord;
    });

    let transfer;
    try {
      transfer = await flutterwaveRequest("/transfers", {
        method: "POST",
        body: {
          account_bank: accountBank,
          account_number: accountNumber,
          amount,
          currency: "NGN",
          debit_currency: "NGN",
          reference,
          beneficiary_name: resolvedAccount.account_name,
          narration: `WebNexa vendor wallet withdrawal ${reference}`,
          callback_url: `${(process.env.APP_URL || "").replace(/\/$/, "")}/api/payments/flutterwave/webhook`,
          meta: { vendor_id: vendorId, withdrawal_reference: reference }
        }
      });
    } catch (error) {
      if (error.providerStatus) {
        await settleFlutterwaveTransfer(db, { reference, status: "FAILED", complete_message: error.message });
        return res.status(error.statusCode || 502).json({ error: "Flutterwave rejected the bank transfer. Reserved funds were restored." });
      }
      await db.collection("withdrawals").updateOne({ reference, status: "processing" }, {
        $set: { status: "unknown", failure_message: "Transfer outcome is being reconciled.", updated_at: new Date().toISOString() }
      });
      return res.status(202).json({ reference, status: "unknown", message: "Transfer outcome is being reconciled; funds remain reserved to prevent duplicate payment." });
    }

    const transferStatus = String(transfer.status || "NEW").toUpperCase();
    await db.collection("withdrawals").updateOne({ reference, status: "processing" }, {
      $set: { status: "pending", provider_transfer_id: String(transfer.id || ""), provider_status: transferStatus, updated_at: new Date().toISOString() }
    });
    await db.collection("wallet_transactions").updateOne({ reference }, {
      $set: { provider_transfer_id: String(transfer.id || ""), provider_status: transferStatus, updated_at: new Date().toISOString() }
    });
    if (["FAILED", "REVERSED", "CANCELLED"].includes(transferStatus)) {
      await settleFlutterwaveTransfer(db, { ...transfer, reference, status: transferStatus });
      return res.status(502).json({ error: "Flutterwave transfer failed; the reserved balance was restored.", reference });
    }
    if (["SUCCESSFUL", "COMPLETED"].includes(transferStatus)) {
      await settleFlutterwaveTransfer(db, { ...transfer, reference, status: transferStatus });
    }
    return res.status(202).json({ reference, status: transferStatus.toLowerCase(), message: "Withdrawal submitted to Flutterwave." });
  } catch (error) {
    console.error("[flutterwave] Vendor withdrawal failed", { message: error.message, code: error.code });
    return res.status(error.statusCode || 503).json({ error: error.message || "Unable to submit withdrawal." });
  }
}