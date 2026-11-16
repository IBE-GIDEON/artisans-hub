"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu as MenuIcon, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Button, Empty, FoodArt, Logo, ThemeToggle } from "@/components/ui";
import { cn, naira } from "@/lib/format";
import { useShop } from "@/lib/shop";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/catering", label: "Catering" },
  { href: "/track", label: "Track order" },
  { href: "/about", label: "Help" },
];

export function ClosedBanner() {
  const { settings } = useShop();
  if (settings.acceptingOrders) return null;
  return (
    <div className="bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
      We&apos;re not taking new orders right now. Opening hours: {settings.openTime} – {settings.closeTime}.
    </div>
  );
}

export function Header() {
  const { cartCount, cartSubtotal, setCartOpen, ready } = useShop();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Artisans Hub home"><Logo /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn("rounded-lg px-3.5 py-2 text-sm font-medium transition", path.startsWith(n.href) ? "bg-raised text-fg" : "text-ink-500 hover:text-fg")}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><ThemeToggle /></div>
          <button
            onClick={() => setCartOpen(true)}
            className="flex h-9 items-center gap-2 rounded-xl bg-brand-500 px-3.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <ShoppingBag className="size-4" />
            {ready && cartCount > 0 && <span className="tabular-nums">{cartCount}</span>}
            <span className="hidden tabular-nums sm:inline">· {ready ? naira(cartSubtotal) : "₦0"}</span>
          </button>
          <button className="grid size-9 place-items-center rounded-xl ring-1 ring-line md:hidden" onClick={() => setOpen(!open)} aria-label="Open menu">
            {open ? <X className="size-4" /> : <MenuIcon className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="animate-fade-up border-t border-line px-4 py-3 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-raised">
              {n.label}
            </Link>
          ))}
          <div className="px-3 pt-2"><ThemeToggle /></div>
        </nav>
      )}
    </header>
  );
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, menu, setQty, cartSubtotal, cartCount } = useShop();
  const router = useRouter();
  if (!cartOpen) return null;
  const lines = Object.entries(cart)
    .map(([id, q]) => ({ item: menu.find((m) => m.id === id)!, q }))
    .filter((l) => l.item);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
      <aside onClick={(e) => e.stopPropagation()} className="animate-slide-in flex h-full w-full max-w-md flex-col bg-surface ring-1 ring-line" aria-label="Your cart">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">Your order</h2>
            <p className="text-xs text-ink-500">{cartCount} item{cartCount === 1 ? "" : "s"}</p>
          </div>
          <button onClick={() => setCartOpen(false)} className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-raised hover:text-fg" aria-label="Close cart">
            <X className="size-4" />
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="flex flex-1 items-center">
            <Empty
              icon={<ShoppingBag className="size-5" />}
              title="Your cart is empty"
              body="Add something from the menu to get started."
              action={<Button onClick={() => { setCartOpen(false); router.push("/menu"); }}>Browse menu</Button>}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map(({ item, q }) => (
                <div key={item.id} className="flex gap-3 py-4">
                  <FoodArt item={item} className="size-14 shrink-0 rounded-xl" size="text-2xl" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <button onClick={() => setQty(item.id, 0)} className="text-ink-400 hover:text-rose-600" aria-label={`Remove ${item.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="text-xs text-ink-500">{naira(item.priceMinor)} each</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <Stepper value={q} onChange={(v) => setQty(item.id, v)} />
                      <p className="text-sm font-bold tabular-nums">{naira(item.priceMinor * q)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t border-line px-6 py-5">
              <div className="flex justify-between text-sm"><span className="text-ink-500">Subtotal</span><span className="font-bold tabular-nums">{naira(cartSubtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-500">Delivery</span><span className="text-ink-500">Set at checkout</span></div>
              <Button size="lg" className="w-full" onClick={() => { setCartOpen(false); router.push("/checkout"); }}>
                Checkout · {naira(cartSubtotal)}
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-lg ring-1 ring-line">
      <button type="button" onClick={() => onChange(value - 1)} className="grid size-7 place-items-center rounded-l-lg hover:bg-raised" aria-label="Decrease"><Minus className="size-3.5" /></button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="grid size-7 place-items-center rounded-r-lg hover:bg-raised" aria-label="Increase"><Plus className="size-3.5" /></button>
    </div>
  );
}

export function MobileCartBar() {
  const { cartCount, cartSubtotal, setCartOpen, ready } = useShop();
  const path = usePathname();
  if (!ready || cartCount === 0 || path === "/checkout") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 p-3 md:hidden">
      <button onClick={() => setCartOpen(true)} className="animate-fade-up flex w-full items-center justify-between rounded-xl bg-brand-500 px-5 py-3.5 text-white shadow-lift">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-6 place-items-center rounded-full bg-white/25 text-xs font-bold">{cartCount}</span> View cart
        </span>
        <span className="font-bold tabular-nums">{naira(cartSubtotal)}</span>
      </button>
    </div>
  );
}

export function Footer() {
  const { settings } = useShop();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            Affordable meals, delivered with care. Everyday meals, small chops and event catering for the FUT Minna community.
          </p>
          {settings.supportPhone && (
            <p className="mt-3 text-sm text-ink-500">
              Support: <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="font-semibold text-fg">{settings.supportPhone}</a>
            </p>
          )}
        </div>
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Order</p>
          <ul className="space-y-2 text-sm text-ink-600">
            <li><Link href="/menu" className="hover:text-fg">Full menu</Link></li>
            <li><Link href="/catering" className="hover:text-fg">Event catering</Link></li>
            <li><Link href="/track" className="hover:text-fg">Track an order</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Help</p>
          <ul className="space-y-2 text-sm text-ink-600">
            <li><Link href="/about" className="hover:text-fg">FAQ & policies</Link></li>
            <li><Link href="/about#hours" className="hover:text-fg">Hours & delivery zones</Link></li>
            <li><Link href="/admin" className="hover:text-fg">Staff login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-xs text-ink-400">© {new Date().getFullYear()} Artisans Hub · FUT Minna</div>
    </footer>
  );
}
