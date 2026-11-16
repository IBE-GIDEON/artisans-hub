"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, PackageSearch } from "lucide-react";
import { Button, Field, inputCls, panel } from "@/components/ui";
import { cn } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function TrackPage() {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data, error } = await supabaseBrowser().rpc("find_order", { order_ref: ref.trim(), phone: phone.replace(/\s/g, "") });
    if (error || !data) {
      setBusy(false);
      setError("We couldn't find an order with that number and phone. Check both and try again.");
      return;
    }
    router.push(`/order/${data}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><PackageSearch className="size-6" /></span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Track your order</h1>
        <p className="mt-2 text-ink-500">Enter your order number and the phone number you ordered with.</p>
      </div>
      <form onSubmit={lookup} className={cn(panel, "mx-auto mt-8 grid max-w-2xl gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end")}>
        <Field label="Order number"><input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="AH-1001" required /></Field>
        <Field label="Phone number"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080…" inputMode="tel" required /></Field>
        <Button type="submit" size="lg" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Track</Button>
      </form>
      {error && <p className="mt-3 text-center text-sm text-rose-600">{error}</p>}
    </div>
  );
}
