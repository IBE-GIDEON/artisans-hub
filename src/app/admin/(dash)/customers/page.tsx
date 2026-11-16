"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, PageHeader, td, th } from "@/components/admin/kit";
import { inputCls } from "@/components/ui";
import { cn, fmtDate, naira } from "@/lib/format";
import { useAdmin } from "@/lib/admin";

export default function CustomersPage() {
  const { orders } = useAdmin();
  const [q, setQ] = useState("");

  const customers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; orders: number; spent: number; last: string; first: string }>();
    for (const o of orders) {
      const c = map.get(o.phone) ?? { name: o.customerName, phone: o.phone, orders: 0, spent: 0, last: o.createdAt, first: o.createdAt };
      c.orders++;
      if (o.paymentStatus === "paid") c.spent += o.totalMinor;
      if (o.createdAt > c.last) c.last = o.createdAt;
      if (o.createdAt < c.first) c.first = o.createdAt;
      map.set(o.phone, c);
    }
    return [...map.values()].sort((a, b) => b.spent - a.spent);
  }, [orders]);

  const rows = customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  const repeat = customers.filter((c) => c.orders > 1).length;

  return (
    <>
      <PageHeader title="Customers" sub={`${customers.length} customers · ${repeat} repeat (${Math.round((repeat / Math.max(1, customers.length)) * 100)}%)`} />
      <Card>
        <div className="border-b border-line p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" className={cn(inputCls, "h-10 pl-9")} />
          </div>
        </div>
        <ul className="divide-y divide-line md:hidden">
          {rows.map((c) => (
            <li key={c.phone} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <a href={`tel:${c.phone}`} className="text-xs text-brand-600">{c.phone}</a>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">{naira(c.spent)}</p>
                <p className="text-xs text-ink-500">{c.orders} order{c.orders === 1 ? "" : "s"}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-line bg-ink-50/50">
              <tr><th className={th}>Customer</th><th className={th}>Orders</th><th className={th}>Total spent</th><th className={th}>First order</th><th className={th}>Last order</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.phone} className="hover:bg-ink-50/50">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{c.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
                      <div><p className="font-semibold">{c.name}</p><p className="text-xs text-ink-500">{c.phone}</p></div>
                    </div>
                  </td>
                  <td className={td}>{c.orders} {c.orders > 2 && <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Regular</span>}</td>
                  <td className={cn(td, "font-bold tabular-nums")}>{naira(c.spent)}</td>
                  <td className={cn(td, "text-ink-600")}>{fmtDate(c.first)}</td>
                  <td className={cn(td, "text-ink-600")}>{fmtDate(c.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 text-xs text-ink-500">Privacy: production access to phone numbers and addresses should be limited by role, with defined retention rules.</p>
    </>
  );
}
