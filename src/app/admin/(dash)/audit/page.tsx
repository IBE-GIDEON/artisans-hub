"use client";

import { History } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/kit";
import { Empty } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { useAdmin } from "@/lib/admin";

export default function AuditPage() {
  const { audit } = useAdmin();
  return (
    <>
      <PageHeader title="Audit log" sub="Every price, status, payment and settings change — who did it and when." />
      <Card>
        {audit.length ? (
          <ol className="relative p-6">
            <span className="absolute bottom-6 left-[39px] top-6 w-px bg-ink-100" />
            {[...audit].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100).map((a) => (
              <li key={a.id} className="relative flex gap-4 pb-6 last:pb-0">
                <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-surface text-xs font-bold ring-1 ring-ink-200">{a.actor[0]}</span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm"><b>{a.actor}</b> <span className="text-ink-600">{a.action.toLowerCase()}</span> <b>{a.entity}</b></p>
                  {a.detail && <p className="mt-0.5 font-mono text-xs text-ink-500">{a.detail}</p>}
                </div>
                <time className="shrink-0 pt-1 text-xs text-ink-400">{fmtDateTime(a.at)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <Empty icon={<History className="size-6" />} title="No activity yet" />
        )}
      </Card>
    </>
  );
}
