"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Phone, XCircle } from "lucide-react";
import { Badge, Button, panel } from "@/components/ui";
import { ORDER_STATUS, PAYMENT_STATUS, cn, fmtDateTime, naira, trackingSteps } from "@/lib/format";
import { useShop } from "@/lib/shop";
import type { PublicOrder } from "@/lib/types";

export function OrderTracker({ order, onTransferSent }: { order: PublicOrder; onTransferSent: () => Promise<void> }) {
  const { settings, notify } = useShop();
  const [sending, setSending] = useState(false);
  const steps = trackingSteps(order.fulfilment);
  const effective = order.status === "verifying" ? "pending_payment" : order.status;
  const current = steps.indexOf(effective);
  const cancelled = order.status === "cancelled";
  const hasBank = settings.accountNumber && settings.bankName;

  return (
    <div className="space-y-4">
      <div className={cn(panel, "p-6 sm:p-8")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Order</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{order.ref}</p>
            <p className="mt-1 text-xs text-ink-500">Last updated {fmtDateTime(order.updatedAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
            <Badge tone={PAYMENT_STATUS[order.paymentStatus].tone}>Payment: {PAYMENT_STATUS[order.paymentStatus].label}</Badge>
          </div>
        </div>

        {cancelled ? (
          <div className="mt-8 flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 ring-1 ring-rose-200">
            <XCircle className="size-5 shrink-0" /> This order was cancelled. If you paid, we&apos;ll refund you to the account you paid from.
          </div>
        ) : (
          <ol className="mt-8 grid gap-0 sm:grid-cols-5">
            {steps.map((s, i) => {
              const done = i < current || (i === current && s === "completed");
              const active = i === current && s !== "completed";
              const label = s === "pending_payment" ? (order.status === "verifying" ? "Checking payment" : "Order received") : ORDER_STATUS[s].label;
              return (
                <li key={s} className="relative flex gap-3 pb-6 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
                  {i < steps.length - 1 && (
                    <span className={cn("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px sm:left-1/2 sm:top-[15px] sm:h-px sm:w-full", i < current ? "bg-brand-500" : "bg-line")} />
                  )}
                  <span
                    className={cn(
                      "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 ring-surface",
                      done ? "bg-brand-500 text-white" : active ? "bg-fg text-canvas" : "bg-raised text-ink-400",
                    )}
                  >
                    {done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className={cn("text-sm font-medium sm:mt-3 sm:text-xs", done || active ? "text-fg" : "text-ink-400")}>{label}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {order.status === "pending_payment" && (
        <div className={cn(panel, "p-6 ring-brand-500/40 sm:p-8")}>
          <p className="text-sm font-semibold text-brand-600">Complete your bank transfer</p>
          <p className="mt-1 text-sm text-ink-500">
            Transfer exactly <b className="text-fg">{naira(order.totalMinor)}</b> and use <b className="text-fg">{order.ref}</b> as the narration.
          </p>
          {hasBank ? (
            <dl className="mt-5 grid gap-4 rounded-xl bg-raised p-4 text-sm ring-1 ring-line sm:grid-cols-3">
              <div><dt className="text-xs text-ink-500">Bank</dt><dd className="font-semibold">{settings.bankName}</dd></div>
              <div><dt className="text-xs text-ink-500">Account name</dt><dd className="font-semibold">{settings.accountName}</dd></div>
              <div>
                <dt className="text-xs text-ink-500">Account number</dt>
                <dd className="flex items-center gap-2 font-mono font-semibold">
                  {settings.accountNumber}
                  <button onClick={() => { navigator.clipboard?.writeText(settings.accountNumber); notify("Account number copied"); }} aria-label="Copy account number">
                    <Copy className="size-3.5 text-ink-400 hover:text-fg" />
                  </button>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 rounded-xl bg-raised p-4 text-sm text-ink-600 ring-1 ring-line">Our team will send you the account details on WhatsApp shortly.</p>
          )}
          <Button className="mt-5" disabled={sending} onClick={async () => { setSending(true); await onTransferSent(); setSending(false); }}>
            {sending && <Loader2 className="size-4 animate-spin" />} I&apos;ve sent the transfer
          </Button>
          <p className="mt-3 text-xs text-ink-500">We check every transfer against our bank records before confirming your order.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn(panel, "p-6")}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Items</p>
          <ul className="mt-3 space-y-2 text-sm">
            {order.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-3"><span className="text-ink-600">{l.quantity} × {l.name}</span><span className="font-semibold tabular-nums">{naira(l.unitPriceMinor * l.quantity)}</span></li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd className="tabular-nums">{naira(order.subtotalMinor)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Delivery</dt><dd>{order.feeMinor ? naira(order.feeMinor) : "Free"}</dd></div>
            <div className="flex justify-between pt-1 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{naira(order.totalMinor)}</dd></div>
          </dl>
        </div>
        <div className={cn(panel, "p-6")}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">{order.fulfilment === "delivery" ? "Delivery" : "Pickup"}</p>
          <dl className="mt-3 space-y-3 text-sm">
            <div><dt className="text-xs text-ink-500">{order.fulfilment === "delivery" ? "Deliver to" : "Collect from"}</dt><dd className="font-semibold">{order.fulfilment === "delivery" ? `${order.landmark} · ${order.zoneName ?? ""}` : settings.pickupPoint}</dd></div>
            <div><dt className="text-xs text-ink-500">When</dt><dd className="font-semibold">{order.scheduledFor} · {order.timeSlot}</dd></div>
            <div><dt className="text-xs text-ink-500">Contact</dt><dd className="font-semibold">{order.customerName} · {order.phone}</dd></div>
          </dl>
          {settings.supportPhone && (
            <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
              <Phone className="size-4" /> Need help? Call {settings.supportPhone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
