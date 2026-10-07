import React, { useEffect, useState } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';

type WalletPanelProps = { token: string | null; role: 'buyer' | 'vendor' | 'admin' };
const endpoint = (role: WalletPanelProps['role']) => role === 'buyer' ? '/api/wallet' : `/api/${role}/wallet`;
const paymentEndpoint = (role: WalletPanelProps['role'], method: 'card' | 'bank_transfer' | 'crypto') => {
  if (method === 'crypto') {
    return role === 'buyer' ? '/api/payments/wallet/crypto' : `/api/${role}/payments/wallet/crypto`;
  }
  return role === 'buyer' ? '/api/payments/wallet/paystack' : `/api/${role}/payments/wallet/paystack`;
};

export const WalletPanel: React.FC<WalletPanelProps> = ({ token, role }) => {
  const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState('btc');
  const load = async () => {
    const response = await fetch(endpoint(role), { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setWallet((await response.json()).wallet);
  };
  useEffect(() => { if (token) load(); }, [token, role]);
  const start = async (method: 'card' | 'bank_transfer' | 'crypto') => {
    setLoading(true); setMessage('');
    try {
      const response = await fetch(paymentEndpoint(role, method), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount), channel: method === 'bank_transfer' ? 'bank_transfer' : 'card', pay_currency: cryptoCurrency }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create payment.');
      if (data.paystack?.authorization_url) window.location.href = data.paystack.authorization_url;
      else if (data.payment?.pay_address) setMessage(`Send crypto to ${data.payment.pay_address}. Your wallet credits after confirmation.`);
      setAmount('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Payment failed.'); }
    finally { setLoading(false); }
  };
  return (
    <section className="bg-[#18181e] border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-400" /> Wallet</h2>
        <button onClick={load} className="text-zinc-400 hover:text-white" aria-label="Refresh wallet"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div className="text-2xl font-mono text-emerald-300">₦{(wallet?.balance || 0).toLocaleString()}</div>
      <div className="flex flex-wrap gap-2">
        <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" placeholder="Amount (NGN)" className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm w-40" />
        <button disabled={loading || !amount} onClick={() => start('card')} className="px-3 py-2 rounded-lg bg-purple-600 text-xs font-semibold disabled:opacity-50">Card</button>
        <button disabled={loading || !amount} onClick={() => start('bank_transfer')} className="px-3 py-2 rounded-lg bg-indigo-700 text-xs font-semibold disabled:opacity-50">Bank transfer</button>
        <select value={cryptoCurrency} onChange={(event) => setCryptoCurrency(event.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-xs">
          <option value="btc">BTC</option>
          <option value="eth">ETH</option>
          <option value="usdt">USDT</option>
        </select>
        <button disabled={loading || !amount} onClick={() => start('crypto')} className="px-3 py-2 rounded-lg bg-zinc-700 text-xs font-semibold disabled:opacity-50">Crypto</button>
      </div>
      {message && <p className="text-xs text-amber-300 break-all">{message}</p>}
    </section>
  );
};
