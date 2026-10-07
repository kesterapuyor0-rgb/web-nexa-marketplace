import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  ArrowRight,
  Truck,
  AlertCircle,
  User,
  MapPin,
  ExternalLink,
  ChevronLeft,
  Package,
  Store
} from "lucide-react";
import { PhoneInput } from "../components/PhoneInput.jsx";
export const Checkout = () => {
  const { items, selectedItems, totalAmount, selectedTotalAmount, clearCart, clearSelectedItems, setIsCartOpen } = useCart();
  const { buyer, token } = useAuth();
  const navigate = useNavigate();
  const activeItems = selectedItems.length > 0 ? selectedItems : items;
  const activeTotalAmount = selectedItems.length > 0 ? selectedTotalAmount : totalAmount;
  const [shippingAddress, setShippingAddress] = useState({
    recipient_name: buyer?.full_name || "",
    phone: buyer?.phone || "",
    address_line1: buyer?.shipping_address_line1 || "",
    city: buyer?.city || "",
    state: buyer?.state || "",
    country: buyer?.country || "Nigeria"
  });
  useEffect(() => {
    if (buyer) {
      setShippingAddress((prev) => ({
        recipient_name: prev.recipient_name || buyer.full_name || "",
        phone: prev.phone || buyer.phone || "",
        address_line1: prev.address_line1 || buyer.shipping_address_line1 || "",
        city: prev.city || buyer.city || "",
        state: prev.state || buyer.state || "",
        country: prev.country || buyer.country || "Nigeria"
      }));
    }
  }, [buyer]);
  const [step, setStep] = useState("details");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [paystackSession, setPaystackSession] = useState(null);
  const platformProtectionFee = Math.round(activeTotalAmount * 0.02);
  const grandTotal = activeTotalAmount + platformProtectionFee;
  const vendorGroupMap = activeItems.reduce(
    (acc, item) => {
      const vId = item.product.vendor_id;
      if (!acc[vId]) {
        acc[vId] = {
          vendor_name: item.product.vendor_name,
          items: []
        };
      }
      acc[vId].items.push(item);
      return acc;
    },
    {}
  );
  const vendorGroups = Object.entries(vendorGroupMap);
  const handleInitializeSecurePayment = async (e) => {
    e.preventDefault();
    if (activeItems.length === 0) {
      setError("Please select items from your cart to proceed with checkout.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const checkoutItems = activeItems.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity
      }));
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: checkoutItems,
          shipping_address: shippingAddress,
          defer_payment: true
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize secure payment.");
      }
      setOrderResult(data.order);
      setPaystackSession(data.paystack);
      setStep("paystack");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleSimulatePaystackPayment = async () => {
    if (!orderResult || !paystackSession) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reference: paystackSession.reference
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment verification failed.");
      }
      setOrderResult(data.order);
      if (selectedItems.length > 0) {
        clearSelectedItems();
      } else {
        clearCart();
      }
      setStep("success");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  const handlePaystackPayment = async () => {
    if (!orderResult || !paystackSession) {
      setError("Payment session is unavailable. Please return to delivery details and try again.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          order_id: orderResult.id,
          email: buyer?.email,
          amount: Number(paystackSession.amount),
          reference: `WN_ORD_${Date.now()}`
        })
      });
      if (!response.ok) {
        const textResponse = await response.text();
        throw new Error(`Server returned ${response.status}: ${textResponse.slice(0, 100)}`);
      }
      const data = await response.json();
      if (!data?.data?.authorization_url) {
        throw new Error(data?.message || data?.error || "Missing authorization URL from Paystack response.");
      }
      window.location.href = data.data.authorization_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to connect to Paystack. Please try again.";
      console.error("Payment Error:", err);
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };
  if (items.length === 0 && step !== "success") {
    return <div className="min-h-[75vh] max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-500 mb-5 shadow-xl">
          <Package className="w-10 h-10 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white font-cinzel">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-zinc-400 max-w-md mt-2 mb-8 leading-relaxed">
          You don't have any items pending in your checkout cart. Explore verified computing, solar, and enterprise hardware from vetted WebNexa merchants.
        </p>
        <Link
      to="/"
      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl cta-gradient text-white text-sm font-bold shadow-lg hover:opacity-95 transition-opacity"
    >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Marketplace Catalog</span>
        </Link>
      </div>;
  }
  return <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {
    /* Top Breadcrumb & Status */
  }
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
    to="/"
    className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors"
    title="Return to Marketplace"
  >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>WebNexa Buyer Protection Checkout</span>
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </h1>
            <p className="text-xs text-zinc-400">
              Authenticated as <strong className="text-zinc-200">{buyer?.full_name}</strong> ({buyer?.email})
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Buyer Protection Guard Active
          </span>
        </div>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 shadow-md">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>}

      {
    /* Main Checkout Grid */
  }
      {step === "details" && <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {
    /* Left Column: Delivery & Buyer Details Form */
  }
          <div className="lg:col-span-7 space-y-6">
            {
    /* Buyer protection banner */
  }
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/30 text-xs text-zinc-300 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Platform-Managed Secure Settlement</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Payment safely processed. Vendor is credited automatically upon verified delivery to your address.
              </p>
            </div>

            {
    /* Shipping Form */
  }
            <form id="checkout-shipping-form" onSubmit={handleInitializeSecurePayment} className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#16161a] border border-zinc-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-purple-400" />
                    <span>Shipping & Delivery Destination</span>
                  </h2>
                  <span className="text-[11px] text-emerald-400 font-medium">Free Insured Courier</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Recipient Full Legal Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                      <input
    type="text"
    required
    value={shippingAddress.recipient_name}
    onChange={(e) => setShippingAddress({ ...shippingAddress, recipient_name: e.target.value })}
    placeholder="e.g. Amara Nwosu"
    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
  />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Phone Number (Delivery SMS / Calls)
                    </label>
                    <PhoneInput value={shippingAddress.phone} onChange={(phone) => setShippingAddress({ ...shippingAddress, phone })} required className="text-xs" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">City</label>
                    <input
    type="text"
    required
    value={shippingAddress.city}
    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
    placeholder="e.g. Ikeja or Lekki"
    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
  />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Street Address / Building Details
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                      <input
    type="text"
    required
    value={shippingAddress.address_line1}
    onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
    placeholder="e.g. Suite 4B, Victoria Island Tech Hub"
    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
  />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">State</label>
                    <input
    type="text"
    required
    value={shippingAddress.state}
    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
    placeholder="e.g. Lagos State"
    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
  />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Country</label>
                    <input
    type="text"
    disabled
    value={shippingAddress.country}
    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400"
  />
                  </div>
                </div>
              </div>

              {
    /* Payment Gateway Selector */
  }
              <div className="p-6 rounded-2xl bg-[#16161a] border border-zinc-800 shadow-xl space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Secure Payment Method</span>
                </h2>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-purple-500/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-white block">
                        Paystack Gateway • Platform-Managed Secure Settlement
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Supports Debit Cards, Bank Transfer, USSD & Apple Pay
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 font-semibold border border-purple-500/30">
                    Active
                  </span>
                </div>
              </div>

              {
    /* Submit Button */
  }
              <button
    type="submit"
    disabled={isProcessing}
    className="w-full py-4 px-6 rounded-xl cta-gradient text-white text-sm font-bold shadow-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50"
  >
                {isProcessing ? <span>Initializing Secure Settlement...</span> : <>
                    <span>Proceed to Secure Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>}
              </button>
            </form>
          </div>

          {
    /* Right Column: Order Review & Pricing Breakdown */
  }
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#16161a] border border-zinc-800 shadow-xl space-y-5 sticky top-24">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                  Order Summary ({activeItems.length} {activeItems.length === 1 ? "Product" : "Products"})
                </h3>
                <button
    type="button"
    onClick={() => setIsCartOpen(true)}
    className="text-xs text-purple-400 hover:text-purple-300 font-medium"
  >
                  Adjust Cart Selection
                </button>
              </div>

              {
    /* Items List grouped by Vendor */
  }
              <div className="max-h-80 overflow-y-auto pr-1 space-y-4">
                {vendorGroups.map(([vendorId, group]) => <div key={vendorId} className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-800">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-purple-400" />
                        <span>{group.vendor_name}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        {group.items.length} {group.items.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.items.map(({ product, quantity }) => <div key={product.id} className="flex items-center gap-3">
                          <img
    src={product.images[0] || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&q=80"}
    alt={product.title}
    className="w-12 h-12 rounded-lg object-cover bg-zinc-800 shrink-0 border border-zinc-700/60"
  />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-white truncate">{product.title}</h4>
                            <div className="flex items-center justify-between mt-0.5 text-xs">
                              <span className="text-zinc-400 text-[11px]">Qty: {quantity}</span>
                              <span className="font-mono text-purple-300 font-bold">
                                ₦{(product.price * quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>)}
                    </div>
                  </div>)}
              </div>

              {
    /* Price Calculation breakdown */
  }
              <div className="border-t border-zinc-800 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Cart Subtotal</span>
                  <span className="font-mono text-zinc-200 font-medium">
                    ₦{activeTotalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span>Platform Protection Fee (2%)</span>
                  </span>
                  <span className="font-mono text-zinc-300">
                    ₦{platformProtectionFee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Merchant Insured Shipping</span>
                  <span className="text-emerald-400 font-semibold uppercase text-[11px]">
                    Free Delivery
                  </span>
                </div>
                <div className="border-t border-zinc-800 pt-3 flex justify-between text-base font-bold text-white">
                  <span>Total Payment</span>
                  <span className="font-mono text-metallic-gold">
                    ₦{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {
    /* Trust Badge */
  }
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Multi-Vendor Buyer Protection Guard</span>
                </div>
                <p>
                  Payment is safely processed and each vendor is credited automatically upon verified delivery.
                </p>
              </div>
            </div>
          </div>
        </div>}

      {
    /* Step 2: Paystack Gateway Payment Terminal */
  }
      {step === "paystack" && paystackSession && <div className="max-w-xl mx-auto space-y-6">
          <div className="p-8 rounded-3xl bg-[#18181d] border border-zinc-700/90 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-inner">
              <CreditCard className="w-8 h-8 text-cyan-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">WebNexa Secure Payment</h2>
              <p className="text-xs text-purple-300">Platform-Managed Secure Settlement</p>
              <p className="text-[11px] text-zinc-500 font-mono">Reference: {paystackSession.reference}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Total Payment
              </span>
              <div className="text-3xl font-black font-mono text-white">
                ₦{paystackSession.amount.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium block">
                Held in trust for Order #{orderResult?.order_number}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-left space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Beneficiary Merchant:</span>
                <span className="text-white font-semibold">{orderResult?.vendor_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Authenticated Buyer:</span>
                <span className="text-white font-semibold">{buyer?.full_name} ({buyer?.email})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Settlement Manager:</span>
                <span className="text-purple-300 font-semibold">WebNexa Trust Vault</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Demo Test Card:</span>
                <span className="font-mono text-emerald-400">Secure Paystack Inline Checkout</span>
              </div>
            </div>

            {paystackSession.authorization_url && <a
    href={paystackSession.authorization_url}
    target="_blank"
    rel="noopener noreferrer"
    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
  >
                <span>Open Live Paystack Checkout</span>
                <ExternalLink className="w-4 h-4" />
              </a>}

            <button
    onClick={handlePaystackPayment}
    disabled={isProcessing}
    className="w-full py-4 px-6 rounded-xl cta-gradient text-white text-sm font-bold shadow-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50"
  >
              {isProcessing ? <span>Processing Secure Settlement...</span> : <>
                  <Lock className="w-4 h-4" />
                  <span>Pay Now with Paystack (₦{paystackSession.amount.toLocaleString()})</span>
                </>}
            </button>

            <button
    onClick={() => setStep("details")}
    className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
  >
              ← Back to Delivery Details
            </button>
          </div>
        </div>}

      {
    /* Step 3: Payment success confirmation */
  }
      {step === "success" && orderResult && <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="p-8 rounded-3xl bg-[#18181d] border border-emerald-500/40 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Payment Confirmed & Protected</h2>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                WebNexa Buyer Protection Guard Active
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Order Number:</span>
                <span className="font-mono font-bold text-white">{orderResult.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Protected Payment:</span>
                <span className="font-mono text-metallic-gold font-bold">
                  ₦{orderResult.total_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Vault Custody Status:</span>
                <span className="font-semibold text-purple-300">PAYMENT_VERIFIED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Vendor:</span>
                <span className="text-white font-medium">{orderResult.vendor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Destination:</span>
                <span className="text-zinc-300 truncate max-w-[200px]">
                  {orderResult.shipping_address?.address_line1}, {orderResult.shipping_address?.city}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Your deposit is safely locked. The vendor has received the order notice and will dispatch via courier. Once delivered, you can confirm receipt in your orders portal to authorize payout.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
    onClick={() => navigate("/buyer/orders")}
    className="flex-1 py-3 px-4 rounded-xl cta-gradient text-white text-xs font-bold shadow flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
  >
                <span>Track in Orders & Buyer Protection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
    onClick={() => navigate("/")}
    className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
  >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>}
    </div>;
};
