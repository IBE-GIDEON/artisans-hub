"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import { FoodCard } from "@/components/shop/food-card";
import { Empty } from "@/components/ui";
import { CATEGORIES, CATEGORY_EMOJI } from "@/lib/data";
import { cn } from "@/lib/format";
import { useShop } from "@/lib/shop";
import type { Category } from "@/lib/types";

export default function MenuPage() {
  return (
    <Suspense>
      <MenuInner />
    </Suspense>
  );
}

function MenuInner() {
  const { menu } = useShop();
  const params = useSearchParams();
  const initial = params.get("c") as Category | null;
  const [cat, setCat] = useState<Category | "All">(initial && CATEGORIES.includes(initial) ? initial : "All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"popular" | "low" | "high">("popular");
  const [hideSoldOut, setHideSoldOut] = useState(false);

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = menu.filter(
      (m) =>
        (cat === "All" || m.category === cat) &&
        (!hideSoldOut || m.available) &&
        (!term || `${m.name} ${m.description} ${m.category}`.toLowerCase().includes(term)),
    );
    if (sort === "low") list.sort((a, b) => a.priceMinor - b.priceMinor);
    if (sort === "high") list.sort((a, b) => b.priceMinor - a.priceMinor);
    return list;
  }, [menu, cat, q, sort, hideSoldOut]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Today&apos;s menu</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">What are you craving?</h1>
          <p className="mt-2 text-sm text-ink-500">Delivery fees are added at checkout based on your zone.</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jollof, small chops…"
            aria-label="Search menu"
            className="h-12 w-full rounded-2xl bg-surface pl-11 pr-10 text-sm shadow-soft ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-ink-100" aria-label="Clear search">
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="sticky top-16 z-20 -mx-4 mt-8 bg-canvas/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {(["All", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                  cat === c ? "bg-ink-900 text-white" : "bg-surface text-ink-600 ring-1 ring-line hover:ring-ink-400",
                )}
              >
                {c !== "All" && <span>{CATEGORY_EMOJI[c]}</span>} {c}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort"
            className="hidden h-9 rounded-full bg-surface px-3 text-sm font-semibold ring-1 ring-line sm:block"
          >
            <option value="popular">Popular</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
        <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-ink-500">
          <input type="checkbox" checked={hideSoldOut} onChange={(e) => setHideSoldOut(e.target.checked)} className="accent-brand-500" />
          Hide sold-out items
        </label>
      </div>

      {items.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => <FoodCard key={m.id} item={m} />)}
        </div>
      ) : (
        <Empty icon={<SearchX className="size-6" />} title="Nothing matches that" body="Try another search term or category." />
      )}
    </div>
  );
}
