import React, { useState } from 'react';
import { Product } from '../types.ts';
import { useCart } from '../context/CartContext.tsx';
import { X, ShieldCheck, CheckCircle2, ShoppingBag, Plus, Minus, Truck, RefreshCw, Star } from 'lucide-react';
import { VendorProfileModal } from './VendorProfileModal.tsx';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isVendorProfileOpen, setIsVendorProfileOpen] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#18181e] border border-zinc-700/80 rounded-2xl w-full max-w-2xl text-zinc-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#131317]">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
              {product.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="aspect-square rounded-xl bg-zinc-900 overflow-hidden border border-zinc-800">
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Info */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-cinzel leading-snug">
                  {product.title}
                </h3>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400">Sold by:</span>
                  <button type="button" onClick={() => setIsVendorProfileOpen(true)} className="font-semibold text-purple-300 underline-offset-2 hover:text-purple-200 hover:underline">{product.vendor_name}</button>
                  <span className="inline-flex items-center gap-1 text-amber-300"><Star className="h-3 w-3 fill-current" /> {product.rating ? product.rating.toFixed(1) : 'New'}{product.reviews_count ? ` (${product.reviews_count})` : ''}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified CAC
                  </span>
                </div>

                <div className="pt-2 flex items-baseline gap-3">
                  <span className="text-2xl font-black font-mono text-metallic-gold">
                    ₦{product.price.toLocaleString()}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-xs text-zinc-500 line-through font-mono">
                      ₦{product.compare_at_price.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed pt-2">
                  {product.description}
                </p>
              </div>

              {/* Buyer protection guarantee */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>WebNexa Buyer Protection Guard</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Payment safely processed. The vendor is credited automatically upon verified delivery to your address.
                </p>
              </div>

              {/* Quantity and CTA */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.inventory_count, quantity + 1))}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {isVendorProfileOpen && <VendorProfileModal vendorId={product.vendor_id} vendorName={product.vendor_name} onClose={() => setIsVendorProfileOpen(false)} />}
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full py-3 px-4 rounded-xl cta-gradient text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart (₦{(product.price * quantity).toLocaleString()})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
