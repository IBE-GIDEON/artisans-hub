"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, ChefHat, ExternalLink, History, LayoutDashboard, LogOut, Menu as MenuIcon, PartyPopper, Settings, ShieldAlert, ShoppingBag, Users, X,
} from "lucide-react";
import { Button, Logo, ThemeToggle } from "@/components/ui";
import { AdminProvider, useAdmin } from "@/lib/admin";
import { ROLE_LABEL } from "@/lib/data";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "orders" },
  { href: "/admin/menu", label: "Menu & pricing", icon: ChefHat },
  { href: "/admin/catering", label: "Catering", icon: PartyPopper, badge: "catering" },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit", label: "Audit log", icon: History },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <Shell>{children}</Shell>
    </AdminProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { state, me, signOut, orders, enquiries } = useAdmin();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  if (state === "loading")
    return <div className="grid min-h-screen place-items-center"><div className="size-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  if (state === "no-access" || !me)
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-sm text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-raised text-ink-500 ring-1 ring-line"><ShieldAlert className="size-5" /></span>
          <h1 className="mt-4 text-xl font-bold">No staff access</h1>
          <p className="mt-2 text-sm text-ink-500">Your account isn&apos;t on the Artisans Hub team yet. Ask the owner to invite this email address, then sign in again.</p>
          <Button variant="outline" className="mt-6" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );

  const badges = {
    orders: orders.filter((o) => ["pending_payment", "verifying", "confirmed", "preparing"].includes(o.status)).length,
    catering: enquiries.filter((e) => e.status === "new").length,
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-between px-6">
        <Link href="/admin"><Logo /></Link>
        <button className="text-ink-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="size-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 px-3 pt-2">
        {NAV.map((n) => {
          const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
          const count = "badge" in n ? badges[n.badge] : 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition",
                active ? "bg-raised text-fg ring-1 ring-line" : "text-ink-500 hover:bg-raised/60 hover:text-fg",
              )}
            >
              <n.icon className="size-[18px]" strokeWidth={1.75} />
              {n.label}
              {count > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">{count}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 p-3">
        <Link href="/" target="_blank" className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-600 ring-1 ring-brand-500/40 transition hover:bg-brand-50">
          <ExternalLink className="size-4" /> View storefront
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-raised p-3 ring-1 ring-line">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">{me.name[0]?.toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{me.name}</p>
            <p className="truncate text-xs text-ink-500">{ROLE_LABEL[me.role]} · {me.email}</p>
          </div>
          <button onClick={signOut} className="text-ink-400 hover:text-fg" aria-label="Sign out" title="Sign out"><LogOut className="size-4" /></button>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-canvas lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="animate-fade-up h-full w-72 border-r border-line bg-canvas" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl lg:hidden">
          <button className="grid size-9 place-items-center rounded-lg ring-1 ring-line" onClick={() => setOpen(true)} aria-label="Open navigation"><MenuIcon className="size-4" /></button>
          <Logo className="text-lg" />
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-8 lg:py-12">{children}</main>
      </div>

      {/* Phone tab bar — the most-used screens one tap away */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {[...NAV.slice(0, 4), { href: "#more", label: "More", icon: MenuIcon }].map((n) => {
          const active = n.href === "/admin" ? path === "/admin" : n.href !== "#more" && path.startsWith(n.href);
          const count = "badge" in n ? badges[n.badge as keyof typeof badges] : 0;
          const inner = (
            <>
              <span className="relative">
                <n.icon className="size-5" strokeWidth={1.75} />
                {count > 0 && <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">{count}</span>}
              </span>
              <span className="text-[10px] font-semibold">{n.label === "Menu & pricing" ? "Menu" : n.label}</span>
            </>
          );
          const cls = cn("flex h-16 flex-col items-center justify-center gap-1", active ? "text-brand-600" : "text-ink-500");
          return n.href === "#more" ? (
            <button key="more" onClick={() => setOpen(true)} className={cls}>{inner}</button>
          ) : (
            <Link key={n.href} href={n.href} className={cls}>{inner}</Link>
          );
        })}
      </nav>
    </div>
  );
}
