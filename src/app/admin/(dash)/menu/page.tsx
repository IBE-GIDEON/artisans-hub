"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Card, PageHeader, Toggle, td, th } from "@/components/admin/kit";
import { Button, Field, FoodArt, Modal, inputCls } from "@/components/ui";
import { CATEGORIES } from "@/lib/data";
import { cn, naira } from "@/lib/format";
import { useAdmin } from "@/lib/admin";
import type { Category, MenuItem } from "@/lib/types";

const EMOJIS = ["🍗", "🍛", "🍚", "🍜", "🍌", "🥟", "🍩", "🥠", "🧃", "💧", "🍱", "🥘", "🍲", "🌯", "🥤", "🍰"];
const TONES: MenuItem["tone"][] = ["orange", "yellow", "green", "brown", "red"];

const blank = (): MenuItem => ({
  id: "", name: "", category: "Rice & meals", description: "", priceMinor: 0, emoji: "🍛", tone: "orange", available: true, prepMinutes: 15, allergens: [],
});

export default function MenuAdmin() {
  const { menu, upsertMenuItem, setAvailability, deleteMenuItem } = useAdmin();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [confirmDel, setConfirmDel] = useState<MenuItem | null>(null);

  const rows = menu.filter((m) => (cat === "All" || m.category === cat) && m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Menu & pricing"
        sub={`${menu.length} items · ${menu.filter((m) => !m.available).length} sold out. Changes go live on the storefront instantly.`}
        actions={<Button onClick={() => setEditing(blank())}><Plus className="size-4" /> Add item</Button>}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" className={cn(inputCls, "h-10 pl-9")} />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className={cn(inputCls, "h-10 sm:w-48")}>
            <option>All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {/* Phones: sold-out toggle and edit within thumb reach */}
        <ul className="divide-y divide-line md:hidden">
          {rows.map((m) => (
            <li key={m.id} className={cn("flex items-center gap-3 px-4 py-3", !m.available && "opacity-70")}>
              <FoodArt item={m} className="size-12 shrink-0 rounded-xl" size="text-2xl" />
              <button onClick={() => setEditing(m)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold">{m.name}</p>
                <p className="text-xs text-ink-500">{naira(m.priceMinor)} · {m.available ? "Available" : "Sold out"}</p>
              </button>
              <Toggle label={`${m.name} availability`} checked={m.available} onChange={(v) => setAvailability(m, v)} />
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-line bg-ink-50/50">
              <tr><th className={th}>Item</th><th className={th}>Category</th><th className={th}>Price</th><th className={th}>Prep</th><th className={th}>Available</th><th className={th}></th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((m) => (
                <tr key={m.id} className={cn("transition hover:bg-ink-50/50", !m.available && "bg-ink-50/40")}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <FoodArt item={m} className="size-11 shrink-0 rounded-xl" size="text-2xl" />
                      <div className="min-w-0">
                        <p className="font-semibold">{m.name} {m.featured && <span className="ml-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">Featured</span>}</p>
                        <p className="max-w-xs truncate text-xs text-ink-500">{m.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className={cn(td, "text-ink-600")}>{m.category}</td>
                  <td className={td}><PriceCell item={m} onSave={(p) => upsertMenuItem({ ...m, priceMinor: p })} /></td>
                  <td className={cn(td, "text-ink-600")}>{m.prepMinutes ? `${m.prepMinutes} min` : "—"}</td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <Toggle label={`${m.name} availability`} checked={m.available} onChange={(v) => setAvailability(m, v)} />
                      <span className={cn("text-xs font-semibold", m.available ? "text-emerald-700" : "text-ink-400")}>{m.available ? "On" : "Sold out"}</span>
                    </div>
                  </td>
                  <td className={cn(td, "text-right")}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(m)} className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-fg" aria-label={`Edit ${m.name}`}><Pencil className="size-4" /></button>
                      <button onClick={() => setConfirmDel(m)} className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${m.name}`}><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && <ItemEditor item={editing} onClose={() => setEditing(null)} onSave={async (it) => { if (await upsertMenuItem(it)) setEditing(null); }} />}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete item?">
        <p className="text-sm text-ink-600">“{confirmDel?.name}” will be removed from the menu. Past orders keep their snapshot. Consider marking it sold out instead.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Keep it</Button>
          <Button variant="danger" onClick={() => { deleteMenuItem(confirmDel!.id); setConfirmDel(null); }}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}

function PriceCell({ item, onSave }: { item: MenuItem; onSave: (minor: number) => void }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(String(item.priceMinor / 100));
  if (!edit)
    return (
      <button onClick={() => { setV(String(item.priceMinor / 100)); setEdit(true); }} className="rounded-lg px-2 py-1 font-bold tabular-nums ring-1 ring-transparent hover:bg-surface hover:ring-ink-200" title="Click to edit">
        {naira(item.priceMinor)}
      </button>
    );
  const commit = () => { const n = Math.round(Number(v)); if (n > 0 && n * 100 !== item.priceMinor) onSave(n * 100); setEdit(false); };
  return (
    <input
      autoFocus
      type="number"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEdit(false); }}
      className={cn(inputCls, "h-8 w-24 px-2")}
    />
  );
}

function ItemEditor({ item, onClose, onSave }: { item: MenuItem; onClose: () => void; onSave: (i: MenuItem) => void }) {
  const [f, setF] = useState(item);
  const [price, setPrice] = useState(item.priceMinor ? String(item.priceMinor / 100) : "");
  const [allergens, setAllergens] = useState(item.allergens.join(", "));
  const isNew = !item.name;
  const valid = f.name.trim() && Number(price) > 0;
  return (
    <Modal open onClose={onClose} title={isNew ? "New menu item" : `Edit ${item.name}`} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave({ ...f, name: f.name.trim(), priceMinor: Math.round(Number(price)) * 100, allergens: allergens.split(",").map((s) => s.trim()).filter(Boolean) });
        }}
        className="grid gap-5 sm:grid-cols-[180px_1fr]"
      >
        <div>
          <FoodArt item={f} className="aspect-square rounded-2xl" size="text-7xl" />
          <div className="mt-3 grid grid-cols-8 gap-1 sm:grid-cols-4">
            {EMOJIS.map((e) => (
              <button type="button" key={e} onClick={() => setF({ ...f, emoji: e })} className={cn("grid aspect-square place-items-center rounded-lg text-lg", f.emoji === e ? "bg-brand-100 ring-2 ring-brand-500" : "hover:bg-ink-50")}>{e}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            {TONES.map((t) => <button type="button" key={t} onClick={() => setF({ ...f, tone: t })} className={cn(`tone-${t} size-7 rounded-full`, f.tone === t && "ring-2 ring-ink-900 ring-offset-2")} aria-label={t} />)}
          </div>
          <p className="mt-2 text-[11px] text-ink-400">Production: upload a real food photo here.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Ofada Rice & Sauce" /></Field>
          <Field label="Category"><select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Price (₦)"><input type="number" min={0} className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea className={cn(inputCls, "h-20 py-2.5")} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Prep time (min)"><input type="number" min={0} className={inputCls} value={f.prepMinutes} onChange={(e) => setF({ ...f, prepMinutes: Number(e.target.value) })} /></Field>
          <Field label="Badge (optional)"><input className={inputCls} value={f.tag ?? ""} onChange={(e) => setF({ ...f, tag: e.target.value || undefined })} placeholder="e.g. New" /></Field>
          <Field label="Allergens" hint="Comma separated" className="sm:col-span-2"><input className={inputCls} value={allergens} onChange={(e) => setAllergens(e.target.value)} placeholder="Egg, Gluten" /></Field>
          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium"><Toggle label="Available" checked={f.available} onChange={(v) => setF({ ...f, available: v })} /> Available</label>
            <label className="flex items-center gap-2 text-sm font-medium"><Toggle label="Featured" checked={!!f.featured} onChange={(v) => setF({ ...f, featured: v })} /> Featured on homepage</label>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!valid}>{isNew ? "Create item" : "Save changes"}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
