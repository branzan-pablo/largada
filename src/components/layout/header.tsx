import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/corridas" aria-label="Largada, calendário de corridas" className="flex items-center gap-1">
          <Image src="/logo_120.png" alt="" width={48} height={48} />
          <span className="font-[family-name:var(--font-logo)] text-2xl tracking-wide text-[#0D1B2A]">LARGADA</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/corridas" className="font-medium text-[#0D1B2A]">Corridas</Link>
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
