import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
export const ProductCartControl = ({ product, compact = false }) => {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;
  if (quantity === 0) {
    return <button
      type="button"
      onClick={() => addToCart(product, 1)}
      className={`${compact ? "mt-3 w-full" : "flex-1"} rounded-xl cta-gradient px-3 py-2 text-xs font-bold text-white shadow transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5`}
      title="Add to shopping cart"
    >
        <ShoppingBag className="h-3.5 w-3.5" />
        <span>{compact ? "Add to Cart" : "Add"}</span>
      </button>;
  }
  return <div className={`${compact ? "mt-3 w-full" : "flex-1"} flex h-9 items-stretch overflow-hidden rounded-xl border border-purple-500/40 bg-purple-950/30 shadow`}>
      <button
    type="button"
    onClick={() => updateQuantity(product.id, quantity - 1)}
    className="flex w-10 items-center justify-center text-purple-200 transition-colors hover:bg-purple-900/60 hover:text-white"
    aria-label={`Decrease ${product.title} quantity`}
  >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
    type="number"
    min="1"
    value={quantity}
    onChange={(event) => {
      const nextQuantity = Number(event.target.value);
      if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
        removeFromCart(product.id);
        return;
      }
      updateQuantity(product.id, Math.floor(nextQuantity));
    }}
    className="w-full min-w-0 border-x border-purple-500/30 bg-transparent text-center text-xs font-bold text-white outline-none"
    aria-label={`${product.title} quantity`}
  />
      <button
    type="button"
    onClick={() => updateQuantity(product.id, quantity + 1)}
    className="flex w-10 items-center justify-center text-purple-200 transition-colors hover:bg-purple-900/60 hover:text-white"
    aria-label={`Increase ${product.title} quantity`}
  >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>;
};
