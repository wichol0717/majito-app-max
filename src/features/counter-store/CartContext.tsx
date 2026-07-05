import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Database } from "@/api/database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"];

export interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  isGift: boolean;
  giftMessage?: string;
  giftDetails?: GiftDetails;
  cakeMessage?: string;
}

export interface GiftDetails {
  buyerName: string;
  buyerWhatsapp: string;
  recipientName: string;
  recipientWhatsapp: string;
  recipientLocation: string;
}

interface CartCtx {
  items: CartItem[];
  addToCart: (p: Product, qty?: number) => void;
  addGift: (p: Product, qty: number, message: string, details: GiftDetails) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  setCakeMessage: (key: string, message: string) => void;
  quantityOf: (productId: number) => number;
  totalItems: number;
  subtotal: number;
  hasAnyGift: boolean;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((p: Product, qty = 1) => {
    setItems((prev) => {
      const currentSameProduct = prev
        .filter((i) => i.product.id === p.id)
        .reduce((s, i) => s + i.quantity, 0);
      const room = Math.max(0, p.stock - currentSameProduct);
      const add = Math.min(qty, room);
      if (add <= 0) return prev;
      const existing = prev.find((i) => i.product.id === p.id && !i.isGift);
      if (existing) {
        return prev.map((i) =>
          i.key === existing.key ? { ...i, quantity: i.quantity + add } : i,
        );
      }
      return [
        ...prev,
        { key: `p-${p.id}-${Date.now()}`, product: p, quantity: add, isGift: false },
      ];
    });
  }, []);

  const addGift = useCallback((p: Product, qty: number, message: string, details: GiftDetails) => {
    setItems((prev) => {
      const currentSameProduct = prev
        .filter((i) => i.product.id === p.id)
        .reduce((s, i) => s + i.quantity, 0);
      const room = Math.max(0, p.stock - currentSameProduct);
      const add = Math.min(qty, room);
      if (add <= 0) return prev;
      return [
        ...prev,
        {
          key: `g-${p.id}-${Date.now()}`,
          product: p,
          quantity: add,
          isGift: true,
          giftMessage: message,
          giftDetails: details,
        },
      ];
    });
  }, []);

  const increment = useCallback((key: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.key === key);
      if (!target) return prev;
      const totalForProduct = prev
        .filter((i) => i.product.id === target.product.id)
        .reduce((s, i) => s + i.quantity, 0);
      if (totalForProduct >= target.product.stock) return prev;
      return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
    });
  }, []);

  const decrement = useCallback((key: string) => {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const setCakeMessage = useCallback((key: string, message: string) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, cakeMessage: message } : i)));
  }, []);

  const value = useMemo<CartCtx>(() => {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.quantity * Number(i.product.precio), 0);
    const hasAnyGift = items.some((i) => i.isGift);
    const quantityOf = (productId: number) =>
      items.filter((i) => i.product.id === productId).reduce((s, i) => s + i.quantity, 0);
    return {
      items,
      addToCart,
      addGift,
      increment,
      decrement,
      remove,
      clear,
      setCakeMessage,
      quantityOf,
      totalItems,
      subtotal,
      hasAnyGift,
    };
  }, [items, addToCart, addGift, increment, decrement, remove, clear, setCakeMessage]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}