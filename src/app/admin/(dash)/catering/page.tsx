"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Phone, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/kit";
import { Badge, Button, Field, Modal, inputCls } from "@/components/ui";

import { ENQUIRY_STATUS, cn, naira, timeAgo } from "@/lib/format";
import { useAdmin } from "@/lib/admin";
import type { CateringEnquiry, EnquiryStatus } from "@/lib/types";

const COLUMNS: EnquiryStatus[] = ["new", "contacted", "quoted", "accepted", "scheduled", "completed"];

export default function CateringAdmin() {
  const { enquiries } = useAdmin();
  const [sel, setSel] = useState<string | null>(null);
  const open = enquiries.filter((e) => !["completed", "lost"].includes(e.status));
  const pipelineValue = open.reduce((s, e) => s + (e.quoteMinor ?? e.budgetMinor ?? 0), 0);
  const current = enquiries.find((e) => e.id === sel);

  return (
    <>
      <PageHeader title="Catering pipeline" sub={`${open.length} open enquiries · ${naira(pipelineValue)} in pipeline`} />
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
        {COLUMNS.map((col) => {
          const items = enquiries.filter((e) => e.status === col);
          return (
            <div key={col} className="w-72 shrink-0">
              <div className="mb-3 flex items-center justify-between px-1">
                <Badge tone={ENQUIRY_STATUS[col].tone}>{ENQUIRY_STATUS[col].label}</Badge>
                <span className="text-xs font-semibold text-ink-400">{items.length}</span>
              </div>
              <div className="space-y-3 rounded-2xl bg-ink-100/50 p-2 min-h-40">
                {items.map((e) => (
                  <button key={e.id} onClick={() => setSel(e.id)} className="block w-full rounded-xl bg-surface p-4 text-left ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-soft">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold">{e.name}</p>
                      <span className="text-[10px] font-semibold text-ink-400">{e.ref}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">{e.eventType}</p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
                      <span className="flex items-center gap-1"><CalendarDays className="size-3" />{e.eventDate}</span>
                      <span className="flex items-center gap-1"><Users className="size-3" />{e.guests}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-sm font-bold">{e.quoteMinor ? naira(e.quoteMinor) : e.budgetMinor ? `~${naira(e.budgetMinor)}` : "—"}</span>
                      {e.assignedTo ? <span className="grid size-6 place-items-center rounded-full bg-ink-900 text-[10px] font-bold text-white" title={e.assignedTo}>{e.assignedTo[0]}</span> : <span className="text-[10px] text-ink-400">{timeAgo(e.createdAt)}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {current && <EnquiryModal e={current} onClose={() => setSel(null)} />}
    </>
  );
}

function EnquiryModal({ e, onClose }: { e: CateringEnquiry; onClose: () => void }) {
  const { updateEnquiry, team } = useAdmin();
  const [quote, setQuote] = useState(e.quoteMinor ? String(e.quoteMinor / 100) : "");
  const [deposit, setDeposit] = useState(e.depositMinor ? String(e.depositMinor / 100) : "");
  const [assigned, setAssigned] = useState(e.assignedTo ?? "");
  const idx = COLUMNS.indexOf(e.status);
  const next = idx >= 0 && idx < COLUMNS.length - 1 ? COLUMNS[idx + 1] : null;

  const saveQuote = () => {
    const q = Number(quote) * 100;
    updateEnquiry(e.id, { quoteMinor: q || undefined, depositMinor: Number(deposit) * 100 || undefined, assignedTo: assigned || undefined, status: q && ["new", "contacted"].includes(e.status) ? "quoted" : e.status }, "Quote saved");

  };

  return (
    <Modal open onClose={onClose} title={`${e.ref} · ${e.name}`} wide>
      <div className="flex flex-wrap gap-2">
        <Badge tone={ENQUIRY_STATUS[e.status].tone}>{ENQUIRY_STATUS[e.status].label}</Badge>
        <span className="text-xs text-ink-500">Received {timeAgo(e.createdAt)}</span>
      </div>
      <div className="mt-5 grid gap-4 rounded-2xl bg-ink-50 p-4 text-sm sm:grid-cols-2">
        <p className="flex items-center gap-2"><Phone className="size-4 text-ink-400" /><a href={`tel:${e.phone}`} className="font-semibold text-brand-600">{e.phone}</a></p>
        <p className="flex items-center gap-2"><CalendarDays className="size-4 text-ink-400" />{e.eventDate} · {e.eventType}</p>
        <p className="flex items-center gap-2"><MapPin className="size-4 text-ink-400" />{e.venue}</p>
        <p className="flex items-center gap-2"><Users className="size-4 text-ink-400" />{e.guests} guests · budget {e.budgetMinor ? naira(e.budgetMinor) : "not given"}</p>
        <p className="sm:col-span-2"><span className="text-xs font-semibold text-ink-400">Requested</span><br />{e.requestedItems}</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Field label="Quote total (₦)"><input type="number" className={inputCls} value={quote} onChange={(x) => setQuote(x.target.value)} /></Field>
        <Field label="Deposit (₦)"><input type="number" className={inputCls} value={deposit} onChange={(x) => setDeposit(x.target.value)} /></Field>
        <Field label="Assigned to">
          <select className={inputCls} value={assigned} onChange={(x) => setAssigned(x.target.value)}>
            <option value="">Unassigned</option>
            {team.filter((t) => t.active).map((t) => <option key={t.userId}>{t.name}</option>)}
          </select>
        </Field>
      </div>
      {Number(quote) > 0 && <p className="mt-2 text-xs text-ink-500">Balance due after deposit: <b>{naira((Number(quote) - Number(deposit || 0)) * 100)}</b></p>}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" onClick={saveQuote}>Save quote</Button>
        <Button variant="danger" onClick={() => { updateEnquiry(e.id, { status: "lost" }, "Marked as lost"); onClose(); }}>Mark lost</Button>
        {next && (
          <Button className={cn("ml-auto")} onClick={() => { updateEnquiry(e.id, { status: next }, `${e.ref} → ${ENQUIRY_STATUS[next].label}`); }}>
            Move to {ENQUIRY_STATUS[next].label}
          </Button>
        )}
      </div>
    </Modal>
  );
}
