"use client";

import { ChevronDown, Clock, MapPin, Phone } from "lucide-react";
import { naira } from "@/lib/format";
import { useShop } from "@/lib/shop";

const FAQ = [
  ["When is my order confirmed?", "Once we receive your bank transfer. Our team checks every transfer against our bank records, then confirms your order."],
  ["What's the ordering cut-off?", "We take orders until 30 minutes before closing. Scheduled orders can be placed for later the same day or the next day."],
  ["Can I cancel?", "You can cancel free of charge before your order moves to “Preparing”. After that, contact us and we'll do our best. Refunds go back to the original payment method."],
  ["Do you handle allergies?", "Add allergy notes at checkout and our team will confirm what's possible. Our kitchen handles gluten, egg and groundnut, so we can't promise an allergen-free environment."],
  ["What if I'm not available at delivery?", "Our rider will call you. If we can't reach you after 10 minutes, the order returns to the pickup point and a re-delivery fee may apply."],
  ["Is my payment information safe?", "We only accept bank transfers to the account shown on your order page. We will never ask for your card PIN, OTP or banking password."],
];

export default function AboutPage() {
  const { zones, settings } = useShop();
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Help centre</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Everything you need to know</h1>

      <div id="hours" className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-line">
          <Clock className="size-5 text-brand-600" />
          <p className="mt-3 font-bold">Opening hours</p>
          <p className="text-sm text-ink-500">Every day, {settings.openTime} – {settings.closeTime}</p>
        </div>
        <div className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-line">
          <MapPin className="size-5 text-brand-600" />
          <p className="mt-3 font-bold">Pickup point</p>
          <p className="text-sm text-ink-500">{settings.pickupPoint}</p>
        </div>
        <div className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-line">
          <Phone className="size-5 text-brand-600" />
          <p className="mt-3 font-bold">Support</p>
          <p className="text-sm text-ink-500">{settings.supportPhone || "Phone and WhatsApp coming soon"}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-line">
        <p className="font-bold">Delivery zones & fees</p>
        <div className="mt-4 divide-y divide-line">
          {zones.map((z) => (
            <div key={z.id} className="flex items-center justify-between py-3 text-sm">
              <span className={z.active ? "" : "text-ink-400 line-through"}>{z.name}</span>
              <span className="flex items-center gap-4">
                <span className="text-ink-500">~{z.etaMinutes} min</span>
                <span className="w-16 text-right font-bold">{z.active ? naira(z.feeMinor) : "Paused"}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-14 text-2xl font-bold tracking-tight">Frequently asked questions</h2>
      <div className="mt-5 space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-line open:ring-brand-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {q}
              <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
