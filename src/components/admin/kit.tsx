"use client";

import { cn } from "@/lib/format";

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-500">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children, title, action }: { className?: string; children: React.ReactNode; title?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("min-w-0 rounded-2xl bg-surface ring-1 ring-line", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, delta, icon, accent }: { label: string; value: string; delta?: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-5 ring-1", accent ? "bg-ink-900 text-white ring-ink-900" : "bg-surface ring-line")}>
      <div className="flex items-center justify-between">
        <p className={cn("text-xs font-semibold", accent ? "text-white/65" : "text-ink-500")}>{label}</p>
        <span className={cn("grid size-8 place-items-center rounded-lg", accent ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600")}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {delta && <p className={cn("mt-1 text-xs", accent ? "text-ink-400" : "text-ink-500")}>{delta}</p>}
    </div>
  );
}

export function Bars({ data, format = String, height = 180 }: { data: { label: string; value: number }[]; format?: (n: number) => string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label + i} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <div className="relative flex w-full flex-1 items-end justify-center">
            <div
              className={cn("w-full max-w-10 rounded-t-md transition-all", i === data.length - 1 ? "bg-brand-500" : "bg-ink-200 group-hover:bg-ink-400")}
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[10px] font-semibold text-white group-hover:block">
              {format(d.value)}
            </span>
          </div>
          <span className="max-w-full truncate text-[10px] font-medium text-ink-400">{data.length > 10 && i % 2 && i !== data.length - 1 ? "" : d.label}&nbsp;</span>
        </div>
      ))}
    </div>
  );
}

export function Meter({ label, value, max, right }: { label: string; value: number; max: number; right: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="font-medium">{label}</span><span className="font-semibold tabular-nums">{right}</span></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-50">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(value / Math.max(1, max)) * 100}%` }} />
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-emerald-500" : "bg-ink-200")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-surface shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-400";
export const td = "px-4 py-3.5 text-sm";
