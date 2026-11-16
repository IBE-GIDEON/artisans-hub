"use client";

import { useState } from "react";
import { Banknote, Percent, ReceiptText, XCircle } from "lucide-react";
import { Bars, Card, Meter, PageHeader, Stat } from "@/components/admin/kit";
import { dailySeries, sumPaid, topItems } from "@/lib/analytics";
import { ORDER_STATUS, cn, naira } from "@/lib/format";
import { useAdmin } from "@/lib/admin";
import type { OrderStatus } from "@/lib/types";

export default function Reports() {
  const { orders, zones, enquiries } = useAdmin();
  const [range, setRange] = useState<7 | 14>(14);
  const inRange = orders.filter((o) => Date.now() - +new Date(o.createdAt) < range * 86400_000);
  const paid = inRange.filter((o) => o.paymentStatus === "paid");
  const unpaid = inRange.filter((o) => ["unpaid", "verifying"].includes(o.paymentStatus));
  const cancelled = inRange.filter((o) => o.status === "cancelled");
  const gross = sumPaid(inRange);
  const top = topItems(inRange, 8);

  const byStatus = (Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => ({ s, n: inRange.filter((o) => o.status === s).length }));
  const byZone = zones.map((z) => {
    const os = paid.filter((o) => o.zoneId === z.id);
    return { name: z.name, n: os.length, value: sumPaid(os) };
  }).concat([{ name: "Pickup", n: paid.filter((o) => o.fulfilment === "pickup").length, value: sumPaid(paid.filter((o) => o.fulfilment === "pickup")) }]);
  const maxZone = Math.max(1, ...byZone.map((z) => z.value));


  return (
    <>
      <PageHeader
        title="Reports"
        sub="Sales, payments, fulfilment and catering at a glance."
        actions={
          <div className="flex rounded-xl bg-surface p-1 ring-1 ring-line">
            {([7, 14] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", range === r ? "bg-ink-900 text-white" : "text-ink-500")}>Last {r} days</button>
            ))}
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat accent label="Gross sales (paid)" value={naira(gross)} delta={`${paid.length} paid orders`} icon={<Banknote className="size-4" />} />
        <Stat label="Unpaid / verifying" value={naira(unpaid.reduce((s, o) => s + o.totalMinor, 0))} delta={`${unpaid.length} orders`} icon={<ReceiptText className="size-4" />} />
        <Stat label="Avg. order value" value={naira(paid.length ? gross / paid.length : 0)} delta={`${paid.length} paid orders`} icon={<Percent className="size-4" />} />
        <Stat label="Cancellations" value={String(cancelled.length)} delta={`${((cancelled.length / Math.max(1, inRange.length)) * 100).toFixed(1)}% of orders`} icon={<XCircle className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Daily sales">
          <div className="p-5 pt-10"><Bars data={dailySeries(orders, range, sumPaid)} format={naira} /></div>
        </Card>
        <Card title="Orders per day">
          <div className="p-5 pt-10"><Bars data={dailySeries(orders, range, (os) => os.length)} format={(n) => `${n} orders`} /></div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Popular items">
          <div className="space-y-4 p-5">{top.map((t) => <Meter key={t.name} label={t.name} value={t.qty} max={top[0]?.qty ?? 1} right={`${t.qty} · ${naira(t.revenue)}`} />)}</div>
        </Card>
        <Card title="Delivery zone performance">
          <div className="space-y-4 p-5">{byZone.map((z) => <Meter key={z.name} label={z.name} value={z.value} max={maxZone} right={`${z.n} · ${naira(z.value)}`} />)}</div>
        </Card>
        <div className="space-y-6">
          <Card title="Orders by status">
            <ul className="grid grid-cols-2 gap-px bg-ink-100">
              {byStatus.map(({ s, n }) => (
                <li key={s} className="bg-surface px-4 py-3"><p className="text-xs text-ink-500">{ORDER_STATUS[s].label}</p><p className="text-lg font-bold">{n}</p></li>
              ))}
            </ul>
          </Card>
          <Card title="Catering">
            <div className="grid grid-cols-2 gap-4 p-5 text-sm">
              <div><p className="text-xs text-ink-500">Open enquiries</p><p className="text-lg font-bold">{enquiries.filter((e) => !["completed", "lost"].includes(e.status)).length}</p></div>
              <div><p className="text-xs text-ink-500">Quoted value</p><p className="text-lg font-bold">{naira(enquiries.reduce((s, e) => s + (e.quoteMinor ?? 0), 0))}</p></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
