import { useEffect, useState } from "react";
import { BadgeCheck, Landmark, Wallet } from "lucide-react";
export const WalletPanel = ({ token, role, vendor }) => {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const [accountBank, setAccountBank] = useState(vendor?.bank_code || "");
  const [accountNumber, setAccountNumber] = useState(vendor?.bank_account_number || "");
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => {
    if (!token || role !== "vendor") return;
    const response = await fetch("/api/vendor/wallet", { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setWallet((await response.json()).wallet);
  };
  useEffect(() => {
    load();
  }, [token, role]);
  useEffect(() => {
    setAccountBank(vendor?.bank_code || "");
    setAccountNumber(vendor?.bank_account_number || "");
  }, [vendor]);
  const verifyAccount = async () => {
    setIsVerifying(true);
    setMessage("");
    setVerifiedAccount(null);
    try {
      const response = await fetch("/api/vendor/banks/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ account_bank: accountBank, account_number: accountNumber })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to verify bank account.");
      setVerifiedAccount(data);
      setMessage("Bank account verified with Flutterwave.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bank account verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };
  const withdraw = async () => {
    if (!verifiedAccount) return;
    setIsWithdrawing(true);
    setMessage("");
    try {
      const response = await fetch("/api/vendor/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount), account_bank: accountBank, account_number: accountNumber, account_name: verifiedAccount.account_name })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit withdrawal.");
      setMessage(data.message || `Withdrawal ${data.status || "submitted"}. Reference: ${data.reference}`);
      setAmount("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Withdrawal failed.");
    } finally {
      setIsWithdrawing(false);
    }
  };
  if (role !== "vendor") return null;
  return <section className="bg-[#18181e] border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-400" /> Vendor wallet</h2>
        <span className="text-xs text-zinc-400">Available balance</span>
      </div>
      <div className="text-2xl font-mono text-emerald-300">₦{(wallet?.balance || 0).toLocaleString()}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-400">Bank code
          <input inputMode="numeric" value={accountBank} onChange={(event) => { setAccountBank(event.target.value); setVerifiedAccount(null); }} placeholder="e.g. 044" className="mt-1.5 min-h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white" />
        </label>
        <label className="text-xs text-zinc-400">Account number
          <input inputMode="numeric" value={accountNumber} onChange={(event) => { setAccountNumber(event.target.value); setVerifiedAccount(null); }} placeholder="10-digit account number" className="mt-1.5 min-h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white" />
        </label>
      </div>
      <button type="button" onClick={verifyAccount} disabled={isVerifying || !accountBank || !accountNumber} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 disabled:opacity-50">
        <Landmark className="h-4 w-4" /> {isVerifying ? "Verifying account…" : "Verify bank account"}
      </button>
      {verifiedAccount && <p className="flex items-center gap-2 text-xs text-emerald-300"><BadgeCheck className="h-4 w-4" /> {verifiedAccount.account_name}</p>}
      <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
        <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="100" max={wallet?.balance || undefined} placeholder="Withdrawal amount (NGN)" className="min-h-10 min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white" />
        <button disabled={isWithdrawing || !verifiedAccount || !amount || Number(amount) > Number(wallet?.balance || 0)} onClick={withdraw} className="min-h-10 rounded-lg bg-purple-600 px-4 text-xs font-bold text-white disabled:opacity-50">
          {isWithdrawing ? "Submitting…" : "Withdraw"}
        </button>
      </div>
      {message && <p className="text-xs text-amber-300 break-all">{message}</p>}
      <p className="text-[11px] text-zinc-500">Flutterwave transfer status is tracked by webhook. Funds remain reserved until the transfer completes or fails.</p>
    </section>;
};
