"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Footprints, X } from "lucide-react";

const DISMISS_KEY = "largada_sticky_cta_dismissed";

export function StickyMobileCta({
  racesOpenThisWeek,
  firstOpenSlug,
}: {
  racesOpenThisWeek: number;
  firstOpenSlug?: string;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Hydration-safe read: start hidden, reveal once we know the storage state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (racesOpenThisWeek <= 0) return null;
  if (dismissed) return null;

  const isSingle = racesOpenThisWeek === 1 && Boolean(firstOpenSlug);
  const href = isSingle ? `/corrida/${firstOpenSlug}` : "/corridas";
  const label = isSingle
    ? "Ver a prova com inscrição aberta"
    : `Ver ${racesOpenThisWeek} provas com inscrição aberta`;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore storage errors (private mode)
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Link
        href={href}
        className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#FF4D00] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#E04400] active:scale-[0.98]"
      >
        <Footprints className="h-4 w-4" />
        {label}
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dispensar"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
