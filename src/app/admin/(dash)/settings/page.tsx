"use client";

import { useState } from "react";
import { Lock, Plus, Trash2 } from "lucide-react";
import { Card, PageHeader, Toggle } from "@/components/admin/kit";
import { Badge, Button, Field, inputCls } from "@/components/ui";
import { useAdmin } from "@/lib/admin";
import { ROLE_LABEL } from "@/lib/data";
import { cn } from "@/lib/format";
import type { Settings, StaffRole, Zone } from "@/lib/types";

const ROLES = Object.keys(ROLE_LABEL) as StaffRole[];

export default function SettingsPage() {
  const { settings, isOwner } = useAdmin();
  if (!settings) return null;
  return (
    <>
      <PageHeader title="Settings" sub="Business hours, pickup, bank details, delivery zones and team." />
      {!isOwner && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-raised p-3 text-sm text-ink-500 ring-1 ring-line">
          <Lock className="size-4" /> Only the owner can change settings and the team.
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <BusinessCard initial={settings} disabled={!isOwner} />
        <ZonesCard disabled={!isOwner} />
        <TeamCard />
      </div>
    </>
  );
}

function BusinessCard({ initial, disabled }: { initial: Settings; disabled: boolean }) {
  const { updateSettings } = useAdmin();
  const [s, setS] = useState(initial);
  return (
    <Card title="Business">
      <form onSubmit={(e) => { e.preventDefault(); updateSettings(s); }} className="grid gap-4 p-5 sm:grid-cols-2">
        <fieldset disabled={disabled} className="contents">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-raised p-4 ring-1 ring-line sm:col-span-2">
            <div><p className="text-sm font-semibold">Accepting orders</p><p className="text-xs text-ink-500">Turn off to pause new orders during rush hours or closures.</p></div>
            <Toggle label="Accepting orders" checked={s.acceptingOrders} onChange={(v) => setS({ ...s, acceptingOrders: v })} />
          </div>
          <Field label="Opens"><input type="time" className={inputCls} value={s.openTime} onChange={(e) => setS({ ...s, openTime: e.target.value })} /></Field>
          <Field label="Closes"><input type="time" className={inputCls} value={s.closeTime} onChange={(e) => setS({ ...s, closeTime: e.target.value })} /></Field>
          <Field label="Pickup point" className="sm:col-span-2"><input className={inputCls} value={s.pickupPoint} onChange={(e) => setS({ ...s, pickupPoint: e.target.value })} /></Field>
          <Field label="Support phone / WhatsApp" className="sm:col-span-2"><input className={inputCls} value={s.supportPhone} onChange={(e) => setS({ ...s, supportPhone: e.target.value })} placeholder="080…" /></Field>
          <p className="pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500 sm:col-span-2">Bank transfer details</p>
          <Field label="Bank"><input className={inputCls} value={s.bankName} onChange={(e) => setS({ ...s, bankName: e.target.value })} /></Field>
          <Field label="Account number"><input className={inputCls} inputMode="numeric" value={s.accountNumber} onChange={(e) => setS({ ...s, accountNumber: e.target.value })} /></Field>
          <Field label="Account name" className="sm:col-span-2" hint="Customers see these details after placing an order."><input className={inputCls} value={s.accountName} onChange={(e) => setS({ ...s, accountName: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Button type="submit" className="w-full sm:w-auto">Save settings</Button></div>
        </fieldset>
      </form>
    </Card>
  );
}

function ZonesCard({ disabled }: { disabled: boolean }) {
  const { zones, updateZones } = useAdmin();
  const [z, setZ] = useState<(Zone & { fee: string })[]>(zones.map((x) => ({ ...x, fee: String(x.feeMinor / 100) })));
  const setZone = (id: string, patch: Partial<Zone & { fee: string }>) => setZ((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return (
    <Card
      title="Delivery zones & fees"
      action={!disabled && <Button size="sm" variant="soft" onClick={() => setZ([...z, { id: `new-${z.length}-${Date.now()}`, name: "New zone", feeMinor: 50000, fee: "500", etaMinutes: 30, active: true }])}><Plus className="size-3.5" /> Add</Button>}
    >
      <fieldset disabled={disabled} className="divide-y divide-line">
        {z.map((x) => (
          <div key={x.id} className={cn("grid grid-cols-[1fr_auto] gap-3 p-4 sm:grid-cols-[1fr_96px_88px_auto_auto] sm:items-center", !x.active && "opacity-60")}>
            <input className={cn(inputCls, "col-span-2 h-10 sm:col-span-1")} value={x.name} onChange={(e) => setZone(x.id, { name: e.target.value })} aria-label="Zone name" />
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">₦</span><input type="number" className={cn(inputCls, "h-10 pl-7")} value={x.fee} onChange={(e) => setZone(x.id, { fee: e.target.value })} aria-label="Fee" /></div>
            <div className="relative"><input type="number" className={cn(inputCls, "h-10 pr-10")} value={x.etaMinutes} onChange={(e) => setZone(x.id, { etaMinutes: Number(e.target.value) })} aria-label="ETA minutes" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">min</span></div>
            <Toggle label={`${x.name} active`} checked={x.active} onChange={(v) => setZone(x.id, { active: v })} />
            <button type="button" onClick={() => setZ(z.filter((y) => y.id !== x.id))} className="grid size-9 place-items-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove zone"><Trash2 className="size-4" /></button>
          </div>
        ))}
        {!disabled && (
          <div className="p-4">
            <Button className="w-full sm:w-auto" onClick={() => updateZones(z.map(({ fee, ...rest }) => ({ ...rest, feeMinor: Math.max(0, Math.round(Number(fee))) * 100 })))}>Save zones</Button>
          </div>
        )}
      </fieldset>
    </Card>
  );
}

function TeamCard() {
  const { team, invites, isOwner, me, addInvite, removeInvite, updateStaff } = useAdmin();
  const [inv, setInv] = useState({ email: "", name: "", role: "orders" as StaffRole });
  return (
    <Card title="Team" className="xl:col-span-2">
      <ul className="divide-y divide-line">
        {team.map((t) => (
          <li key={t.userId} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
            <span className="grid size-9 place-items-center rounded-full bg-raised text-sm font-bold ring-1 ring-line">{t.name[0]?.toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.name} {t.userId === me?.userId && <span className="text-ink-400">(you)</span>}</p>
              <p className="truncate text-xs text-ink-500">{t.email}</p>
            </div>
            {isOwner && t.userId !== me?.userId ? (
              <>
                <select className={cn(inputCls, "h-9 w-44")} value={t.role} onChange={(e) => updateStaff(t.userId, { role: e.target.value as StaffRole })} aria-label="Role">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <Toggle label={`${t.name} active`} checked={t.active} onChange={(v) => updateStaff(t.userId, { active: v })} />
              </>
            ) : (
              <Badge tone="bg-raised text-ink-600 ring-line">{ROLE_LABEL[t.role]}</Badge>
            )}
          </li>
        ))}
        {invites.map((i) => (
          <li key={i.email} className="flex items-center gap-3 px-5 py-3.5">
            <span className="grid size-9 place-items-center rounded-full border border-dashed border-ink-300 text-sm text-ink-400">?</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{i.name} <span className="font-normal text-ink-400">· invited</span></p>
              <p className="truncate text-xs text-ink-500">{i.email} · {ROLE_LABEL[i.role]}</p>
            </div>
            {isOwner && <button onClick={() => removeInvite(i.email)} className="grid size-9 place-items-center rounded-lg text-ink-400 hover:text-rose-600" aria-label="Remove invite"><Trash2 className="size-4" /></button>}
          </li>
        ))}
      </ul>
      {isOwner && (
        <form
          onSubmit={(e) => { e.preventDefault(); addInvite(inv); setInv({ email: "", name: "", role: "orders" }); }}
          className="grid gap-3 border-t border-line p-5 sm:grid-cols-[1fr_1fr_180px_auto] sm:items-end"
        >
          <Field label="Name"><input className={inputCls} required value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} /></Field>
          <Field label="Email"><input className={inputCls} type="email" required value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></Field>
          <Field label="Role">
            <select className={inputCls} value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value as StaffRole })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
          <Button type="submit" size="lg"><Plus className="size-4" /> Invite</Button>
          <p className="text-xs text-ink-500 sm:col-span-4">They then create an account at /admin/login with this email and get access automatically.</p>
        </form>
      )}
    </Card>
  );
}
