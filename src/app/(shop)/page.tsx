"use client";

import Link from "next/link";
import { ArrowRight, Bike, CalendarHeart, ChefHat, Clock, MapPin, ShieldCheck, Store, Users, Wallet } from "lucide-react";
import { FoodCard } from "@/components/shop/food-card";
import { Button, Eyebrow, FoodArt, panel } from "@/components/ui";
import { CATEGORIES, CATEGORY_EMOJI } from "@/lib/data";
import { cn, naira } from "@/lib/format";
import { useShop } from "@/lib/shop";

export default function Home() {
  const { menu, addToCart, zones, settings } = useShop();
  const featured = menu.filter((m) => m.featured && m.available).slice(0, 4);
  const combo = menu.find((m) => m.category === "Combos" && m.available);
  const activeZones = zones.filter((z) => z.active);
  const cheapest = menu.filter((m) => m.available && m.category !== "Drinks").reduce((min, m) => Math.min(min, m.priceMinor), Infinity);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="animate-fade-up">
            <Eyebrow className="text-brand-600">FUT Minna · Delivery & pickup</Eyebrow>
            <h1 className="mt-5 text-[clamp(2.4rem,5.5vw,4rem)] font-bold leading-[1.02] tracking-[-0.035em]">
              Good food.
              <br />
              <span className="text-brand-500">Student-friendly</span> prices.
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-500">
              From a quick lunch between lectures to small chops for your hangout — Nigerian favourites, delivered to your hostel or ready for pickup.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/menu" size="lg">Order now <ArrowRight className="size-4" /></Button>
              <Button href="/catering" size="lg" variant="outline">Plan an event</Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                [Number.isFinite(cheapest) ? naira(cheapest) : "—", "Meals from"],
                [`${settings.openTime}–${settings.closeTime}`, "Open daily"],
                [String(activeZones.length), "Delivery zones"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-xs text-ink-500">{l}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-3">
              {featured.slice(0, 4).map((m, i) => (
                <div key={m.id} className={cn(panel, "overflow-hidden", i % 2 === 1 && "translate-y-6")}>
                  <FoodArt item={m} className="aspect-square" size="text-6xl" />
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <p className="text-sm font-bold text-brand-600">{naira(m.priceMinor)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/menu?c=${encodeURIComponent(c)}`} className={cn(panel, "flex min-w-[160px] flex-1 items-center gap-3 p-3 transition hover:ring-ink-300")}>
              <span className="grid size-10 place-items-center rounded-lg bg-raised text-xl">{CATEGORY_EMOJI[c]}</span>
              <span>
                <span className="block text-sm font-semibold">{c}</span>
                <span className="text-xs text-ink-500">{menu.filter((m) => m.category === c).length} items</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <Eyebrow>Popular right now</Eyebrow>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Student favourites</h2>
            </div>
            <Link href="/menu" className="flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-fg">
              Full menu <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((m) => <FoodCard key={m.id} item={m} />)}
          </div>
        </section>
      )}

      {/* Combo */}
      {combo && (
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <div className={cn(panel, "flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8")}>
            <FoodArt item={combo} className="size-24 shrink-0 rounded-2xl" size="text-5xl" />
            <div className="flex-1">
              <Eyebrow className="text-brand-600">Best value</Eyebrow>
              <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">Big appetite, student budget.</h2>
              <p className="mt-1 text-sm text-ink-500">{combo.description}</p>
            </div>
            <Button size="lg" onClick={() => addToCart(combo.id)}>Add {combo.name} · {naira(combo.priceMinor)}</Button>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">From craving to collection</h2>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ChefHat, t: "Pick your food", d: "Browse by category, check prices and add to your cart." },
            { icon: MapPin, t: "Delivery or pickup", d: "Choose your campus zone and hostel landmark, or collect." },
            { icon: Wallet, t: "Pay by transfer", d: "Transfer the exact total. We confirm once it lands." },
            { icon: Bike, t: "Track your order", d: "Follow it from the kitchen to your door." },
          ].map((s, i) => (
            <li key={s.t} className={cn(panel, "p-5")}>
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><s.icon className="size-[18px]" /></span>
                <span className="text-xs font-semibold text-ink-400">0{i + 1}</span>
              </div>
              <p className="mt-4 font-semibold">{s.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Catering + info */}
      <section className="mx-auto grid max-w-6xl gap-3 px-4 pt-20 sm:px-6 lg:grid-cols-5">
        <div className={cn(panel, "p-7 sm:p-9 lg:col-span-3")}>
          <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><CalendarHeart className="size-[18px]" /></span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight">Planning an event?</h2>
          <p className="mt-2 max-w-md text-ink-500">
            Birthdays, department meetings, fellowships and workshops. Tell us what you need and we&apos;ll send a clear quote — menu, quantities, delivery and deposit.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-ink-600">
            {["Small chops platters", "Meal trays", "Drinks & add-ons", "10 – 200+ guests"].map((t) => (
              <span key={t} className="rounded-full bg-raised px-3 py-1.5 ring-1 ring-line">{t}</span>
            ))}
          </div>
          <Button href="/catering" className="mt-7">Request a quote <ArrowRight className="size-4" /></Button>
        </div>
        <div id="hours" className="grid gap-3 lg:col-span-2">
          <div className={cn(panel, "p-6")}>
            <div className="flex items-center gap-3">
              <Clock className="size-[18px] text-brand-600" />
              <p className="font-semibold">Open daily</p>
              <span className="ml-auto text-sm font-semibold tabular-nums">{settings.openTime} – {settings.closeTime}</span>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <Store className="mt-0.5 size-[18px] shrink-0 text-brand-600" />
              <div><p className="font-semibold">Pickup point</p><p className="text-sm text-ink-500">{settings.pickupPoint}</p></div>
            </div>
          </div>
          <div className={cn(panel, "p-6")}>
            <p className="flex items-center gap-2 font-semibold"><Bike className="size-[18px] text-brand-600" /> We deliver to</p>
            <ul className="mt-3 divide-y divide-line">
              {activeZones.map((z) => (
                <li key={z.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink-600">{z.name}</span>
                  <span className="font-semibold tabular-nums">{naira(z.feeMinor)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="grid gap-6 border-y border-line py-8 sm:grid-cols-3">
          {[
            { icon: Wallet, t: "Clear prices", d: "Every fee shown before you pay." },
            { icon: ShieldCheck, t: "Safe payments", d: "We never ask for card PINs or OTPs." },
            { icon: Users, t: "Group orders welcome", d: "One cart for the whole crew." },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-4">
              <x.icon className="size-5 shrink-0 text-ink-400" />
              <div><p className="font-semibold">{x.t}</p><p className="text-sm text-ink-500">{x.d}</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
