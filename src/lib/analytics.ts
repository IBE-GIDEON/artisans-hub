import type { Order } from "./types";

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export const isRevenue = (o: Order) => o.paymentStatus === "paid";

export function dailySeries(orders: Order[], days: number, metric: (os: Order[]) => number) {
  const out: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    const key = dayKey(d);
    const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === key);
    out.push({ label: i === 0 ? "Today" : d.toLocaleDateString("en-NG", { weekday: "short" }), value: metric(dayOrders) });
  }
  return out;
}

export const sumPaid = (os: Order[]) => os.filter(isRevenue).reduce((s, o) => s + o.totalMinor, 0);

export function topItems(orders: Order[], n = 5) {
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const l of o.lines) {
      const e = map.get(l.itemId) ?? { name: l.nameSnapshot, qty: 0, revenue: 0 };
      e.qty += l.quantity;
      e.revenue += l.quantity * l.unitPriceMinor;
      map.set(l.itemId, e);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, n);
}

export function isToday(iso: string) {
  return iso.slice(0, 10) === dayKey(new Date());
}
