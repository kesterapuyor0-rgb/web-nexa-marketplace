import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { VendorRatingModal } from "../components/VendorRatingModal.jsx";
import { WalletPanel } from "../components/WalletPanel.jsx";
import {
  Package,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock
} from "lucide-react";
export const BuyerOrders = () => {
  const { buyer, token, role } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  useEffect(() => {
    if (role !== "buyer") {
      navigate("/login?redirect=/buyer/orders");
      return;
    }
    loadOrders();
  }, [role, token]);
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/buyer", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data.orders) ? data.orders.filter((order) => order && typeof order === "object").map((order) => ({
          ...order,
          items: Array.isArray(order.items) ? order.items.filter((item) => item && typeof item === "object") : [],
          shipping_address: order.shipping_address && typeof order.shipping_address === "object" && !Array.isArray(order.shipping_address)
            ? order.shipping_address
            : {}
        })) : []);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleConfirmDelivery = async (orderId) => {
    setConfirmingId(orderId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-delivery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm delivery.");
      setFeedback(data.message);
      await loadOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirmingId(null);
    }
  };
  const getStatusStep = (status) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return 1;
      case "HELD_IN_ESCROW":
        return 2;
      case "SHIPPED":
        return 3;
      case "DELIVERED":
      case "delivered_and_completed":
        return status === "delivered_and_completed" ? 5 : 4;
      case "ESCROW_RELEASED":
        return 5;
      default:
        return 2;
    }
  };
  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return "Payment Pending";
      case "HELD_IN_ESCROW":
        return "Payment Verified & Held by Platform";
      case "SHIPPED":
        return "Order Shipped by Vendor";
      case "DELIVERED":
        return "Buyer Confirmed Delivery";
      case "delivered_and_completed":
      case "ESCROW_RELEASED":
        return "Payout Released to Vendor";
      default:
        return status;
    }
  };
  return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {
    /* Header */
  }
      <div className="bg-[#18181e] border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/30 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> WebNexa Buyer Protection
          </span>
          <h1 className="text-2xl font-bold text-white font-cinzel mt-2">
            My Orders & Buyer Protection Tracker
          </h1>
          <p className="text-xs text-zinc-400">
            Account: <span className="text-zinc-200">{buyer?.full_name}</span> ({buyer?.email})
          </p>
        </div>
        <WalletPanel token={token} role="buyer" />

        <button
    onClick={() => navigate("/")}
    className="px-4 py-2 rounded-xl cta-gradient text-white text-xs font-semibold shadow self-start sm:self-auto"
  >
          Browse Marketplace
        </button>
      </div>

      {feedback && <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>}

      {
    /* Orders List */
  }
      <div className="space-y-6">
        {orders.length === 0 ? <div className="p-12 text-center bg-[#18181e] rounded-2xl border border-zinc-800 space-y-3">
            <Package className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-base font-semibold text-zinc-300">No orders placed yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Shop high-grade computing hardware, electronics, or solar power systems protected by the WebNexa Buyer Protection Guard.
            </p>
            <button
    onClick={() => navigate("/")}
    className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
  >
              Explore Products
            </button>
          </div> : orders.map((order) => {
    const currentStep = getStatusStep(order.status);
            const orderItems = Array.isArray(order.items) ? order.items : [];
            const shippingAddress = order.shipping_address || {};
            const vendorsToReview = Array.from(
              new Map(
                orderItems.map((item) => [
          item.vendor_id || order.vendor_id,
          item.vendor_name || order.vendor_name
        ])
      ).entries()
    );
    return <div
      key={order.id}
      className="bg-[#18181e] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6"
    >
                {
      /* Order Top Bar */
    }
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-base">
                        {order.order_number}
                      </span>
                      <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${order.status === "HELD_IN_ESCROW" ? "bg-purple-900/50 text-purple-300 border border-purple-500/30" : order.status === "SHIPPED" ? "bg-blue-900/50 text-blue-300 border border-blue-500/30" : order.status === "DELIVERED" ? "bg-amber-900/50 text-amber-300 border border-amber-500/30" : "bg-emerald-900/50 text-emerald-300 border border-emerald-500/30"}`}
    >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Merchant: <span className="text-zinc-200 font-semibold">{order.vendor_name}</span> • Placed:{" "}
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-zinc-400">Total Payment</div>
                    <div className="text-xl font-bold font-mono text-metallic-gold">
                      ₦{order.total_amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Flutterwave Ref: {order.payment_reference || order.paystack_reference}
                    </div>
                  </div>
                </div>

                {
      /* 5-step buyer protection and settlement tracker */
    }
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                    <span className={currentStep >= 1 ? "text-purple-300 font-bold" : ""}>
                      1. Order Placed & Paid
                    </span>
                    <span className={currentStep >= 2 ? "text-purple-300 font-bold" : ""}>
                      2. Payment Verified & Held by Platform
                    </span>
                    <span className={currentStep >= 3 ? "text-purple-300 font-bold" : ""}>
                      3. Order Shipped by Vendor
                    </span>
                    <span className={currentStep >= 4 ? "text-purple-300 font-bold" : ""}>
                      4. Buyer Confirms Delivery
                    </span>
                    <span className={currentStep >= 5 ? "text-emerald-300 font-bold" : ""}>
                      5. Payout Released to Vendor
                    </span>
                  </div>

                  {
      /* Progress bar line */
    }
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
      className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 transition-all duration-500"
      style={{ width: `${currentStep / 5 * 100}%` }}
    />
                  </div>
                </div>

                {
      /* Items & Shipping Address Details */
    }
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="space-y-2">
                    <h4 className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                      Purchased Items
                    </h4>
                    {orderItems.map((item) => <div
      key={item.id}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800"
    >
                        <img
      src={item.image}
      alt={item.title}
      className="w-12 h-12 rounded-lg object-cover bg-zinc-800 shrink-0"
    />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-200 truncate">{item.title}</p>
                          <p className="text-zinc-400 text-[11px]">
                            Qty: {item.quantity || 0} • ₦{Number(item.price || 0).toLocaleString()} each
                            {item.vendor_name && <span className="text-purple-300 ml-1.5 font-medium">• Sold by: {item.vendor_name}</span>}
                          </p>
                        </div>
                      </div>)}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                      Shipping & Delivery Destination
                    </h4>
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                      <p className="text-zinc-200 font-semibold">{shippingAddress.recipient_name || "Recipient not provided"}</p>
                      <p className="text-zinc-400">{shippingAddress.phone || ""}</p>
                      <p className="text-zinc-400 text-[11px]">
                        {[shippingAddress.address_line1, shippingAddress.address_line2, shippingAddress.city, shippingAddress.state, shippingAddress.country].filter(Boolean).join(", ") || "Delivery address not available"}
                      </p>
                    </div>

                    {
      /* Logistics tracking callout */
    }
                    {order.carrier_name && <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-[11px] flex items-center justify-between">
                        <div>
                          <span className="text-zinc-400 block">Carrier: {order.carrier_name}</span>
                          <span className="font-mono text-purple-300 font-bold">
                            Waybill: {order.tracking_number}
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-400 font-medium">In Transit</span>
                      </div>}
                  </div>
                </div>

                {
      /* Bottom Action Area: Buyer Confirmation Trigger */
    }
                <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  {order.status === "HELD_IN_ESCROW" && <div className="flex items-center gap-2 text-purple-300">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>
                        Payment processed via Flutterwave. Funds are held securely in escrow. The vendor is
                        preparing your package.
                      </span>
                    </div>}

                  {order.status === "SHIPPED" && <>
                      <div className="flex items-center gap-2 text-blue-300">
                        <Truck className="w-4 h-4 shrink-0" />
                        <span>
                          Package dispatched with {order.carrier_name}. Have you received and inspected the item?
                        </span>
                      </div>

                      <button
      id={`confirm-delivery-btn-${order.id}`}
      onClick={() => handleConfirmDelivery(order.id)}
      disabled={confirmingId === order.id}
      className="w-full sm:w-auto px-5 py-2.5 rounded-xl cta-gradient text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-all"
    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Item Received</span>
                      </button>
                    </>}

                  {(order.status === "DELIVERED" || order.status === "delivered_and_completed") && <div className="flex w-full flex-col items-start justify-between gap-3 text-amber-400 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          You confirmed receipt on{" "}
                          {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : "today"}
                          . The vendor has been credited automatically through Platform-Managed Secure Settlement.
                        </span>
                      </div>
                      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                        {vendorsToReview.map(([vendorId, vendorName]) => <button
      key={vendorId}
      type="button"
      onClick={() => setReviewingOrder({ ...order, vendor_id: vendorId, vendor_name: vendorName })}
      className="rounded-xl border border-amber-500/40 px-4 py-2.5 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-950/40"
    >
                            Rate {vendorName}
                          </button>)}
                      </div>
                    </div>}

                  {order.status === "ESCROW_RELEASED" && <div className="flex items-center justify-between w-full text-emerald-400 font-semibold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Payment complete. Funds were disbursed to {order.vendor_name}.</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Released: {order.escrow_released_at ? new Date(order.escrow_released_at).toLocaleDateString() : "Settled"}
                      </span>
                    </div>}
                </div>
              </div>;
  })}
      </div>
      {reviewingOrder && <VendorRatingModal
    order={reviewingOrder}
    vendorId={reviewingOrder.vendor_id}
    vendorName={reviewingOrder.vendor_name}
    token={token}
    onClose={() => setReviewingOrder(null)}
    onSubmitted={(message) => {
      setReviewingOrder(null);
      setFeedback(message);
    }}
  />}
    </div>;
};
