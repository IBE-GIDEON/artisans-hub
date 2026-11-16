"use client";

import { useState } from "react";
import { Button, Field, Logo, inputCls, panel } from "@/components/ui";
import { cn } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Landing page for password-reset emails (the link signs the user in first). */
export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <Logo />
        <form
          className={cn(panel, "mt-8 space-y-4 p-6")}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const { error } = await supabaseBrowser().auth.updateUser({ password });
            setBusy(false);
            if (error) return setMsg(error.message);
            window.location.href = "/admin";
          }}
        >
          <h1 className="text-xl font-bold">Set a new password</h1>
          <Field label="New password" hint="At least 8 characters">
            <input className={inputCls} type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {msg && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">{msg}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>Save password</Button>
        </form>
      </div>
    </div>
  );
}
