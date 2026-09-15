import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 min-[360px]:px-4 md:h-[4.5rem] md:px-8">
        <Link href="/" aria-label="Largada, calendário de corridas" className="group flex items-center gap-1">
          <Image src="/logo_120.png" alt="" width={48} height={48} className="h-10 w-10 min-[360px]:h-12 min-[360px]:w-12" />
          <span className="font-[family-name:var(--font-logo)] text-xl tracking-wide text-[#0D1B2A] transition-colors group-hover:text-[#FF4D00] min-[360px]:text-2xl">LARGADA</span>
        </Link>
        <nav className="flex items-center gap-1 text-[13px] min-[360px]:gap-2 min-[360px]:text-sm">
          <Link href="/" className="border-b-2 border-[#FF4D00] py-1 font-semibold text-[#0D1B2A]">Corridas</Link>
          <Link href="/admin" className="rounded-full px-2 py-1.5 font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0D1B2A] min-[360px]:px-3">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
