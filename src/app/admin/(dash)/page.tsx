"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ArrowUpRight, Banknote, ChefHat, Clock, ShoppingBag, TrendingUp } from "lucide-react";
import { Bars, Card, Meter, PageHeader, Stat } from "@/components/admin/kit";
import { Badge, Button } from "@/components/ui";
import { dailySeries, isToday, sumPaid, topItems } from "@/lib/analytics";
import { ENQUIRY_STATUS, ORDER_STATUS, naira, nextStatus, timeAgo } from "@/lib/format";
import { useAdmin } from "@/lib/admin";

export default function Overview() {
  const { orders, enquiries, menu, staff, setOrderStatus } = useAdmin();
  const today = orders.filter((o) => isToday(o.createdAt));
  const paidToday = sumPaid(today);
  const queue = orders.filter((o) => ["pending_payment", "verifying", "confirmed", "preparing", "ready", "dispatched"].includes(o.status));
  const paidAll = orders.filter((o) => o.paymentStatus === "paid");
  const aov = paidAll.length ? sumPaid(paidAll) / paidAll.length : 0;
  const week = dailySeries(orders, 7, sumPaid);
  const weekTotal = week.reduce((s, d) => s + d.value, 0);
  const top = topItems(orders, 5);
  const soldOut = menu.filter((m) => !m.available);
  const pipeline = enquiries.filter((e) => !["completed", "lost"].includes(e.status));

  return (
    <>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${staff?.split(" ")[0]} 👋`}
        sub="Here's what's happening at the kitchen today."
        actions={<Button href="/admin/orders" variant="dark" size="md"><ShoppingBag className="size-4" /> Open order queue</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat accent label="Sales today (paid)" value={naira(paidToday)} delta={`${today.length} orders placed today`} icon={<Banknote className="size-4" />} />
        <Stat label="Needs action" value={String(queue.length)} delta={`${queue.filter((o) => o.status === "verifying").length} awaiting payment check`} icon={<Clock className="size-4" />} />
        <Stat label="Avg. order value" value={naira(aov)} delta="Across paid orders" icon={<TrendingUp className="size-4" />} />
        <Stat label="Last 7 days" value={naira(weekTotal)} delta={`${orders.filter((o) => Date.now() - +new Date(o.createdAt) < 7 * 86400_000).length} orders`} icon={<ArrowUpRight className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Revenue — last 7 days" className="xl:col-span-2" action={<Link href="/admin/reports" className="text-xs font-semibold text-brand-600">Reports →</Link>}>
          <div className="p-5 pt-10"><Bars data={week} format={naira} height={200} /></div>
        </Card>
        <Card title="Best sellers">
          <div className="space-y-4 p-5">
            {top.map((t) => <Meter key={t.name} label={t.name} value={t.qty} max={top[0]?.qty ?? 1} right={`${t.qty} sold`} />)}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Live order queue" className="xl:col-span-2" action={<Link href="/admin/orders" className="text-xs font-semibold text-brand-600">All orders →</Link>}>
          <ul className="divide-y divide-line">
            {queue.slice(0, 7).map((o) => {
              const next = nextStatus(o.status, o.fulfilment);
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{o.ref} <span className="font-normal text-ink-500">· {o.customerName}</span></p>
                    <p className="truncate text-xs text-ink-500">
                      {o.lines.map((l) => `${l.quantity}× ${l.nameSnapshot}`).join(", ")} · {o.fulfilment} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  <span className="w-20 text-right text-sm font-bold">{naira(o.totalMinor)}</span>
                  {next && (
                    <Button size="sm" variant="soft" onClick={() => { setOrderStatus(o.id, next); }}>
                      {ORDER_STATUS[next].label} <ArrowRight className="size-3" />
                    </Button>
                  )}
                </li>
              );
            })}
            {!queue.length && <li className="px-5 py-10 text-center text-sm text-ink-500">All caught up 🎉</li>}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card title="Catering pipeline" action={<Link href="/admin/catering" className="text-xs font-semibold text-brand-600">Open →</Link>}>
            <ul className="divide-y divide-line">
              {pipeline.slice(0, 4).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 px-5 py-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{e.name}</p><p className="text-xs text-ink-500">{e.eventDate} · {e.guests} guests</p></div>
                  <Badge tone={ENQUIRY_STATUS[e.status].tone}>{ENQUIRY_STATUS[e.status].label}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Kitchen alerts">
            <div className="space-y-2 p-5">
              {soldOut.length ? soldOut.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle className="size-4 shrink-0" /> <span className="flex-1"><b>{m.name}</b> is marked sold out</span>
                  <Link href="/admin/menu" className="text-xs font-semibold underline">Fix</Link>
                </div>
              )) : <p className="flex items-center gap-2 text-sm text-ink-500"><ChefHat className="size-4" /> Everything on the menu is available.</p>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
