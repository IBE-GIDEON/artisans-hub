"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Bike, Building2, Loader2, ShoppingBag, Store } from "lucide-react";
import { Stepper } from "@/components/shop/chrome";
import { Button, Empty, Field, FoodArt, inputCls, panel } from "@/components/ui";
import { PHONE_RE, TIME_SLOTS } from "@/lib/data";
import { cn, naira } from "@/lib/format";
import { useShop } from "@/lib/shop";
import type { Fulfilment } from "@/lib/types";

const localToday = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export default function CheckoutPage() {
  const { cart, menu, cartSubtotal, setQty, zones, settings, placeOrder, ready, notify } = useShop();
  const router = useRouter();
  const activeZones = zones.filter((z) => z.active);
  const today = localToday();

  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    fulfilment: "delivery" as Fulfilment,
    zoneId: "",
    landmark: "",
    date: today,
    slot: TIME_SLOTS[0],
    notes: "",
    allergy: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const lines = Object.entries(cart).map(([id, q]) => ({ item: menu.find((m) => m.id === id)!, q })).filter((l) => l.item);
  const zone = zones.find((z) => z.id === f.zoneId);
  const fee = f.fulfilment === "delivery" ? zone?.feeMinor ?? 0 : 0;
  const total = cartSubtotal + fee;

  if (!ready) return <div className="min-h-[60vh]" />;

  if (!lines.length)
    return (
      <div className="mx-auto max-w-xl px-4 pt-16">
        <Empty icon={<ShoppingBag className="size-5" />} title="Nothing to check out yet" body="Your cart is empty. Add a few favourites first." action={<Button href="/menu">Browse menu</Button>} />
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    const phone = f.phone.replace(/\s/g, "");
    if (f.name.trim().length < 2) err.name = "Please enter your name";
    if (!PHONE_RE.test(phone)) err.phone = "Enter a valid Nigerian number, e.g. 08012345678";
    if (f.fulfilment === "delivery" && !f.zoneId) err.zoneId = "Choose a delivery zone";
    if (f.fulfilment === "delivery" && f.landmark.trim().length < 3) err.landmark = "Add a hostel, room or landmark";
    if (!f.consent) err.consent = "Please confirm your order details";
    setErrors(err);
    if (Object.keys(err).length) return;

    setSubmitting(true);
    const res = await placeOrder({
      customerName: f.name.trim(),
      phone,
      email: f.email.trim() || undefined,
      fulfilment: f.fulfilment,
      zoneId: f.fulfilment === "delivery" ? f.zoneId : undefined,
      landmark: f.fulfilment === "delivery" ? f.landmark.trim() : undefined,
      scheduledFor: f.date,
      timeSlot: f.slot,
      notes: f.notes.trim() || undefined,
      allergyNotes: f.allergy.trim() || undefined,
    });
    if (!res.ok) {
      setSubmitting(false);
      notify(res.error, "error");
      router.refresh();
      return;
    }
    router.push(`/order/${res.data.token}`);
  };

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <button type="button" onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-fg">
        <ArrowLeft className="size-4" /> Back
      </button>
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-4">
          <Section title="Your details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name}><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Fatima Bello" autoComplete="name" /></Field>
              <Field label="Phone / WhatsApp" error={errors.phone}><input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="080…" inputMode="tel" autoComplete="tel" /></Field>
              <Field label="Email (optional)" hint="For your receipt" className="sm:col-span-2"><input className={inputCls} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
            </div>
          </Section>

          <Section title="Delivery or pickup">
            <div className="grid grid-cols-2 gap-3">
              {([["delivery", Bike, "Delivery", "To your hostel or faculty"], ["pickup", Store, "Pickup", "Collect from our kitchen"]] as const).map(([v, Icon, t, d]) => (
                <ChoiceCard key={v} active={f.fulfilment === v} onClick={() => set("fulfilment", v)} icon={<Icon className="size-[18px]" />} title={t} desc={d} />
              ))}
            </div>
            {f.fulfilment === "delivery" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Delivery zone" error={errors.zoneId}>
                  <select className={inputCls} value={f.zoneId} onChange={(e) => set("zoneId", e.target.value)}>
                    <option value="">Select your zone…</option>
                    {activeZones.map((z) => <option key={z.id} value={z.id}>{z.name} — {naira(z.feeMinor)}</option>)}
                  </select>
                </Field>
                <Field label="Hostel / room / landmark" error={errors.landmark}><input className={inputCls} value={f.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="e.g. Hall 3, Room 12" /></Field>
                {zone && <p className="text-xs text-ink-500 sm:col-span-2">Usually delivered about {zone.etaMinutes} minutes after your food is ready.</p>}
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-raised p-4 text-sm ring-1 ring-line">
                <Store className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <div><p className="font-semibold">{settings.pickupPoint}</p><p className="text-ink-500">Open {settings.openTime} – {settings.closeTime}. We&apos;ll let you know when it&apos;s ready.</p></div>
              </div>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Date"><input type="date" min={today} className={inputCls} value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
              <Field label="Time"><select className={inputCls} value={f.slot} onChange={(e) => set("slot", e.target.value)}>{TIME_SLOTS.map((s) => <option key={s}>{s}</option>)}</select></Field>
            </div>
          </Section>

          <Section title="Payment">
            <div className="flex items-start gap-3 rounded-xl bg-raised p-4 ring-1 ring-line">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Building2 className="size-[18px]" /></span>
              <div className="text-sm">
                <p className="font-semibold">Bank transfer</p>
                <p className="text-ink-500">After you place your order we&apos;ll show our account details. Your order is confirmed once we receive the transfer.</p>
              </div>
            </div>
          </Section>

          <Section title="Notes">
            <div className="grid gap-4">
              <Field label="Allergies or dietary needs" hint="Our team will confirm before preparing. Please call us about severe allergies."><input className={inputCls} value={f.allergy} onChange={(e) => set("allergy", e.target.value)} placeholder="e.g. no groundnut" /></Field>
              <Field label="Delivery instructions (optional)"><textarea className={cn(inputCls, "h-24 py-3")} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. call when you get to the gate" /></Field>
            </div>
          </Section>
        </div>

        <aside className={cn(panel, "p-6 lg:sticky lg:top-24")}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Order summary</p>
          <ul className="mt-3 divide-y divide-line">
            {lines.map(({ item, q }) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <FoodArt item={item} className="size-11 shrink-0 rounded-lg" size="text-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <div className="mt-1"><Stepper value={q} onChange={(v) => setQty(item.id, v)} /></div>
                </div>
                <p className="text-sm font-semibold tabular-nums">{naira(item.priceMinor * q)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd className="font-semibold tabular-nums">{naira(cartSubtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Delivery fee</dt>
              <dd className="font-semibold">{f.fulfilment === "pickup" ? "Free" : zone ? naira(fee) : "Select zone"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg"><dt className="font-bold">Total</dt><dd className="font-bold tabular-nums">{naira(total)}</dd></div>
          </dl>
          <label className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-ink-600">
            <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 size-4 accent-brand-500" />
            I&apos;ve checked my order, fees and contact details. I understand my order is confirmed after payment is received.
          </label>
          {errors.consent && <p className="mt-1 text-xs text-rose-600">{errors.consent}</p>}
          {!settings.acceptingOrders && (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">We&apos;re not taking new orders right now. Please check back soon.</p>
          )}
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={!settings.acceptingOrders || submitting}>
            {submitting ? <><Loader2 className="size-4 animate-spin" /> Placing order…</> : <>Place order · {naira(total)}</>}
          </Button>
        </aside>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cn(panel, "p-6")}>
      <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">{title}</p>
      {children}
    </section>
  );
}

function ChoiceCard({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("flex items-start gap-3 rounded-xl p-4 text-left ring-1 transition", active ? "bg-brand-50 ring-2 ring-brand-500" : "bg-canvas ring-line hover:ring-ink-300")}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", active ? "bg-brand-500 text-white" : "bg-raised text-ink-500")}>{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-ink-500">{desc}</span>
      </span>
    </button>
  );
}
