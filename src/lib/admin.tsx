"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { dbError, fromMenuItem, fromSettings, toAudit, toEnquiry, toMenuItem, toOrder, toSettings, toStaff, toZone } from "./db";
import { ORDER_STATUS } from "./format";
import { supabaseBrowser } from "./supabase/client";
import { useToast } from "./toast";
import type { AuditEvent, CateringEnquiry, MenuItem, Order, OrderStatus, PaymentStatus, Settings, StaffMember, StaffRole, Zone } from "./types";

type Invite = { email: string; name: string; role: StaffRole };

type Data = {
  me: StaffMember | null;
  orders: Order[];
  enquiries: CateringEnquiry[];
  menu: MenuItem[];
  zones: Zone[];
  settings: Settings | null;
  audit: AuditEvent[];
  team: StaffMember[];
  invites: Invite[];
};

const empty: Data = { me: null, orders: [], enquiries: [], menu: [], zones: [], settings: null, audit: [], team: [], invites: [] };

function paymentFor(status: OrderStatus, current: PaymentStatus): PaymentStatus {
  if (status === "cancelled") return current === "paid" ? "refunded" : current;
  if (status === "pending_payment") return "unpaid";
  if (status === "verifying") return "verifying";
  return "paid";
}

function useAdminState() {
  const sb = supabaseBrowser();
  const { notify } = useToast();
  const [d, setD] = useState<Data>(empty);
  const [state, setState] = useState<"loading" | "ready" | "no-access">("loading");

  const loadOrders = useCallback(async () => {
    const { data } = await sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(500);
    if (data) setD((p) => ({ ...p, orders: data.map(toOrder) }));
  }, [sb]);
  const loadEnquiries = useCallback(async () => {
    const { data } = await sb.from("catering_enquiries").select("*").order("created_at", { ascending: false }).limit(300);
    if (data) setD((p) => ({ ...p, enquiries: data.map(toEnquiry) }));
  }, [sb]);
  const loadMenu = useCallback(async () => {
    const { data } = await sb.from("menu_items").select("*").order("sort").order("name");
    if (data) setD((p) => ({ ...p, menu: data.map(toMenuItem) }));
  }, [sb]);
  const loadZones = useCallback(async () => {
    const { data } = await sb.from("zones").select("*").order("sort").order("name");
    if (data) setD((p) => ({ ...p, zones: data.map(toZone) }));
  }, [sb]);
  const loadSettings = useCallback(async () => {
    const { data } = await sb.from("settings").select("*").eq("id", 1).single();
    if (data) setD((p) => ({ ...p, settings: toSettings(data) }));
  }, [sb]);
  const loadAudit = useCallback(async () => {
    const { data } = await sb.from("audit_events").select("*").order("at", { ascending: false }).limit(200);
    if (data) setD((p) => ({ ...p, audit: data.map(toAudit) }));
  }, [sb]);
  const loadTeam = useCallback(async () => {
    const [t, i] = await Promise.all([sb.from("staff").select("*").order("created_at"), sb.from("staff_invites").select("*").order("created_at")]);
    setD((p) => ({ ...p, team: (t.data ?? []).map(toStaff), invites: (i.data ?? []) as Invite[] }));
  }, [sb]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return setState("no-access");
      const { data: me } = await sb.from("staff").select("*").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      if (!me || !me.active) return setState("no-access");
      setD((p) => ({ ...p, me: toStaff(me) }));
      await Promise.all([loadOrders(), loadEnquiries(), loadMenu(), loadZones(), loadSettings(), loadAudit(), loadTeam()]);
      if (!cancelled) setState("ready");
    })();
    return () => { cancelled = true; };
  }, [sb, loadOrders, loadEnquiries, loadMenu, loadZones, loadSettings, loadAudit, loadTeam]);

  // Live updates: new orders and enquiries appear without a refresh.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (state !== "ready") return;
    const ch = sb
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (e: { eventType: string; new: unknown }) => {
        if (e.eventType === "INSERT") notify(`New order ${(e.new as { ref: string }).ref}`);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { loadOrders(); loadAudit(); }, 400);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "catering_enquiries" }, (e: { eventType: string; new: unknown }) => {
        if (e.eventType === "INSERT") notify(`New catering enquiry ${(e.new as { ref: string }).ref}`);
        loadEnquiries();
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [state, sb, notify, loadOrders, loadEnquiries, loadAudit]);

  const run = useCallback(
    async (p: PromiseLike<{ error: { message?: string } | null }>, ok?: string) => {
      const { error } = await p;
      if (error) {
        notify(dbError(error), "error");
        return false;
      }
      if (ok) notify(ok);
      loadAudit();
      return true;
    },
    [notify, loadAudit],
  );

  return useMemo(() => {
    const isOwner = d.me?.role === "owner";
    return {
      ...d,
      state,
      isOwner,
      staff: d.me ? d.me.name : null,
      notify,
      setOrderStatus: async (id: string, status: OrderStatus) => {
        const o = d.orders.find((x) => x.id === id);
        if (!o) return;
        const paymentStatus = paymentFor(status, o.paymentStatus);
        if (await run(sb.from("orders").update({ status, payment_status: paymentStatus }).eq("id", id), `${o.ref} → ${ORDER_STATUS[status].label}`))
          setD((p) => ({ ...p, orders: p.orders.map((x) => (x.id === id ? { ...x, status, paymentStatus, updatedAt: new Date().toISOString() } : x)) }));
      },
      saveInternalNote: async (id: string, note: string) => {
        if (await run(sb.from("orders").update({ internal_notes: note || null }).eq("id", id), "Note saved"))
          setD((p) => ({ ...p, orders: p.orders.map((x) => (x.id === id ? { ...x, internalNotes: note } : x)) }));
      },
      upsertMenuItem: async (item: MenuItem) => {
        const exists = d.menu.some((m) => m.id === item.id);
        const q = exists ? sb.from("menu_items").update(fromMenuItem(item)).eq("id", item.id) : sb.from("menu_items").insert(fromMenuItem(item));
        const ok = await run(q, `${item.name} saved`);
        if (ok) await loadMenu();
        return ok;
      },
      setAvailability: async (item: MenuItem, available: boolean) => {
        setD((p) => ({ ...p, menu: p.menu.map((m) => (m.id === item.id ? { ...m, available } : m)) }));
        if (!(await run(sb.from("menu_items").update({ available }).eq("id", item.id), `${item.name} ${available ? "is back on" : "marked sold out"}`))) loadMenu();
      },
      deleteMenuItem: async (id: string) => {
        if (await run(sb.from("menu_items").delete().eq("id", id), "Item deleted")) setD((p) => ({ ...p, menu: p.menu.filter((m) => m.id !== id) }));
      },
      updateEnquiry: async (id: string, patch: Partial<CateringEnquiry>, ok?: string) => {
        const row: Record<string, unknown> = {};
        if ("status" in patch) row.status = patch.status;
        if ("quoteMinor" in patch) row.quote_minor = patch.quoteMinor ?? null;
        if ("depositMinor" in patch) row.deposit_minor = patch.depositMinor ?? null;
        if ("assignedTo" in patch) row.assigned_to = patch.assignedTo ?? null;
        if (await run(sb.from("catering_enquiries").update(row).eq("id", id), ok))
          setD((p) => ({ ...p, enquiries: p.enquiries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
      },
      updateZones: async (zones: Zone[]) => {
        const removed = d.zones.filter((z) => !zones.some((n) => n.id === z.id)).map((z) => z.id);
        const rows = zones.map((z, i) => ({ name: z.name, fee_minor: z.feeMinor, eta_minutes: z.etaMinutes, active: z.active, sort: i + 1 }));
        const existing = zones.map((z, i) => ({ z, row: rows[i] })).filter(({ z }) => d.zones.some((o) => o.id === z.id));
        const added = zones.map((z, i) => ({ z, row: rows[i] })).filter(({ z }) => !d.zones.some((o) => o.id === z.id));
        let ok = true;
        if (removed.length) ok = (await run(sb.from("zones").delete().in("id", removed))) && ok;
        for (const { z, row } of existing) ok = (await run(sb.from("zones").update(row).eq("id", z.id))) && ok;
        if (added.length) ok = (await run(sb.from("zones").insert(added.map((a) => a.row)))) && ok;
        await loadZones();
        if (ok) notify("Delivery zones saved");
      },
      updateSettings: async (s: Settings) => {
        if (await run(sb.from("settings").update(fromSettings(s)).eq("id", 1), "Settings saved")) setD((p) => ({ ...p, settings: s }));
      },
      addInvite: async (inv: Invite) => {
        if (await run(sb.from("staff_invites").insert({ ...inv, email: inv.email.trim().toLowerCase() }), `Invite added for ${inv.email}`)) loadTeam();
      },
      removeInvite: async (email: string) => {
        if (await run(sb.from("staff_invites").delete().eq("email", email))) loadTeam();
      },
      updateStaff: async (userId: string, patch: { role?: StaffRole; active?: boolean }) => {
        if (await run(sb.from("staff").update(patch).eq("user_id", userId), "Team updated")) loadTeam();
      },
      signOut: async () => {
        await sb.auth.signOut();
        window.location.href = "/admin/login";
      },
    };
  }, [d, state, notify, run, sb, loadMenu, loadZones, loadTeam]);
}

type Admin = ReturnType<typeof useAdminState>;
const Ctx = createContext<Admin | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const admin = useAdminState();
  return <Ctx.Provider value={admin}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const a = useContext(Ctx);
  if (!a) throw new Error("useAdmin must be used inside AdminProvider");
  return a;
}
