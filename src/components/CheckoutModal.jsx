import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  X,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  ArrowRight,
  Truck,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { PhoneInput } from "./PhoneInput.jsx";
export const CheckoutModal = () => {
  const { items, totalAmount, isCheckoutOpen, setIsCheckoutOpen, clearCart } = useCart();
  const { buyer, token, role } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isCheckoutOpen && (!token || role !== "buyer")) {
      setIsCheckoutOpen(false);
      navigate("/login?redirect=/checkout&notice=checkout_required");
    }
  }, [isCheckoutOpen, token, role, navigate, setIsCheckoutOpen]);
  const [shippingAddress, setShippingAddress] = useState({
    recipient_name: buyer?.full_name || "Amara Nwosu",
    phone: buyer?.phone || "+234 812 345 6789",
    address_line1: buyer?.shipping_address_line1 || "14 Admiralty Way, Lekki Phase 1",
    city: buyer?.city || "Lagos",
    state: buyer?.state || "Lagos State",
    country: buyer?.country || "Nigeria"
  });
  const [step, setStep] = useState("details");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [paystackSession, setPaystackSession] = useState(null);
  if (!isCheckoutOpen) return null;
  const platformProtectionFee = Math.round(totalAmount * 0.02);
  const grandTotal = totalAmount + platformProtectionFee;
  const handleInitializeSecurePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    try {
      const checkoutItems = items.map((i) => ({
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
      clearCart();
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
  const handleClose = () => {
    setIsCheckoutOpen(false);
    setStep("details");
    setError(null);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#18181d] border border-zinc-700/80 rounded-2xl w-full max-w-xl text-zinc-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {
    /* Modal Header */
  }
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#131317]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">WebNexa Buyer Protection Checkout</h3>
              <p className="text-xs text-zinc-400">Platform-Managed Secure Settlement • Processed via Paystack Gateway</p>
            </div>
          </div>
          <button
    onClick={handleClose}
    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Modal Body */
  }
        <div className="p-6 overflow-y-auto space-y-6">
          {error && <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>}

          {step === "details" && <form onSubmit={handleInitializeSecurePayment} className="space-y-4">
              {
    /* Secure settlement summary banner */
  }
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 text-xs space-y-1">
                <div className="flex items-center gap-2 text-purple-300 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Payment verified and held securely by the platform</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  WebNexa holds your deposit securely. The vendor will only receive their payout
                  once you inspect the delivery and mark the order as fulfilled.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Delivery Address</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Recipient Name</label>
                    <input
    type="text"
    required
    value={shippingAddress.recipient_name}
    onChange={(e) => setShippingAddress({ ...shippingAddress, recipient_name: e.target.value })}
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-purple-500"
  />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Contact Phone</label>
                    <PhoneInput value={shippingAddress.phone} onChange={(phone) => setShippingAddress({ ...shippingAddress, phone })} required className="text-xs" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-zinc-400 mb-1">Street Address</label>
                    <input
    type="text"
    required
    value={shippingAddress.address_line1}
    onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-purple-500"
  />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">City</label>
                    <input
    type="text"
    required
    value={shippingAddress.city}
    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-purple-500"
  />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">State</label>
                    <input
    type="text"
    required
    value={shippingAddress.state}
    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-purple-500"
  />
                  </div>
                </div>
              </div>

              {
    /* Order items preview */
  }
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Cart Breakdown ({items.length} items)
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1.5 text-xs text-zinc-300 pr-1">
                  {items.map(({ product, quantity }) => <div key={product.id} className="flex justify-between items-center py-1">
                      <span className="truncate max-w-[260px]">
                        {quantity}x {product.title}
                      </span>
                      <span className="font-mono text-zinc-200">
                        ₦{(product.price * quantity).toLocaleString()}
                      </span>
                    </div>)}
                </div>

                <div className="pt-2 border-t border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>Platform Protection Fee (2%)</span>
                    <span className="font-mono">₦{platformProtectionFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-zinc-100 pt-1">
                    <span>Total Required Deposit</span>
                    <span className="font-mono text-metallic-gold">₦{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
    type="submit"
    disabled={isProcessing}
    className="w-full py-3 px-4 rounded-xl cta-gradient text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50"
  >
                {isProcessing ? <span>Initializing Paystack Session...</span> : <>
                    <span>Continue to Paystack Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>}
              </button>
            </form>}

          {step === "paystack" && paystackSession && <div className="space-y-5">
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-700 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-zinc-100">Paystack Payment Gateway</h4>
                  <p className="text-xs text-purple-300 font-medium">Payment verified by Platform-Managed Secure Settlement</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Reference: {paystackSession.reference}</p>
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  ₦{paystackSession.amount.toLocaleString()}
                </div>
              </div>

              {
    /* Paystack Channel Options */
  }
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs">
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-400">Merchant:</span>
                  <span className="font-semibold text-white">WebNexa Marketplace Ltd</span>
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-400">Settlement Custodian:</span>
                  <span className="font-semibold text-purple-300">WebNexa Trust Protocol</span>
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-400">Payment method:</span>
                  <span className="font-mono text-emerald-400">Secure Paystack Inline Checkout</span>
                </div>
              </div>

              {paystackSession.authorization_url && <a
    href={paystackSession.authorization_url}
    target="_blank"
    rel="noopener noreferrer"
    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
  >
                  <span>Open Live Paystack Checkout Window</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>}

              <button
    onClick={handlePaystackPayment}
    disabled={isProcessing}
    className="w-full py-3.5 px-4 rounded-xl cta-gradient text-white text-sm font-bold shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-50"
  >
                {isProcessing ? <span>Verifying Secure Payment...</span> : <>
                    <Lock className="w-4 h-4" />
                    <span>Pay Now with Paystack (₦{paystackSession.amount.toLocaleString()})</span>
                  </>}
              </button>

              <button
    onClick={() => setStep("details")}
    className="w-full text-center text-xs text-zinc-400 hover:text-zinc-200"
  >
                Back to delivery details
              </button>
            </div>}

          {step === "success" && orderResult && <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-bold text-zinc-100 font-cinzel">Payment Verified & Held by Platform</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Your funds are protected. WebNexa will release ₦
                  {orderResult.vendor_payout_amount.toLocaleString()} to {orderResult.vendor_name} only
                  after you confirm delivery.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Order Number:</span>
                  <span className="font-mono font-bold text-white">{orderResult.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Paystack Reference:</span>
                  <span className="font-mono text-purple-300">{orderResult.paystack_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Settlement Status:</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 font-semibold text-[10px]">
                    HELD_IN_ESCROW
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                <button
    onClick={() => {
      handleClose();
      navigate("/buyer/orders");
    }}
    className="flex-1 py-2.5 px-4 rounded-xl cta-gradient text-white text-xs font-bold"
  >
                  Track Order & Delivery
                </button>
                <button
    onClick={handleClose}
    className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
  >
                  Continue Shopping
                </button>
              </div>
            </div>}
        </div>
      </div>
    </div>;
};
