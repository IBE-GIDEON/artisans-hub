"use client";

import { use, useCallback, useEffect, useState } from "react";
import { CheckCircle2, SearchX } from "lucide-react";
import { OrderTracker } from "@/components/shop/order-tracker";
import { Button, Empty } from "@/components/ui";
import { dbError } from "@/lib/db";
import { useShop } from "@/lib/shop";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { PublicOrder } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const toPublic = (r: any): PublicOrder => ({
  ref: r.ref, token: r.token, customerName: r.customer_name, phone: r.phone, fulfilment: r.fulfilment, zoneName: r.zone_name ?? undefined,
  landmark: r.landmark ?? undefined, scheduledFor: r.scheduled_for, timeSlot: r.time_slot, subtotalMinor: r.subtotal_minor, feeMinor: r.fee_minor,
  totalMinor: r.total_minor, paymentStatus: r.payment_status, status: r.status, updatedAt: r.updated_at,
  lines: (r.lines ?? []).map((l: any) => ({ name: l.name, unitPriceMinor: l.unit_price_minor, quantity: l.quantity })),
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { notify } = useShop();
  const [order, setOrder] = useState<PublicOrder | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!UUID.test(token)) return setOrder(null);
    const { data, error } = await supabaseBrowser().rpc("get_order", { token });
    setOrder(error || !data ? null : toPublic(data));
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  if (order === undefined) return <div className="min-h-[60vh]" />;
  if (!order)
    return (
      <div className="mx-auto max-w-xl px-4 pt-16">
        <Empty icon={<SearchX className="size-5" />} title="Order not found" body="This link may be incomplete. Look it up with your order number and phone." action={<Button href="/track">Track an order</Button>} />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><CheckCircle2 className="size-6" /></span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Thanks, {order.customerName.split(" ")[0]}!</h1>
          <p className="text-sm text-ink-500">Bookmark this page to check on order <b className="text-fg">{order.ref}</b> any time.</p>
        </div>
      </div>
      <OrderTracker
        order={order}
        onTransferSent={async () => {
          const { error } = await supabaseBrowser().rpc("confirm_transfer_sent", { token });
          if (error) notify(dbError(error), "error");
          else notify("Thanks! We'll confirm once the transfer lands.");
          await load();
        }}
      />
    </div>
  );
}
