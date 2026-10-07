import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  ArrowRight,
  Lock,
  CheckSquare,
  Square,
  ShoppingBag
} from "lucide-react";
export const CartDrawer = () => {
  const {
    items,
    selectedItems,
    removeFromCart,
    updateQuantity,
    toggleSelectItem,
    selectAllItems,
    clearCart,
    selectedTotalAmount,
    selectedTotalCount,
    isAllSelected,
    totalCount,
    isCartOpen,
    setIsCartOpen,
    cartNotice,
    dismissCartNotice
  } = useCart();
  const { role, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname.startsWith("/vendor/")) return null;
  const toast = cartNotice ? <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#18221d] px-4 py-3 text-xs font-semibold text-emerald-200 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
      <ShieldCheck className="h-4 w-4 text-emerald-400" />
      <span>{cartNotice}</span>
      <button type="button" onClick={dismissCartNotice} className="ml-2 text-emerald-400 hover:text-white" title="Dismiss notification">
        <X className="h-3.5 w-3.5" />
      </button>
    </div> : null;
  if (!isCartOpen) return toast;
  const estimatedShipping = selectedItems.length > 0 ? 2500 : 0;
  const grandTotal = selectedTotalAmount + estimatedShipping;
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;
    setIsCartOpen(false);
    if (!token || role !== "buyer") {
      navigate("/login?redirect=/checkout");
      return;
    }
    navigate("/checkout");
  };
  return <>
      {toast}
      <div className="fixed inset-0 z-50 overflow-hidden">
      {
    /* Backdrop */
  }
      <div
    className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
    onClick={() => setIsCartOpen(false)}
  />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#16161a] border-l border-zinc-800 text-zinc-100 flex flex-col shadow-2xl">
          {
    /* Header */
  }
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-100">Marketplace Cart</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                {totalCount} {totalCount === 1 ? "item" : "items"}
              </span>
            </div>
            <button
    onClick={() => setIsCartOpen(false)}
    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
  >
              <X className="w-5 h-5" />
            </button>
          </div>

          {
    /* Select All Bar (when cart has items) */
  }
          {items.length > 0 && <div className="px-5 py-2.5 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between text-xs">
              <button
    type="button"
    onClick={() => selectAllItems(!isAllSelected)}
    className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
  >
                {isAllSelected ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4 text-zinc-500" />}
                <span className="font-medium">
                  {isAllSelected ? "Deselect All" : "Select All"} ({selectedItems.length}/{items.length})
                </span>
              </button>
              <button
    type="button"
    onClick={() => setIsCartOpen(false)}
    className="text-purple-400 hover:text-purple-300 font-medium"
  >
                + Add more items
              </button>
            </div>}

          {
    /* Cart items list */
  }
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-zinc-400">
                <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-500">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-zinc-200">Your cart is empty</h3>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Browse products from verified WebNexa vendors with Buyer Protection Guard coverage.
                </p>
                <button
    onClick={() => setIsCartOpen(false)}
    className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
  >
                  Start Shopping
                </button>
              </div> : items.map(({ product, quantity, selected }) => {
    const isChecked = selected !== false;
    return <div
      key={product.id}
      className={`p-3 rounded-xl border transition-all flex gap-3 items-center ${isChecked ? "bg-zinc-900/90 border-purple-500/30 shadow-sm" : "bg-zinc-950/50 border-zinc-800/60 opacity-60"}`}
    >
                    {
      /* Item selection checkbox */
    }
                    <button
      type="button"
      onClick={() => toggleSelectItem(product.id)}
      className="p-1 text-zinc-400 hover:text-white transition-colors shrink-0"
      title={isChecked ? "Deselect item" : "Select item for checkout"}
    >
                      {isChecked ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4 text-zinc-600" />}
                    </button>

                    <img
      src={product.images[0] || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&q=80"}
      alt={product.title}
      className="w-14 h-14 rounded-lg object-cover bg-zinc-800 shrink-0"
    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 truncate">{product.title}</h4>
                      <p className="text-xs text-purple-400 font-mono font-semibold">
                        ₦{product.price.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        Vendor: <span className="text-zinc-300 font-medium">{product.vendor_name}</span>
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <button
      onClick={() => updateQuantity(product.id, quantity - 1)}
      className="p-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
    >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center">{quantity}</span>
                        <button
      onClick={() => updateQuantity(product.id, quantity + 1)}
      className="p-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
    >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button
      onClick={() => removeFromCart(product.id)}
      className="p-2 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
      title="Remove item"
    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>;
  })}
          </div>

          {
    /* Footer & Checkout button */
  }
          {items.length > 0 && <div className="p-5 border-t border-zinc-800 bg-[#121215] space-y-3.5">
              {
    /* Buyer protection information */
  }
              <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-2 text-xs text-purple-200">
                <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-semibold block text-purple-300 text-[11px]">
                    WebNexa Buyer Protection Guard
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Payment is safely processed and each vendor is credited after verified delivery.
                  </span>
                </div>
              </div>

              {
    /* Price Breakdown */
  }
              <div className="space-y-1 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Selected Items ({selectedTotalCount})</span>
                  <span className="font-mono text-zinc-200">₦{selectedTotalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Estimated Shipping</span>
                  <span className="font-mono text-zinc-300">₦{estimatedShipping.toLocaleString()}</span>
                </div>
                <div className="border-t border-zinc-800 pt-1.5 flex justify-between text-sm font-bold text-zinc-100">
                  <span>Order Total</span>
                  <span className="font-mono text-metallic-gold">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {selectedItems.length === 0 && <p className="text-[11px] text-amber-400 text-center font-medium">
                  Please select at least 1 item to proceed to checkout.
                </p>}

              <div className="flex gap-2">
                <button
    onClick={() => setIsCartOpen(false)}
    className="px-3 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
  >
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Browse More</span>
                </button>
                <button
    id="checkout-proceed-btn"
    onClick={handleProceedToCheckout}
    disabled={selectedItems.length === 0}
    className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 group transition-all ${selectedItems.length > 0 ? "cta-gradient cursor-pointer" : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"}`}
  >
                  <span>Proceed to Checkout ({selectedTotalCount} Items)</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>}
        </div>
      </div>
    </div>
    </>;
};
