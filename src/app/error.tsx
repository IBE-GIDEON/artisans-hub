"use client";

import { RefreshCw } from "lucide-react";
import { Button, Logo, panel } from "@/components/ui";
import { cn } from "@/lib/format";

/** Shown instead of Next's bare "Application error" when a page can't load (e.g. the database is unreachable). */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm text-center">
        <Logo className="justify-center" />
        <div className={cn(panel, "mt-8 space-y-3 p-6")}>
          <h1 className="text-xl font-bold">We&apos;ll be right back</h1>
          <p className="text-sm text-ink-500">The menu couldn&apos;t load just now. Please try again in a minute.</p>
          <Button size="lg" className="w-full" onClick={reset}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
