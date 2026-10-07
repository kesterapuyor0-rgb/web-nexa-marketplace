import { getAccountForRequest, getDatabase } from "../../_mongoAuth.js";
import { flutterwaveRequest } from "../../_flutterwave.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const db = await getDatabase();
    const vendor = req.vendor || await getAccountForRequest(req, db, "vendor");
    if (!vendor) return res.status(401).json({ error: "Vendor authentication required." });
    const accountBank = String(req.body?.account_bank || vendor.bank_code || "").trim();
    const accountNumber = String(req.body?.account_number || vendor.bank_account_number || "").trim();
    if (!accountBank || !accountNumber) return res.status(400).json({ error: "Bank code and account number are required." });
    const account = await flutterwaveRequest("/accounts/resolve", {
      method: "POST",
      body: { account_bank: accountBank, account_number: accountNumber }
    });
    return res.json({
      account_name: account.account_name,
      account_number: account.account_number || accountNumber,
      account_bank: account.account_bank || accountBank
    });
  } catch (error) {
    return res.status(error.statusCode || 502).json({ error: error.message || "Unable to verify the bank account." });
  }
}