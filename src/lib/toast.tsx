"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { msg: string; tone: "ok" | "error" } | null;
const Ctx = createContext<{ toast: Toast; notify: (msg: string, tone?: "ok" | "error") => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const notify = useCallback((msg: string, tone: "ok" | "error" = "ok") => {
    setToast({ msg, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), tone === "error" ? 4500 : 2600);
  }, []);
  return <Ctx.Provider value={{ toast, notify }}>{children}</Ctx.Provider>;
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used inside ToastProvider");
  return c;
}
