"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";
import { useToast } from "@/lib/toast";
import type { MenuItem } from "@/lib/types";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "dark" | "outline" | "ghost" | "soft" | "danger";
  size?: "sm" | "md" | "lg";
  href?: string;
};

const variants = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  dark: "bg-ink-900 text-white hover:opacity-90 dark:bg-fg dark:text-canvas",
  outline: "bg-surface text-fg ring-1 ring-line hover:bg-raised",
  ghost: "text-ink-600 hover:bg-raised hover:text-fg",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
};
const sizes = { sm: "h-8 px-3 text-xs rounded-lg", md: "h-10 px-4 text-sm rounded-xl", lg: "h-12 px-5 text-[15px] rounded-xl" };

export function Button({ variant = "primary", size = "md", className, href, children, ...rest }: BtnProps) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    className,
  );
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}

export function Badge({ tone, children, className }: { tone: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap", tone, className)}>
      {children}
    </span>
  );
}

export function FoodArt({ item, className, size = "text-6xl" }: { item: Pick<MenuItem, "emoji" | "tone">; className?: string; size?: string }) {
  return (
    <div className={cn(`tone-${item.tone} relative grid place-items-center overflow-hidden`, className)}>
      <span className={cn(size, "relative drop-shadow-[0_6px_8px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-105")}>{item.emoji}</span>
    </div>
  );
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-semibold">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : hint ? <span className="text-xs text-ink-500">{hint}</span> : null}
    </label>
  );
}

export const inputCls =
  "h-11 w-full rounded-xl bg-canvas px-3.5 text-base sm:text-sm text-fg ring-1 ring-line placeholder:text-ink-400 transition focus:outline-none focus:ring-2 focus:ring-brand-500";

/** Small uppercase section label, as used on cards. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500", className)}>{children}</p>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn("animate-pop max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface shadow-lift ring-1 ring-line sm:rounded-2xl", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-raised hover:text-fg">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Toast() {
  const { toast } = useToast();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 md:bottom-8" role="status">
      <div className="animate-fade-up flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm font-semibold shadow-lift ring-1 ring-line">
        {toast.tone === "error" ? <AlertCircle className="size-4 text-rose-600" /> : <CheckCircle2 className="size-4 text-brand-500" />}
        {toast.msg}
      </div>
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-[19px]", className)}>
      {/* White mark on transparent; inverted to black on light backgrounds. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={631} height={417} className="h-7 w-auto invert dark:invert-0" />
      <span className="font-display font-bold leading-none tracking-tight text-fg">Artisans Hub</span>
    </span>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(true);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const set = (d: boolean) => {
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    try {
      localStorage.setItem("theme", d ? "dark" : "light");
    } catch {}
  };
  return (
    <div className={cn("inline-flex rounded-full bg-raised p-0.5 ring-1 ring-line", className)} role="group" aria-label="Theme">
      {([[false, Sun, "Light"], [true, Moon, "Dark"]] as const).map(([d, Icon, label]) => (
        <button
          key={label}
          onClick={() => set(d)}
          aria-pressed={dark === d}
          aria-label={`${label} theme`}
          className={cn("grid size-7 place-items-center rounded-full transition", dark === d ? "bg-surface text-fg shadow-soft ring-1 ring-line" : "text-ink-400 hover:text-fg")}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-raised text-ink-500 ring-1 ring-line">{icon}</div>
      <p className="font-bold">{title}</p>
      {body && <p className="max-w-sm text-sm text-ink-500">{body}</p>}
      {action}
    </div>
  );
}

/** Standard bordered panel used across the site (matches the admin cards). */
export const panel = "rounded-2xl bg-surface ring-1 ring-line";
