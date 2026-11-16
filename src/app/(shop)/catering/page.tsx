"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardList, CupSoda, PartyPopper, Soup, UtensilsCrossed } from "lucide-react";
import { Button, Field, inputCls } from "@/components/ui";
import { cn } from "@/lib/format";
import { useShop } from "@/lib/shop";
import { PHONE_RE } from "@/lib/data";

const EVENT_TYPES = ["Birthday / hangout", "Department or club event", "Meeting / workshop", "Religious or community event", "Other"];
const GUESTS = ["10–20", "21–50", "51–100", "100+"];

export default function CateringPage() {
  const { submitEnquiry, notify } = useShop();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", eventType: EVENT_TYPES[0], eventDate: "", guests: GUESTS[1], budget: "", items: "", venue: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!f.name.trim()) err.name = "Required";
    if (!PHONE_RE.test(f.phone.replace(/\s/g, ""))) err.phone = "Enter a valid phone number";
    if (!f.eventDate) err.eventDate = "Pick a date";
    if (!f.venue.trim()) err.venue = "Required";
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    const res = await submitEnquiry({
      name: f.name.trim(),
      phone: f.phone.replace(/\s/g, ""),
      eventType: f.eventType,
      eventDate: f.eventDate,
      guests: f.guests,
      budgetMinor: f.budget ? Number(f.budget) * 100 : undefined,
      requestedItems: f.items.trim() || "Details to confirm",
      venue: f.venue.trim(),
    });
    setBusy(false);
    if (!res.ok) return notify(res.error, "error");
    setDone(res.data);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Event catering</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Make your event easier.</h1>
          <p className="mt-4 max-w-md text-ink-500">
            Birthdays, department meetings, fellowships, hangouts and workshops. Tell us what you&apos;re planning — we&apos;ll reply with a clear quote, usually within 24 hours.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: UtensilsCrossed, t: "Small chops platters", d: "Samosa, spring rolls, puff-puff, mosa." },
              { icon: Soup, t: "Meal trays & packs", d: "Rice dishes, proteins and sides by quantity." },
              { icon: CupSoda, t: "Drinks & add-ons", d: "Water, zobo, soft drinks, serving packs." },
              { icon: ClipboardList, t: "Quote first", d: "Menu, delivery, deposit and balance — agreed up front." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl bg-surface p-4 shadow-soft ring-1 ring-line">
                <x.icon className="size-5 text-brand-600" />
                <p className="mt-3 text-sm font-bold">{x.t}</p>
                <p className="mt-1 text-xs text-ink-500">{x.d}</p>
              </div>
            ))}
          </div>
          <ol className="mt-8 space-y-3 text-sm">
            {["Send your request", "We call to confirm details", "Receive an itemised quote", "Pay deposit to lock your date"].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-ink-900 text-xs font-bold text-white">{i + 1}</span>
                <span className="font-medium">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-lift ring-1 ring-line sm:p-8">
          {done ? (
            <div className="animate-fade-up flex flex-col items-center py-12 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-8" /></span>
              <h2 className="mt-5 text-2xl font-bold">Request received!</h2>
              <p className="mt-2 max-w-sm text-sm text-ink-500">
                Your reference is <b className="text-fg">{done}</b>. Our catering team will reach out on WhatsApp or phone with your quote.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => { setDone(null); setF({ ...f, items: "", eventDate: "" }); }}>New request</Button>
                <Button href="/menu"><PartyPopper className="size-4" /> Browse menu</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
              <h2 className="text-xl font-bold sm:col-span-2">Request a quote</h2>
              <Field label="Your name" error={errors.name}><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name or organisation" /></Field>
              <Field label="Phone / WhatsApp" error={errors.phone}><input className={inputCls} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="080…" inputMode="tel" /></Field>
              <Field label="Event type"><select className={inputCls} value={f.eventType} onChange={(e) => set("eventType", e.target.value)}>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Event date" error={errors.eventDate}><input type="date" className={inputCls} value={f.eventDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set("eventDate", e.target.value)} /></Field>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-[13px] font-semibold text-ink-800">Estimated guests</p>
                <div className="grid grid-cols-4 gap-2">
                  {GUESTS.map((g) => (
                    <button type="button" key={g} onClick={() => set("guests", g)} className={cn("h-11 rounded-xl text-sm font-semibold ring-1 transition", f.guests === g ? "bg-ink-900 text-white ring-ink-900" : "bg-surface ring-ink-200 hover:ring-ink-400")}>{g}</button>
                  ))}
                </div>
              </div>
              <Field label="Budget (₦, optional)"><input type="number" min={0} className={inputCls} value={f.budget} onChange={(e) => set("budget", e.target.value)} placeholder="e.g. 50000" /></Field>
              <Field label="Venue / landmark" error={errors.venue}><input className={inputCls} value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Hall, lecture theatre…" /></Field>
              <Field label="What would you like?" className="sm:col-span-2"><textarea className={cn(inputCls, "h-28 py-3")} value={f.items} onChange={(e) => set("items", e.target.value)} placeholder="e.g. 40 small chops packs, 25 jollof portions, drinks…" /></Field>
              <Button type="submit" size="lg" className="sm:col-span-2" disabled={busy}>{busy ? "Sending…" : "Send request"}</Button>
              <p className="text-center text-xs text-ink-400 sm:col-span-2">No payment now. We&apos;ll confirm availability and send a quote first.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
