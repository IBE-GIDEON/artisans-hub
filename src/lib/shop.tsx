"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dbError } from "./db";
import { supabaseBrowser } from "./supabase/client";
import { useToast } from "./toast";
import type { CartState, Catalog, Fulfilment } from "./types";

const CART_KEY = "artisans-hub-cart";

export type OrderInput = {
  customerName: string;
  phone: string;
  email?: string;
  fulfilment: Fulfilment;
  zoneId?: string;
  landmark?: string;
  scheduledFor: string;
  timeSlot: string;
  notes?: string;
  allergyNotes?: string;
};

export type EnquiryInput = {
  name: string;
  phone: string;
  eventType: string;
  eventDate: string;
  guests: string;
  budgetMinor?: number;
  requestedItems: string;
  venue: string;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function useShopState(catalog: Catalog) {
  const { notify } = useToast();
  const [cart, setCart] = useState<CartState>({});
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, ready]);

  // Drop cart lines for items that were removed or sold out since they were added.
  const validCart = useMemo(() => {
    const out: CartState = {};
    for (const [id, q] of Object.entries(cart)) if (catalog.menu.some((m) => m.id === id && m.available)) out[id] = q;
    return out;
  }, [cart, catalog.menu]);

  const cartCount = Object.values(validCart).reduce((a, b) => a + b, 0);
  const cartSubtotal = Object.entries(validCart).reduce((s, [id, q]) => s + (catalog.menu.find((m) => m.id === id)?.priceMinor ?? 0) * q, 0);

  return {
    ...catalog,
    ready,
    cart: validCart,
    cartOpen,
    setCartOpen,
    cartCount,
    cartSubtotal,
    notify,
    addToCart: (id: string, qty = 1) => {
      setCart((c) => ({ ...c, [id]: Math.min(50, (c[id] ?? 0) + qty) }));
      const m = catalog.menu.find((x) => x.id === id);
      if (m) notify(`${m.name} added to cart`);
    },
    setQty: (id: string, qty: number) =>
      setCart((c) => {
        const next = { ...c };
        if (qty <= 0) delete next[id];
        else next[id] = Math.min(50, qty);
        return next;
      }),
    clearCart: () => setCart({}),
    placeOrder: async (o: OrderInput): Promise<Result<{ ref: string; token: string }>> => {
      const { data, error } = await supabaseBrowser().rpc("place_order", {
        payload: {
          customer_name: o.customerName,
          phone: o.phone,
          email: o.email,
          fulfilment: o.fulfilment,
          zone_id: o.zoneId,
          landmark: o.landmark,
          scheduled_for: o.scheduledFor,
          time_slot: o.timeSlot,
          notes: o.notes,
          allergy_notes: o.allergyNotes,
          items: Object.entries(validCart).map(([menu_item_id, quantity]) => ({ menu_item_id, quantity })),
        },
      });
      if (error) return { ok: false, error: dbError(error) };
      setCart({});
      return { ok: true, data: data as { ref: string; token: string } };
    },
    submitEnquiry: async (e: EnquiryInput): Promise<Result<string>> => {
      const { data, error } = await supabaseBrowser().rpc("submit_enquiry", {
        payload: {
          name: e.name,
          phone: e.phone,
          event_type: e.eventType,
          event_date: e.eventDate,
          guests: e.guests,
          budget_minor: e.budgetMinor ?? "",
          requested_items: e.requestedItems,
          venue: e.venue,
        },
      });
      if (error) return { ok: false, error: dbError(error) };
      return { ok: true, data: data as string };
    },
  };
}

type Shop = ReturnType<typeof useShopState>;
const Ctx = createContext<Shop | null>(null);

export function ShopProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  const shop = useShopState(catalog);
  return <Ctx.Provider value={shop}>{children}</Ctx.Provider>;
}

export function useShop() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useShop must be used inside ShopProvider");
  return s;
}
