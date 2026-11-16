"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Bike, Download, Printer, Search, Store, X } from "lucide-react";
import { Card, PageHeader, td, th } from "@/components/admin/kit";
import { Badge, Button, inputCls } from "@/components/ui";
import { ORDER_STATUS, PAYMENT_STATUS, cn, fmtDateTime, naira, nextStatus, timeAgo } from "@/lib/format";
import { useAdmin } from "@/lib/admin";
import type { Order, OrderStatus } from "@/lib/types";

const TABS: { key: string; label: string; match: (o: Order) => boolean }[] = [
  { key: "active", label: "Active", match: (o) => ["confirmed", "preparing", "ready", "dispatched"].includes(o.status) },
  { key: "payment", label: "Awaiting payment", match: (o) => ["pending_payment", "verifying"].includes(o.status) },
  { key: "completed", label: "Completed", match: (o) => o.status === "completed" },
  { key: "cancelled", label: "Cancelled", match: (o) => o.status === "cancelled" },
  { key: "all", label: "All", match: () => true },
];

export default function OrdersPage() {
  const { orders } = useAdmin();
  const [tab, setTab] = useState("active");
  const [q, setQ] = useState("");
  const [ful, setFul] = useState<"all" | "delivery" | "pickup">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => {
    const t = TABS.find((x) => x.key === tab)!;
    const term = q.trim().toLowerCase();
    return orders.filter(
      (o) => t.match(o) && (ful === "all" || o.fulfilment === ful) && (!term || `${o.ref} ${o.customerName} ${o.phone}`.toLowerCase().includes(term)),
    );
  }, [orders, tab, q, ful]);

  const exportCsv = () => {
    const head = "ref,customer,phone,fulfilment,status,payment,total_ngn,created_at\n";
    const body = rows.map((o) => [o.ref, o.customerName, o.phone, o.fulfilment, o.status, o.paymentStatus, o.totalMinor / 100, o.createdAt].join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `orders-${tab}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const sel = orders.find((o) => o.id === selected);

  return (
    <>
      <PageHeader title="Orders" sub="Search, verify payments and move orders through the kitchen." actions={<Button variant="outline" onClick={exportCsv}><Download className="size-4" /> Export CSV</Button>} />

      <div className="no-scrollbar mb-4 flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 ring-1 ring-line sm:inline-flex">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition", tab === t.key ? "bg-raised text-fg ring-1 ring-line" : "text-ink-500 hover:text-fg")}>
            {t.label}
            <span className={cn("rounded-full px-1.5 text-[11px]", tab === t.key ? "bg-brand-500 text-white" : "bg-ink-100")}>{orders.filter(t.match).length}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by reference, name or phone" className={cn(inputCls, "h-10 pl-9")} />
          </div>
          <select value={ful} onChange={(e) => setFul(e.target.value as typeof ful)} className={cn(inputCls, "h-10 sm:w-44")}>
            <option value="all">All fulfilment</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>
        {/* Phones: tappable cards */}
        <ul className="divide-y divide-line md:hidden">
          {rows.map((o) => (
            <li key={o.id}>
              <button onClick={() => setSelected(o.id)} className="w-full px-4 py-4 text-left active:bg-raised">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{o.ref} <span className="font-normal text-ink-500">· {o.customerName}</span></p>
                  <p className="font-bold tabular-nums">{naira(o.totalMinor)}</p>
                </div>
                <p className="mt-1 truncate text-sm text-ink-500">{o.lines.map((l) => `${l.quantity}× ${l.nameSnapshot}`).join(", ")}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  <Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge>
                  {o.allergyNotes && <Badge tone="bg-rose-50 text-rose-700 ring-rose-200"><AlertTriangle className="size-3" /> Allergy</Badge>}
                  <span className="ml-auto flex items-center gap-1 text-xs text-ink-500">
                    {o.fulfilment === "delivery" ? <Bike className="size-3" /> : <Store className="size-3" />}{timeAgo(o.createdAt)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-line bg-ink-50/50">
              <tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Items</th><th className={th}>Total</th><th className={th}>Payment</th><th className={th}>Status</th><th className={th}></th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id} onClick={() => setSelected(o.id)} className="cursor-pointer transition hover:bg-brand-50/40">
                  <td className={td}>
                    <p className="font-bold">{o.ref}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-500">{o.fulfilment === "delivery" ? <Bike className="size-3" /> : <Store className="size-3" />}{timeAgo(o.createdAt)}</p>
                  </td>
                  <td className={td}><p className="font-medium">{o.customerName}</p><p className="text-xs text-ink-500">{o.phone}</p></td>
                  <td className={cn(td, "max-w-[220px]")}>
                    <p className="truncate text-ink-600">{o.lines.map((l) => `${l.quantity}× ${l.nameSnapshot}`).join(", ")}</p>
                    {o.allergyNotes && <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-rose-600"><AlertTriangle className="size-3" /> Allergy note</p>}
                  </td>
                  <td className={cn(td, "font-bold tabular-nums")}>{naira(o.totalMinor)}</td>
                  <td className={td}><Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge></td>
                  <td className={td}><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></td>
                  <td className={cn(td, "text-right text-ink-400")}><ArrowRight className="ml-auto size-4" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <p className="py-14 text-center text-sm text-ink-500">No orders match these filters.</p>}
      </Card>

      {sel && <OrderDrawer order={sel} onClose={() => setSelected(null)} />}
    </>
  );
}

const ALL_STATUSES: OrderStatus[] = ["pending_payment", "verifying", "confirmed", "preparing", "ready", "dispatched", "completed", "cancelled"];

function OrderDrawer({ order: o, onClose }: { order: Order; onClose: () => void }) {
  const { setOrderStatus, saveInternalNote, zones } = useAdmin();
  const [note, setNote] = useState(o.internalNotes ?? "");
  const next = nextStatus(o.status, o.fulfilment);
  const zone = zones.find((z) => z.id === o.zoneId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/40 backdrop-blur-sm" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="animate-slide-in flex h-full w-full max-w-lg flex-col bg-surface shadow-lift">
        <div className="flex items-start justify-between border-b border-line p-6">
          <div>
            <p className="text-xs text-ink-500">Placed {fmtDateTime(o.createdAt)}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{o.ref}</h2>
            <div className="mt-2 flex gap-2">
              <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
              <Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label} · {o.paymentMethod === "online" ? "Online" : "Transfer"}</Badge>
            </div>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-ink-50 hover:bg-ink-100" aria-label="Close"><X className="size-4" /></button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {o.status === "verifying" && (
            <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
              <p className="text-sm font-bold text-sky-900">Payment needs verification</p>
              <p className="mt-1 text-xs text-sky-800">Confirm {naira(o.totalMinor)} with reference {o.ref} has landed in the business account / gateway dashboard before confirming.</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => { setOrderStatus(o.id, "confirmed"); }}>Mark paid & confirm</Button>
                <Button size="sm" variant="outline" onClick={() => setOrderStatus(o.id, "pending_payment")}>Not received</Button>
              </div>
            </div>
          )}
          {o.allergyNotes && (
            <div className="flex gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">
              <AlertTriangle className="size-5 shrink-0" /><div><p className="font-bold">Allergy / dietary note</p><p>{o.allergyNotes}</p></div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">Items</p>
            <ul className="divide-y divide-line rounded-2xl ring-1 ring-line">
              {o.lines.map((l, i) => (
                <li key={i} className="flex justify-between px-4 py-3 text-sm"><span><b>{l.quantity}×</b> {l.nameSnapshot}</span><span className="font-semibold">{naira(l.unitPriceMinor * l.quantity)}</span></li>
              ))}
              <li className="flex justify-between bg-ink-50/60 px-4 py-2 text-sm"><span className="text-ink-500">Delivery fee</span><span>{naira(o.feeMinor)}</span></li>
              <li className="flex justify-between px-4 py-3 font-bold"><span>Total</span><span>{naira(o.totalMinor)}</span></li>
            </ul>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-ink-400">Customer</dt><dd className="font-semibold">{o.customerName}</dd></div>
            <div><dt className="text-xs text-ink-400">Phone</dt><dd className="font-semibold"><a href={`tel:${o.phone}`} className="text-brand-600 hover:underline">{o.phone}</a></dd></div>
            <div><dt className="text-xs text-ink-400">Fulfilment</dt><dd className="font-semibold capitalize">{o.fulfilment}{zone ? ` · ${zone.name}` : ""}</dd></div>
            <div><dt className="text-xs text-ink-400">Scheduled</dt><dd className="font-semibold">{o.scheduledFor} · {o.timeSlot}</dd></div>
            {o.landmark && <div className="col-span-2"><dt className="text-xs text-ink-400">Landmark</dt><dd className="font-semibold">{o.landmark}</dd></div>}
            {o.notes && <div className="col-span-2"><dt className="text-xs text-ink-400">Customer notes</dt><dd>{o.notes}</dd></div>}
          </dl>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">Set status</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUSES.filter((s) => !(o.fulfilment === "delivery" && s === "ready") && !(o.fulfilment === "pickup" && s === "dispatched")).map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderStatus(o.id, s)}
                  className={cn("rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition", o.status === s ? "bg-ink-900 text-white ring-ink-900" : "bg-surface text-ink-600 ring-ink-200 hover:ring-ink-400")}
                >
                  {ORDER_STATUS[s].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">Internal notes</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible to staff only" className={cn(inputCls, "h-20 py-2.5")} />
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { saveInternalNote(o.id, note); }}>Save note</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="ghost" onClick={() => window.print()}><Printer className="size-4" /> Receipt</Button>
          {o.status !== "cancelled" && o.status !== "completed" && (
            <Button variant="danger" onClick={() => { setOrderStatus(o.id, "cancelled"); }}>Cancel</Button>
          )}
          {next && (
            <Button className="ml-auto" onClick={() => { setOrderStatus(o.id, next); }}>
              Mark {ORDER_STATUS[next].label.toLowerCase()} <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
