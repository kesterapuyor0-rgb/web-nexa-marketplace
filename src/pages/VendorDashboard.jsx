import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { WalletPanel } from "../components/WalletPanel.jsx";
import {
  Store,
  CheckCircle2,
  Clock,
  Plus,
  Package,
  Wallet,
  Truck,
  AlertCircle,
  X,
  Lock
} from "lucide-react";
export const VendorDashboard = () => {
  const { vendor, token, role, refreshProfiles } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    category: "Networking & Optics",
    price: "",
    inventory_count: "10",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
  });
  const [productError, setProductError] = useState(null);
  const [logoError, setLogoError] = useState(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const handleProductImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProductError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProductError("Product images must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProductForm((current) => ({ ...current, image: reader.result }));
        setProductError(null);
      }
    };
    reader.onerror = () => setProductError("Unable to read that image. Please try another file.");
    reader.readAsDataURL(file);
  };
  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setLogoError("Please choose a JPEG, PNG, WEBP, or GIF logo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Logo files must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      setLogoSaving(true);
      setLogoError(null);
      try {
        const response = await fetch("/api/vendor/branding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ store_logo_url: reader.result })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to save logo.");
        await refreshProfiles?.();
      } catch (error) {
        setLogoError(error instanceof Error ? error.message : "Unable to save logo.");
      } finally {
        setLogoSaving(false);
      }
    };
    reader.onerror = () => setLogoError("Unable to read the logo file.");
    reader.readAsDataURL(file);
  };
  const [shippingOrder, setShippingOrder] = useState(null);
  const [carrierName, setCarrierName] = useState("GIG Logistics");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isShipping, setIsShipping] = useState(false);
  useEffect(() => {
    if (role !== "vendor") {
      navigate("/vendor/login");
      return;
    }
    loadVendorData();
  }, [role, token]);
  const loadVendorData = async () => {
    setIsLoading(true);
    try {
      if (refreshProfiles) {
        await refreshProfiles();
      }
      const pRes = await fetch("/api/vendor/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData.products || []);
      }
      const oRes = await fetch("/api/orders/vendor", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(Array.isArray(oData.orders) ? oData.orders.filter((order) => order && typeof order === "object").map((order) => ({
          ...order,
          items: Array.isArray(order.items) ? order.items.filter((item) => item && typeof item === "object") : [],
          shipping_address: order.shipping_address && typeof order.shipping_address === "object" && !Array.isArray(order.shipping_address)
            ? order.shipping_address
            : {},
          vendor_payout_amount: Number(order.vendor_payout_amount) || 0
        })) : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setProductError(null);
    if (!vendor?.is_approved) {
      setProductError("Your vendor account is pending verification by The WebNexa Platform. Product listings are locked.");
      return;
    }
    try {
      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: productForm.title,
          description: productForm.description,
          category: productForm.category,
          price: Number(productForm.price),
          inventory_count: Number(productForm.inventory_count),
          images: [productForm.image]
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create product listing.");
      }
      setIsAddProductOpen(false);
      setProductForm({
        title: "",
        description: "",
        category: "Networking & Optics",
        price: "",
        inventory_count: "10",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
      });
      loadVendorData();
    } catch (err) {
      setProductError(err.message);
    }
  };
  const handleShipOrder = async (e) => {
    e.preventDefault();
    if (!shippingOrder) return;
    setIsShipping(true);
    try {
      const res = await fetch(`/api/orders/${shippingOrder.id}/ship`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          carrier_name: carrierName,
          tracking_number: trackingNumber
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update shipping status.");
      }
      setShippingOrder(null);
      setTrackingNumber("");
      loadVendorData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsShipping(false);
    }
  };
  const isApproved = vendor?.is_approved === true;
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {
    /* Top Banner / Vendor Status Card */
  }
      <div className="bg-[#18181e] border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-900 to-zinc-900 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 overflow-hidden">
              {vendor?.store_logo_url ? <img src={vendor.store_logo_url} alt={`${vendor.business_name} logo`} className="h-full w-full object-cover" /> : <Store className="w-7 h-7" />}
            </div>
            <div className="mt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-purple-500">
                {logoSaving ? "Saving logo..." : "Upload brand logo"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleLogoUpload} disabled={logoSaving} className="hidden" />
              </label>
              {logoError && <p className="mt-1 text-xs text-red-300">{logoError}</p>}
            </div>
            <WalletPanel token={token} role="vendor" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white font-cinzel">
                  {vendor?.business_name || "Vendor Hub"}
                </h1>
                {isApproved ? <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified & Authorized Merchant
                  </span> : <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Verification by The WebNexa Platform
                  </span>}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Contact: <span className="text-zinc-200">{vendor?.contact_person}</span> • Email:{" "}
                <span className="text-zinc-200">{vendor?.email}</span> • CAC/RC:{" "}
                <span className="font-mono text-purple-300">{vendor?.company_registration_no}</span>
              </p>
            </div>
          </div>

          {
    /* Action button */
  }
          <div>
            <button
    id="add-product-open-btn"
    onClick={() => {
      if (!isApproved) {
        alert(
          "Your vendor account is currently awaiting administrative compliance verification. New product listings will be enabled once approved."
        );
        return;
      }
      setIsAddProductOpen(true);
    }}
    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isApproved ? "cta-gradient text-white shadow-lg hover:opacity-90" : "bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed opacity-75"}`}
  >
              <Plus className="w-4 h-4" />
              <span>{isApproved ? "Add New Product" : "Listing Disabled (Pending Verification)"}</span>
            </button>
          </div>
        </div>

        {
    /* Clean "Account Awaiting Admin Verification" Banner */
  }
        {!isApproved && <div className="mt-6 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-300 block text-sm">
                Account Awaiting Admin Verification
              </span>
              <p className="text-zinc-300 text-xs leading-relaxed">
                Your merchant application for <strong className="text-white">{vendor?.business_name}</strong> (CAC/RC:{" "}
                <span className="font-mono text-amber-300">{vendor?.company_registration_no}</span>) is currently pending review by WebNexa Compliance Administrators.
                In accordance with marketplace compliance policy, new inventory submissions and payout disbursements will be activated immediately once your corporate registration and bank verification are finalized.
              </p>
              <div className="pt-2 text-[11px] text-zinc-400 flex flex-wrap items-center gap-4">
                <span>Compliance Support: <strong className="text-zinc-200 font-mono">+234 805 216 8776</strong></span>
                <span>•</span>
                <span>Email: <strong className="text-purple-300">compliance@webnexa.ng</strong></span>
              </div>
            </div>
          </div>}
      </div>

      {
    /* Metrics Row */
  }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#18181e] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Settled Payout Wallet</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ₦{(vendor?.wallet_balance || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Available for bank wire disbursement</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181e] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Pending Platform Settlement</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            ₦{(vendor?.escrow_pending_balance || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Held until buyer confirms fulfillment</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181e] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Catalog Items</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">{products.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Active items in marketplace search</p>
        </div>
      </div>

      {
    /* Navigation Tabs */
  }
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button
    onClick={() => setActiveTab("inventory")}
    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${activeTab === "inventory" ? "bg-purple-900/40 text-purple-200 border border-purple-500/30" : "text-zinc-400 hover:text-white"}`}
  >
          <Package className="w-4 h-4" />
          <span>Product Catalog ({products.length})</span>
        </button>

        <button
    onClick={() => setActiveTab("orders")}
    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${activeTab === "orders" ? "bg-purple-900/40 text-purple-200 border border-purple-500/30" : "text-zinc-400 hover:text-white"}`}
  >
          <Truck className="w-4 h-4" />
          <span>Fulfillment & Buyer Protection Orders ({orders.length})</span>
        </button>
      </div>

      {
    /* Tab 1: Product Inventory */
  }
      {activeTab === "inventory" && <div className="space-y-4">
          {products.length === 0 ? <div className="p-12 text-center bg-[#18181e] rounded-2xl border border-zinc-800 space-y-3">
              <Package className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-semibold text-zinc-300">No products published yet</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {isApproved ? 'Click "Add New Product" to list networking gear, high-grade hardware, or consumer systems.' : "Product listings will unlock immediately once your vendor registration is approved."}
              </p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => <div
    key={product.id}
    className="bg-[#18181e] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between"
  >
                  <div className="relative h-44 bg-zinc-900 overflow-hidden">
                    <img
    src={product.images[0]}
    alt={product.title}
    className="w-full h-full object-cover"
  />
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-emerald-400 backdrop-blur-sm">
                      {product.inventory_count} in stock
                    </span>
                    <span className="absolute bottom-3 left-3 text-[10px] px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 backdrop-blur-sm">
                      {product.category}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-100 line-clamp-1">
                        {product.title}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-base font-bold font-mono text-metallic-gold">
                        ₦{product.price.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Active on WebNexa
                      </span>
                    </div>
                  </div>
                </div>)}
            </div>}
        </div>}

      {
    /* Tab 2: Orders & Buyer Protection Fulfillment */
  }
      {activeTab === "orders" && <div className="space-y-4">
          {orders.length === 0 ? <div className="p-12 text-center bg-[#18181e] rounded-2xl border border-zinc-800 space-y-2">
              <Truck className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-semibold text-zinc-300">No customer orders yet</h3>
              <p className="text-xs text-zinc-500">
                When a buyer completes checkout, payment is verified by Platform-Managed Secure Settlement and the order appears here for dispatch.
              </p>
            </div> : <div className="space-y-4">
              {orders.map((order) => <div
    key={order.id}
    className="p-5 rounded-2xl bg-[#18181e] border border-zinc-800 space-y-4"
  >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {order.order_number}
                        </span>
                        <span
    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${order.status === "HELD_IN_ESCROW" ? "bg-purple-900/50 text-purple-300 border border-purple-500/30" : order.status === "SHIPPED" ? "bg-blue-900/50 text-blue-300 border border-blue-500/30" : order.status === "DELIVERED" ? "bg-amber-900/50 text-amber-300 border border-amber-500/30" : "bg-emerald-900/50 text-emerald-300 border border-emerald-500/30"}`}
  >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Buyer: <span className="text-zinc-200">{order.buyer_name}</span> • Placed:{" "}
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-zinc-400">Vendor Net Settlement</div>
                      <div className="text-lg font-bold font-mono text-metallic-gold">
                        ₦{(() => {
    const vItems = order.items.filter((it) => it.vendor_id === vendor?.id);
    if (vItems.length > 0 && order.items.some((it) => it.vendor_id && it.vendor_id !== vendor?.id)) {
      const sub = vItems.reduce((s, it) => s + it.subtotal, 0);
      return Math.round(sub * 0.98).toLocaleString();
    }
    return order.vendor_payout_amount.toLocaleString();
  })()}
                      </div>
                    </div>
                  </div>

                  {
    /* Order items */
  }
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block mb-1">Your Fulfillable Items:</span>
                      {(order.items.filter((it) => !it.vendor_id || it.vendor_id === vendor?.id).length > 0 ? order.items.filter((it) => !it.vendor_id || it.vendor_id === vendor?.id) : order.items).map((it) => <div key={it.id} className="text-zinc-300">
                          {it.quantity}x {it.title} (₦{it.price.toLocaleString()})
                        </div>)}
                    </div>

                    <div>
                      <span className="text-zinc-500 block mb-1">Shipping Destination:</span>
                      <p className="text-zinc-300">
                        {order.shipping_address.recipient_name} ({order.shipping_address.phone})
                      </p>
                      <p className="text-zinc-400 text-[11px]">
                        {order.shipping_address.address_line1}, {order.shipping_address.city},{" "}
                        {order.shipping_address.state}
                      </p>
                    </div>
                  </div>

                  {
    /* Payment status explanation & action */
  }
                  <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    {order.status === "HELD_IN_ESCROW" && <>
                        <div className="flex items-center gap-2 text-purple-300">
                          <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>
                            Paystack verified payment. Payment is held securely by the platform. Please dispatch
                            package.
                          </span>
                        </div>
                        <button
    onClick={() => setShippingOrder(order)}
    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
  >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Mark as Shipped</span>
                        </button>
                      </>}

                    {order.status === "SHIPPED" && <div className="flex items-center justify-between w-full">
                        <div className="text-zinc-400">
                          Carrier: <span className="text-zinc-200 font-semibold">{order.carrier_name}</span> •
                          Tracking: <span className="text-purple-300 font-mono">{order.tracking_number}</span>
                        </div>
                        <span className="text-amber-400 text-[11px] font-medium">
                          Awaiting buyer delivery confirmation
                        </span>
                      </div>}

                    {order.status === "DELIVERED" && <div className="flex items-center justify-between w-full">
                        <span className="text-emerald-400 font-medium">
                          Buyer verified delivery! Payout is settled automatically to your wallet.
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Delivered: {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : "Confirmed"}
                        </span>
                      </div>}

                    {order.status === "ESCROW_RELEASED" && <div className="flex items-center justify-between w-full text-emerald-400">
                        <span className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Payout Released - Credited to Wallet
                        </span>
                        <span className="font-mono font-bold text-white">
                          +₦{order.vendor_payout_amount.toLocaleString()}
                        </span>
                      </div>}
                  </div>
                </div>)}
            </div>}
        </div>}

      {
    /* Add Product Modal */
  }
      {isAddProductOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181e] border border-zinc-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white font-cinzel">Add Catalog Product</h3>
              <button
    onClick={() => setIsAddProductOpen(false)}
    className="text-zinc-400 hover:text-white"
  >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productError && <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                {productError}
              </div>}

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Product Title *</label>
                <input
    type="text"
    required
    value={productForm.title}
    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
    placeholder="e.g. Cisco Catalyst 9300 48-Port Switch"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Price in NGN (₦) *</label>
                  <input
    type="number"
    required
    value={productForm.price}
    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
    placeholder="250000"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500 font-mono"
  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Inventory Stock *</label>
                  <input
    type="number"
    required
    value={productForm.inventory_count}
    onChange={(e) => setProductForm({ ...productForm, inventory_count: e.target.value })}
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500 font-mono"
  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Category *</label>
                <select
    value={productForm.category}
    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  >
                  <option value="Networking & Optics">Networking & Optics</option>
                  <option value="Solar & Power Solutions">Solar & Power Solutions</option>
                  <option value="Servers & Cloud Infrastructure">Servers & Cloud Infrastructure</option>
                  <option value="Industrial Automation">Industrial Automation</option>
                  <option value="Computing & Workstations">Computing & Workstations</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Product Image</label>
                <input
    type="file"
    accept="image/jpeg,image/png,image/webp,image/gif"
    onChange={handleProductImageChange}
    className="w-full mb-2 text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-purple-500"
  />
                <p className="mb-2 text-[11px] text-zinc-500">Upload JPG, PNG, WEBP, or GIF (maximum 5 MB), or use an image URL.</p>
                <input
    type="url"
    aria-label="Product image URL"
    value={productForm.image}
    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
    placeholder="https://example.com/product-image.jpg"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  />
                {productForm.image && <img src={productForm.image} alt="Product preview" className="mt-3 h-28 w-full rounded-lg object-cover border border-zinc-700" />}
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Full Technical Description *</label>
                <textarea
    rows={3}
    required
    value={productForm.description}
    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
    placeholder="Include manufacturer part numbers, warranty period, specs..."
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  />
              </div>

              <button
    type="submit"
    className="w-full py-2.5 rounded-xl cta-gradient text-white font-bold text-xs shadow-lg hover:opacity-90"
  >
                Publish to WebNexa Catalog
              </button>
            </form>
          </div>
        </div>}

      {
    /* Ship Order Modal */
  }
      {shippingOrder && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181e] border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white font-cinzel">
                Dispatch Order {shippingOrder.order_number}
              </h3>
              <button
    onClick={() => setShippingOrder(null)}
    className="text-zinc-400 hover:text-white"
  >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleShipOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Logistics / Courier Carrier *</label>
                <select
    value={carrierName}
    onChange={(e) => setCarrierName(e.target.value)}
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
  >
                  <option value="GIG Logistics">GIG Logistics</option>
                  <option value="DHL Express Nigeria">DHL Express Nigeria</option>
                  <option value="FedEx / Red Star">FedEx / Red Star</option>
                  <option value="Kwik Delivery">Kwik Delivery</option>
                  <option value="Dedicated Direct Courier">Dedicated Direct Courier</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Waybill / Tracking Number *</label>
                <input
    type="text"
    required
    value={trackingNumber}
    onChange={(e) => setTrackingNumber(e.target.value)}
    placeholder="e.g. GIG-LOS-90281"
    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-purple-500 font-mono"
  />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-purple-300">
                Buyer will receive an automated delivery notification with this waybill number. Once
                the buyer receives and confirms the package, the payout will be credited automatically.
              </div>

              <button
    type="submit"
    disabled={isShipping}
    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-colors"
  >
                {isShipping ? "Updating Shipment..." : "Confirm Shipment Dispatch"}
              </button>
            </form>
          </div>
        </div>}
    </div>;
};
