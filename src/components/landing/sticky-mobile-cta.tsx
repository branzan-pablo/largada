import Link from "next/link";
import { Footprints } from "lucide-react";

export function StickyMobileCta({
  racesOpenThisWeek,
}: {
  racesOpenThisWeek: number;
}) {
  if (racesOpenThisWeek <= 0) return null;

  const label =
    racesOpenThisWeek === 1
      ? "Ver 1 prova com inscrição aberta"
      : `Ver ${racesOpenThisWeek} provas com inscrição aberta`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Link
        href="/corridas"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF4D00] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#E04400]"
      >
        <Footprints className="h-4 w-4" />
        {label}
      </Link>
    </div>
  );
}
