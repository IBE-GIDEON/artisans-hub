"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Field, Logo, inputCls, panel } from "@/components/ui";
import { cn } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "reset";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);

  const callback = (next: string) => `${window.location.origin}/auth/callback?next=${next}`;

  const resend = async () => {
    setBusy(true);
    const { error } = await supabaseBrowser().auth.resend({ type: "signup", email, options: { emailRedirectTo: callback("/admin") } });
    setMsg(error ? { tone: "error", text: error.message } : { tone: "ok", text: "Confirmation email sent. Open the link in it, then sign in." });
    setUnconfirmed(false);
    setBusy(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setUnconfirmed(false);
    const sb = supabaseBrowser();
    if (mode === "signin") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        const notConfirmed = error.code === "email_not_confirmed" || /not confirmed/i.test(error.message);
        setUnconfirmed(notConfirmed);
        setMsg({
          tone: "error",
          text: notConfirmed
            ? "Your email isn't confirmed yet. Open the link we emailed you, or send a new one."
            : error.message === "Invalid login credentials" ? "Wrong email or password." : error.message,
        });
        setBusy(false);
        return;
      }
      window.location.href = "/admin";
      return;
    }
    if (mode === "signup") {
      const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: callback("/admin") } });
      setMsg(error ? { tone: "error", text: error.message } : { tone: "ok", text: "Check your inbox to confirm your email, then sign in." });
    } else {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: callback("/admin/reset") });
      setMsg(error ? { tone: "error", text: error.message } : { tone: "ok", text: "If that email is registered, a reset link is on its way." });
    }
    setBusy(false);
  };

  const titles: Record<Mode, [string, string, string]> = {
    signin: ["Staff sign in", "Use your Artisans Hub staff account.", "Sign in"],
    signup: ["Create staff account", "Only email addresses invited by the owner get dashboard access.", "Create account"],
    reset: ["Reset password", "We'll email you a link to set a new password.", "Send reset link"],
  };
  const [title, sub, cta] = titles[mode];

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block"><Logo /></Link>
        <form onSubmit={submit} className={cn(panel, "mt-8 space-y-4 p-6")}>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-ink-500">{sub}</p>
          </div>
          <Field label="Email"><input className={inputCls} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          {mode !== "reset" && (
            <Field label="Password" hint={mode === "signup" ? "At least 8 characters" : undefined}>
              <input className={inputCls} type="password" required minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          )}
          {msg && <p className={cn("rounded-lg p-3 text-sm ring-1", msg.tone === "ok" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200")}>{msg.text}</p>}
          {unconfirmed && (
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={resend}>Resend confirmation email</Button>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}{cta}</Button>
        </form>
        <div className="mt-4 flex justify-between text-sm text-ink-500">
          {mode === "signin" ? (
            <>
              <button onClick={() => setMode("reset")} className="hover:text-fg">Forgot password?</button>
              <button onClick={() => setMode("signup")} className="hover:text-fg">Invited? Create account</button>
            </>
          ) : (
            <button onClick={() => setMode("signin")} className="hover:text-fg">← Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}
