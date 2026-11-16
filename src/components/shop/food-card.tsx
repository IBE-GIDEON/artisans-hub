"use client";

import { Clock, Plus } from "lucide-react";
import { useState } from "react";
import { Button, FoodArt, Modal } from "@/components/ui";
import { cn, naira } from "@/lib/format";
import { useShop } from "@/lib/shop";
import type { MenuItem } from "@/lib/types";
import { Stepper } from "./chrome";

export function FoodCard({ item }: { item: MenuItem }) {
  const { addToCart } = useShop();
  const [open, setOpen] = useState(false);
  return (
    <>
      <article className={cn("group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-soft ring-1 ring-line transition hover:ring-ink-300", !item.available && "opacity-70")}>
        <button onClick={() => setOpen(true)} className="relative text-left" aria-label={`View ${item.name}`}>
          <FoodArt item={item} className="aspect-[4/3] w-full" size="text-6xl sm:text-7xl" />
          {item.tag && (
            <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700 backdrop-blur">{item.tag}</span>
          )}
          {!item.available && (
            <span className="absolute inset-0 grid place-items-center bg-canvas/60 backdrop-blur-[1px]">
              <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-bold text-white">Sold out today</span>
            </span>
          )}
        </button>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="text-[15px] font-bold leading-snug">{item.name}</h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-500">{item.description}</p>
          <div className="mt-auto flex items-center justify-between pt-3">
            <div>
              <p className="text-lg font-bold tracking-tight">{naira(item.priceMinor)}</p>
              {item.prepMinutes > 0 && (
                <p className="flex items-center gap-1 text-[11px] text-ink-400"><Clock className="size-3" /> ~{item.prepMinutes} min</p>
              )}
            </div>
            <button
              disabled={!item.available}
              onClick={() => addToCart(item.id)}
              className="grid size-10 place-items-center rounded-full bg-ink-900 text-white transition hover:bg-brand-500 active:scale-90 disabled:bg-ink-200"
              aria-label={`Add ${item.name} to cart`}
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>
      </article>
      <ItemModal item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ItemModal({ item, open, onClose }: { item: MenuItem; open: boolean; onClose: () => void }) {
  const { addToCart } = useShop();
  const [qty, setQty] = useState(1);
  return (
    <Modal open={open} onClose={onClose} title={item.name}>
      <FoodArt item={item} className="-mx-6 -mt-6 mb-5 aspect-[16/9]" size="text-8xl" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{item.category}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.description}</p>
        </div>
        <p className="text-2xl font-bold">{naira(item.priceMinor)}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-ink-50 p-3">
          <p className="text-xs text-ink-500">Prep time</p>
          <p className="font-bold">{item.prepMinutes ? `~${item.prepMinutes} minutes` : "Ready to go"}</p>
        </div>
        <div className="rounded-2xl bg-ink-50 p-3">
          <p className="text-xs text-ink-500">Allergens</p>
          <p className="font-bold">{item.allergens.length ? item.allergens.join(", ") : "None declared"}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-500">Have a dietary need? Add it in checkout notes — our team will confirm before preparing.</p>
      <div className="mt-6 flex items-center gap-3">
        <Stepper value={qty} onChange={(v) => setQty(Math.max(1, v))} />
        <Button
          size="lg"
          className="flex-1"
          disabled={!item.available}
          onClick={() => { addToCart(item.id, qty); setQty(1); onClose(); }}
        >
          {item.available ? `Add ${qty} · ${naira(item.priceMinor * qty)}` : "Sold out today"}
        </Button>
      </div>
    </Modal>
  );
}
