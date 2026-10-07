import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, Lock, MapPin, Package, ShieldCheck, Truck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { PhoneInput } from "../components/PhoneInput.jsx";
import { getFlutterwavePublicKey } from "../config/flutterwave.js";

export const FlutterwaveCheckout = () => {
  const { buyer, token } = useAuth();
  const { items, selectedItems, totalAmount, selectedTotalAmount } = useCart();
  const activeItems = selectedItems.length ? selectedItems : items;
  const subtotal = selectedItems.length ? selectedTotalAmount : totalAmount;
  const fee = Math.round(subtotal * 0.02);
  const [shipping, setShipping] = useState({
    recipient_name: buyer?.full_name || "",
    phone: buyer?.phone || "",
    address_line1: buyer?.shipping_address_line1 || "",
    city: buyer?.city || "",
    state: buyer?.state || "",
    country: buyer?.country || "Nigeria"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!buyer) return;
    setShipping((current) => ({
      recipient_name: current.recipient_name || buyer.full_name || "",
      phone: current.phone || buyer.phone || "",
      address_line1: current.address_line1 || buyer.shipping_address_line1 || "",
      city: current.city || buyer.city || "",
      state: current.state || buyer.state || "",
      country: current.country || buyer.country || "Nigeria"
    }));
  }, [buyer]);

  const setField = (field, value) => setShipping((current) => ({ ...current, [field]: value }));
  const startCheckout = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const publicKey = getFlutterwavePublicKey();
      const response = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: activeItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          shipping_address: shipping
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start secure checkout.");
      if (!data.checkout_url) throw new Error("Flutterwave did not return a checkout link.");
      if (publicKey !== import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY) {
        throw new Error("Flutterwave public key configuration is invalid.");
      }
      window.location.assign(data.checkout_url);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start secure checkout.");
      setIsLoading(false);
    }
  };

  if (activeItems.length === 0) {
    return <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <Package className="h-12 w-12 text-zinc-500" />
      <h1 className="mt-4 text-2xl font-bold text-white">Your cart is empty</h1>
      <Link to="/marketplace" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white">
        <ArrowLeft className="h-4 w-4" /> Return to marketplace
      </Link>
    </main>;
  }

  return <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:px-8">
    <section>
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>
      <div className="mt-5 flex items-start gap-3 border-b border-zinc-800 pb-5">
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-2 text-purple-300"><ShieldCheck className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-bold text-white">Secure checkout</h1>
          <p className="mt-1 text-xs text-zinc-400">Payment is verified before an order is created and held in escrow until receipt is confirmed.</p>
        </div>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}

      <form onSubmit={startCheckout} className="mt-6 space-y-4">
        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100"><Truck className="h-4 w-4 text-purple-300" /> Delivery contact confirmation</h2>
            <p className="mt-1 text-xs text-zinc-400">Confirm the delivery address and courier contact number for this order.</p>
          </div>
          <label className="block text-xs text-zinc-400">Recipient name
            <input required value={shipping.recipient_name} onChange={(event) => setField("recipient_name", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white" />
          </label>
          <PhoneInput label="Courier contact number" value={shipping.phone} onChange={(phone) => setField("phone", phone)} required />
          <label className="block text-xs text-zinc-400">Street address
            <span className="relative mt-1.5 block"><MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-500" /><input required value={shipping.address_line1} onChange={(event) => setField("address_line1", event.target.value)} className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-9 pr-3 text-sm text-white" /></span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs text-zinc-400">City<input required value={shipping.city} onChange={(event) => setField("city", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white" /></label>
            <label className="block text-xs text-zinc-400">State<input required value={shipping.state} onChange={(event) => setField("state", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white" /></label>
          </div>
        </section>
        <button disabled={isLoading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-bold text-white transition-colors hover:bg-purple-500 disabled:cursor-wait disabled:opacity-60">
          <CreditCard className="h-4 w-4" />
          {isLoading ? "Connecting to Flutterwave…" : "Continue to Flutterwave"}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </section>

    <aside className="h-fit rounded-lg border border-zinc-800 bg-[#18181e] p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-white">Order summary <span className="text-zinc-500">({activeItems.length})</span></h2>
      <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto border-b border-zinc-800 pb-4">
        {activeItems.map(({ product, quantity }) => <li key={product.id} className="flex min-w-0 items-start justify-between gap-3 text-xs">
          <span className="min-w-0"><span className="block truncate text-zinc-200">{product.title}</span><span className="text-zinc-500">Qty {quantity}</span></span>
          <span className="shrink-0 font-mono text-zinc-200">₦{(product.price * quantity).toLocaleString()}</span>
        </li>)}
      </ul>
      <div className="space-y-2 pt-4 text-xs">
        <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
        <div className="flex justify-between text-zinc-400"><span>Platform protection fee</span><span>₦{fee.toLocaleString()}</span></div>
        <div className="flex justify-between border-t border-zinc-800 pt-3 text-sm font-bold text-white"><span>Total</span><span>₦{(subtotal + fee).toLocaleString()}</span></div>
      </div>
      <p className="mt-4 flex items-start gap-2 border-t border-zinc-800 pt-4 text-[11px] leading-relaxed text-zinc-500"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> Funds go to WebNexa’s Flutterwave account and are held until you confirm delivery.</p>
    </aside>
  </main>;
};