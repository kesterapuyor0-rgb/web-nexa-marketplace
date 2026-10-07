import { useCallback, useEffect, useState } from "react";
import { Landmark, Wallet } from "lucide-react";

const naira = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

export const WalletPanel = ({ token, role, vendor }) => {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [message, setMessage] = useState("");

  const loadWallet = useCallback(async () => {
    if (!token || role !== "vendor") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/vendor/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load vendor wallet.");
      setWallet(data.wallet || null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load vendor wallet.");
    } finally {
      setIsLoading(false);
    }
  }, [token, role]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const bankName = typeof vendor?.bank_name === "string" ? vendor.bank_name.trim() : "";
  const accountName = typeof vendor?.bank_account_name === "string" ? vendor.bank_account_name.trim() : "";
  const accountNumber = typeof vendor?.bank_account_number === "string" ? vendor.bank_account_number.trim() : "";
  const maskedAccountNumber = accountNumber
    ? `${"*".repeat(Math.max(0, accountNumber.length - 4))}${accountNumber.slice(-4)}`
    : "Not provided";
  const hasRegisteredBank = Boolean(vendor?.bank_code && accountNumber && accountName);
  const numericAmount = Number(amount);
  const balance = Number(wallet?.balance || 0);

  const withdraw = async (event) => {
    event.preventDefault();
    if (!hasRegisteredBank) {
      setMessage("Add complete bank details to your vendor profile before withdrawing.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 100 || numericAmount > balance) {
      setMessage("Enter an amount from ₦100 up to your available balance.");
      return;
    }

    setIsWithdrawing(true);
    setMessage("");
    try {
      const response = await fetch("/api/vendor/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: numericAmount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit withdrawal.");
      setMessage(data.message || `Withdrawal ${data.status || "submitted"}. Reference: ${data.reference}`);
      setAmount("");
      await loadWallet();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Withdrawal failed.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (role !== "vendor") return null;

  return (
    <section className="w-full min-w-0 space-y-5 overflow-hidden rounded-2xl border border-zinc-800 bg-[#18181e] p-4 sm:p-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Wallet className="h-4 w-4 shrink-0 text-emerald-400" />
          Vendor wallet
        </div>
        <p className="mt-4 text-xs text-zinc-400">Available balance</p>
        <p className="mt-1 break-all text-3xl font-semibold tracking-tight text-emerald-300">
          {isLoading ? "Loading…" : naira(balance)}
        </p>
      </div>

      <div className="w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
          <Landmark className="h-4 w-4 shrink-0 text-purple-300" />
          Registered bank account
        </div>
        {hasRegisteredBank ? (
          <dl className="mt-3 grid min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs text-zinc-500">Bank</dt>
              <dd className="mt-1 break-words text-zinc-200">{bankName || "Registered bank"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-zinc-500">Account number</dt>
              <dd className="mt-1 font-mono text-zinc-200">{maskedAccountNumber}</dd>
            </div>
            <div className="min-w-0 sm:col-span-2">
              <dt className="text-xs text-zinc-500">Account name</dt>
              <dd className="mt-1 break-words text-zinc-200">{accountName}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 break-words text-xs text-amber-300">
            Complete bank details are not available on your vendor profile.
          </p>
        )}
      </div>

      <form onSubmit={withdraw} className="flex w-full min-w-0 flex-col gap-3 border-t border-zinc-800 pt-4">
        <label htmlFor="vendor-withdrawal-amount" className="text-xs font-medium text-zinc-300">
          Withdrawal amount (NGN)
        </label>
        <input
          id="vendor-withdrawal-amount"
          type="number"
          inputMode="decimal"
          min="100"
          max={balance}
          step="1"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Enter amount"
          className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={isLoading || isWithdrawing || !hasRegisteredBank || !amount || numericAmount > balance}
          className="min-h-11 w-full rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isWithdrawing ? "Submitting withdrawal…" : "Withdraw to registered bank"}
        </button>
      </form>

      {message && <p role="status" className="break-words text-xs text-amber-300">{message}</p>}
      <p className="break-words text-[11px] leading-relaxed text-zinc-500">
        Transfer status is tracked by Flutterwave. Funds remain reserved until the transfer completes or fails.
      </p>
    </section>
  );
};
