import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sednicon-cart');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('sednicon-cart', JSON.stringify(cart));
    } catch {
      // storage unavailable
    }
  }, [cart]);

  const addToCart = (iconName) => {
    if (!iconName) return;
    setCart((prev) => (prev.includes(iconName) ? prev : [...prev, iconName]));
  };

  const removeFromCart = (iconName) => {
    setCart((prev) => prev.filter((item) => item !== iconName));
  };

  const toggleCart = (iconName) => {
    if (!iconName) return;
    setCart((prev) =>
      prev.includes(iconName) ? prev.filter((item) => item !== iconName) : [...prev, iconName]
    );
  };

  const isInCart = (iconName) => cart.includes(iconName);

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart.length,
        addToCart,
        removeFromCart,
        toggleCart,
        isInCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
