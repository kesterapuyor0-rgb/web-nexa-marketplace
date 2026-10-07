import { createContext, useContext, useState, useEffect, useRef } from "react";
const CartContext = createContext(void 0);
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("webnexa_cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map((item) => ({ ...item, selected: item.selected !== false })) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState(null);
  const cartNoticeTimer = useRef(null);
  useEffect(() => {
    return () => {
      if (cartNoticeTimer.current !== null) window.clearTimeout(cartNoticeTimer.current);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("webnexa_cart", JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);
  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        next[existingIndex].selected = true;
        return next;
      }
      return [...prev, { product, quantity, selected: true }];
    });
    setCartNotice("Item added to cart");
    if (cartNoticeTimer.current !== null) window.clearTimeout(cartNoticeTimer.current);
    cartNoticeTimer.current = window.setTimeout(() => setCartNotice(null), 2200);
  };
  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(
      (prev) => prev.map((item) => item.product.id === productId ? { ...item, quantity } : item)
    );
  };
  const toggleSelectItem = (productId) => {
    setItems(
      (prev) => prev.map(
        (item) => item.product.id === productId ? { ...item, selected: !(item.selected !== false) } : item
      )
    );
  };
  const selectAllItems = (selected) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected })));
  };
  const clearCart = () => {
    setItems([]);
  };
  const clearSelectedItems = () => {
    setItems((prev) => prev.filter((i) => i.selected === false));
  };
  const selectedItems = items.filter((i) => i.selected !== false);
  const selectedTotalAmount = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const selectedTotalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isAllSelected = items.length > 0 && items.every((i) => i.selected !== false);
  return <CartContext.Provider
    value={{
      items,
      selectedItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleSelectItem,
      selectAllItems,
      clearCart,
      clearSelectedItems,
      totalAmount,
      totalCount,
      selectedTotalAmount,
      selectedTotalCount,
      isAllSelected,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      cartNotice,
      dismissCartNotice: () => setCartNotice(null)
    }}
  >
      {children}
    </CartContext.Provider>;
};
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
